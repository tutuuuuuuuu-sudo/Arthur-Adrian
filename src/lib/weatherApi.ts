export interface WindyForecast {
  waveHeight: number
  windSpeed: number
  windDirection: string
  swellPeriod: number
  swellDirection: string
  sunrise?: string
  sunset?: string
}

export async function getWindyForecast(
  lat: number,
  lng: number,
  beachOrientation: number = 180
): Promise<WindyForecast | null> {
  try {
    const response = await fetch(`/api/surf?lat=${lat}&lng=${lng}&orientation=${beachOrientation}`)
    if (!response.ok) throw new Error('API error')
    const data: WindyForecast = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    return null
  }
}
