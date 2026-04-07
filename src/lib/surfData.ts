import { getWindyForecast } from './weatherApi'
import { getRealWaterTemp } from './weatherData'

export interface SubRegion {
  id: string
  name: string
  description?: string
  lat: number
  lng: number
  bestNow?: boolean
  swellDirections?: string[]
}

export interface WaterConditions {
  temperature: number
  wetsuit: {
    thickness: string
  }
}

export interface BeachCondition {
  id: string
  name: string
  region: 'Sul' | 'Leste' | 'Norte' | 'Centro'
  subRegions?: SubRegion[]
  score: number
  waveHeight: number
  windSpeed: number
  windDirection: string
  swellDirection: string
  swellPeriod: number
  tide: 'Enchendo' | 'Secando' | 'Cheia' | 'Vazia'
  tideHeight: number
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  boardSuggestion: string
  waterConditions: WaterConditions
  crowdLevel: 'Vazio' | 'Pouca gente' | 'Cheio'
  crowdMessage: string
  bestTimeWindow: string
  sunrise?: string
  sunset?: string
  lat: number
  lng: number
  cameraUrl?: string
  cameraEmbed?: string
  cameraSource?: string
}

const getTideHeight = (): number => {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const amplitude = 0.20, midLevel = 0.50, period = 12.4
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const phaseOffset = (dayOfYear * 0.8) % period
  return Number((midLevel + amplitude * Math.cos((2 * Math.PI * (currentHour + phaseOffset)) / period)).toFixed(2))
}

// Sem descrição textual — só espessura
const getWetsuitInfo = (temp: number) => {
  if (temp >= 24) return { thickness: '2mm ou lycra' }
  if (temp >= 20) return { thickness: '3/2mm' }
  if (temp >= 18) return { thickness: '4/3mm' }
  return { thickness: '5/4mm + touca' }
}

export function degreesToWindDir(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}


const calculateScore = (waveHeight: number, windSpeed: number, swellPeriod: number, windDir: string, beachOrientation: number): number => {
  // Escala baseada na realidade de Florianópolis:
  // 0.5m-1m = nota 6-8 base, vento >15km/h penaliza abaixo de 7, período curto = 5 base

  // ONDA: 0.5m já dá nota 6, 1m dá nota 8, 2m+ nota 10
  let waveBase = 0
  if (waveHeight >= 2.5) waveBase = 10
  else if (waveHeight >= 2.0) waveBase = 9.5
  else if (waveHeight >= 1.5) waveBase = 9.0
  else if (waveHeight >= 1.2) waveBase = 8.5
  else if (waveHeight >= 1.0) waveBase = 8.0
  else if (waveHeight >= 0.8) waveBase = 7.5
  else if (waveHeight >= 0.6) waveBase = 7.0
  else if (waveHeight >= 0.5) waveBase = 6.5
  else if (waveHeight >= 0.4) waveBase = 5.5
  else waveBase = 4.0

  // VENTO: penalização sobre o waveBase
  // Offshore (<= 45° da direção offshore) = bônus
  // Onshore (> 90°) = penaliza muito
  const windDegMap: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
  }
  const wDir = windDegMap[windDir] ?? 0
  const offshoreDir = (beachOrientation + 180) % 360
  let angleDiff = Math.abs(wDir - offshoreDir)
  if (angleDiff > 180) angleDiff = 360 - angleDiff

  let windPenalty = 0
  if (angleDiff <= 45) {
    // Offshore — penaliza pouco mesmo com vento forte
    if (windSpeed <= 10) windPenalty = 0
    else if (windSpeed <= 15) windPenalty = -0.3
    else if (windSpeed <= 20) windPenalty = -0.8
    else windPenalty = -1.5
  } else if (angleDiff <= 90) {
    // Lateral
    if (windSpeed <= 10) windPenalty = -0.5
    else if (windSpeed <= 15) windPenalty = -1.0
    else if (windSpeed <= 20) windPenalty = -1.8
    else windPenalty = -2.5
  } else {
    // Onshore — penaliza bastante
    if (windSpeed <= 10) windPenalty = -1.0
    else if (windSpeed <= 15) windPenalty = -2.0
    else if (windSpeed <= 20) windPenalty = -3.0
    else windPenalty = -4.0
  }

  // PERÍODO: ajuste fino em Floripa, período curto é normal (nota base 5)
  // Período longo é bônus, curto não penaliza muito
  let periodAdjust = 0
  if (swellPeriod >= 16) periodAdjust = +0.5
  else if (swellPeriod >= 14) periodAdjust = +0.3
  else if (swellPeriod >= 12) periodAdjust = +0.2
  else if (swellPeriod >= 10) periodAdjust = 0
  else if (swellPeriod >= 8) periodAdjust = -0.2
  else if (swellPeriod >= 7) periodAdjust = -0.4
  else periodAdjust = -0.6  // 5s = ruim mas não catastrófico

  const finalScore = waveBase + windPenalty + periodAdjust
  return Math.min(10, Math.max(1, Number(finalScore.toFixed(1))))
}

const getTide = (): 'Enchendo' | 'Secando' | 'Cheia' | 'Vazia' => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour <= 9) return 'Enchendo'
  if (hour >= 10 && hour <= 13) return 'Cheia'
  if (hour >= 14 && hour <= 17) return 'Secando'
  if (hour >= 18 && hour <= 21) return 'Enchendo'
  return 'Vazia'
}

const getCrowdLevel = (score: number): 'Vazio' | 'Pouca gente' | 'Cheio' => {
  const hour = new Date().getHours()
  if (score >= 8 && hour >= 6 && hour <= 10) return 'Cheio'
  if (score >= 7) return 'Pouca gente'
  return 'Vazio'
}

const getCrowdMessage = (crowdLevel: string, score: number): string => {
  if (crowdLevel === 'Cheio') return score >= 8 ? 'Mar bom atrai galera' : 'Bastante gente na água'
  if (crowdLevel === 'Pouca gente') return 'Bom momento para surfar'
  return 'Água tranquila, quase ninguém'
}

const getLevel = (waveHeight: number): 'Iniciante' | 'Intermediário' | 'Avançado' => {
  if (waveHeight > 1.0) return 'Avançado'
  if (waveHeight >= 0.5) return 'Intermediário'
  return 'Iniciante'
}

const getBoardSuggestion = (waveHeight: number): string => {
  if (waveHeight > 1.5) return 'Shortboard 5\'10" - 6\'2"'
  if (waveHeight > 1.0) return 'Shortboard 6\'2" - 6\'4"'
  if (waveHeight >= 0.5) return 'Fish 6\'0" ou Funboard 7\'0"'
  return 'Longboard 8\'0"+'
}

const getBestSubRegion = (subRegions: { id: string, swellDirections?: string[] }[], swellDirection: string): string => {
  const best = subRegions.map(sub => ({
    id: sub.id,
    score: sub.swellDirections?.includes(swellDirection) ? 3 : 0
  })).reduce((a, b) => a.score >= b.score ? a : b)
  return best.id
}

function getWindAnalysis(windDir: string, windSpeed: number, beachOrientation: number): string {
  const windDegMap: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
  }
  const windDeg = windDegMap[windDir] ?? 0
  const offshoreDir = (beachOrientation + 180) % 360
  let diff = Math.abs(windDeg - offshoreDir)
  if (diff > 180) diff = 360 - diff
  if (diff <= 45) return `Vento ${windDir} ${windSpeed}km/h deixando o mar limpo e organizado. `
  if (diff <= 90) return `Vento ${windDir} ${windSpeed}km/h lateral, pode atrapalhar um pouco. `
  return `Vento ${windDir} ${windSpeed}km/h frontal bagunçando as ondas. `
}

const CAMERAS: Record<string, { cameraUrl: string, cameraEmbed: string, cameraSource: string }> = {
  'barra-lagoa': {
    cameraUrl: 'https://www.skylinewebcams.com/webcam/brasil/santa-catarina/florianopolis/barra-da-lagoa.html',
    cameraEmbed: 'https://www.skylinewebcams.com/embed/barra-da-lagoa.html',
    cameraSource: 'SkylineWebcams',
  },
  'joaquina': {
    cameraUrl: 'https://www.windy.com/webcams/1385233278',
    cameraEmbed: 'https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=13&overlay=wind&product=ecmwf&level=surface&lat=-27.6294&lon=-48.449&detail=true&webcam=1385233278',
    cameraSource: 'Windy Webcams',
  },
  'mole': {
    cameraUrl: 'https://www.skylinewebcams.com/webcam/brasil/santa-catarina/florianopolis/florianopolis.html',
    cameraEmbed: 'https://www.skylinewebcams.com/embed/florianopolis.html',
    cameraSource: 'SkylineWebcams',
  },
}

// ✅ Canajurê REMOVIDO
const BEACHES = [
  // ✅ GPS corrigido conforme verificação no Google Maps (prints do usuário)
  { id: 'campeche', name: 'Campeche', region: 'Sul' as const,
    lat: -27.697703, lng: -48.4898603, // Campeche — Lomba do Sabão (bem na areia)
    orientation: 90,
    subRegions: [
      { id: 'lomba-sabao', name: 'Lomba do Sabão', lat: -27.6974, lng: -48.4899, swellDirections: ['E', 'SE'] },
      { id: 'palanque', name: 'Palanque', lat: -27.7050, lng: -48.4950, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'principal', name: 'Principal', lat: -27.7100, lng: -48.4980, swellDirections: ['E', 'NE'] },
    ], bestTimeWindow: '06h - 09h' },
  { id: 'novo-campeche', name: 'Novo Campeche', region: 'Sul' as const,
    lat: -27.6661001, lng: -48.4755307, // Praia do Novo Campeche — bem na areia
    orientation: 90,
    subRegions: [
      { id: 'riozinho', name: 'Riozinho', lat: -27.6540, lng: -48.4700, swellDirections: ['NE', 'E', 'ENE'] },
      { id: 'centro', name: 'Centro', lat: -27.6610, lng: -48.4738, swellDirections: ['E', 'SE'] },
      { id: 'pico-da-cruz', name: 'Pico da Cruz', lat: -27.6680, lng: -48.4775, swellDirections: ['SE', 'S', 'SSE'] },
    ], bestTimeWindow: '06h - 09h' },
  { id: 'morro-pedras', name: 'Morro das Pedras', region: 'Sul' as const,
    lat: -27.7170897, lng: -48.503436, // Av. Campeche, s/n — Lagoa Pequena
    orientation: 100,
    subRegions: [
      { id: 'canto-norte', name: 'Canto Norte', lat: -27.7098, lng: -48.5000, swellDirections: ['E', 'SE', 'ESE'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.7145, lng: -48.5028, swellDirections: ['SE', 'E'] },
      { id: 'costao', name: 'Costão', lat: -27.7188, lng: -48.5055, swellDirections: ['SE', 'S', 'SSE'] },
    ], bestTimeWindow: '07h - 10h' },
  { id: 'matadeiro', name: 'Matadeiro', region: 'Sul' as const,
    lat: -27.7548429, lng: -48.4985647, // Matadeiro — estacionamento início trilha
    orientation: 110, bestTimeWindow: '06h - 09h' },
  { id: 'lagoinha-leste', name: 'Lagoinha do Leste', region: 'Sul' as const,
    lat: -27.7732103, lng: -48.4863806, // Lagoinha do Leste — início da trilha (Praia das Pacas)
    orientation: 180, bestTimeWindow: 'Dia todo (acesso por trilha)' },
  { id: 'acores', name: 'Açores', region: 'Sul' as const,
    lat: -27.7837144, lng: -48.5236746, // Praia dos Açores — bem na areia
    orientation: 120,
    subRegions: [
      { id: 'ponta-esquerda', name: 'Ponta Esquerda', lat: -27.7820, lng: -48.5195, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'meio', name: 'Meio', lat: -27.7855, lng: -48.5220, swellDirections: ['SE', 'E', 'ESE'] },
    ], bestTimeWindow: '07h - 11h' },
  { id: 'solidao', name: 'Solidão', region: 'Sul' as const,
    lat: -27.7941233, lng: -48.5334965, // Praia da Solidão — acesso areia
    orientation: 130, bestTimeWindow: '08h - 11h' },
  { id: 'armacao', name: 'Armação', region: 'Sul' as const,
    lat: -27.7504078, lng: -48.5017637, orientation: 115,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo', lat: -27.7420, lng: -48.5020, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'centro', name: 'Centro', lat: -27.7490, lng: -48.5048, swellDirections: ['SE', 'E'] },
      { id: 'matadouro', name: 'Matadouro', lat: -27.7530, lng: -48.5060, swellDirections: ['S', 'SW', 'SSW'] },
    ], bestTimeWindow: '06h - 09h e 16h - 18h' },
  { id: 'naufragados', name: 'Naufragados', region: 'Sul' as const,
    lat: -27.8335587, lng: -48.5641537, // Naufragados — início da Trilha Caminho dos Naufragados
    orientation: 180, bestTimeWindow: 'Depende da maré (acesso por trilha)' },
  { id: 'joaquina', name: 'Joaquina', region: 'Leste' as const,
    lat: -27.6293577, lng: -48.4490173, // Joaquina — bem na areia
    orientation: 90,
    subRegions: [
      { id: 'pedra-do-sami', name: 'Pedra do Sami', lat: -27.6340, lng: -48.4520, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6294, lng: -48.4490, swellDirections: ['E', 'SE'] },
      { id: 'canto-direito', name: 'Canto Direito', lat: -27.6250, lng: -48.4460, swellDirections: ['NE', 'E', 'ENE'] },
    ], bestTimeWindow: 'Agora até 11h' },
  { id: 'mole', name: 'Praia Mole', region: 'Leste' as const,
    lat: -27.6022459, lng: -48.4326839, orientation: 85,
    subRegions: [
      { id: 'canto-sul', name: 'Canto Sul (Gruta)', lat: -27.6035, lng: -48.4340, swellDirections: ['SE', 'E', 'ESE'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6022, lng: -48.4327, swellDirections: ['E', 'NE'] },
      { id: 'canto-norte', name: 'Canto Norte', lat: -27.5990, lng: -48.4310, swellDirections: ['NE', 'ENE'] },
    ], bestTimeWindow: '07h - 10h' },
  { id: 'mocambique', name: 'Moçambique', region: 'Leste' as const,
    lat: -27.4937746, lng: -48.3955175, // Moçambique — bem na areia
    orientation: 80,
    subRegions: [
      { id: 'norte', name: 'Norte', lat: -27.4700, lng: -48.3855, swellDirections: ['NE', 'E', 'ENE'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.4938, lng: -48.3910, swellDirections: ['E', 'NE'] },
      { id: 'sul', name: 'Sul', lat: -27.5180, lng: -48.3990, swellDirections: ['SE', 'E', 'ESE'] },
    ], bestTimeWindow: '08h - 11h' },
  { id: 'barra-lagoa', name: 'Barra da Lagoa', region: 'Leste' as const,
    lat: -27.5734502, lng: -48.424939, orientation: 75,
    subRegions: [
      { id: 'canal', name: 'Canal da Barra', lat: -27.5762, lng: -48.4188, swellDirections: ['NE', 'E', 'ENE'] },
      { id: 'praia-principal', name: 'Praia Principal', lat: -27.5748, lng: -48.4210, swellDirections: ['E', 'NE'] },
      { id: 'norte-da-barra', name: 'Norte da Barra', lat: -27.5720, lng: -48.4235, swellDirections: ['NE', 'ENE'] },
    ], bestTimeWindow: 'Melhor na maré enchente' },
  { id: 'santinho', name: 'Santinho', region: 'Norte' as const,
    lat: -27.4618653, lng: -48.3761513, // Praia do Santinho — bem na areia
    orientation: 70,
    subRegions: [
      { id: 'costao', name: 'Costão Norte', lat: -27.4580, lng: -48.3740, swellDirections: ['NE', 'E', 'ENE'] },
      { id: 'centro', name: 'Centro', lat: -27.4619, lng: -48.3762, swellDirections: ['E', 'NE'] },
      { id: 'canto-sul', name: 'Canto Sul', lat: -27.4660, lng: -48.3790, swellDirections: ['E', 'SE'] },
    ], bestTimeWindow: '15h - 17h' },
  { id: 'ponta-aranhas', name: 'Ponta das Aranhas', region: 'Norte' as const,
    lat: -27.4802204, lng: -48.3769892, orientation: 65, bestTimeWindow: '09h - 12h' },
]

let cachedConditions: BeachCondition[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 15 * 60 * 1000

export async function fetchCurrentConditions(): Promise<BeachCondition[]> {
  const now = Date.now()
  if (cachedConditions && (now - lastFetchTime) < CACHE_DURATION) return cachedConditions

  const tide = getTide()
  // ✅ Busca temperatura da água real UMA vez para toda a ilha
  const realWaterTemp = await getRealWaterTemp()

  const conditions = await Promise.all(
    BEACHES.map(async (beach) => {
      const windyData = await getWindyForecast(beach.lat, beach.lng, beach.orientation)

      const waveHeight = Number((windyData?.waveHeight ?? 1.0).toFixed(1))
      const windSpeed = Math.round(windyData?.windSpeed ?? 12)
      const swellPeriod = Math.round(windyData?.swellPeriod ?? 10)
      const swellDirection = windyData?.swellDirection ?? 'SE'
      const waterTemp = realWaterTemp
      const windDirection = (windyData?.windDirection ?? 'N').split(' ')[0].split('(')[0].trim()

      const score = calculateScore(waveHeight, windSpeed, swellPeriod, windDirection, beach.orientation)
      const crowdLevel = getCrowdLevel(score)

      let subRegions = undefined
      if ((beach as any).subRegions?.length > 0) {
        const beachSubs = (beach as any).subRegions
        const bestSubId = getBestSubRegion(beachSubs, swellDirection)
        subRegions = beachSubs.map((sub: any) => ({
          id: sub.id, name: sub.name, lat: sub.lat, lng: sub.lng,
          swellDirections: sub.swellDirections ?? [],
          description: sub.id === bestSubId
            ? `🔥 Melhor com swell de ${swellDirection}`
            : `Funciona melhor com swell de ${sub.swellDirections?.join(', ') ?? 'E'}`,
          bestNow: sub.id === bestSubId
        }))
      }

      const camera = CAMERAS[beach.id]

      return {
        id: beach.id, name: beach.name, region: beach.region, subRegions,
        score, waveHeight, windSpeed, windDirection, swellDirection, swellPeriod, tide,
        tideHeight: getTideHeight(), level: getLevel(waveHeight),
        boardSuggestion: getBoardSuggestion(waveHeight),
        waterConditions: { temperature: waterTemp, wetsuit: getWetsuitInfo(waterTemp) },
        crowdLevel, crowdMessage: getCrowdMessage(crowdLevel, score),
        bestTimeWindow: beach.bestTimeWindow,
        sunrise: windyData?.sunrise, sunset: windyData?.sunset,
        lat: beach.lat, lng: beach.lng,
        cameraUrl: camera?.cameraUrl, cameraEmbed: camera?.cameraEmbed, cameraSource: camera?.cameraSource,
        _beachOrientation: beach.orientation,
      } as BeachCondition & { _beachOrientation: number }
    })
  )

  cachedConditions = conditions
  lastFetchTime = now
  return conditions
}

export function getCurrentConditions(): BeachCondition[] { return cachedConditions ?? [] }
export function getTopSpots(limit = 3): BeachCondition[] { return getCurrentConditions().sort((a, b) => b.score - a.score).slice(0, limit) }
export function getSpotsByRegion(region: BeachCondition['region']): BeachCondition[] { return getCurrentConditions().filter(s => s.region === region).sort((a, b) => b.score - a.score) }
export function getSpotById(id: string): BeachCondition | undefined { return getCurrentConditions().find(s => s.id === id) }

export function analyzeConditions(spot: BeachCondition): string {
  const orientation = (spot as any)._beachOrientation ?? 90
  let analysis = ''
  if (spot.score >= 8) analysis = '🔥 Condições EXCELENTES! '
  else if (spot.score >= 6.5) analysis = '✅ Boas condições para surfar. '
  else if (spot.score >= 5) analysis = '⚠️ Condições medianas. '
  else analysis = '❌ Condições fracas. '

  analysis += getWindAnalysis(spot.windDirection, spot.windSpeed, orientation)

  if (spot.swellPeriod >= 12) analysis += `Período de ${spot.swellPeriod}s trazendo ondas longas e bem formadas. `
  else if (spot.swellPeriod >= 9) analysis += `Período médio de ${spot.swellPeriod}s, ondas razoáveis. `
  else analysis += `Período curto de ${spot.swellPeriod}s, ondas fracas e desorganizadas. `

  if (spot.tide === 'Cheia') analysis += 'Maré cheia, momento ideal para pegar as melhores ondas.'
  else if (spot.tide === 'Enchendo') analysis += 'Maré enchendo, ainda bom para surfar.'
  else if (spot.tide === 'Secando') analysis += 'Maré secando, condições podem mudar.'
  else analysis += 'Maré vazia, cuidado com as pedras.'

  return analysis
}
