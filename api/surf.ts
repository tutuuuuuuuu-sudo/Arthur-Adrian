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
    const apiUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction&wind_speed_unit=kmh&length_unit=metric`

    const marineRes = await fetch(apiUrl)
    const marine = await marineRes.json() as any

    const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`
    const windRes = await fetch(windUrl)
    const wind = await windRes.json() as any

    const waveHeight = Number((marine.current?.wave_height ?? 1.0).toFixed(1))
    const swellPeriod = Math.round(marine.current?.swell_wave_period ?? marine.current?.wave_period ?? 10)
    const swellDeg = marine.current?.swell_wave_direction ?? marine.current?.wave_direction ?? 180
    const swellDirection = windDirectionFromDegrees(swellDeg)

    const windSpeed = Math.round(wind.current?.wind_speed_10m ?? 12)
    const windDeg = wind.current?.wind_direction_10m ?? 0
    const windDir = windDirectionFromDegrees(windDeg)
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
