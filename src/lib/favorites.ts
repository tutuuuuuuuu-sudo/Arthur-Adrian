// Gerenciamento de praias favoritas usando localStorage

const FAVORITES_KEY = 'surf-ai-favorites'

export function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function isFavorite(spotId: string): boolean {
  const favorites = getFavorites()
  return favorites.includes(spotId)
}

export function toggleFavorite(spotId: string): boolean {
  const favorites = getFavorites()
  const index = favorites.indexOf(spotId)

  if (index > -1) {
    // Remove dos favoritos
    favorites.splice(index, 1)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return false
  } else {
    // Adiciona aos favoritos
    favorites.push(spotId)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return true
  }
}

export function clearFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY)
}
