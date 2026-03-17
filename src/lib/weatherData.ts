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

export function getWeatherForecast(_spotId: string): WeatherForecast[] {
  const today = new Date()
  const forecasts: WeatherForecast[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()]

    const baseWave = 1.0 + Math.random() * 1.5
    const baseWind = 8 + Math.random() * 10
    const basePeriod = 9 + Math.random() * 6
    const baseTemp = 21 + Math.random() * 6
    const score = calculateForecastScore(baseWave, baseWind, basePeriod)
    const condition = getConditionFromScore(score)

    forecasts.push({
      date: date.toISOString().split('T')[0],
      dayName,
      waveHeight: Number(baseWave.toFixed(1)),
      windSpeed: Number(baseWind.toFixed(0)),
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      swellPeriod: Number(basePeriod.toFixed(0)),
      temperature: Number(baseTemp.toFixed(0)),
      condition,
      score: Number(score.toFixed(1))
    })
  }
  return forecasts
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
