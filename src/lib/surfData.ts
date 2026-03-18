import { getWindyForecast } from './weatherApi'

export interface SubRegion {
  id: string
  name: string
  description?: string
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
  tide: 'Enchente' | 'Vazante' | 'Estofo'
  tideHeight: number
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  boardSuggestion: string
  waterConditions: WaterConditions
  crowdLevel: 'Vazio' | 'Pouca gente' | 'Cheio'
  bestTimeWindow: string
  lat: number
  lng: number
  cameraUrl?: string
  cameraEmbed?: string
}

const getWaterTemp = (): number => {
  const month = new Date().getMonth()
  if (month >= 11 || month <= 2) return 25
  if (month >= 3 && month <= 5) return 21
  if (month >= 6 && month <= 8) return 17
  return 21
}

const getWetsuitInfo = (temp: number) => {
  if (temp >= 24) return { thickness: '2mm ou lycra', description: 'Quentinha ☀️' }
  if (temp >= 20) return { thickness: '3/2mm', description: 'Confortável 🌤️' }
  if (temp >= 18) return { thickness: '4/3mm', description: 'Fria 🌊' }
  return { thickness: '5/4mm + touca', description: 'Muito fria 🥶' }
}

const calculateScore = (waveHeight: number, windSpeed: number, swellPeriod: number, windDirection: string): number => {
  let score = 5
  if (waveHeight >= 1.5) score += 2
  else if (waveHeight >= 1.0) score += 1.5
  else if (waveHeight >= 0.8) score += 1
  else score -= 1

  if (windDirection.includes('Terral')) {
    if (windSpeed <= 10) score += 2
    else if (windSpeed <= 15) score += 1
  } else if (windDirection.includes('Lateral')) {
    if (windSpeed <= 10) score += 0.5
    else score -= 0.5
  } else {
    score -= 2
  }

  if (swellPeriod >= 14) score += 2
  else if (swellPeriod >= 12) score += 1.5
  else if (swellPeriod >= 10) score += 1
  else if (swellPeriod < 8) score -= 1

  return Math.min(10, Math.max(0, Number(score.toFixed(1))))
}

const getTide = (): 'Enchente' | 'Vazante' | 'Estofo' => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour <= 9) return 'Enchente'
  if (hour >= 10 && hour <= 13) return 'Estofo'
  if (hour >= 14 && hour <= 17) return 'Vazante'
  if (hour >= 18 && hour <= 21) return 'Enchente'
  return 'Estofo'
}

const getCrowdLevel = (score: number): 'Vazio' | 'Pouca gente' | 'Cheio' => {
  const hour = new Date().getHours()
  const isMorning = hour >= 6 && hour <= 10
  if (score >= 8 && isMorning) return 'Cheio'
  if (score >= 7) return 'Pouca gente'
  return 'Vazio'
}

const getLevel = (waveHeight: number, swellPeriod: number): 'Iniciante' | 'Intermediário' | 'Avançado' => {
  if (waveHeight >= 2.0 && swellPeriod >= 13) return 'Avançado'
  if (waveHeight >= 1.2 && swellPeriod >= 10) return 'Intermediário'
  return 'Iniciante'
}

const getBoardSuggestion = (waveHeight: number, level: string): string => {
  if (level === 'Avançado') return 'Shortboard 5\'8" - 6\'0" (tubos)'
  if (level === 'Intermediário') {
    if (waveHeight >= 1.5) return 'Shortboard 6\'0" - 6\'2"'
    return 'Fish 5\'8" ou Shortboard'
  }
  return 'Longboard 8\'0"+ ou Funboard'
}

const BEACHES = [
  // SUL
  { id: 'campeche', name: 'Campeche', region: 'Sul' as const, lat: -27.6683, lng: -48.4772, orientation: 90,
    subRegions: [
      { id: 'lomba-sabao', name: 'Lomba do Sabão', description: 'Região protegida, boa para iniciantes' },
      { id: 'palanque', name: 'Palanque', description: 'Pico famoso, ondas tubulares' },
      { id: 'principal', name: 'Principal', description: 'Faixa central, mais movimentada' }
    ],
    bestTimeWindow: '06h - 09h',
    cameraUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    cameraEmbed: 'https://www.youtube.com/embed/5qap5aO4i9A'
  },
  { id: 'morro-pedras', name: 'Morro das Pedras', region: 'Sul' as const, lat: -27.6761, lng: -48.4842, orientation: 100,
    subRegions: [
      { id: 'canto-direito', name: 'Canto Direito', description: 'Ondas mais fortes' },
      { id: 'meio', name: 'Meio da Praia', description: 'Beach break mais tranquilo' }
    ],
    bestTimeWindow: '07h - 10h'
  },
  { id: 'matadeiro', name: 'Matadeiro', region: 'Sul' as const, lat: -27.7342, lng: -48.5167, orientation: 110, bestTimeWindow: '06h - 09h' },
  { id: 'lagoinha-leste', name: 'Lagoinha do Leste', region: 'Sul' as const, lat: -27.7892, lng: -48.5289, orientation: 180, bestTimeWindow: 'Dia todo (acesso por trilha)' },
  { id: 'acores', name: 'Açores', region: 'Sul' as const, lat: -27.7572, lng: -48.5125, orientation: 120,
    subRegions: [
      { id: 'ponta-esquerda', name: 'Ponta Esquerda', description: 'Point break clássico' },
      { id: 'meio', name: 'Meio', description: 'Beach break mais acessível' }
    ],
    bestTimeWindow: '07h - 11h'
  },
  { id: 'solidao', name: 'Solidão', region: 'Sul' as const, lat: -27.7456, lng: -48.5089, orientation: 130, bestTimeWindow: '08h - 11h' },
  { id: 'armacao', name: 'Armação', region: 'Sul' as const, lat: -27.7447, lng: -48.5044, orientation: 115,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo', description: 'Point break na pedra' },
      { id: 'centro', name: 'Centro', description: 'Beach break principal' },
      { id: 'matadouro', name: 'Matadouro', description: 'Pico clássico avançado' }
    ],
    bestTimeWindow: '06h - 09h e 16h - 18h'
  },
  { id: 'naufragados', name: 'Naufragados', region: 'Sul' as const, lat: -27.8456, lng: -48.5623, orientation: 180, bestTimeWindow: 'Depende da maré (acesso por trilha)' },
  // LESTE
  { id: 'joaquina', name: 'Joaquina', region: 'Leste' as const, lat: -27.6214, lng: -48.4433, orientation: 90,
    subRegions: [
      { id: 'canto-esquerdo', name: 'Canto Esquerdo (Dunas)', description: 'Pico clássico heavy' },
      { id: 'meio', name: 'Meio da Praia', description: 'Beach break mais tranquilo' },
      { id: 'canto-direito', name: 'Canto Direito', description: 'Point break na pedra' }
    ],
    bestTimeWindow: 'Agora até 11h'
  },
  { id: 'mole', name: 'Praia Mole', region: 'Leste' as const, lat: -27.5989, lng: -48.4381, orientation: 85,
    subRegions: [
      { id: 'gruta', name: 'Gruta', description: 'Lado esquerdo, mais protegido' },
      { id: 'meio', name: 'Meio da Praia', description: 'Pico principal' }
    ],
    bestTimeWindow: '07h - 10h'
  },
  { id: 'mocambique', name: 'Moçambique', region: 'Leste' as const, lat: -27.5647, lng: -48.4208, orientation: 80,
    subRegions: [
      { id: 'norte', name: 'Norte (Barra)', description: 'Perto da Barra da Lagoa' },
      { id: 'meio', name: 'Meio da Praia', description: 'Extensão enorme' },
      { id: 'sul', name: 'Sul', description: 'Mais isolado' }
    ],
    bestTimeWindow: '08h - 11h'
  },
  { id: 'barra-lagoa', name: 'Barra da Lagoa', region: 'Leste' as const, lat: -27.5767, lng: -48.4194, orientation: 75,
    subRegions: [
      { id: 'canal', name: 'Canal da Barra', description: 'Point break na barra do rio' },
      { id: 'prainha', name: 'Prainha', description: 'Beach break ao lado' }
    ],
    bestTimeWindow: 'Melhor na maré enchente'
  },
  // NORTE
  { id: 'santinho', name: 'Santinho', region: 'Norte' as const, lat: -27.4433, lng: -48.3917, orientation: 70,
    subRegions: [
      { id: 'costao', name: 'Costão do Santinho', description: 'Point break direito' },
      { id: 'centro', name: 'Centro', description: 'Beach break principal' }
    ],
    bestTimeWindow: '15h - 17h'
  },
  { id: 'ponta-aranhas', name: 'Ponta das Aranhas', region: 'Norte' as const, lat: -27.4256, lng: -48.3889, orientation: 65, bestTimeWindow: '09h - 12h' },
  { id: 'canajure', name: 'Canajurê', region: 'Norte' as const, lat: -27.4189, lng: -48.3945, orientation: 60, bestTimeWindow: '10h - 13h' },
  { id: 'cachoeira', name: 'Cachoeira do Bom Jesus', region: 'Norte' as const, lat: -27.4122, lng: -48.4006, orientation: 55, bestTimeWindow: 'Melhor no verão' },
]

let cachedConditions: BeachCondition[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 15 * 60 * 1000

export async function fetchCurrentConditions(): Promise<BeachCondition[]> {
  const now = Date.now()
  if (cachedConditions && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConditions
  }

  const waterTemp = getWaterTemp()
  const tide = getTide()

  const conditions = await Promise.all(
    BEACHES.map(async (beach) => {
      const windyData = await getWindyForecast(beach.lat, beach.lng, beach.orientation)

      const waveHeight = Number((windyData?.waveHeight ?? 1.0 + Math.random() * 0.5).toFixed(1))
      const windSpeed = Math.round(windyData?.windSpeed ?? 10 + Math.floor(Math.random() * 10))
      const windDirection = windyData?.windDirection ?? 'N (Terral)'
      const swellPeriod = Math.round(windyData?.swellPeriod ?? 10 + Math.floor(Math.random() * 4))
      const swellDirection = windyData?.swellDirection ?? 'SE'

      const score = calculateScore(waveHeight, windSpeed, swellPeriod, windDirection)
      const level = getLevel(waveHeight, swellPeriod)

      return {
        id: beach.id,
        name: beach.name,
        region: beach.region,
        subRegions: beach.subRegions,
        score,
        waveHeight,
        windSpeed,
        windDirection,
        swellDirection,
        swellPeriod,
        tide,
        tideHeight: Number((0.8 + Math.random() * 0.6).toFixed(1)),
        level,
        boardSuggestion: getBoardSuggestion(waveHeight, level),
        waterConditions: {
          temperature: waterTemp,
          wetsuit: getWetsuitInfo(waterTemp)
        },
        crowdLevel: getCrowdLevel(score),
        bestTimeWindow: beach.bestTimeWindow,
        lat: beach.lat,
        lng: beach.lng,
        cameraUrl: (beach as any).cameraUrl,
        cameraEmbed: (beach as any).cameraEmbed,
      } as BeachCondition
    })
  )

  cachedConditions = conditions
  lastFetchTime = now
  return conditions
}

export function getCurrentConditions(): BeachCondition[] {
  if (cachedConditions) return cachedConditions
  return BEACHES.map(beach => ({
    id: beach.id,
    name: beach.name,
    region: beach.region,
    subRegions: beach.subRegions,
    score: Number((5 + Math.random() * 3).toFixed(1)),
    waveHeight: Number((1.0 + Math.random() * 1.0).toFixed(1)),
    windSpeed: Math.round(10 + Math.random() * 10),
    windDirection: 'N (Terral)',
    swellDirection: 'SE',
    swellPeriod: Math.round(10 + Math.random() * 4),
    tide: getTide(),
    tideHeight: Number((0.8 + Math.random() * 0.6).toFixed(1)),
    level: 'Intermediário' as const,
    boardSuggestion: 'Shortboard 6\'0"',
    waterConditions: { temperature: getWaterTemp(), wetsuit: getWetsuitInfo(getWaterTemp()) },
    crowdLevel: 'Pouca gente' as const,
    bestTimeWindow: beach.bestTimeWindow,
    lat: beach.lat,
    lng: beach.lng,
  }))
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

  if (spot.tide === 'Estofo') analysis += 'Maré no estofo, momento ideal para pegar as melhores ondas.'
  else if (spot.tide === 'Enchente') analysis += 'Maré enchendo, ainda bom para surfar.'
  else analysis += 'Maré vazando, condições podem mudar.'

  return analysis
}
