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
  { id: 'acores', name: 'Açores', region: 'Sul' as const, lat: -27.
