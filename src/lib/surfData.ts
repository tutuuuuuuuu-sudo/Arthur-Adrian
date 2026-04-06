import { getWindyForecast } from './weatherApi'
import { getRealTideAndWaterTemp } from './weatherData'

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

const getWaterTempFallback = (): number => {
  // Temperatura sazonal real de Florianópolis baseada em dados históricos
  const month = new Date().getMonth() // 0=Jan
  if (month >= 11 || month <= 1) return 24  // Dez-Jan-Fev: verão
  if (month === 2 || month === 3) return 22  // Mar-Abr: final verão
  if (month === 4 || month === 5) return 20  // Mai-Jun: outono
  if (month === 6 || month === 7) return 18  // Jul-Ago: inverno
  if (month === 8 || month === 9) return 19  // Set-Out: primavera
  return 21                                   // Nov: início verão
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

function windQuality(windDir: string, windSpeed: number, beachOrientation: number): number {
  const windDegMap: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
  }
  const windDeg = windDegMap[windDir] ?? 0
  const offshoreDir = (beachOrientation + 180) % 360
  let diff = Math.abs(windDeg - offshoreDir)
  if (diff > 180) diff = 360 - diff

  if (diff <= 45) {
    if (windSpeed <= 5) return 3.5
    if (windSpeed <= 10) return 3.2
    if (windSpeed <= 15) return 2.6
    if (windSpeed <= 20) return 1.8
    if (windSpeed <= 25) return 1.2
    return 0.6
  } else if (diff <= 90) {
    if (windSpeed <= 5) return 3.0
    if (windSpeed <= 10) return 2.4
    if (windSpeed <= 15) return 1.8
    if (windSpeed <= 20) return 1.2
    return 0.5
  } else {
    if (windSpeed <= 5) return 2.2
    if (windSpeed <= 10) return 1.6
    if (windSpeed <= 15) return 1.0
    if (windSpeed <= 20) return 0.5
    return 0.1
  }
}

const calculateScore = (waveHeight: number, windSpeed: number, swellPeriod: number, windDir: string, beachOrientation: number): number => {
  let waveScore = 0
  if (waveHeight >= 2.0) waveScore = 4.5
  else if (waveHeight >= 1.5) waveScore = 4.0
  else if (waveHeight >= 1.2) waveScore = 3.5
  else if (waveHeight >= 1.0) waveScore = 3.2
  else if (waveHeight >= 0.8) waveScore = 2.8
  else if (waveHeight >= 0.6) waveScore = 2.4
  else if (waveHeight >= 0.4) waveScore = 2.0
  else if (waveHeight >= 0.2) waveScore = 1.2
  else waveScore = 0.5

  const windScore = windQuality(windDir, windSpeed, beachOrientation)

  let periodScore = 0
  if (swellPeriod >= 16) periodScore = 3.0
  else if (swellPeriod >= 14) periodScore = 2.8
  else if (swellPeriod >= 12) periodScore = 2.4
  else if (swellPeriod >= 10) periodScore = 2.0
  else if (swellPeriod >= 9) periodScore = 1.6
  else if (swellPeriod >= 8) periodScore = 1.2
  else if (swellPeriod >= 7) periodScore = 0.8
  else periodScore = 0.4

  return Math.min(10, Math.max(1, Number((waveScore + windScore + periodScore).toFixed(1))))
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
    cameraUrl: 'https://condicaoatual.com.br/joaquina-2/',
    cameraEmbed: 'https://condicaoatual.com.br/embed/joaquina',
    cameraSource: 'Condição Atual',
  },
  'santinho': {
    cameraUrl: 'https://climaaovivo.com.br/',
    cameraEmbed: 'https://climaaovivo.com.br/embed/florianopolis-ingleses',
    cameraSource: 'Clima ao Vivo',
  },
}

// ✅ Canajurê REMOVIDO
const BEACHES = [
  // ✅ GPS corrigido conforme verificação no Google Maps (prints do usuário)
  { id: 'campeche', name: 'Campeche', region: 'Sul' as const,
    lat: -27.697703, lng: -48.4898603, // Campeche — Lomba do Sabão (bem na areia)
    orientation: 90,
    subRegions: [
      { id: 'lomba-sabao', name: 'Lomba do Sabão', lat: -27.6720, lng: -48.4780, swellDirections: ['E', 'SE'] },
      { id: 'palanque', name: 'Palanque', lat: -27.6683, lng: -48.4772, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'principal', name: 'Principal', lat: -27.6650, lng: -48.4760, swellDirections: ['E', 'NE'] },
    ], bestTimeWindow: '06h - 09h' },
  { id: 'novo-campeche', name: 'Novo Campeche', region: 'Sul' as const,
    lat: -27.6661001, lng: -48.4755307, // Praia do Novo Campeche — bem na areia
    orientation: 90,
    subRegions: [
      { id: 'norte-novo-campeche', name: 'Lado Norte', lat: -27.6400, lng: -48.4630, swellDirections: ['E', 'NE'] },
      { id: 'sul-novo-campeche', name: 'Lado Sul', lat: -27.6500, lng: -48.4670, swellDirections: ['SE', 'E'] },
    ], bestTimeWindow: '06h - 09h' },
  { id: 'morro-pedras', name: 'Morro das Pedras', region: 'Sul' as const,
    lat: -27.7170897, lng: -48.503436, // Av. Campeche, s/n — Lagoa Pequena
    orientation: 100,
    subRegions: [
      { id: 'canto-direito', name: 'Canto Direito', lat: -27.6750, lng: -48.4830, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6761, lng: -48.4842, swellDirections: ['E', 'SE'] },
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
      { id: 'ponta-esquerda', name: 'Ponta Esquerda', lat: -27.7565, lng: -48.5110, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio', lat: -27.7572, lng: -48.5125, swellDirections: ['E', 'SE'] },
    ], bestTimeWindow: '07h - 11h' },
  { id: 'solidao', name: 'Solidão', region: 'Sul' as const,
    lat: -27.7941233, lng: -48.5334965, // Praia da Solidão — acesso areia
    orientation: 130, bestTimeWindow: '08h - 11h' },
  { id: 'armacao', name: 'Armação', region: 'Sul' as const,
    lat: -27.7504078, lng: -48.5017637, orientation: 115,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo', lat: -27.7440, lng: -48.5035, swellDirections: ['SE', 'S'] },
      { id: 'centro', name: 'Centro', lat: -27.7447, lng: -48.5044, swellDirections: ['E', 'SE'] },
      { id: 'matadouro', name: 'Matadouro', lat: -27.7455, lng: -48.5055, swellDirections: ['S', 'SW'] },
    ], bestTimeWindow: '06h - 09h e 16h - 18h' },
  { id: 'naufragados', name: 'Naufragados', region: 'Sul' as const,
    lat: -27.8335587, lng: -48.5641537, // Naufragados — início da Trilha Caminho dos Naufragados
    orientation: 180, bestTimeWindow: 'Depende da maré (acesso por trilha)' },
  { id: 'joaquina', name: 'Joaquina', region: 'Leste' as const,
    lat: -27.6293577, lng: -48.4490173, // Joaquina — bem na areia
    orientation: 90,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo (Dunas)', lat: -27.6230, lng: -48.4440, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6214, lng: -48.4433, swellDirections: ['E', 'SE'] },
      { id: 'canto-direito', name: 'Canto Direito', lat: -27.6195, lng: -48.4420, swellDirections: ['NE', 'E'] },
    ], bestTimeWindow: 'Agora até 11h' },
  { id: 'mole', name: 'Praia Mole', region: 'Leste' as const,
    lat: -27.6022459, lng: -48.4326839, orientation: 85,
    subRegions: [
      { id: 'gruta', name: 'Gruta', lat: -27.5995, lng: -48.4390, swellDirections: ['SE', 'E'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.5989, lng: -48.4381, swellDirections: ['E', 'NE'] },
    ], bestTimeWindow: '07h - 10h' },
  { id: 'mocambique', name: 'Moçambique', region: 'Leste' as const,
    lat: -27.4937746, lng: -48.3955175, // Moçambique — bem na areia
    orientation: 80,
    subRegions: [
      { id: 'norte', name: 'Norte (Barra)', lat: -27.5600, lng: -48.4195, swellDirections: ['NE', 'E'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.5647, lng: -48.4208, swellDirections: ['E', 'SE'] },
      { id: 'sul', name: 'Sul', lat: -27.5700, lng: -48.4220, swellDirections: ['SE', 'S'] },
    ], bestTimeWindow: '08h - 11h' },
  { id: 'barra-lagoa', name: 'Barra da Lagoa', region: 'Leste' as const,
    lat: -27.5734502, lng: -48.424939, orientation: 75,
    subRegions: [
      { id: 'canal', name: 'Canal da Barra', lat: -27.5760, lng: -48.4185, swellDirections: ['NE', 'E'] },
      { id: 'prainha', name: 'Prainha', lat: -27.5775, lng: -48.4200, swellDirections: ['E', 'SE'] },
    ], bestTimeWindow: 'Melhor na maré enchente' },
  { id: 'santinho', name: 'Santinho', region: 'Norte' as const,
    lat: -27.4618653, lng: -48.3761513, // Praia do Santinho — bem na areia
    orientation: 70,
    subRegions: [
      { id: 'costao', name: 'Costão do Santinho', lat: -27.4420, lng: -48.3905, swellDirections: ['NE', 'E'] },
      { id: 'centro', name: 'Centro', lat: -27.4433, lng: -48.3917, swellDirections: ['E', 'SE'] },
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

  const conditions = await Promise.all(
    BEACHES.map(async (beach) => {
      const windyData = await getWindyForecast(beach.lat, beach.lng, beach.orientation)

      const waveHeight = Number((windyData?.waveHeight ?? 1.0).toFixed(1))
      const windSpeed = Math.round(windyData?.windSpeed ?? 12)
      const swellPeriod = Math.round(windyData?.swellPeriod ?? 10)
      const swellDirection = windyData?.swellDirection ?? 'SE'
      // ✅ Temperatura da água real via Open-Meteo Marine
      const marineData = await getRealTideAndWaterTemp(beach.lat, beach.lng)
      const waterTemp = marineData?.waterTemp ?? windyData?.waterTemperature ?? getWaterTempFallback()
      const windDirection = (windyData?.windDirection ?? 'N').split(' ')[0].split('(')[0].trim()

      const score = calculateScore(waveHeight, windSpeed, swellPeriod, windDirection, beach.orientation)
      const crowdLevel = getCrowdLevel(score)

      let subRegions = undefined
      if ((beach as any).subRegions?.length > 0) {
        const beachSubs = (beach as any).subRegions
        const bestSubId = getBestSubRegion(beachSubs, swellDirection)
        subRegions = beachSubs.map((sub: any) => ({
          id: sub.id, name: sub.name, lat: sub.lat, lng: sub.lng,
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
