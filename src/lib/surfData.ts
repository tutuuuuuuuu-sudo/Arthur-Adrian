export interface SubRegion {
  id: string
  name: string
  description?: string
}

export interface WaterConditions {
  temperature: number // °C
  wetsuit: {
    thickness: string // "2mm", "3/2mm", "4/3mm", "5/4mm"
    description: string // "Quentinha", "Confortável", "Fria", "Muito fria"
  }
}

export interface BeachCondition {
  id: string
  name: string
  region: 'Sul' | 'Leste' | 'Norte' | 'Centro'
  subRegions?: SubRegion[] // Ex: Campeche tem Lomba do Sabão, Palanque, etc
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
  waterConditions: WaterConditions
  crowdLevel: 'Vazio' | 'Pouca gente' | 'Cheio'
  bestTimeWindow: string
  lat: number
  lng: number
  cameraUrl?: string // URL da câmera ao vivo
  cameraEmbed?: string // URL para embed da câmera
}

// Simulação de dados em tempo real
export function getCurrentConditions(): BeachCondition[] {
  const now = new Date()
  const hour = now.getHours()
  const month = now.getMonth() // 0-11

  // Temperatura da água varia por estação
  // Verão (Dez-Mar): 24-26°C | Outono (Abr-Jun): 20-22°C
  // Inverno (Jul-Set): 16-18°C | Primavera (Out-Nov): 20-22°C
  const waterTemp = month >= 11 || month <= 2 ? 25 :
                    month >= 3 && month <= 5 ? 21 :
                    month >= 6 && month <= 8 ? 17 : 21

  const getWetsuitInfo = (temp: number): WaterConditions['wetsuit'] => {
    if (temp >= 24) return { thickness: '2mm ou lycra', description: 'Quentinha ☀️' }
    if (temp >= 20) return { thickness: '3/2mm', description: 'Confortável 🌤️' }
    if (temp >= 18) return { thickness: '4/3mm', description: 'Fria 🌊' }
    return { thickness: '5/4mm + touca', description: 'Muito fria 🥶' }
  }

  // Simulação de condições variáveis por hora
  const isMorning = hour >= 6 && hour <= 10

  return [
    // ========== SUL ==========
    {
      id: 'campeche',
      name: 'Campeche',
      region: 'Sul',
      subRegions: [
        { id: 'lomba-sabao', name: 'Lomba do Sabão', description: 'Região protegida, boa para iniciantes' },
        { id: 'palanque', name: 'Palanque', description: 'Pico famoso, ondas tubulares' },
        { id: 'principal', name: 'Principal', description: 'Faixa central, mais movimentada' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: isMorning ? 'Cheio' : 'Pouca gente',
      bestTimeWindow: '06h - 09h',
      lat: -27.6683,
      lng: -48.4772,
      cameraUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
      cameraEmbed: 'https://www.youtube.com/embed/5qap5aO4i9A'
    },
    {
      id: 'morro-pedras',
      name: 'Morro das Pedras',
      region: 'Sul',
      subRegions: [
        { id: 'canto-direito', name: 'Canto Direito', description: 'Ondas mais fortes' },
        { id: 'meio', name: 'Meio da Praia', description: 'Beach break mais tranquilo' }
      ],
      score: 8.2,
      waveHeight: 1.8,
      windSpeed: 10,
      windDirection: 'N (Terral)',
      swellDirection: 'S',
      swellPeriod: 13,
      tide: 'Estofo',
      tideHeight: 1.1,
      level: 'Intermediário',
      boardSuggestion: 'Shortboard 5\'10" - 6\'2"',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '07h - 10h',
      lat: -27.6761,
      lng: -48.4842,
      cameraUrl: 'https://www.youtube.com/watch?v=live_floripa',
      cameraEmbed: 'https://www.youtube.com/embed/live_floripa'
    },
    {
      id: 'matadeiro',
      name: 'Matadeiro',
      region: 'Sul',
      score: 7.8,
      waveHeight: 1.6,
      windSpeed: 11,
      windDirection: 'NW (Terral)',
      swellDirection: 'SE',
      swellPeriod: 11,
      tide: 'Enchente',
      tideHeight: 0.9,
      level: 'Intermediário',
      boardSuggestion: 'Fish 5\'8" ou Shortboard',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '06h - 09h',
      lat: -27.7342,
      lng: -48.5167,
      cameraUrl: 'https://www.youtube.com/watch?v=matadeiro_live',
      cameraEmbed: 'https://www.youtube.com/embed/matadeiro_live'
    },
    {
      id: 'lagoinha-leste',
      name: 'Lagoinha do Leste',
      region: 'Sul',
      score: 9.2,
      waveHeight: 2.1,
      windSpeed: 8,
      windDirection: 'N (Terral)',
      swellDirection: 'S',
      swellPeriod: 15,
      tide: 'Estofo',
      tideHeight: 1.3,
      level: 'Avançado',
      boardSuggestion: 'Shortboard 5\'8" - 6\'0" (tubos)',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: 'Dia todo (acesso por trilha)',
      lat: -27.7892,
      lng: -48.5289
    },
    {
      id: 'acores',
      name: 'Açores',
      region: 'Sul',
      subRegions: [
        { id: 'ponta-esquerda', name: 'Ponta Esquerda', description: 'Point break clássico' },
        { id: 'meio', name: 'Meio', description: 'Beach break mais acessível' }
      ],
      score: 8.7,
      waveHeight: 1.9,
      windSpeed: 9,
      windDirection: 'N (Terral)',
      swellDirection: 'SE',
      swellPeriod: 14,
      tide: 'Estofo',
      tideHeight: 1.0,
      level: 'Intermediário',
      boardSuggestion: 'Shortboard 6\'0" - 6\'2"',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '07h - 11h',
      lat: -27.7572,
      lng: -48.5125,
      cameraUrl: 'https://www.youtube.com/watch?v=acores_live',
      cameraEmbed: 'https://www.youtube.com/embed/acores_live'
    },
    {
      id: 'solidao',
      name: 'Solidão',
      region: 'Sul',
      score: 7.5,
      waveHeight: 1.4,
      windSpeed: 12,
      windDirection: 'NW (Terral)',
      swellDirection: 'S',
      swellPeriod: 12,
      tide: 'Enchente',
      tideHeight: 0.8,
      level: 'Intermediário',
      boardSuggestion: 'Fish ou Shortboard',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '08h - 11h',
      lat: -27.7456,
      lng: -48.5089
    },
    {
      id: 'armacao',
      name: 'Armação',
      region: 'Sul',
      subRegions: [
        { id: 'canto-esquerdo', name: 'Canto Esquerdo', description: 'Point break na pedra' },
        { id: 'centro', name: 'Centro', description: 'Beach break principal' },
        { id: 'matadouro', name: 'Matadouro', description: 'Pico clássico avançado' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '06h - 09h e 16h - 18h',
      lat: -27.7447,
      lng: -48.5044,
      cameraUrl: 'https://www.youtube.com/watch?v=armacao_live',
      cameraEmbed: 'https://www.youtube.com/embed/armacao_live'
    },
    {
      id: 'naufragados',
      name: 'Naufragados',
      region: 'Sul',
      score: 8.9,
      waveHeight: 2.3,
      windSpeed: 7,
      windDirection: 'NW (Terral)',
      swellDirection: 'S',
      swellPeriod: 16,
      tide: 'Estofo',
      tideHeight: 1.4,
      level: 'Avançado',
      boardSuggestion: 'Shortboard 5\'10" - 6\'0" (tubos)',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: 'Depende da maré (acesso por trilha)',
      lat: -27.8456,
      lng: -48.5623
    },

    // ========== LESTE ==========
    {
      id: 'joaquina',
      name: 'Joaquina',
      region: 'Leste',
      subRegions: [
        { id: 'canto-esquerdo', name: 'Canto Esquerdo (Dunas)', description: 'Pico clássico heavy' },
        { id: 'meio', name: 'Meio da Praia', description: 'Beach break mais tranquilo' },
        { id: 'canto-direito', name: 'Canto Direito', description: 'Point break na pedra' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Cheio',
      bestTimeWindow: 'Agora até 11h',
      lat: -27.6214,
      lng: -48.4433,
      cameraUrl: 'https://www.youtube.com/watch?v=joaquina_live',
      cameraEmbed: 'https://www.youtube.com/embed/joaquina_live'
    },
    {
      id: 'mole',
      name: 'Praia Mole',
      region: 'Leste',
      subRegions: [
        { id: 'gruta', name: 'Gruta', description: 'Lado esquerdo, mais protegido' },
        { id: 'meio', name: 'Meio da Praia', description: 'Pico principal' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Pouca gente',
      bestTimeWindow: '07h - 10h',
      lat: -27.5989,
      lng: -48.4381,
      cameraUrl: 'https://www.youtube.com/watch?v=mole_live',
      cameraEmbed: 'https://www.youtube.com/embed/mole_live'
    },
    {
      id: 'mocambique',
      name: 'Moçambique',
      region: 'Leste',
      subRegions: [
        { id: 'norte', name: 'Norte (Barra)', description: 'Perto da Barra da Lagoa' },
        { id: 'meio', name: 'Meio da Praia', description: 'Extensão enorme' },
        { id: 'sul', name: 'Sul', description: 'Mais isolado' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '08h - 11h',
      lat: -27.5647,
      lng: -48.4208,
      cameraUrl: 'https://www.youtube.com/watch?v=mocambique_live',
      cameraEmbed: 'https://www.youtube.com/embed/mocambique_live'
    },
    {
      id: 'barra-lagoa',
      name: 'Barra da Lagoa',
      region: 'Leste',
      subRegions: [
        { id: 'canal', name: 'Canal da Barra', description: 'Point break na barra do rio' },
        { id: 'prainha', name: 'Prainha', description: 'Beach break ao lado' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Pouca gente',
      bestTimeWindow: 'Não recomendado hoje',
      lat: -27.5767,
      lng: -48.4194,
      cameraUrl: 'https://www.youtube.com/watch?v=barra_live',
      cameraEmbed: 'https://www.youtube.com/embed/barra_live'
    },

    // ========== NORTE ==========
    {
      id: 'santinho',
      name: 'Santinho',
      region: 'Norte',
      subRegions: [
        { id: 'costao', name: 'Costão do Santinho', description: 'Point break direito' },
        { id: 'centro', name: 'Centro', description: 'Beach break principal' }
      ],
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '15h - 17h',
      lat: -27.4433,
      lng: -48.3917,
      cameraUrl: 'https://www.youtube.com/watch?v=santinho_live',
      cameraEmbed: 'https://www.youtube.com/embed/santinho_live'
    },
    {
      id: 'ponta-aranhas',
      name: 'Ponta das Aranhas',
      region: 'Norte',
      score: 6.8,
      waveHeight: 1.1,
      windSpeed: 13,
      windDirection: 'NW (Terral)',
      swellDirection: 'NE',
      swellPeriod: 9,
      tide: 'Enchente',
      tideHeight: 0.7,
      level: 'Intermediário',
      boardSuggestion: 'Fish ou Funboard',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '09h - 12h',
      lat: -27.4256,
      lng: -48.3889
    },
    {
      id: 'canajure',
      name: 'Canajurê',
      region: 'Norte',
      score: 5.5,
      waveHeight: 0.9,
      windSpeed: 16,
      windDirection: 'E (Lateral)',
      swellDirection: 'NE',
      swellPeriod: 8,
      tide: 'Vazante',
      tideHeight: 0.6,
      level: 'Iniciante',
      boardSuggestion: 'Longboard ou Funboard',
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
      crowdLevel: 'Vazio',
      bestTimeWindow: '10h - 13h',
      lat: -27.4189,
      lng: -48.3945
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
      waterConditions: {
        temperature: waterTemp,
        wetsuit: getWetsuitInfo(waterTemp)
      },
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
