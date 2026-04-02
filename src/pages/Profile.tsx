import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { usePremium } from '@/lib/premium'
import { getFavorites } from '@/lib/favorites'
import { getCurrentConditions, fetchCurrentConditions } from '@/lib/surfData'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Crown, Heart, MessageCircle, Waves, Settings,
  LogOut, User, TrendingUp, MapPin, Star, Calendar, Award
} from 'lucide-react'
import { toast } from 'sonner'

const SCORE_COLORS: Record<string, string> = {
  'Épico': '#8b5cf6', 'Excelente': '#06b6d4', 'Bom': '#22c55e',
  'Regular': '#f59e0b', 'Ruim': '#ef4444'
}

function getScoreLabel(score: number) {
  if (score >= 8.5) return 'Épico'
  if (score >= 7) return 'Excelente'
  if (score >= 5.5) return 'Bom'
  if (score >= 4) return 'Regular'
  return 'Ruim'
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium, subscription } = usePremium()
  const [favorites, setFavorites] = useState<string[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [favoriteSpots, setFavoriteSpots] = useState<any[]>([])

  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Surfista'
  const userInitial = userName.charAt(0).toUpperCase()
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [favs, spots] = await Promise.all([
        getFavorites(),
        fetchCurrentConditions(),
      ])
      setFavorites(favs)

      // Busca detalhes das praias favoritas
      const favSpots = spots.filter(s => favs.includes(s.id))
      setFavoriteSpots(favSpots)

      // Conta comentários do usuário
      if (user) {
        const { count } = await supabase
          .from('beach_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setCommentCount(count ?? 0)
      }

      setLoading(false)
    }
    load()
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Até logo! 🤙')
    navigate('/')
  }

  const animStyles = `
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
    .anim { animation: slideUp 0.4s ease-out both; }
  `

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Faça login para ver seu perfil</p>
            <Button onClick={() => navigate('/login')} className="w-full">Entrar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <style>{animStyles}</style>

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
          <h1 className="text-lg font-bold">Perfil</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-5">

        {/* Avatar + Info */}
        <Card className="anim overflow-hidden" style={{ animationDelay: '0s' }}>
          <div className="h-16 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
          <CardContent className="pb-5 -mt-8">
            <div className="flex items-end justify-between">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-4 border-background flex items-center justify-center overflow-hidden shadow-lg">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{userInitial}</span>
                  )}
                </div>
                {isPremium && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-background">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4 mr-1.5" />Sair
              </Button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{userName}</h2>
                {isPremium && (
                  <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-xs">
                    <Crown className="h-3 w-3 mr-1" />Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Membro desde {memberSince}
              </p>
            </div>

            {/* Premium info */}
            {isPremium && subscription?.expires_at && (
              <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-600 dark:text-yellow-400">
                ✨ Premium ativo até {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
              </div>
            )}
            {!isPremium && (
              <button
                onClick={() => navigate('/premium')}
                className="mt-3 w-full p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="text-xs font-semibold text-yellow-500">Upgrade para Premium</div>
                    <div className="text-xs text-muted-foreground">Previsão 7 dias, câmeras, sem anúncios</div>
                  </div>
                </div>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 anim" style={{ animationDelay: '0.1s' }}>
          {[
            { icon: Heart, label: 'Favoritas', value: favorites.length, color: '#ef4444', action: () => navigate('/favorites') },
            { icon: MessageCircle, label: 'Relatos', value: commentCount, color: '#06b6d4', action: undefined },
            { icon: Award, label: 'Nível', value: isPremium ? 'Pro' : 'Free', color: isPremium ? '#f59e0b' : '#6b7280', action: undefined },
          ].map(stat => (
            <Card
              key={stat.label}
              className={`text-center ${stat.action ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}
              onClick={stat.action}
            >
              <CardContent className="pt-4 pb-4 space-y-1">
                <stat.icon className="h-5 w-5 mx-auto" style={{ color: stat.color }} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Praias Favoritas */}
        {favoriteSpots.length > 0 && (
          <Card className="anim" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                Suas Praias Favoritas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {favoriteSpots.map((spot, idx) => {
                const label = getScoreLabel(spot.score)
                const color = SCORE_COLORS[label]
                return (
                  <button
                    key={spot.id}
                    onClick={() => navigate(`/spot/${spot.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                    style={{ animation: `slideUp 0.3s ${idx * 0.06}s ease-out both` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ backgroundColor: color }}>
                      {spot.score.toFixed(1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{spot.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{spot.region} da Ilha
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold" style={{ color }}>{label}</div>
                      <div className="text-xs text-muted-foreground">{spot.waveHeight.toFixed(1)}m</div>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => navigate('/favorites')}
                className="w-full text-xs text-primary hover:underline text-center py-1"
              >
                Ver todas as favoritas →
              </button>
            </CardContent>
          </Card>
        )}

        {/* Melhor pico hoje */}
        {!loading && (
          <Card className="anim" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Melhor Pico Agora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const spots = getCurrentConditions().sort((a, b) => b.score - a.score)
                const best = spots[0]
                if (!best) return <p className="text-sm text-muted-foreground">Carregando...</p>
                const label = getScoreLabel(best.score)
                const color = SCORE_COLORS[label]
                return (
                  <button
                    onClick={() => navigate(`/spot/${best.id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/20 transition-colors text-left"
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0" style={{ backgroundColor: color }}>
                      {best.score.toFixed(1)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base">{best.name}</div>
                      <div className="text-xs text-muted-foreground">{best.region} da Ilha</div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>🌊 {best.waveHeight.toFixed(1)}m</span>
                        <span>💨 {Math.round(best.windSpeed)}km/h</span>
                        <span>⏱️ {Math.round(best.swellPeriod)}s</span>
                      </div>
                    </div>
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  </button>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Card className="anim" style={{ animationDelay: '0.4s' }}>
          <CardContent className="py-3 space-y-1">
            {[
              { icon: Heart, label: 'Praias Favoritas', path: '/favorites', color: '#ef4444' },
              { icon: Waves, label: 'Todas as Praias', path: '/', color: '#06b6d4' },
              { icon: MapPin, label: 'Me Leva ao Pico', path: '/navigation', color: '#22c55e' },
              { icon: Settings, label: 'Configurações', path: '/settings', color: '#6b7280' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors text-left"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" style={{ color: item.color }} />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="ml-auto text-muted-foreground text-sm">→</span>
              </button>
            ))}
            <Separator className="my-1" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors text-left text-destructive"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
