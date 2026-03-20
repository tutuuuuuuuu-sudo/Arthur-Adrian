import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lat, lng } = req.query

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
    if (!response.ok) throw new Error('Windy API error')
    const data = await response.json()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' })
  }
}
