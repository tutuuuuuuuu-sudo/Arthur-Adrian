const WINDY_API_KEY = import.meta.env.VITE_WINDY_API_KEY

export interface WindyForecast {
  waveHeight: number
  windSpeed: number
  windDirection: string
  swellPeriod: number
  swellDirection: string
}

const windDirectionFromDegrees = (degrees: number): string => {
  const dirs = ['N', 'NE', 'NE', 'E', 'E', 'SE', 'SE', 'S', 'S', 'SW', 'SW', 'W', 'W', 'NW', 'NW', 'N']
  const index = Math.round(degrees / 22.5)
  return dirs[index % 16]
}

const classifyWind = (direction: string, beachOrientation: number): string => {
  const dirMap: Record<string, number> = {
    'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
    'S': 180, 'SW': 225, 'W': 270, 'NW': 315
  }
  const windDeg = dirMap[direction] ?? 0
  const diff = Math.abs(windDeg - beachOrientation) % 360
  const angle = diff > 180 ? 360 - diff : diff
  if (angle <= 45) return `${direction} (Terral)`
  if (angle <= 90) return `${direction} (Lateral)`
  return `${direction} (Frontal)`
}

export async function getWindyForecast(
  lat: number,
  lng: number,
  beachOrientation: number = 180
): Promise<WindyForecast | null> {
  try {
    const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lon: lng,
        model: 'gfs',
        parameters: ['wind', 'waves', 'swell1'],
        levels: ['surface'],
        key: WINDY_API_KEY
      })
    })

    if (!response.ok) throw new Error('Erro na Windy API')

    const data = await response.json()

    const windU = data['wind_u-surface']?.[0] ?? 0
    const windV = data['wind_v-surface']?.[0] ?? 0
    const windSpeed = Math.round(Math.sqrt(windU ** 2 + windV ** 2) * 3.6)
    const windDeg = (Math.atan2(windU, windV) * 180 / Math.PI + 360) % 360
    const windDir = windDirectionFromDegrees(windDeg)

    const rawWaveHeight = data['waves_height-surface']?.[0]
    const waveHeight = rawWaveHeight != null ? Number(rawWaveHeight.toFixed(1)) : null

    const rawPeriod = data['swell1_period-surface']?.[0]
    const swellPeriod = rawPeriod != null ? Math.round(rawPeriod) : null

    const swellDeg = data['swell1_direction-surface']?.[0] ?? 180
    const swellDirection = windDirectionFromDegrees(swellDeg)

    return {
      waveHeight: waveHeight ?? 1.0,
      windSpeed,
      windDirection: classifyWind(windDir, beachOrientation),
      swellPeriod: swellPeriod ?? 10,
      swellDirection
    }
  } catch (error) {
    console.error('Erro ao buscar dados da Windy:', error)
    return null
  }
}
