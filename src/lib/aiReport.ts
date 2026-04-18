import { BeachCondition } from './surfData'

const CACHE_KEY = 'ai_report_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

interface CachedReport {
  report: string
  fetchedAt: number
}

function getCached(): CachedReport | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedReport
    if (Date.now() - parsed.fetchedAt > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setCached(report: string) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ report, fetchedAt: Date.now() }))
  } catch { /* sessionStorage quota exceeded */ }
}

export async function fetchAIReport(
  spots: BeachCondition[],
  topSpot: BeachCondition,
  userLevel?: string
): Promise<string | null> {
  const cached = getCached()
  if (cached) return cached.report

  try {
    const res = await fetch('/api/ai-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spots, topSpot, userLevel }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.report) {
      setCached(data.report)
      return data.report
    }
    return null
  } catch {
    return null
  }
}

export function clearAIReportCache() {
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
