import { BeachCondition } from './surfData'

let reportCache: { report: string; fetchedAt: number } | null = null
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

export async function fetchAIReport(
  spots: BeachCondition[],
  topSpot: BeachCondition,
  userLevel?: string
): Promise<string | null> {
  const now = Date.now()
  if (reportCache && now - reportCache.fetchedAt < CACHE_DURATION) {
    return reportCache.report
  }

  try {
    const res = await fetch('/api/ai-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spots, topSpot, userLevel }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.report) {
      reportCache = { report: data.report, fetchedAt: now }
      return data.report
    }
    return null
  } catch {
    return null
  }
}

export function clearAIReportCache() {
  reportCache = null
}
