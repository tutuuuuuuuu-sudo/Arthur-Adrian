import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setFavorites([]); return }
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('favorites')
      .select('beach_id')
      .eq('user_id', user.id)
    setFavorites(data?.map(f => f.beach_id) ?? [])
    setLoading(false)
  }

  const toggleFavorite = async (beachId: string, beachName: string) => {
    if (!user) return
    const isFav = favorites.includes(beachId)
    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('beach_id', beachId)
      setFavorites(prev => prev.filter(id => id !== beachId))
    } else {
      await supabase.from('favorites')
        .insert({ user_id: user.id, beach_id: beachId, beach_name: beachName })
      setFavorites(prev => [...prev, beachId])
    }
  }

  const isFavorite = (beachId: string) => favorites.includes(beachId)

  return { favorites, loading, toggleFavorite, isFavorite }
}
