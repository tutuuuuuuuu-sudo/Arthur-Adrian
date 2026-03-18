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
  else if (swellPeriod < 8) score -=
