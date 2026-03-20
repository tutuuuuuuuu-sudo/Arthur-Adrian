import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lat, lng } = req.query

  const body = JSON.stringify({
    lat: Number(lat),
    lon: Number(lng),
    model: 'gfs',
    parameters: ['wind', 'waves', 'swell1'],
    levels: ['surface'],
    key: process.env.WINDY_API_KEY
  })

  const options = {
    hostname: 'api.windy.com',
    path: '/api/point-forecast/v2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }

  const data = await new Promise<string>((resolve, reject) => {
    const reqHttp = https.request(options, (response) => {
      let raw = ''
      response.on('data', chunk => raw += chunk)
      response.on('end', () => resolve(raw))
    })
    reqHttp.on('error', reject)
    reqHttp.write(body)
    reqHttp.end()
  })

  try {
    const parsed = JSON.parse(data)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(parsed)
  } catch {
    res.status(500).json({ error: 'Failed to parse response' })
  }
}
