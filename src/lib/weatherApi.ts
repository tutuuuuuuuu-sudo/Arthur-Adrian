// weatherApi.ts — Open-Meteo Marine (GFS Wave) + Stormglass fallback
// Open-Meteo: gratuito, sem key, modelo GFS Wave
// Stormglass: fallback com dados de múltiplos modelos (NOAA, ECMWF, etc.)

export interface WindyForecastData {
  waveHeight: number
  swellPeriod: number
  swellDirection: string
  windSpeed: number
  windDirection: string
  waterTemperature?: number
  sunrise?: string
  sunset?: string
}

const cache: Record<string, { data: WindyForecastData; time: number }> = {}
const CACHE_DURATION = 15 * 60 * 1000

const STORMGLASS_KEY = 'c15a1d32-26bc-11f1-97a9-0242ac120003-c15a1d8c-26bc-11f1-97a9-0242ac120003'
// ✅ Windy Point Forecast API — crie sua key gratuita em: https://api.windy.com/keys
// Quando tiver a key, cole aqui. Ela será usada como fonte primária (mais precisa que Open-Meteo)
const WINDY_API_KEY = import.meta.env?.VITE_WINDY_API_KEY ?? ''
const WINDY_ENDPOINT = 'https://api.windy.com/api/point-forecast/v2'

function degToDir(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

function getHourIndex(times: string[]): number {
  const nowMs = Date.now()
  let bestIdx = 0, bestDiff = Infinity
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - nowMs)
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
  })
  return bestIdx
}

// ── Fonte 0: Windy Point Forecast API (mais precisa — requer key) ───────────────
async function fetchWindyAPI(lat: number, lng: number): Promise<WindyForecastData | null> {
  if (!WINDY_API_KEY) return null
  try {
    const [waveRes, windRes] = await Promise.all([
      fetch(WINDY_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon: lng, model: 'gfsWave', parameters: ['waves', 'swell1'], key: WINDY_API_KEY }),
      }),
      fetch(WINDY_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon: lng, model: 'gfs', parameters: ['wind', 'temp'], levels: ['surface'], key: WINDY_API_KEY }),
      }),
    ])
    const waveData = await waveRes.json() as any
    const windData = await windRes.json() as any
    if (waveData.error || windData.error) return null

    const ts: number[] = waveData.ts ?? []
    const nowMs = Date.now()
    let idx = 0, minDiff = Infinity
    ts.forEach((t, i) => { const d = Math.abs(t - nowMs); if (d < minDiff) { minDiff = d; idx = i } })

    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
    const degToDir = (deg: number) => dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]

    const wH = (waveData['waves_height-surface'] ?? [])[idx] ?? 0
    const sH = (waveData['swell1_height-surface'] ?? [])[idx] ?? 0
    const sP = (waveData['swell1_period-surface'] ?? [])[idx] ?? 8
    const sD = (waveData['swell1_direction-surface'] ?? [])[idx] ?? 90
    const wu = (windData['wind_u-surface'] ?? [])[idx] ?? 0
    const wv = (windData['wind_v-surface'] ?? [])[idx] ?? 0
    const windSpeed = Math.round(Math.sqrt(wu*wu + wv*wv) * 3.6)
    const windDir = degToDir((Math.atan2(-wu, -wv) * 180 / Math.PI + 360) % 360)

    return {
      waveHeight: Number(Math.max(wH, sH).toFixed(1)),
      swellPeriod: Math.round(sP), swellDirection: degToDir(sD),
      windSpeed, windDirection: windDir,
    }
  } catch { return null }
}

// ── Fonte 1: Open-Meteo Marine (GFS Wave) ────────────────────────────────────
async function fetchOpenMeteo(lat: number, lng: number): Promise<WindyForecastData | null> {
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lng}` +
        `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction` +
        `&timezone=America%2FSao_Paulo&forecast_days=2`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lng}` +
        `&hourly=wind_speed_10m,wind_direction_10m,temperature_2m` +
        `&wind_speed_unit=kmh&timezone=America%2FSao_Paulo&forecast_days=2`
      ),
    ])

    const marine = await marineRes.json() as any
    const weather = await weatherRes.json() as any
    if (marine.error || weather.error) return null

    const mi = getHourIndex(marine.hourly?.time ?? [])
    const wi = getHourIndex(weather.hourly?.time ?? [])

    const waveH  = (marine.hourly?.wave_height ?? [])[mi]  ?? 0
    const swellH = (marine.hourly?.swell_wave_height ?? [])[mi] ?? 0
    const swellP = (marine.hourly?.swell_wave_period ?? [])[mi] ?? (marine.hourly?.wave_period ?? [])[mi] ?? 8
    const swellD = (marine.hourly?.swell_wave_direction ?? [])[mi] ?? (marine.hourly?.wave_direction ?? [])[mi] ?? 90
    const windKmh = (weather.hourly?.wind_speed_10m ?? [])[wi] ?? 0
    const windDeg = (weather.hourly?.wind_direction_10m ?? [])[wi] ?? 0
    const tempC   = (weather.hourly?.temperature_2m ?? [])[wi]

    // wave_height já é Hs total; usa o maior entre total e swell isolado
    const totalH = Math.max(waveH, swellH)
    if (totalH < 0.1) return null // dado suspeito, tenta próxima fonte

    return {
      waveHeight: Number(totalH.toFixed(1)),
      swellPeriod: Math.round(swellP),
      swellDirection: degToDir(swellD),
      windSpeed: Math.round(windKmh),
      windDirection: degToDir(windDeg),
      waterTemperature: tempC != null ? Math.round(tempC) : undefined,
    }
  } catch { return null }
}

// ── Fonte 2: Stormglass (NOAA + ECMWF + MetOffice) ───────────────────────────
async function fetchStormglass(lat: number, lng: number): Promise<WindyForecastData | null> {
  try {
    const params = 'waveHeight,wavePeriod,waveDirection,swellHeight,swellPeriod,swellDirection,windSpeed,windDirection,waterTemperature'
    const res = await fetch(
      `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`,
      { headers: { Authorization: STORMGLASS_KEY } }
    )
    const data = await res.json() as any
    if (!data.hours?.length) return null

    // Pega o primeiro horário (mais próximo do atual)
    const now = Date.now()
    let bestHour = data.hours[0]
    let bestDiff = Infinity
    for (const h of data.hours) {
      const diff = Math.abs(new Date(h.time).getTime() - now)
      if (diff < bestDiff) { bestDiff = diff; bestHour = h }
    }

    const pick = (key: string) => {
      const obj = bestHour[key]
      if (!obj) return null
      // Stormglass retorna média dos modelos disponíveis
      const vals = Object.values(obj) as number[]
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }

    const wH = pick('swellHeight') ?? pick('waveHeight')
    const wP = pick('swellPeriod') ?? pick('wavePeriod')
    const wD = pick('swellDirection') ?? pick('waveDirection')
    const windSpd = pick('windSpeed') // m/s
    const windDir = pick('windDirection')
    const waterT  = pick('waterTemperature')

    if (!wH) return null

    return {
      waveHeight: Number((wH).toFixed(1)),
      swellPeriod: Math.round(wP ?? 8),
      swellDirection: degToDir(wD ?? 90),
      windSpeed: Math.round((windSpd ?? 0) * 3.6), // m/s → km/h
      windDirection: degToDir(windDir ?? 0),
      waterTemperature: waterT != null ? Math.round(waterT) : undefined,
    }
  } catch { return null }
}

// ── Exportação principal ──────────────────────────────────────────────────────
export async function getWindyForecast(
  lat: number,
  lng: number,
  _beachOrientation?: number
): Promise<WindyForecastData | null> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`
  const now = Date.now()

  if (cache[cacheKey] && (now - cache[cacheKey].time) < CACHE_DURATION) {
    return cache[cacheKey].data
  }

  // Tenta Windy API primeiro (mais precisa, requer key em VITE_WINDY_API_KEY)
  const windyResult = await fetchWindyAPI(lat, lng)
  if (windyResult) {
    cache[cacheKey] = { data: windyResult, time: now }
    return windyResult
  }

  // Fallback: Open-Meteo (gratuito, sem limite)
  const openMeteo = await fetchOpenMeteo(lat, lng)
  if (openMeteo) {
    cache[cacheKey] = { data: openMeteo, time: now }
    return openMeteo
  }

  // Fallback: Stormglass (tem limite de 10 req/dia no free tier)
  const stormglass = await fetchStormglass(lat, lng)
  if (stormglass) {
    cache[cacheKey] = { data: stormglass, time: now }
    return stormglass
  }

  return null
}
