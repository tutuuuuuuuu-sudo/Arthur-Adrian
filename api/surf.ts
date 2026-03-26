export const config = { runtime: 'edge' }

const windDirectionFromDegrees = (degrees: number): string => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5)
  return dirs[index % 16]
}

// Terral APENAS para W e SW — vento que vem de terra para o mar nas praias do leste de Floripa
const classifyWind = (direction: string): string => {
  const terrals = ['W', 'SW']
  const laterals = ['NW', 'WSW', 'SSW', 'S']
  if (terrals.includes(direction)) return `${direction} (Terral)`
  if (laterals.includes(direction)) return `${direction} (Lateral)`
  return `${direction} (Frontal)`
}

const formatTimeBrasilia = (isoString: string): string => {
  if (!isoString) return ''
  const timePart = isoString.split('T')[1]
  if (!timePart) return ''
  return timePart.substring(0, 5)
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  const fetchTide = url.searchParams.get('tide') === 'true'

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature&length_unit=metric`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=America%2FSao_Paulo`)
    ])

    const marine = await marineRes.json() as any
    const weather = await weatherRes.json() as any

    const waveHeight = Number((marine.current?.swell_wave_height ?? marine.current?.wave_height ?? 1.0).toFixed(1))
    const swellPeriod = Math.round(marine.current?.swell_wave_period ?? marine.current?.wave_period ?? 10)
    const swellDeg = marine.current?.swell_wave_direction ?? marine.current?.wave_direction ?? 180
    const swellDirection = windDirectionFromDegrees(swellDeg)

    const windSpeed = Math.round(weather.current?.wind_speed_10m ?? 12)
    const windDeg = weather.current?.wind_direction_10m ?? 0
    const windDir = windDirectionFromDegrees(windDeg)
    const windDirection = classifyWind(windDir)

    const rawSeaTemp = marine.current?.sea_surface_temperature
    const waterTemperature = rawSeaTemp != null ? Math.round(rawSeaTemp) : null

    const sunriseRaw = weather.daily?.sunrise?.[0] ?? ''
    const sunsetRaw = weather.daily?.sunset?.[0] ?? ''
    const sunrise = formatTimeBrasilia(sunriseRaw)
    const sunset = formatTimeBrasilia(sunsetRaw)

    let tideData: { time: string, height: number, type?: string }[] = []

    if (fetchTide) {
      try {
        const now = new Date()
        const start = new Date(now)
        start.setHours(0, 0, 0, 0)
        const end = new Date(now)
        end.setHours(23, 59, 59, 999)

        const tideRes = await fetch(
          `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start.toISOString()}&end=${end.toISOString()}`,
          { headers: { 'Authorization': process.env.STORMGLASS_API_KEY ?? '' } }
        )

        if (tideRes.ok) {
          const tideJson = await tideRes.json() as any
          tideData = (tideJson.data ?? []).map((item: any) => ({
            time: item.time,
            height: Number(item.height.toFixed(2)),
            type: item.type
          }))
        }
      } catch (e) {
        console.error('Erro ao buscar maré:', e)
      }
    }

    return new Response(JSON.stringify({
      waveHeight, windSpeed, windDirection, swellPeriod,
      swellDirection, waterTemperature, sunrise, sunset, tideData
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
