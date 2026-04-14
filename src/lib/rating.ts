// Utilitário centralizado de rating — use este em TODOS os componentes
// Evita duplicar a mesma lógica em SpotCard, Favorites, SpotDetails, History, etc.

export interface RatingInfo {
  label: string
  color: string
  bg: string
  bars: number
  scoreColor: string
}

export function getRatingInfo(score: number): RatingInfo {
  if (score >= 8.5) return { label: 'ÉPICO', color: 'text-purple-500', bg: 'bg-purple-500', bars: 5, scoreColor: '#8b5cf6' }
  if (score >= 7)   return { label: 'EXCELENTE', color: 'text-primary', bg: 'bg-primary', bars: 4, scoreColor: '#06b6d4' }
  if (score >= 5.5) return { label: 'BOM', color: 'text-accent', bg: 'bg-accent', bars: 3, scoreColor: '#22c55e' }
  if (score >= 4)   return { label: 'REGULAR', color: 'text-yellow-500', bg: 'bg-yellow-500', bars: 2, scoreColor: '#f59e0b' }
  return { label: 'RUIM', color: 'text-destructive', bg: 'bg-destructive', bars: 1, scoreColor: '#ef4444' }
}

export function getScoreColor(score: number): string {
  return getRatingInfo(score).scoreColor
}

export function getThemeGradient(score: number): string {
  if (score >= 8.5) return 'from-purple-900/40 via-background to-background'
  if (score >= 7)   return 'from-cyan-900/40 via-background to-background'
  if (score >= 5.5) return 'from-green-900/30 via-background to-background'
  if (score >= 4)   return 'from-yellow-900/30 via-background to-background'
  return 'from-red-900/30 via-background to-background'
}
