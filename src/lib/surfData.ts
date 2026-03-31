import { getWindyForecast } from './weatherApi'

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
    description: string
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
  cameraSource?: string   // nome da fonte da câmera para exibir no player
}

const getWaterTempFallback = (): number => {
  const month = new Date().getMonth()
  if (month >= 11 || month <= 2) return 25
  if (month >= 3 && month <= 5) return 21
  if (month >= 6 && month <= 8) return 17
  return 21
}

const getTideHeight = (): number => {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const amplitude = 0.20
  const midLevel = 0.50
  const period = 12.4
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const phaseOffset = (dayOfYear * 0.8) % period
  const height = midLevel + amplitude * Math.cos((2 * Math.PI * (currentHour + phaseOffset)) / period)
  return Number(height.toFixed(2))
}

const getWetsuitInfo = (temp: number) => {
  if (temp >= 24) return { thickness: '2mm ou lycra', description: 'Quentinha ☀️' }
  if (temp >= 20) return { thickness: '3/2mm', description: 'Confortável 🌤️' }
  if (temp >= 18) return { thickness: '4/3mm', description: 'Fria 🌊' }
  return { thickness: '5/4mm + touca', description: 'Muito fria 🥶' }
}

const calculateScore = (
  waveHeight: number,
  windSpeed: number,
  swellPeriod: number,
  windDirection: string
): number => {
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

  let windScore = 0
  if (windDirection.includes('Terral')) {
    if (windSpeed <= 5) windScore = 3.5
    else if (windSpeed <= 10) windScore = 3.2
    else if (windSpeed <= 15) windScore = 2.6
    else if (windSpeed <= 20) windScore = 1.8
    else if (windSpeed <= 25) windScore = 1.2
    else windScore = 0.6
  } else if (windDirection.includes('Lateral')) {
    if (windSpeed <= 5) windScore = 3.0
    else if (windSpeed <= 10) windScore = 2.4
    else if (windSpeed <= 15) windScore = 1.8
    else if (windSpeed <= 20) windScore = 1.2
    else windScore = 0.5
  } else {
    if (windSpeed <= 5) windScore = 2.2
    else if (windSpeed <= 10) windScore = 1.6
    else if (windSpeed <= 15) windScore = 1.0
    else if (windSpeed <= 20) windScore = 0.5
    else windScore = 0.1
  }

  let periodScore = 0
  if (swellPeriod >= 16) periodScore = 3.0
  else if (swellPeriod >= 14) periodScore = 2.8
  else if (swellPeriod >= 12) periodScore = 2.4
  else if (swellPeriod >= 10) periodScore = 2.0
  else if (swellPeriod >= 9) periodScore = 1.6
  else if (swellPeriod >= 8) periodScore = 1.2
  else if (swellPeriod >= 7) periodScore = 0.8
  else periodScore = 0.4

  const total = waveScore + windScore + periodScore
  return Math.min(10, Math.max(1, Number(total.toFixed(1))))
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
  const isMorning = hour >= 6 && hour <= 10
  if (score >= 8 && isMorning) return 'Cheio'
  if (score >= 7) return 'Pouca gente'
  return 'Vazio'
}

const getCrowdMessage = (crowdLevel: string, score: number): string => {
  if (crowdLevel === 'Cheio') {
    if (score >= 8) return 'Mar bom atrai galera'
    return 'Bastante gente na água'
  }
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

const getBestSubRegion = (
  subRegions: { id: string, swellDirections?: string[] }[],
  swellDirection: string,
  _windDirection: string
): string => {
  const scored = subRegions.map(sub => {
    let score = 0
    if (sub.swellDirections && sub.swellDirections.includes(swellDirection)) score += 3
    return { id: sub.id, score }
  })
  const best = scored.reduce((a, b) => a.score >= b.score ? a : b)
  return best.id
}

// ─── Câmeras disponíveis gratuitamente ────────────────────────────────────────
//
// Fontes verificadas:
//  - SkylineWebcams: embed público com suporte a iframe → Barra da Lagoa
//  - CondicaoAtual: câmera de surf da Joaquina (Restaurante Pedra Careca)
//  - ClimaAoVivo: vista panorâmica dos Ingleses
//
// IMPORTANTE: YouTube bloqueia embed em domínios externos por padrão.
// Removido o embed do YouTube do Campeche — era inativo e causava erro na aba.
// Quando houver câmera real do Campeche, adicionar aqui.

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

const BEACHES = [
  {
    id: 'campeche', name: 'Campeche', region: 'Sul' as const,
    lat: -27.6683, lng: -48.4772, orientation: 90,
    subRegions: [
      { id: 'lomba-sabao', name: 'Lomba do Sabão', lat: -27.6720, lng: -48.4780, swellDirections: ['E', 'SE'] },
      { id: 'palanque', name: 'Palanque', lat: -27.6683, lng: -48.4772, swellDirections: ['SE', 'S', 'SSE'] },
      { id: 'principal', name: 'Principal', lat: -27.6650, lng: -48.4760, swellDirections: ['E', 'NE'] },
    ],
    bestTimeWindow: '06h - 09h',
    // Câmera removida: o YouTube bloqueia embed em domínios externos.
    // Adicionar aqui quando houver câmera parceira real do Campeche.
  },
  {
    id: 'novo-campeche', name: 'Novo Campeche', region: 'Sul' as const,
    lat: -27.6450, lng: -48.4650, orientation: 90,
    subRegions: [
      { id: 'norte-novo-campeche', name: 'Lado Norte', lat: -27.6400, lng: -48.4630, swellDirections: ['E', 'NE'] },
      { id: 'sul-novo-campeche', name: 'Lado Sul', lat: -27.6500, lng: -48.4670, swellDirections: ['SE', 'E'] },
    ],
    bestTimeWindow: '06h - 09h',
  },
  {
    id: 'morro-pedras', name: 'Morro das Pedras', region: 'Sul' as const,
    lat: -27.6761, lng: -48.4842, orientation: 100,
    subRegions: [
      { id: 'canto-direito', name: 'Canto Direito', lat: -27.6750, lng: -48.4830, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6761, lng: -48.4842, swellDirections: ['E', 'SE'] },
    ],
    bestTimeWindow: '07h - 10h',
  },
  {
    id: 'matadeiro', name: 'Matadeiro', region: 'Sul' as const,
    lat: -27.7342, lng: -48.5167, orientation: 110,
    bestTimeWindow: '06h - 09h',
  },
  {
    id: 'lagoinha-leste', name: 'Lagoinha do Leste', region: 'Sul' as const,
    lat: -27.7892, lng: -48.5289, orientation: 180,
    bestTimeWindow: 'Dia todo (acesso por trilha)',
  },
  {
    id: 'acores', name: 'Açores', region: 'Sul' as const,
    lat: -27.7572, lng: -48.5125, orientation: 120,
    subRegions: [
      { id: 'ponta-esquerda', name: 'Ponta Esquerda', lat: -27.7565, lng: -48.5110, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio', lat: -27.7572, lng: -48.5125, swellDirections: ['E', 'SE'] },
    ],
    bestTimeWindow: '07h - 11h',
  },
  {
    id: 'solidao', name: 'Solidão', region: 'Sul' as const,
    lat: -27.7456, lng: -48.5089, orientation: 130,
    bestTimeWindow: '08h - 11h',
  },
  {
    id: 'armacao', name: 'Armação', region: 'Sul' as const,
    lat: -27.7447, lng: -48.5044, orientation: 115,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo', lat: -27.7440, lng: -48.5035, swellDirections: ['SE', 'S'] },
      { id: 'centro', name: 'Centro', lat: -27.7447, lng: -48.5044, swellDirections: ['E', 'SE'] },
      { id: 'matadouro', name: 'Matadouro', lat: -27.7455, lng: -48.5055, swellDirections: ['S', 'SW'] },
    ],
    bestTimeWindow: '06h - 09h e 16h - 18h',
  },
  {
    id: 'naufragados', name: 'Naufragados', region: 'Sul' as const,
    lat: -27.8456, lng: -48.5623, orientation: 180,
    bestTimeWindow: 'Depende da maré (acesso por trilha)',
  },
  {
    id: 'joaquina', name: 'Joaquina', region: 'Leste' as const,
    lat: -27.6214, lng: -48.4433, orientation: 90,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo (Dunas)', lat: -27.6230, lng: -48.4440, swellDirections: ['SE', 'S'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.6214, lng: -48.4433, swellDirections: ['E', 'SE'] },
      { id: 'canto-direito', name: 'Canto Direito', lat: -27.6195, lng: -48.4420, swellDirections: ['NE', 'E'] },
    ],
    bestTimeWindow: 'Agora até 11h',
  },
  {
    id: 'mole', name: 'Praia Mole', region: 'Leste' as const,
    lat: -27.5989, lng: -48.4381, orientation: 85,
    subRegions: [
      { id: 'gruta', name: 'Gruta', lat: -27.5995, lng: -48.4390, swellDirections: ['SE', 'E'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.5989, lng: -48.4381, swellDirections: ['E', 'NE'] },
    ],
    bestTimeWindow: '07h - 10h',
  },
  {
    id: 'mocambique', name: 'Moçambique', region: 'Leste' as const,
    lat: -27.5647, lng: -48.4208, orientation: 80,
    subRegions: [
      { id: 'norte', name: 'Norte (Barra)', lat: -27.5600, lng: -48.4195, swellDirections: ['NE', 'E'] },
      { id: 'meio', name: 'Meio da Praia', lat: -27.5647, lng: -48.4208, swellDirections: ['E', 'SE'] },
      { id: 'sul', name: 'Sul', lat: -27.5700, lng: -48.4220, swellDirections: ['SE', 'S'] },
    ],
    bestTimeWindow: '08h - 11h',
  },
  {
    id: 'barra-lagoa', name: 'Barra da Lagoa', region: 'Leste' as const,
    lat: -27.5767, lng: -48.4194, orientation: 75,
    subRegions: [
      { id: 'canal', name: 'Canal da Barra', lat: -27.5760, lng: -48.4185, swellDirections: ['NE', 'E'] },
      { id: 'prainha', name: 'Prainha', lat: -27.5775, lng: -48.4200, swellDirections: ['E', 'SE'] },
    ],
    bestTimeWindow: 'Melhor na maré enchente',
  },
  {
    id: 'santinho', name: 'Santinho', region: 'Norte' as const,
    lat: -27.4433, lng: -48.3917, orientation: 70,
    subRegions: [
      { id: 'costao', name: 'Costão do Santinho', lat: -27.4420, lng: -48.3905, swellDirections: ['NE', 'E'] },
      { id: 'centro', name: 'Centro', lat: -27.4433, lng: -48.3917, swellDirections: ['E', 'SE'] },
    ],
    bestTimeWindow: '15h - 17h',
  },
  {
    id: 'ponta-aranhas', name: 'Ponta das Aranhas', region: 'Norte' as const,
    lat: -27.4256, lng: -48.3889, orientation: 65,
    bestTimeWindow: '09h - 12h',
  },
  {
    id: 'canajure', name: 'Canajurê', region: 'Norte' as const,
    lat: -27.4189, lng: -48.3945, orientation: 60,
    bestTimeWindow: '10h - 13h',
  },
]

let cachedConditions: BeachCondition[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 15 * 60 * 1000

export async function fetchCurrentConditions(): Promise<BeachCondition[]> {
  const now = Date.now()

  if (cachedConditions && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConditions
  }

  const tide = getTide()

  const conditions = await Promise.all(
    BEACHES.map(async (beach) => {
      const windyData = await getWindyForecast(beach.lat, beach.lng, beach.orientation)

      const waveHeight = Number((windyData?.waveHeight ?? 1.0).toFixed(1))
      const windSpeed = Math.round(windyData?.windSpeed ?? 12)
      const windDirection = windyData?.windDirection ?? 'N (Terral)'
      const swellPeriod = Math.round(windyData?.swellPeriod ?? 10)
      const swellDirection = windyData?.swellDirection ?? 'SE'
      const waterTemp = windyData?.waterTemperature ?? getWaterTempFallback()

      const score = calculateScore(waveHeight, windSpeed, swellPeriod, windDirection)
      const level = getLevel(waveHeight)
      const crowdLevel = getCrowdLevel(score)

      let subRegions = undefined
      if ((beach as any).subRegions && (beach as any).subRegions.length > 0) {
        const beachSubs = (beach as any).subRegions
        const bestSubId = getBestSubRegion(beachSubs, swellDirection, windDirection)

        subRegions = beachSubs.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          lat: sub.lat,
          lng: sub.lng,
          description: sub.id === bestSubId
            ? `🔥 Melhor com swell de ${swellDirection}`
            : `Funciona melhor com swell de ${sub.swellDirections?.join(', ') ?? 'E'}`,
          bestNow: sub.id === bestSubId
        }))
      }

      // Câmera: busca na tabela CAMERAS por id da praia
      const camera = CAMERAS[beach.id]

      return {
        id: beach.id,
        name: beach.name,
        region: beach.region,
        subRegions,
        score,
        waveHeight,
        windSpeed,
        windDirection,
        swellDirection,
        swellPeriod,
        tide,
        tideHeight: getTideHeight(),
        level,
        boardSuggestion: getBoardSuggestion(waveHeight),
        waterConditions: {
          temperature: waterTemp,
          wetsuit: getWetsuitInfo(waterTemp)
        },
        crowdLevel,
        crowdMessage: getCrowdMessage(crowdLevel, score),
        bestTimeWindow: beach.bestTimeWindow,
        sunrise: windyData?.sunrise,
        sunset: windyData?.sunset,
        lat: beach.lat,
        lng: beach.lng,
        cameraUrl: camera?.cameraUrl,
        cameraEmbed: camera?.cameraEmbed,
        cameraSource: camera?.cameraSource,
      } as BeachCondition
    })
  )

  cachedConditions = conditions
  lastFetchTime = now
  return conditions
}

export function getCurrentConditions(): BeachCondition[] {
  return cachedConditions ?? []
}

export function getTopSpots(limit: number = 3): BeachCondition[] {
  return getCurrentConditions().sort((a, b) => b.score - a.score).slice(0, limit)
}

export function getSpotsByRegion(region: BeachCondition['region']): BeachCondition[] {
  return getCurrentConditions().filter(spot => spot.region === region).sort((a, b) => b.score - a.score)
}

export function getSpotById(id: string): BeachCondition | undefined {
  return getCurrentConditions().find(spot => spot.id === id)
}

export function analyzeConditions(spot: BeachCondition): string {
  let analysis = ''
  if (spot.score >= 8) analysis = '🔥 Condições EXCELENTES! '
  else if (spot.score >= 6.5) analysis = '✅ Boas condições para surfar. '
  else if (spot.score >= 5) analysis = '⚠️ Condições medianas. '
  else analysis = '❌ Condições fracas. '

  if (spot.windDirection.includes('Terral')) {
    analysis += `Vento terral ${spot.windSpeed}km/h deixando o mar limpo e organizado. `
  } else if (spot.windDirection.includes('Lateral')) {
    analysis += `Vento lateral ${spot.windSpeed}km/h pode atrapalhar um pouco. `
  } else {
    analysis += `Vento frontal ${spot.windSpeed}km/h bagunçando as ondas. `
  }

  if (spot.swellPeriod >= 12) analysis += `Período de ${spot.swellPeriod}s trazendo ondas longas e bem formadas. `
  else if (spot.swellPeriod >= 9) analysis += `Período médio de ${spot.swellPeriod}s, ondas razoáveis. `
  else analysis += `Período curto de ${spot.swellPeriod}s, ondas fracas e desorganizadas. `

  if (spot.tide === 'Cheia') analysis += 'Maré cheia, momento ideal para pegar as melhores ondas.'
  else if (spot.tide === 'Enchendo') analysis += 'Maré enchendo, ainda bom para surfar.'
  else if (spot.tide === 'Secando') analysis += 'Maré secando, condições podem mudar.'
  else analysis += 'Maré vazia, cuidado com as pedras.'

  return analysis
}
