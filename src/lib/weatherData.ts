export interface WeatherForecast {
  date: string
  dayName: string
  waveHeight: number
  windSpeed: number
  windDirection: string
  swellPeriod: number
  temperature: number
  condition: 'Excelente' | 'Bom' | 'Regular' | 'Ruim'
  score: number
}

function calculateForecastScore(wave: number, wind: number, period: number): number {
  let score = 5
  if (wave >= 1.5) score += 2
  else if (wave >= 1.0) score += 1.5
  else if (wave >= 0.8) score += 1
  if (wind <= 10) score += 2
  else if (wind <= 15) score += 1
  else score -= 1
  if (period >= 12) score += 2
  else if (period >= 10) score += 1
  return Math.min(10, Math.max(0, score))
}

function getConditionFromScore(score: number): 'Excelente' | 'Bom' | 'Regular' | 'Ruim' {
  if (score >= 8) return 'Excelente'
  if (score >= 6.5) return 'Bom'
  if (score >= 5) return 'Regular'
  return 'Ruim'
}

const BEACH_COORDS: Record<string, { lat: number, lng: number }> = {
  'campeche': { lat: -27.6683, lng: -48.4772 },
  'morro-pedras': { lat: -27.6761, lng: -48.4842 },
  'matadeiro': { lat: -27.7342, lng: -48.5167 },
  'lagoinha-leste': { lat: -27.7892, lng: -48.5289 },
  'acores': { lat: -27.7572, lng: -48.5125 },
  'solidao': { lat: -27.7456, lng: -48.5089 },
  'armacao': { lat: -27.7447, lng: -48.5044 },
  'naufragados': { lat: -27.8456, lng: -48.5623 },
  'joaquina': { lat: -27.6214, lng: -48.4433 },
  'mole': { lat: -27.5989, lng: -48.4381 },
  'mocambique': { lat: -27.5647, lng: -48.4208 },
  'barra-lagoa': { lat: -27.5767, lng: -48.4194 },
  'santinho': { lat: -27.4433, lng: -48.3917 },
  'ponta-aranhas': { lat: -27.4256, lng: -48.3889 },
  'canajure': { lat: -27.4189, lng: -48.3945 },
  'cachoeira': { lat: -27.4122, lng: -48.4006 },
}

const forecastCache: Record<string, { data: WeatherForecast[], time: number }> = {}
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutos — mesmo ritmo que os dados atuais

export interface CurrentConditionsForForecast {
  waveHeight: number
  windSpeed: number
  swellPeriod: number
  windDirection: string
  waterTemperature?: number
}

export async function getWeatherForecast(
  spotId: string,
  currentConditions?: CurrentConditionsForForecast
): Promise<WeatherForecast[]> {
  const now = Date.now()
  if (forecastCache[spotId] && (now - forecastCache[spotId].time) < CACHE_DURATION) {
    // Mesmo com cache, atualiza o "Hoje" com dados em tempo real
    if (currentConditions && forecastCache[spotId].data.length > 0) {
      const cached = [...forecastCache[spotId].data]
      const todayScore = calculateForecastScore(
        currentConditions.waveHeight,
        currentConditions.windSpeed,
        currentConditions.swellPeriod
      )
      cached[0] = {
        ...cached[0],
        waveHeight: currentConditions.waveHeight,
        windSpeed: currentConditions.windSpeed,
        swellPeriod: currentConditions.swellPeriod,
        temperature: currentConditions.waterTemperature ?? cached[0].temperature,
        score: Number(todayScore.toFixed(1)),
        condition: getConditionFromScore(todayScore)
      }
      return cached
    }
    return forecastCache[spotId].data
  }

  const coords = BEACH_COORDS[spotId]
  if (!coords) return getFallbackForecast()

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lng}&daily=wave_height_max,wave_period_max,swell_wave_height_max,swell_wave_period_max&length_unit=metric&timezone=America%2FSao_Paulo`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=wind_speed_10m_max,wind_direction_10m_dominant,temperature_2m_max&wind_speed_unit=kmh&timezone=America%2FSao_Paulo`)
    ])

    const marine = await marineRes.json() as any
    const weather = await weatherRes.json() as any

    const days = marine.daily?.time ?? []
    const forecasts: WeatherForecast[] = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    for (let i = 0; i < Math.min(7, days.length); i++) {
      const date = new Date(days[i] + 'T12:00:00')
      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()]

      // Para "Hoje" usa dados em tempo real se disponíveis
      let waveHeight: number
      let windSpeed: number
      let swellPeriod: number
      let temperature: number

      if (i === 0 && currentConditions) {
        waveHeight = currentConditions.waveHeight
        windSpeed = currentConditions.windSpeed
        swellPeriod = currentConditions.swellPeriod
        temperature = currentConditions.waterTemperature ?? Math.round(weather.daily?.temperature_2m_max?.[i] ?? 24)
      } else {
        waveHeight = Number((marine.daily?.swell_wave_height_max?.[i] ?? marine.daily?.wave_height_max?.[i] ?? 1.0).toFixed(1))
        swellPeriod = Math.round(marine.daily?.swell_wave_period_max?.[i] ?? marine.daily?.wave_period_max?.[i] ?? 10)
        windSpeed = Math.round(weather.daily?.wind_speed_10m_max?.[i] ?? 12)
        temperature = Math.round(weather.daily?.temperature_2m_max?.[i] ?? 24)
      }

      const windDeg = weather.daily?.wind_direction_10m_dominant?.[i] ?? 0
      const dirs = ['N', 'NE', 'NE', 'E', 'E', 'SE', 'SE', 'S', 'S', 'SW', 'SW', 'W', 'W', 'NW', 'NW', 'N']
      const windDirection = dirs[Math.round(windDeg / 22.5) % 16]

      const score = calculateForecastScore(waveHeight, windSpeed, swellPeriod)
      const condition = getConditionFromScore(score)

      forecasts.push({
        date: days[i],
        dayName,
        waveHeight,
        windSpeed,
        windDirection,
        swellPeriod,
        temperature,
        condition,
        score: Number(score.toFixed(1))
      })
    }

    forecastCache[spotId] = { data: forecasts, time: now }
    return forecasts
  } catch (error) {
    console.error('Erro ao buscar previsão:', error)
    return getFallbackForecast()
  }
}

function getFallbackForecast(): WeatherForecast[] {
  const today = new Date()
  const forecasts: WeatherForecast[] = []
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()]
    const score = calculateForecastScore(1.0, 12, 10)
    forecasts.push({
      date: date.toISOString().split('T')[0],
      dayName,
      waveHeight: 1.0,
      windSpeed: 12,
      windDirection: 'N',
      swellPeriod: 10,
      temperature: 24,
      condition: getConditionFromScore(score),
      score: Number(score.toFixed(1))
    })
  }
  return forecasts
}
