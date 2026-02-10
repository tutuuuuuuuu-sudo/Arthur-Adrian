export interface BeachCondition {
  id: string
  name: string
  region: 'Sul' | 'Leste' | 'Norte' | 'Centro'
  score: number // 0-10
  waveHeight: number // metros
  windSpeed: number // km/h
  windDirection: string
  swellDirection: string
  swellPeriod: number // segundos
  tide: 'Enchente' | 'Vazante' | 'Estofo'
  tideHeight: number // metros
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  boardSuggestion: string
  crowdLevel: 'Vazio' | 'Pouca gente' | 'Cheio'
  bestTimeWindow: string
  lat: number
  lng: number
}

// Simulação de dados em tempo real
export function getCurrentConditions(): BeachCondition[] {
  const now = new Date()
  const hour = now.getHours()

  // Simulação de condições variáveis por hora
  const isMorning = hour >= 6 && hour <= 10

  return [
    {
      id: 'campeche',
      name: 'Campeche',
      region: 'Sul',
      score: isMorning ? 8.5 : 6.0,
      waveHeight: 1.5,
      windSpeed: isMorning ? 8 : 15,
      windDirection: isMorning ? 'N (Terral)' : 'NE (Lateral)',
      swellDirection: 'SE',
      swellPeriod: 12,
      tide: hour >= 6 && hour <= 12 ? 'Enchente' : 'Vazante',
      tideHeight: 0.8,
      level: 'Intermediário',
      boardSuggestion: 'Shortboard 6\'0" - 6\'2"',
      crowdLevel: isMorning ? 'Cheio' : 'Pouca gente',
      bestTimeWindow: '06h - 09h',
      lat: -27.6683,
      lng: -48.4772
    },
    {
      id: 'joaquina',
      name: 'Joaquina',
      region: 'Leste',
      score: 9.0,
      waveHeight: 2.0,
      windSpeed: 12,
      windDirection: 'NW (Terral)',
      swellDirection: 'S',
      swellPeriod: 14,
      tide: 'Estofo',
      tideHeight: 1.2,
      level: 'Avançado',
      boardSuggestion: 'Shortboard 5\'10" - 6\'0"',
      crowdLevel: 'Cheio',
      bestTimeWindow: 'Agora até 11h',
      lat: -27.6214,
      lng: -48.4433
    },
    {
      id: 'mole',
      name: 'Praia Mole',
      region: 'Leste',
      score: 7.5,
      waveHeight: 1.2,
      windSpeed: 10,
      windDirection: 'N (Terral)',
      swellDirection: 'SE',
      swellPeriod: 10,
      tide: 'Enchente',
      tideHeight: 0.9,
      level: 'Intermediário',
      boardSuggestion: 'Fish 5\'8" ou Funboard',
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '07h - 10h',
      lat: -27.5989,
      lng: -48.4381
    },
    {
      id: 'santinho',
      name: 'Santinho',
      region: 'Norte',
      score: 5.0,
      waveHeight: 0.8,
      windSpeed: 18,
      windDirection: 'NE (Lateral)',
      swellDirection: 'E',
      swellPeriod: 8,
      tide: 'Vazante',
      tideHeight: 0.5,
      level: 'Iniciante',
      boardSuggestion: 'Longboard ou Funboard 7\'0"+',
      crowdLevel: 'Vazio',
      bestTimeWindow: '15h - 17h',
      lat: -27.4433,
      lng: -48.3917
    },
    {
      id: 'mocambique',
      name: 'Moçambique',
      region: 'Leste',
      score: 6.5,
      waveHeight: 1.0,
      windSpeed: 14,
      windDirection: 'NW (Terral)',
      swellDirection: 'S',
      swellPeriod: 11,
      tide: 'Enchente',
      tideHeight: 0.7,
      level: 'Iniciante',
      boardSuggestion: 'Longboard 8\'0"+ ou Funboard',
      crowdLevel: 'Vazio',
      bestTimeWindow: '08h - 11h',
      lat: -27.5647,
      lng: -48.4208
    },
    {
      id: 'barra-lagoa',
      name: 'Barra da Lagoa',
      region: 'Leste',
      score: 4.5,
      waveHeight: 0.6,
      windSpeed: 20,
      windDirection: 'E (Frontal)',
      swellDirection: 'SE',
      swellPeriod: 7,
      tide: 'Vazante',
      tideHeight: 0.4,
      level: 'Iniciante',
      boardSuggestion: 'Longboard ou Prancha de Iniciante',
      crowdLevel: 'Pouca gente',
      bestTimeWindow: 'Não recomendado hoje',
      lat: -27.5767,
      lng: -48.4194
    },
    {
      id: 'armacao',
      name: 'Armação',
      region: 'Sul',
      score: 7.0,
      waveHeight: 1.3,
      windSpeed: 9,
      windDirection: 'N (Terral)',
      swellDirection: 'S',
      swellPeriod: 13,
      tide: 'Estofo',
      tideHeight: 1.0,
      level: 'Intermediário',
      boardSuggestion: 'Fish 5\'10" ou Shortboard',
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '06h - 09h e 16h - 18h',
      lat: -27.7447,
      lng: -48.5044
    },
    {
      id: 'cachoeira',
      name: 'Cachoeira do Bom Jesus',
      region: 'Norte',
      score: 3.5,
      waveHeight: 0.5,
      windSpeed: 22,
      windDirection: 'NE (Frontal)',
      swellDirection: 'E',
      swellPeriod: 6,
      tide: 'Vazante',
      tideHeight: 0.3,
      level: 'Iniciante',
      boardSuggestion: 'Não recomendado surfar',
      crowdLevel: 'Vazio',
      bestTimeWindow: 'Condições ruins',
      lat: -27.4122,
      lng: -48.4006
    }
  ]
}

export function getTopSpots(limit: number = 3): BeachCondition[] {
  return getCurrentConditions()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function getSpotsByRegion(region: BeachCondition['region']): BeachCondition[] {
  return getCurrentConditions()
    .filter(spot => spot.region === region)
    .sort((a, b) => b.score - a.score)
}

export function getSpotById(id: string): BeachCondition | undefined {
  return getCurrentConditions().find(spot => spot.id === id)
}

export function analyzeConditions(spot: BeachCondition): string {
  let analysis = ''

  if (spot.score >= 8) {
    analysis = `🔥 Condições EXCELENTES! `
  } else if (spot.score >= 6.5) {
    analysis = `✅ Boas condições para surfar. `
  } else if (spot.score >= 5) {
    analysis = `⚠️ Condições medianas. `
  } else {
    analysis = `❌ Condições fracas. `
  }

  // Análise do vento
  if (spot.windDirection.includes('Terral')) {
    analysis += `Vento terral ${spot.windSpeed}km/h deixando o mar limpo e organizado. `
  } else if (spot.windDirection.includes('Lateral')) {
    analysis += `Vento lateral ${spot.windSpeed}km/h pode atrapalhar um pouco. `
  } else {
    analysis += `Vento frontal ${spot.windSpeed}km/h bagunçando as ondas. `
  }

  // Análise do swell
  if (spot.swellPeriod >= 12) {
    analysis += `Período de ${spot.swellPeriod}s trazendo ondas longas e bem formadas. `
  } else if (spot.swellPeriod >= 9) {
    analysis += `Período médio de ${spot.swellPeriod}s, ondas razoáveis. `
  } else {
    analysis += `Período curto de ${spot.swellPeriod}s, ondas fracas e desorganizadas. `
  }

  // Análise da maré
  if (spot.tide === 'Estofo') {
    analysis += `Maré no estofo, momento ideal para pegar as melhores ondas.`
  } else if (spot.tide === 'Enchente') {
    analysis += `Maré enchendo, ainda bom para surfar.`
  } else {
    analysis += `Maré vazando, condições podem mudar.`
  }

  return analysis
}
