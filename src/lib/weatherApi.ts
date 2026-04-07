// ✅ weatherApi.ts — usa Windy Point Forecast API (gfsWave)
// Mesma fonte de dados que o windy.com usa nos seus mapas
// Documentação: https://api.windy.com/point-forecast/docs

const WINDY_API_KEY = 'c15a1d32-26bc-11f1-97a9-0242ac120003-c15a1d8c-26bc-11f1-97a9-0242ac120003'
const WINDY_ENDPOINT = 'https://api.windy.com/api/point-forecast/v2'

export interface WindyForecastData {
  waveHeight: number       // metros
  swellPeriod: number      // segundos
  swellDirection: string   // N, NE, E, SE, S, SW, W, NW...
  windSpeed: number        // km/h
  windDirection: string    // N, NE, E...
  waterTemperature?: number
  sunrise?: string
  sunset?: string
}

const cache: Record<string, { data: WindyForecastData, time: number }> = {}
const CACHE_DURATION = 15 * 60 * 1000 // 15 min

function degToDir(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function windUVToSpeed(u: number, v: number): number {
  return Math.sqrt(u * u + v * v) * 3.6 // m/s → km/h
}

function windUVToDir(u: number, v: number): string {
  // u = componente Leste-Oeste, v = componente Sul-Norte
  const deg = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360
  return degToDir(deg)
}

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

  try {
    // Busca ondas (gfsWave) e vento (gfs) em paralelo
    const [waveRes, windRes] = await Promise.all([
      fetch(WINDY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat, lon: lng,
          model: 'gfsWave',
          parameters: ['waves', 'swell1'],
          key: WINDY_API_KEY,
        }),
      }),
      fetch(WINDY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat, lon: lng,
          model: 'gfs',
          parameters: ['wind', 'temp'],
          levels: ['surface'],
          key: WINDY_API_KEY,
        }),
      }),
    ])

    const waveData = await waveRes.json() as any
    const windData = await windRes.json() as any

    // Encontra o índice de tempo mais próximo do momento atual
    const ts: number[] = waveData.ts ?? windData.ts ?? []
    const nowMs = Date.now()
    let idx = 0
    let minDiff = Infinity
    ts.forEach((t, i) => {
      const diff = Math.abs(t - nowMs)
      if (diff < minDiff) { minDiff = diff; idx = i }
    })

    // ── Ondas (gfsWave) ──────────────────────────────────────────────
    // waves = total (wind waves + swell), swell1 = componente swell principal
    const wavesH: number[]  = waveData['waves_height-surface']  ?? []
    const swellH: number[]  = waveData['swell1_height-surface'] ?? []
    const swellP: number[]  = waveData['swell1_period-surface'] ?? []
    const swellD: number[]  = waveData['swell1_direction-surface'] ?? []
    const wavesP: number[]  = waveData['waves_period-surface']  ?? []

    // Usa a altura total de ondas (waves), que inclui swell + wind waves
    // É o que o Windy exibe nos mapas
    const waveHeight = wavesH[idx] ?? swellH[idx] ?? 1.0
    const swellPeriod = swellP[idx] ?? wavesP[idx] ?? 8
    const swellDirDeg = swellD[idx] ?? 90
    const swellDirection = degToDir(swellDirDeg)

    // ── Vento (gfs) ──────────────────────────────────────────────────
    const windU: number[] = windData['wind_u-surface'] ?? []
    const windV: number[] = windData['wind_v-surface'] ?? []
    const tempArr: number[] = windData['temp-surface'] ?? []

    const windSpeed = windUVToSpeed(windU[idx] ?? 0, windV[idx] ?? 0)
    const windDirection = windUVToDir(windU[idx] ?? 0, windV[idx] ?? 0)
    const tempK = tempArr[idx]
    const tempC = tempK ? Math.round(tempK - 273.15) : undefined

    const result: WindyForecastData = {
      waveHeight: Number(waveHeight.toFixed(1)),
      swellPeriod: Math.round(swellPeriod),
      swellDirection,
      windSpeed: Math.round(windSpeed),
      windDirection,
      waterTemperature: tempC,  // temperatura do ar (2m), usada como fallback
    }

    cache[cacheKey] = { data: result, time: now }
    return result
  } catch (err) {
    console.error('[Windy API] erro:', err)
    return null
  }
}
