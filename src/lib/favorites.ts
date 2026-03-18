import { supabase } from './supabase'

export async function getFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('favorites')
    .select('beach_id')
    .eq('user_id', user.id)

  return data?.map(f => f.beach_id) ?? []
}

export async function isFavorite(spotId: string): Promise<boolean> {
  const favorites = await getFavorites()
  return favorites.includes(spotId)
}

export async function toggleFavorite(spotId: string, spotName: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('beach_id', spotId)
    .single()

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('beach_id', spotId)
    return false
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, beach_id: spotId, beach_name: spotName })
    return true
  }
}

export async function clearFavorites(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
}
