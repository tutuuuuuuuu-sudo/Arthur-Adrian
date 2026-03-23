export interface TidePoint {
  time: string
  height: number
  type?: string
}

export interface WindyForecast {
  waveHeight: number
  windSpeed: number
  windDirection: string
  swellPeriod: number
  swellDirection: string
  waterTemperature?: number
  sunrise?: string
  sunset?: string
  tideData?: TidePoint[]
}

export async function getWindyForecast(
  lat: number,
  lng: number,
  beachOrientation: number = 180,
  fetchTide: boolean = false
): Promise<WindyForecast | null> {
  try {
    const response = await fetch(`/api/surf?lat=${lat}&lng=${lng}&orientation=${beachOrientation}&tide=${fetchTide}`)
    if (!response.ok) throw new Error('API error')
    const data: WindyForecast = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    return null
  }
}
