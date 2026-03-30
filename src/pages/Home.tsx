import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SpotCard } from '@/components/surf/SpotCard'
import { RegionFilter } from '@/components/surf/RegionFilter'
import { fetchCurrentConditions, analyzeConditions, BeachCondition } from '@/lib/surfData'
import { getFavorites } from '@/lib/favorites'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToNotifications,
  getNotificationPermission,
  getSavedNotificationSettings,
  saveNotificationSettings,
  checkAndNotifyGoodConditions
} from '@/lib/notifications'
import { Waves, TrendingUp, MapPin, Info, Heart, Settings, Bell, BellOff, Map, X, ChevronDown, ChevronUp, ExternalLink, Navigation } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

const animStyles = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInLeft { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
  .anim-fade { animation: fadeIn 0.5s ease-out both; }
  .anim-slide { animation: slideUp 0.5s ease-out both; }
  .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
`

const SwellPeriodWidget = () => {
  const [open, setOpen] = useState(false)
  const periods = [
    { range: '< 8s', label: 'Fraco', color: '#ef4444', desc: 'Vento local, ondas curtas e bagunçadas. Difícil de surfar.' },
    { range: '8-10s', label: 'Regular', color: '#f59e0b', desc: 'Ondulação moderada. Surfável mas sem muita qualidade.' },
    { range: '10-12s', label: 'Bom', color: '#22c55e', desc: 'Boa ondulação. Ondas bem formadas e com energia.' },
    { range: '12-14s', label: 'Muito Bom', color: '#06b6d4', desc: 'Excelente! Ondas longas, limpas e com muito poder.' },
    { range: '> 14s', label: 'Épico', color: '#8b5cf6', desc: 'Swell de longo período. Ondas perfeitas e muito potentes.' },
  ]
  return (
    <Card className="border-primary/20 bg-primary/5 card-hover anim-slide" style={{ animationDelay: '0.3s' }}>
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Waves className="h-4 w-4 text-primary" />
              O que significa o período do swell?
            </CardTitle>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
      </button>
      {open && (
        <CardContent className="px-4 pb-4 space-y-2" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <p className="text-xs text-muted-foreground mb-3">
            O período é o tempo em segundos entre duas ondas consecutivas. Quanto maior, mais organizada e poderosa é a ondulação.
          </p>
          <div className="space-y-2">
            {periods.map(p => (
              <div key={p.range} className="flex items-start gap-3">
                <div className="min-w-[52px] text-xs font-bold rounded px-1.5 py-0.5 text-center text-white" style={{ backgroundColor: p.color }}>
                  {p.range}
                </div>
                <div>
                  <span className="text-xs font-semibold" style={{ color: p.color }}>{p.label}</span>
                  <span className="text-xs text-muted-foreground ml-1">— {p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

const getScoreColor = (score: number): string => {
  if (score >= 8.5) return '#8b5cf6'
  if (score >= 7) return '#06b6d4'
  if (score >= 5.5) return '#22c55e'
  if (score >= 4) return '#f59e0b'
  return '#ef4444'
}

const getScoreLabel = (score: number): string => {
  if (score >= 8.5) return 'Épico'
  if (score >= 7) return 'Excelente'
  if (score >= 5.5) return 'Bom'
  if (score >= 4) return 'Regular'
  return 'Ruim'
}

const getLocationDescription = (spot: BeachCondition): string => {
  const map: Record<string, string> = {
    'campeche': 'Sul da Ilha',
    'novo-campeche': 'Sul da Ilha',
    'morro-pedras': 'Sul da Ilha',
    'matadeiro': 'Sul da Ilha',
    'lagoinha-leste': 'Extremo Sul',
    'acores': 'Extremo Sul',
    'solidao': 'Extremo Sul',
    'armacao': 'Sul da Ilha',
    'naufragados': 'Extremo Sul',
    'joaquina': 'Leste da Ilha',
    'mole': 'Leste da Ilha',
    'mocambique': 'Leste da Ilha',
    'barra-lagoa': 'Leste da Ilha',
    'santinho': 'Norte da Ilha',
    'ponta-aranhas': 'Norte da Ilha',
    'canajure': 'Norte da Ilha',
  }
  return map[spot.id] ?? `${spot.region} da Ilha`
}

const getThemeGradient = (score: number): string => {
  if (score >= 8.5) return 'from-purple-900/40 via-background to-background'
  if (score >= 7) return 'from-cyan-900/40 via-background to-background'
  if (score >= 5.5) return 'from-green-900/30 via-background to-background'
  if (score >= 4) return 'from-yellow-900/30 via-background to-background'
  return 'from-red-900/30 via-background to-background'
}

const BeachMap = ({ spots }: { spots: BeachCondition[] }) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const iframeSrc = expanded
    ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d95000!2d-48.485!3d-27.615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1234567890`
    : `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d75000!2d-48.485!3d-27.615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1234567890`

  return (
    <Card className="anim-slide card-hover" style={{ animationDelay: '0.35s' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Mapa das Praias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full rounded-xl overflow-hidden border border-border/30" style={{ height: expanded ? '480px' : '260px', transition: 'height 0.3s ease' }}>
          <iframe width="100%" height="100%" style={{ border: 0, display: 'block' }} loading="lazy" allowFullScreen src={iframeSrc} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute top-2 right-2 z-10 px-3 py-1.5 rounded-lg bg-background/90 border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            {expanded ? <><X className="h-3.5 w-3.5" /> Minimizar</> : <><ExternalLink className="h-3.5 w-3.5" /> Expandir</>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {spots.map((spot, idx) => (
            <button
              key={spot.id}
              onClick={() => navigate(`/spot/${spot.id}`)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/40 hover:border-primary/40 bg-card hover:bg-primary/5 transition-all text-left group"
              style={{ animation: `slideInLeft 0.3s ${idx * 0.03}s ease-out both` }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: getScoreColor(spot.score) }} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{spot.name}</div>
                <div className="text-xs text-muted-foreground truncate">{getLocationDescription(spot)}</div>
                <div className="text-xs font-medium" style={{ color: getScoreColor(spot.score) }}>
                  {spot.score.toFixed(1)} · {getScoreLabel(spot.score)}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-1 border-t">
          {[
            { color: '#8b5cf6', label: 'Épico' },
            { color: '#06b6d4', label: 'Excelente' },
            { color: '#22c55e', label: 'Bom' },
            { color: '#f59e0b', label: 'Regular' },
            { color: '#ef4444', label: 'Ruim' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Selecione uma praia na lista para ver as condições detalhadas</p>
      </CardContent>
    </Card>
  )
}

const SwellAlert = ({ spots }: { spots: BeachCondition[] }) => {
  const [dismissed, setDismissed] = useState(false)
  const bigSwellSpots = spots.filter(s => s.waveHeight >= 1.5)
  if (bigSwellSpots.length === 0 || dismissed) return null
  const best = bigSwellSpots.sort((a, b) => b.waveHeight - a.waveHeight)[0]
  return (
    <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4 flex items-start gap-3 anim-slide" style={{ animationDelay: '0.1s' }}>
      <div className="text-2xl">🌊</div>
      <div className="flex-1">
        <div className="font-bold text-sm">Swell grande chegando!</div>
        <div className="text-xs text-muted-foreground mt-0.5">{best.name} com ondas de {best.waveHeight.toFixed(1)}m — período de {Math.round(best.swellPeriod)}s</div>
      </div>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const NotificationPanel = ({ spots, favorites }: { spots: BeachCondition[], favorites: string[] }) => {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [settings, setSettings] = useState(getSavedNotificationSettings())
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  const handleEnable = async () => {
    setLoading(true)
    const success = await subscribeToNotifications()
    if (success) {
      const newSettings = { ...settings, enabled: true }
      setSettings(newSettings)
      saveNotificationSettings(newSettings)
      setPermission('granted')
    }
    setLoading(false)
  }

  const handleDisable = () => {
    const newSettings = { ...settings, enabled: false }
    setSettings(newSettings)
    saveNotificationSettings(newSettings)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
          settings.enabled && permission === 'granted'
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/30'
        }`}
      >
        {settings.enabled && permission === 'granted' ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        {settings.enabled && permission === 'granted' ? 'Alertas ativos' : 'Alertas'}
      </button>
    )
  }

  return (
    <Card className="border-primary/20" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas de Condições
          </CardTitle>
          <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isIOS && (
          <div className="text-xs bg-muted/30 border border-border rounded-lg p-3 text-muted-foreground">
            😔 <strong>iPhone/iPad:</strong> O Safari no iOS não suporta notificações push em aplicações web. Disponível apenas no Android e computador.
          </div>
        )}
        {!isIOS && permission === 'unsupported' && (
          <p className="text-xs text-muted-foreground">Seu navegador não suporta notificações. Tente pelo Chrome.</p>
        )}
        {!isIOS && permission === 'denied' && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">
            Notificações bloqueadas. Clique no cadeado na barra de endereços e permita.
          </div>
        )}
        {!isIOS && (permission === 'default' || permission === 'granted') && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Receber alertas</div>
                <div className="text-xs text-muted-foreground">Quando as condições estiverem boas</div>
              </div>
              <button
                onClick={settings.enabled && permission === 'granted' ? handleDisable : handleEnable}
                disabled={loading}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.enabled && permission === 'granted' ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.enabled && permission === 'granted' ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <Separator />
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-2">Score mínimo</div>
                <div className="flex gap-2">
                  {[6, 7, 8, 9].map(score => (
                    <button key={score}
                      onClick={() => { const s = { ...settings, minScore: score }; setSettings(s); saveNotificationSettings(s) }}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${settings.minScore === score ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border text-muted-foreground'}`}
                    >{score}+</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">Só favoritas</div>
                <button
                  onClick={() => { const s = { ...settings, favoriteOnly: !settings.favoriteOnly }; setSettings(s); saveNotificationSettings(s) }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.favoriteOnly ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.favoriteOnly ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
            {settings.enabled && permission === 'granted' && (
              <button
                onClick={() => checkAndNotifyGoodConditions(spots, favorites, settings.minScore, settings.favoriteOnly)}
                className="w-full text-xs py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
                Testar notificação
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const [activeRegion, setActiveRegion] = useState<string>('all')
  const [showOnlyFavorites] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [spots, setSpots] = useState<BeachCondition[]>([])
  const [allSpots, setAllSpots] = useState<BeachCondition[]>([])
  const [topSpot, setTopSpot] = useState<BeachCondition | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)
    const updateData = async () => {
      setCurrentTime(new Date())
      const allConditions = await fetchCurrentConditions()
      const favs = await getFavorites()
      setFavorites(favs)
      setAllSpots(allConditions)
      let filtered = [...allConditions]
      if (activeRegion !== 'all') filtered = filtered.filter(spot => spot.region === activeRegion)
      if (showOnlyFavorites) filtered = filtered.filter(spot => favs.includes(spot.id))
      filtered = filtered.sort((a, b) => b.score - a.score)
      setSpots(filtered)
      setTopSpot(allConditions.sort((a, b) => b.score - a.score)[0] ?? null)
      setLoading(false)
      setTimeout(() => setVisible(true), 100)
      const notifSettings = getSavedNotificationSettings()
      if (notifSettings.enabled) {
        await checkAndNotifyGoodConditions(allConditions, favs, notifSettings.minScore, notifSettings.favoriteOnly)
      }
    }
    updateData()
    const interval = setInterval(updateData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeRegion, showOnlyFavorites])

  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Surfista'
  const userInitial = userName.charAt(0).toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Waves className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Surf AI</h1>
                <p className="text-xs text-muted-foreground">Florianópolis, SC</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Waves className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-muted-foreground text-sm">Buscando condições em tempo real...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${topSpot ? getThemeGradient(topSpot.score) : 'bg-background'}`}>
      <style>{animStyles}</style>

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3" style={{ animation: 'slideInLeft 0.4s ease-out' }}>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Surf AI</h1>
                <p className="text-xs text-muted-foreground">Florianópolis, SC</p>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ animation: 'slideInRight 0.4s ease-out' }}>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => navigate('/navigation')} className="hidden sm:flex">
                <Navigation className="h-4 w-4 mr-1.5" />
                GPS
              </Button>
              <button
                onClick={() => navigate('/navigation')}
                className="sm:hidden p-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                title="Me leva ao pico"
              >
                <Navigation className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt={userName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary">{userInitial}</span>
                )}
              </button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Atualizado às {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <NotificationPanel spots={allSpots} favorites={favorites} />
        </div>

        <SwellAlert spots={allSpots} />

        {topSpot && (
          <Card
            className="border-primary/20 card-hover cursor-pointer overflow-hidden"
            onClick={() => navigate(`/spot/${topSpot.id}`)}
            style={{
              animation: visible ? 'slideUp 0.5s 0.1s ease-out both' : 'none',
              background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${getScoreColor(topSpot.score)}15 100%)`,
              borderColor: `${getScoreColor(topSpot.score)}40`,
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">🔥 Melhor Pico Agora</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{topSpot.name}</h3>
                  <Badge variant="outline" className="mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {topSpot.region} da Ilha
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analyzeConditions(topSpot)}</p>
                </div>
                <div className="text-center bg-card/80 rounded-lg p-4 border">
                  <div className="text-4xl font-bold" style={{ color: getScoreColor(topSpot.score) }}>
                    {Number(topSpot.score).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Score IA</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div><div className="text-xs text-muted-foreground">Ondas</div><div className="text-lg font-semibold">{Number(topSpot.waveHeight).toFixed(1)}m</div></div>
                <div><div className="text-xs text-muted-foreground">Período</div><div className="text-lg font-semibold">{Math.round(topSpot.swellPeriod)}s</div></div>
                <div><div className="text-xs text-muted-foreground">Maré</div><div className="text-lg font-semibold">{topSpot.tide}</div></div>
                <div><div className="text-xs text-muted-foreground">Água</div><div className="text-lg font-semibold">{topSpot.waterConditions.temperature}°C</div></div>
                <div><div className="text-xs text-muted-foreground">Prancha</div><div className="text-sm font-medium leading-tight">{topSpot.boardSuggestion}</div></div>
              </div>
            </CardContent>
          </Card>
        )}

        <SwellPeriodWidget />

        <Alert className="anim-slide" style={{ animationDelay: '0.35s' }}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            A Inteligência Artificial analisa vento, swell, maré, batimetria e orientação das praias para indicar onde está melhor para surfar agora.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between anim-slide" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-bold">Todas as Praias</h2>
          <div className="flex items-center gap-2">
            <Button variant={showMap ? 'default' : 'outline'} size="sm" onClick={() => setShowMap(!showMap)}>
              <Map className="h-4 w-4 mr-2" />
              {showMap ? 'Lista' : 'Mapa'}
            </Button>
            <Button
              variant={favorites.length > 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigate('/favorites')}
            >
              <Heart className={`h-4 w-4 mr-2 ${favorites.length > 0 ? 'fill-current' : ''}`} />
              {favorites.length > 0 ? `${favorites.length}` : 'Favoritas'}
            </Button>
          </div>
        </div>

        <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />

        {showMap ? (
          <BeachMap spots={spots.length > 0 ? spots : allSpots} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spots.map((spot, idx) => (
              <div key={spot.id} style={{ animation: `slideUp 0.4s ${idx * 0.05}s ease-out both` }}>
                <SpotCard spot={spot} />
              </div>
            ))}
            {spots.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma praia encontrada nesta região.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
