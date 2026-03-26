import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchCurrentConditions, BeachCondition } from '@/lib/surfData'
import { getFavorites, toggleFavorite } from '@/lib/favorites'
import { ArrowLeft, Heart, Waves, Wind, Thermometer, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function Favorites() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<BeachCondition[]>([])
  const [loading, setLoading] = useState(true)

  const getRatingInfo = (score: number) => {
    if (score >= 8.5) return { label: 'ÉPICO', color: 'text-purple-500', bg: 'bg-purple-500', bars: 5 }
    if (score >= 7) return { label: 'EXCELENTE', color: 'text-primary', bg: 'bg-primary', bars: 4 }
    if (score >= 5.5) return { label: 'BOM', color: 'text-green-500', bg: 'bg-green-500', bars: 3 }
    if (score >= 4) return { label: 'REGULAR', color: 'text-yellow-500', bg: 'bg-yellow-500', bars: 2 }
    return { label: 'RUIM', color: 'text-destructive', bg: 'bg-destructive', bars: 1 }
  }

  useEffect(() => {
    const load = async () => {
      const [favIds, spots] = await Promise.all([getFavorites(), fetchCurrentConditions()])
      setFavorites(spots.filter(s => favIds.includes(s.id)).sort((a, b) => b.score - a.score))
      setLoading(false)
    }
    load()
  }, [])

  const handleRemoveFavorite = async (spot: BeachCondition) => {
    await toggleFavorite(spot.id, spot.name)
    setFavorites(prev => prev.filter(s => s.id !== spot.id))
    toast.success(`${spot.name} removido dos favoritos`)
  }

  const bestSpot = favorites[0]

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary fill-primary" />
              Minhas Favoritas
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Waves className="h-10 w-10 text-primary animate-bounce" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground space-y-4">
            <Heart className="h-16 w-16 mx-auto opacity-10" />
            <p className="text-lg font-semibold">Nenhuma praia favorita ainda</p>
            <p className="text-sm">Entre em uma praia e toque no coração para adicionar</p>
            <Button onClick={() => navigate('/')}>Explorar praias</Button>
          </div>
        ) : (
          <>
            {/* Melhor favorita agora */}
            {bestSpot && (
              <Card
                className="bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 transition-all"
                onClick={() => navigate(`/spot/${bestSpot.id}`)}
                style={{ animation: 'slideUp 0.4s ease-out both' }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                    <Star className="h-4 w-4 fill-primary" />
                    Melhor favorita agora
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{bestSpot.name}</h2>
                      <Badge variant="outline" className="mt-1 text-xs">{bestSpot.region} da Ilha</Badge>
                      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                        <span>🌊 {bestSpot.waveHeight.toFixed(1)}m</span>
                        <span>💨 {Math.round(bestSpot.windSpeed)}km/h</span>
                        <span>🌡️ {bestSpot.waterConditions.temperature}°C</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${getRatingInfo(bestSpot.score).color}`}>
                        {bestSpot.score.toFixed(1)}
                      </div>
                      <div className={`text-xs font-bold mt-1 ${getRatingInfo(bestSpot.score).color}`}>
                        {getRatingInfo(bestSpot.score).label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de favoritas */}
            <div className="space-y-3">
              {favorites.map((spot, idx) => {
                const rating = getRatingInfo(spot.score)
                return (
                  <Card
                    key={spot.id}
                    className="cursor-pointer hover:border-primary/40 transition-all card-hover"
                    style={{ animation: `slideInLeft 0.4s ${idx * 0.06}s ease-out both` }}
                  >
                    <CardContent className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(spot) }}
                          className="text-primary hover:text-destructive transition-colors flex-shrink-0"
                        >
                          <Heart className="h-5 w-5 fill-current" />
                        </button>

                        <div
                          className="flex-1 flex items-center justify-between"
                          onClick={() => navigate(`/spot/${spot.id}`)}
                        >
                          <div>
                            <div className="font-semibold">{spot.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{spot.region} da Ilha · {spot.level}</div>
                            <div className="flex gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Waves className="h-3 w-3 text-primary" />
                                {spot.waveHeight.toFixed(1)}m
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wind className="h-3 w-3 text-accent" />
                                {Math.round(spot.windSpeed)}km/h
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Thermometer className="h-3 w-3 text-chart-2" />
                                {spot.waterConditions.temperature}°C
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-2xl font-bold ${rating.color}`}>
                              {spot.score.toFixed(1)}
                            </div>
                            <div className={`text-xs font-bold ${rating.color}`}>{rating.label}</div>
                            <div className="flex gap-0.5 mt-1 justify-end">
                              {[1,2,3,4,5].map(i => (
                                <div key={i} className={`h-1 w-3 rounded-full ${i <= rating.bars ? rating.bg : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Toque no ❤️ para remover dos favoritos
            </p>
          </>
        )}
      </main>
    </div>
  )
}
