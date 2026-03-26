import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { getFavorites } from '@/lib/favorites'
import { fetchCurrentConditions, BeachCondition } from '@/lib/surfData'
import { ArrowLeft, User, Waves, Heart, MapPin, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Expert'] as const
type Level = typeof LEVELS[number]

const FAVORITE_BEACHES = [
  'Campeche', 'Novo Campeche', 'Joaquina', 'Praia Mole', 'Moçambique',
  'Barra da Lagoa', 'Santinho', 'Morro das Pedras', 'Armação', 'Solidão',
  'Açores', 'Matadeiro', 'Lagoinha do Leste', 'Naufragados', 'Ponta das Aranhas', 'Canajurê'
]

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [level, setLevel] = useState<Level>('Intermediário')
  const [favoriteBeach, setFavoriteBeach] = useState('Campeche')
  const [bio, setBio] = useState('')
  const [tempLevel, setTempLevel] = useState<Level>('Intermediário')
  const [tempBeach, setTempBeach] = useState('Campeche')
  const [tempBio, setTempBio] = useState('')
  const [favoriteSpots, setFavoriteSpots] = useState<BeachCondition[]>([])
  const [sessionCount] = useState(Math.floor(Math.random() * 50) + 10)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      // Carrega preferências salvas
      const saved = localStorage.getItem(`profile_${data.user?.id}`)
      if (saved) {
        const p = JSON.parse(saved)
        setLevel(p.level ?? 'Intermediário')
        setFavoriteBeach(p.favoriteBeach ?? 'Campeche')
        setBio(p.bio ?? '')
      }
    })

    // Carrega praias favoritas com condições
    Promise.all([getFavorites(), fetchCurrentConditions()]).then(([favIds, spots]) => {
      setFavoriteSpots(spots.filter(s => favIds.includes(s.id)).sort((a, b) => b.score - a.score))
    })
  }, [])

  const getLevelColor = (l: Level) => {
    if (l === 'Iniciante') return 'bg-green-500/20 text-green-500 border-green-500/30'
    if (l === 'Intermediário') return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
    if (l === 'Avançado') return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
    return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
  }

  const getLevelEmoji = (l: Level) => {
    if (l === 'Iniciante') return '🏄'
    if (l === 'Intermediário') return '🏄‍♂️'
    if (l === 'Avançado') return '🔥'
    return '🏆'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-purple-500'
    if (score >= 7) return 'text-primary'
    if (score >= 5.5) return 'text-green-500'
    if (score >= 4) return 'text-yellow-500'
    return 'text-destructive'
  }

  const handleSave = () => {
    setLevel(tempLevel)
    setFavoriteBeach(tempBeach)
    setBio(tempBio)
    const profileData = { level: tempLevel, favoriteBeach: tempBeach, bio: tempBio }
    localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profileData))
    setEditing(false)
    toast.success('Perfil atualizado!')
  }

  const handleEditStart = () => {
    setTempLevel(level)
    setTempBeach(favoriteBeach)
    setTempBio(bio)
    setEditing(true)
  }

  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Surfista'
  const userEmail = user?.email ?? ''
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={handleEditStart}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Avatar e nome */}
        <Card style={{ animation: 'slideUp 0.4s ease-out both' }}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt={userName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{userInitial}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{userName}</h1>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getLevelColor(level)} border text-xs`}>
                    {getLevelEmoji(level)} {level}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Bio */}
            {!editing && bio && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">{bio}</p>
            )}
            {editing && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-xs text-muted-foreground mb-1 block">Bio (opcional)</label>
                <textarea
                  value={tempBio}
                  onChange={e => setTempBio(e.target.value)}
                  placeholder="Conte um pouco sobre você como surfista..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary transition-colors resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3" style={{ animation: 'slideUp 0.4s 0.1s ease-out both', opacity: 0 }}>
          {[
            { label: 'Favoritas', value: favoriteSpots.length, icon: '❤️' },
            { label: 'Sessões', value: sessionCount, icon: '🏄' },
            { label: 'Nível', value: level.split(' ')[0], icon: getLevelEmoji(level) },
          ].map(stat => (
            <Card key={stat.label} className="text-center">
              <CardContent className="py-4">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Configurações do perfil */}
        <Card style={{ animation: 'slideUp 0.4s 0.15s ease-out both', opacity: 0 }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Meu Perfil de Surfista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nível */}
            <div>
              <div className="text-sm font-semibold mb-2">Nível de Experiência</div>
              {!editing ? (
                <Badge className={`${getLevelColor(level)} border`}>
                  {getLevelEmoji(level)} {level}
                </Badge>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => setTempLevel(l)}
                      className={`py-2 px-3 rounded-xl border text-sm transition-all ${
                        tempLevel === l
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {getLevelEmoji(l)} {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Praia favorita */}
            <div>
              <div className="text-sm font-semibold mb-2">Praia Favorita</div>
              {!editing ? (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  {favoriteBeach}
                </div>
              ) : (
                <select
                  value={tempBeach}
                  onChange={e => setTempBeach(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary transition-colors"
                >
                  {FAVORITE_BEACHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Praias favoritas com condições atuais */}
        {favoriteSpots.length > 0 && (
          <Card style={{ animation: 'slideUp 0.4s 0.2s ease-out both', opacity: 0 }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary fill-primary" />
                Minhas Praias Favoritas Agora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {favoriteSpots.map((spot, idx) => (
                <button
                  key={spot.id}
                  onClick={() => navigate(`/spot/${spot.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-primary/40 bg-card hover:bg-primary/5 transition-all"
                  style={{ animation: `slideInLeft 0.3s ${idx * 0.06}s ease-out both` }}
                >
                  <div className="flex items-center gap-3">
                    <Waves className="h-4 w-4 text-primary" />
                    <div className="text-left">
                      <div className="text-sm font-semibold">{spot.name}</div>
                      <div className="text-xs text-muted-foreground">{spot.waveHeight.toFixed(1)}m · {Math.round(spot.swellPeriod)}s · {spot.windSpeed}km/h</div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(spot.score)}`}>
                    {spot.score.toFixed(1)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {favoriteSpots.length === 0 && (
          <Card style={{ animation: 'slideUp 0.4s 0.2s ease-out both', opacity: 0 }}>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Você ainda não favoritou nenhuma praia.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/')}>
                Explorar praias
              </Button>
            </CardContent>
          </Card>
        )}

        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
      </main>
    </div>
  )
}
