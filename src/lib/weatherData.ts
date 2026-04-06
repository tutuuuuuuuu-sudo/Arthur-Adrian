// ✅ Busca nível de maré e temperatura da água real via Open-Meteo Marine
export async function getRealTideAndWaterTemp(lat: number, lng: number): Promise<{
  tideLevel: number
  waterTemp: number | null
  tideState: string
} | null> {
  try {
    const res = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,sea_surface_temperature&timezone=America%2FSao_Paulo&forecast_days=1`
    )
    const data = await res.json() as any
    const hourlyTimes: string[] = data.hourly?.time ?? []
    const waveHeights: number[] = data.hourly?.wave_height ?? []
    const seaTemps: number[] = data.hourly?.sea_surface_temperature ?? []

    const nowStr = new Date().toISOString().slice(0, 13) // "2026-04-06T08"
    const idx = hourlyTimes.findIndex(t => t.startsWith(nowStr))
    const currentIdx = idx >= 0 ? idx : new Date().getHours()

    const prevIdx = Math.max(0, currentIdx - 1)
    const currWave = waveHeights[currentIdx] ?? 0
    const prevWave = waveHeights[prevIdx] ?? 0
    const waterTemp = seaTemps[currentIdx] != null ? Math.round(seaTemps[currentIdx]) : null

    // Determina estado da maré pela tendência da hora anterior
    let tideState = 'Estável'
    if (currWave > prevWave + 0.02) tideState = 'Enchendo'
    else if (currWave < prevWave - 0.02) tideState = 'Secando'
    else if (currWave > 0.55) tideState = 'Cheia'
    else tideState = 'Vazia'

    return { tideLevel: Number(currWave.toFixed(2)), waterTemp, tideState }
  } catch {
    return null
  }
}

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
  locked?: boolean  // true = dia bloqueado para free
}

function calculateForecastScore(wave: number, wind: number, period: number): number {
  let score = 5
  if (wave >= 1.5) score += 2
  else if (wave >= 1.0) score += 1.5
  else if (wave >= 0.8) score += 1
  else score -= 1
  if (wind <= 10) score += 2
  else if (wind <= 15) score += 1
  else score -= 1
  if (period >= 12) score += 2
  else if (period >= 10) score += 1
  else if (period < 8) score -= 1
  return Math.min(10, Math.max(0, score))
}

function getConditionFromScore(score: number): 'Excelente' | 'Bom' | 'Regular' | 'Ruim' {
  if (score >= 8) return 'Excelente'
  if (score >= 6.5) return 'Bom'
  if (score >= 5) return 'Regular'
  return 'Ruim'
}

// Converte graus para código de direção limpo (N, SE, SW etc)
function degreesToDir(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

const BEACH_COORDS: Record<string, { lat: number, lng: number }> = {
  'campeche': { lat: -27.6683, lng: -48.4772 },
  'novo-campeche': { lat: -27.6450, lng: -48.4650 },
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
}

const forecastCache: Record<string, { data: WeatherForecast[], time: number }> = {}
const CACHE_DURATION = 15 * 60 * 1000

// Quantos dias mostrar sem bloqueio para usuário free
const FREE_DAYS = 2

export interface CurrentConditionsForForecast {
  waveHeight: number
  windSpeed: number
  swellPeriod: number
  windDirection: string
  waterTemperature?: number
  score: number
}

export async function getWeatherForecast(
  spotId: string,
  currentConditions?: CurrentConditionsForForecast,
  isPremium = false
): Promise<WeatherForecast[]> {
  const now = Date.now()
  if (forecastCache[spotId] && (now - forecastCache[spotId].time) < CACHE_DURATION) {
    const cached = [...forecastCache[spotId].data]
    if (currentConditions && cached.length > 0) {
      cached[0] = {
        ...cached[0],
        waveHeight: currentConditions.waveHeight,
        windSpeed: currentConditions.windSpeed,
        swellPeriod: currentConditions.swellPeriod,
        windDirection: currentConditions.windDirection.split(' ')[0].trim(),
        temperature: currentConditions.waterTemperature ?? cached[0].temperature,
        score: currentConditions.score,
        condition: getConditionFromScore(currentConditions.score),
        locked: false,
      }
    }
    return applyPremiumLock(cached, isPremium)
  }

  const coords = BEACH_COORDS[spotId]
  if (!coords) return applyPremiumLock(getFallbackForecast(), isPremium)

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lng}&daily=wave_height_max,wave_period_max,swell_wave_height_max,swell_wave_period_max&length_unit=metric&timezone=America%2FSao_Paulo`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=temperature_2m&daily=wind_speed_10m_max,wind_direction_10m_dominant,temperature_2m_max&wind_speed_unit=kmh&timezone=America%2FSao_Paulo`)
    ])

    const marine = await marineRes.json() as any
    const weather = await weatherRes.json() as any

    const days = marine.daily?.time ?? []
    const forecasts: WeatherForecast[] = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    for (let i = 0; i < Math.min(7, days.length); i++) {
      const date = new Date(days[i] + 'T12:00:00')
      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()]

      let waveHeight: number, windSpeed: number, swellPeriod: number, temperature: number, score: number

      // Temperatura atual: usa valor horário da hora atual (index = hora atual do dia)
      const currentHour = new Date().getHours()
      const hourlyTemps: number[] = weather.hourly?.temperature_2m ?? []
      // Cada dia tem 24 horas no array hourly; dia i começa no índice i*24
      const hourIdx = i === 0 ? currentHour : i * 24 + 12 // hora atual no dia 0, meio-dia nos demais
      const hourlyTemp = hourlyTemps[hourIdx] != null ? Math.round(hourlyTemps[hourIdx]) : null

      if (i === 0 && currentConditions) {
        waveHeight = currentConditions.waveHeight
        windSpeed = currentConditions.windSpeed
        swellPeriod = currentConditions.swellPeriod
        // ✅ Temperatura do ar atual: valor horário real, não máximo diário
        temperature = hourlyTemp ?? Math.round(weather.daily?.temperature_2m_max?.[i] ?? 24)
        score = currentConditions.score
      } else {
        waveHeight = Number((marine.daily?.swell_wave_height_max?.[i] ?? marine.daily?.wave_height_max?.[i] ?? 1.0).toFixed(1))
        swellPeriod = Math.round(marine.daily?.swell_wave_period_max?.[i] ?? marine.daily?.wave_period_max?.[i] ?? 10)
        windSpeed = Math.round(weather.daily?.wind_speed_10m_max?.[i] ?? 12)
        // Para dias futuros usa temperatura máxima (previsão)
        temperature = Math.round(weather.daily?.temperature_2m_max?.[i] ?? 24)
        score = calculateForecastScore(waveHeight, windSpeed, swellPeriod)
      }

      // ✅ CORRIGIDO: direção em graus → código limpo sem sufixo
      const windDeg = weather.daily?.wind_direction_10m_dominant?.[i] ?? 0
      const windDirection = degreesToDir(windDeg)

      forecasts.push({
        date: days[i],
        dayName,
        waveHeight,
        windSpeed,
        windDirection,   // ← "SE", "N", "SW" — sem Terral/Frontal
        swellPeriod,
        temperature,
        condition: getConditionFromScore(score),
        score: Number(score.toFixed(1)),
        locked: false,
      })
    }

    forecastCache[spotId] = { data: forecasts, time: now }
    return applyPremiumLock(forecasts, isPremium)
  } catch (error) {
    console.error('Erro ao buscar previsão:', error)
    return applyPremiumLock(getFallbackForecast(), isPremium)
  }
}

// Marca dias além do limite free como locked=true
function applyPremiumLock(forecasts: WeatherForecast[], isPremium: boolean): WeatherForecast[] {
  if (isPremium) return forecasts.map(f => ({ ...f, locked: false }))
  return forecasts.map((f, i) => ({ ...f, locked: i >= FREE_DAYS }))
}

function getFallbackForecast(): WeatherForecast[] {
  const today = new Date()
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const score = calculateForecastScore(1.0, 12, 10)
    return {
      date: date.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()],
      waveHeight: 1.0, windSpeed: 12, windDirection: 'N',
      swellPeriod: 10, temperature: 24,
      condition: getConditionFromScore(score),
      score: Number(score.toFixed(1)),
      locked: false,
    }
  })
}
