// weatherApi.ts — Windy Point Forecast API (primária) + Open-Meteo Marine (fallback) + Stormglass (fallback)
// Windy: modelo gfsWave (ondas/swell) + gfs (vento) — mais precisa para Floripa
// Open-Meteo: gratuita, sem key, modelo GFS Wave
// Stormglass: último fallback (10 req/dia no free tier)

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
const WINDY_API_KEY = import.meta.env?.VITE_WINDY_API_KEY ?? ''
const WINDY_ENDPOINT = 'https://api.windy.com/api/point-forecast/v2'

// Converte graus para direção cardinal (16 pontos)
function degToDir(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

// Encontra o índice do timestamp ISO mais próximo do momento atual
function getHourIndex(times: string[]): number {
  const nowMs = Date.now()
  let bestIdx = 0, bestDiff = Infinity
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - nowMs)
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
  })
  return bestIdx
}

// Encontra o índice do timestamp UNIX (ms) mais próximo do momento atual
function getHourIndexFromTs(ts: number[]): number {
  const nowMs = Date.now()
  let bestIdx = 0, bestDiff = Infinity
  ts.forEach((t, i) => {
    // Windy retorna timestamps em milissegundos
    const tMs = t > 1e11 ? t : t * 1000
    const diff = Math.abs(tMs - nowMs)
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
  })
  return bestIdx
}

// ── Fonte 0: Windy Point Forecast API (mais precisa — requer VITE_WINDY_API_KEY) ──────────────
async function fetchWindyAPI(lat: number, lng: number): Promise<WindyForecastData | null> {
  if (!WINDY_API_KEY) {
    console.warn('[WeatherAPI] VITE_WINDY_API_KEY não configurada — usando fallback Open-Meteo')
    return null
  }

  try {
    // Duas chamadas em paralelo: ondas (gfsWave) e vento+temp (gfs)
    const [waveRes, windRes] = await Promise.all([
      fetch(WINDY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon: lng,
          model: 'gfsWave',
          parameters: ['windWaves', 'swell1'],
          key: WINDY_API_KEY,
        }),
      }),
      fetch(WINDY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon: lng,
          model: 'gfs',
          parameters: ['wind', 'temp'],
          levels: ['surface'],
          key: WINDY_API_KEY,
        }),
      }),
    ])

    if (!waveRes.ok || !windRes.ok) {
      console.warn(`[WeatherAPI] Windy HTTP error — waves: ${waveRes.status}, wind: ${windRes.status}`)
      return null
    }

    const waveData = await waveRes.json() as any
    const windData = await windRes.json() as any

    if (waveData.error || windData.error) {
      console.warn('[WeatherAPI] Windy API retornou erro:', waveData.error ?? windData.error)
      return null
    }

    // Timestamps — Windy retorna em `ts` como array de milissegundos
    const ts: number[] = waveData.ts ?? windData.ts ?? []
    if (ts.length === 0) {
      console.warn('[WeatherAPI] Windy: sem timestamps — keys disponíveis:', Object.keys(waveData))
      return null
    }

    const waveIdx = getHourIndexFromTs(ts)
    const windTs: number[] = windData.ts ?? ts
    const windIdx = getHourIndexFromTs(windTs)

    // ── Ondas (gfsWave) ──
    // windWaves_height-surface  = altura significativa das ondas de vento
    // swell1_height-surface     = altura do swell primário
    // swell1_period-surface     = período do swell primário (s)
    // swell1_direction-surface  = direção DE ONDE o swell vem (graus)
    const wH = (waveData['windWaves_height-surface'] ?? [])[waveIdx] ?? 0
    const sH = (waveData['swell1_height-surface'] ?? [])[waveIdx] ?? 0
    const sP = (waveData['swell1_period-surface'] ?? [])[waveIdx] ?? 8
    const sD = (waveData['swell1_direction-surface'] ?? [])[waveIdx] ?? 90

    // Usa o maior entre onda de vento e swell primário
    const finalWaveHeight = Math.max(wH, sH)
    if (finalWaveHeight < 0.05) {
      console.warn('[WeatherAPI] Windy: altura suspeita (< 0.05m) — keys disponíveis:', Object.keys(waveData).filter(k => k !== 'ts' && k !== 'units'))
      return null
    }

    // ── Vento (gfs) ──
    // wind_u-surface = componente zonal em m/s (positivo = sopra para LESTE)
    // wind_v-surface = componente meridional em m/s (positivo = sopra para NORTE)
    //
    // Velocidade: sqrt(u² + v²) → m/s → km/h
    // Direção METEOROLÓGICA (de onde o vento VEM, padrão internacional):
    //   atan2(-u, -v) inverte os vetores para obter a origem, não o destino
    const wu = (windData['wind_u-surface'] ?? [])[windIdx] ?? 0
    const wv = (windData['wind_v-surface'] ?? [])[windIdx] ?? 0
    const windSpeedKmh = Math.round(Math.sqrt(wu * wu + wv * wv) * 3.6)
    const windDirDeg = (Math.atan2(-wu, -wv) * 180 / Math.PI + 360) % 360
    const windDir = degToDir(windDirDeg)

    // Temperatura do ar — gfs retorna Kelvin no nível surface
    const tempK = (windData['temp-surface'] ?? [])[windIdx]
    const tempC = tempK != null ? Math.round(tempK - 273.15) : undefined

    console.log(
      `[WeatherAPI] ✅ Windy lat=${lat.toFixed(2)} | ` +
      `ondas=${finalWaveHeight.toFixed(1)}m swell=${Math.round(sP)}s ${degToDir(sD)} | ` +
      `vento=${windSpeedKmh}km/h ${windDir} (${windDirDeg.toFixed(0)}°) [u=${wu.toFixed(2)} v=${wv.toFixed(2)}]`
    )

    return {
      waveHeight: Number(finalWaveHeight.toFixed(1)),
      swellPeriod: Math.round(sP),
      swellDirection: degToDir(sD),
      windSpeed: windSpeedKmh,
      windDirection: windDir,
      waterTemperature: tempC,
    }
  } catch (err) {
    console.error('[WeatherAPI] Windy fetch exception:', err)
    return null
  }
}

// ── Fonte 1: Open-Meteo Marine (GFS Wave) — fallback gratuito ────────────────────────────────
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

    const waveH  = (marine.hourly?.wave_height ?? [])[mi] ?? 0
    const swellH = (marine.hourly?.swell_wave_height ?? [])[mi] ?? 0
    const swellP = (marine.hourly?.swell_wave_period ?? [])[mi] ?? (marine.hourly?.wave_period ?? [])[mi] ?? 8
    const swellD = (marine.hourly?.swell_wave_direction ?? [])[mi] ?? (marine.hourly?.wave_direction ?? [])[mi] ?? 90
    const windKmh = (weather.hourly?.wind_speed_10m ?? [])[wi] ?? 0
    const windDeg = (weather.hourly?.wind_direction_10m ?? [])[wi] ?? 0
    const tempC   = (weather.hourly?.temperature_2m ?? [])[wi]

    const totalH = Math.max(waveH, swellH)
    if (totalH < 0.1) {
      console.warn('[WeatherAPI] Open-Meteo: altura suspeita (< 0.1m), tentando Stormglass')
      return null
    }

    console.log(`[WeatherAPI] ⚠️ Open-Meteo fallback lat=${lat.toFixed(2)} | ondas=${totalH.toFixed(1)}m | vento=${Math.round(windKmh)}km/h ${degToDir(windDeg)}`)

    return {
      waveHeight: Number(totalH.toFixed(1)),
      swellPeriod: Math.round(swellP),
      swellDirection: degToDir(swellD),
      windSpeed: Math.round(windKmh),
      windDirection: degToDir(windDeg),
      waterTemperature: tempC != null ? Math.round(tempC) : undefined,
    }
  } catch (err) {
    console.error('[WeatherAPI] Open-Meteo exception:', err)
    return null
  }
}

// ── Fonte 2: Stormglass (NOAA + ECMWF + MetOffice) — último fallback ─────────────────────────
async function fetchStormglass(lat: number, lng: number): Promise<WindyForecastData | null> {
  try {
    const params = 'waveHeight,wavePeriod,waveDirection,swellHeight,swellPeriod,swellDirection,windSpeed,windDirection,waterTemperature'
    const res = await fetch(
      `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`,
      { headers: { Authorization: STORMGLASS_KEY } }
    )
    const data = await res.json() as any
    if (!data.hours?.length) return null

    const now = Date.now()
    let bestHour = data.hours[0]
    let bestDiff = Infinity
    for (const h of data.hours) {
      const diff = Math.abs(new Date(h.time).getTime() - now)
      if (diff < bestDiff) { bestDiff = diff; bestHour = h }
    }

    const pick = (key: string): number | null => {
      const obj = bestHour[key]
      if (!obj) return null
      const vals = Object.values(obj) as number[]
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }

    const wH      = pick('swellHeight') ?? pick('waveHeight')
    const wP      = pick('swellPeriod') ?? pick('wavePeriod')
    const wD      = pick('swellDirection') ?? pick('waveDirection')
    const windSpd = pick('windSpeed') // m/s
    const windDir = pick('windDirection')
    const waterT  = pick('waterTemperature')

    if (!wH) return null

    console.log(`[WeatherAPI] ⚠️ Stormglass fallback lat=${lat.toFixed(2)} | ondas=${wH.toFixed(1)}m`)

    return {
      waveHeight: Number(wH.toFixed(1)),
      swellPeriod: Math.round(wP ?? 8),
      swellDirection: degToDir(wD ?? 90),
      windSpeed: Math.round((windSpd ?? 0) * 3.6), // m/s → km/h
      windDirection: degToDir(windDir ?? 0),
      waterTemperature: waterT != null ? Math.round(waterT) : undefined,
    }
  } catch (err) {
    console.error('[WeatherAPI] Stormglass exception:', err)
    return null
  }
}

// ── Exportação principal — cascade: Windy → Open-Meteo → Stormglass ──────────────────────────
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

  // 1ª tentativa: Windy API (mais precisa, requer VITE_WINDY_API_KEY no Vercel)
  const windyResult = await fetchWindyAPI(lat, lng)
  if (windyResult) {
    cache[cacheKey] = { data: windyResult, time: now }
    return windyResult
  }

  // 2ª tentativa: Open-Meteo (gratuito, sem limite)
  const openMeteo = await fetchOpenMeteo(lat, lng)
  if (openMeteo) {
    cache[cacheKey] = { data: openMeteo, time: now }
    return openMeteo
  }

  // 3ª tentativa: Stormglass (10 req/dia no free tier — último recurso)
  const stormglass = await fetchStormglass(lat, lng)
  if (stormglass) {
    cache[cacheKey] = { data: stormglass, time: now }
    return stormglass
  }

  return null
}
