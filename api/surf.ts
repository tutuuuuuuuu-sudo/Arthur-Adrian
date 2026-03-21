export const config = { runtime: 'edge' }

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

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  const orientation = Number(url.searchParams.get('orientation') ?? 180)

  try {
    const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: Number(lat),
        lon: Number(lng),
        model: 'gfs',
        parameters: ['wind', 'waves', 'swell1'],
        levels: ['surface'],
        key: process.env.WINDY_API_KEY
      })
    })

    const data = await response.json() as Record<string, number[]>

    const windU = data['wind_u-surface']?.[0] ?? 0
    const windV = data['wind_v-surface']?.[0] ?? 0
    const windSpeed = Math.round(Math.sqrt(windU ** 2 + windV ** 2) * 3.6)
    const windDeg = (Math.atan2(windU, windV) * 180 / Math.PI + 360) % 360
    const windDir = windDirectionFromDegrees(windDeg)

    const rawWave = data['waves_height-surface']?.[0]
    const waveHeight = rawWave != null ? Number(rawWave.toFixed(1)) : 1.0

    const rawPeriod = data['swell1_period-surface']?.[0]
    const swellPeriod = rawPeriod != null ? Math.round(rawPeriod) : 10

    const swellDeg = data['swell1_direction-surface']?.[0] ?? 180
    const swellDirection = windDirectionFromDegrees(swellDeg)
    const windDirection = classifyWind(windDir, orientation)

    return new Response(JSON.stringify({
      waveHeight,
      windSpeed,
      windDirection,
      swellPeriod,
      swellDirection
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
