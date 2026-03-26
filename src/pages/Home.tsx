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
import {
  subscribeToNotifications,
  getNotificationPermission,
  getSavedNotificationSettings,
  saveNotificationSettings,
  checkAndNotifyGoodConditions
} from '@/lib/notifications'
import { Waves, TrendingUp, MapPin, Info, Heart, Settings, Bell, BellOff, Map, X, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

const FIXED_DOMAIN = 'https://lasy-c2c60750-a786-490a-a8f2-7fef1f-self.vercel.app'

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
    <Card className="border-primary/20 bg-primary/5">
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
        <CardContent className="px-4 pb-4 space-y-2">
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

// Mapa com pins SVG sobre iframe do Google Maps + botão expandir
const BeachMap = ({ spots }: { spots: BeachCondition[] }) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Coordenadas do centro de Florianópolis para o iframe
  const mapSrc = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d75000!2d-48.49!3d-27.63!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1234567890"

  const MapContent = ({ height }: { height: string }) => {
    // Limites do mapa visível no iframe (aproximado)
    const latMin = -27.88
    const latMax = -27.40
    const lngMin = -48.62
    const lngMax = -48.36

    // Converte coordenadas geográficas para % da área do mapa
    const toPercX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * 100
    const toPercY = (lat: number) => ((lat - latMax) / (latMin - latMax)) * 100

    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border/30" style={{ height }}>
        {/* Google Maps iframe como fundo */}
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          allowFullScreen
          src={mapSrc}
        />

        {/* Overlay com pins das praias */}
        <div className="absolute inset-0 pointer-events-none">
          {spots.map(spot => {
            const x = toPercX(spot.lng)
            const y = toPercY(spot.lat)
            // Ignora praias fora dos limites visíveis
            if (x < 0 || x > 100 || y < 0 || y > 100) return null
            const color = getScoreColor(spot.score)
            const isHovered = hoveredId === spot.id

            return (
              <div
                key={spot.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: isHovered ? 20 : 10,
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/spot/${spot.id}`)}
                onMouseEnter={() => setHoveredId(spot.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Card da praia */}
                <div
                  className="relative shadow-lg"
                  style={{
                    background: 'rgba(15, 23, 42, 0.92)',
                    border: `2px solid ${color}`,
                    borderRadius: '8px',
                    padding: '4px 8px',
                    minWidth: '80px',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div className="text-white font-semibold" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                    {spot.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span style={{ fontSize: '9px', color, fontWeight: 'bold' }}>
                      {spot.score.toFixed(1)} · {getScoreLabel(spot.score)}
                    </span>
                  </div>
                  {/* Seta do card apontando para baixo */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `7px solid ${color}`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Botão expandir/fechar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute top-2 right-2 z-30 p-2 rounded-lg bg-background/90 border border-border hover:bg-muted transition-colors pointer-events-auto"
          title={expanded ? 'Minimizar mapa' : 'Expandir mapa'}
        >
          {expanded
            ? <X className="h-4 w-4" />
            : <Maximize2 className="h-4 w-4" />
          }
        </button>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Mapa das Praias — Clique para ver detalhes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MapContent height={expanded ? '520px' : '300px'} />

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 pt-1">
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

          <p className="text-xs text-muted-foreground text-center">
            Toque em um card para ver as condições detalhadas da praia
          </p>
        </CardContent>
      </Card>

      {/* Modal de tela cheia */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col p-4 gap-3"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Mapa das Praias
            </h2>
            <button onClick={() => setExpanded(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 relative rounded-xl overflow-hidden border border-border/30">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d110000!2d-48.49!3d-27.60!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1234567890"
            />
            {/* Pins no modal expandido */}
            <div className="absolute inset-0 pointer-events-none">
              {spots.map(spot => {
                const latMin = -27.92, latMax = -27.38
                const lngMin = -48.65, lngMax = -48.33
                const x = ((spot.lng - lngMin) / (lngMax - lngMin)) * 100
                const y = ((spot.lat - latMax) / (latMin - latMax)) * 100
                if (x < 0 || x > 100 || y < 0 || y > 100) return null
                const color = getScoreColor(spot.score)
                return (
                  <div
                    key={spot.id}
                    className="absolute pointer-events-auto"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)', zIndex: 10, cursor: 'pointer' }}
                    onClick={() => { setExpanded(false); navigate(`/spot/${spot.id}`) }}
                  >
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: `2px solid ${color}`,
                      borderRadius: '8px',
                      padding: '5px 10px',
                      minWidth: '90px',
                      backdropFilter: 'blur(4px)',
                    }}>
                      <div className="text-white font-semibold" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{spot.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span style={{ fontSize: '10px', color, fontWeight: 'bold' }}>{spot.score.toFixed(1)} · {getScoreLabel(spot.score)}</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `7px solid ${color}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ color: '#8b5cf6', label: 'Épico' }, { color: '#06b6d4', label: 'Excelente' }, { color: '#22c55e', label: 'Bom' }, { color: '#f59e0b', label: 'Regular' }, { color: '#ef4444', label: 'Ruim' }].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const SwellAlert = ({ spots }: { spots: BeachCondition[] }) => {
  const [dismissed, setDismissed] = useState(false)
  const bigSwellSpots = spots.filter(s => s.waveHeight >= 1.5)
  if (bigSwellSpots.length === 0 || dismissed) return null
  const best = bigSwellSpots.sort((a, b) => b.waveHeight - a.waveHeight)[0]
  return (
    <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
      <div className="text-2xl">🌊</div>
      <div className="flex-1">
        <div className="font-bold text-sm">Swell grande chegando!</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {best.name} com ondas de {best.waveHeight.toFixed(1)}m — período de {Math.round(best.swellPeriod)}s
        </div>
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
  const isNotSupported = permission === 'unsupported' || isIOS

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

  const handleTestNotification = async () => {
    await checkAndNotifyGoodConditions(spots, favorites, settings.minScore, settings.favoriteOnly)
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
        {settings.enabled && permission === 'granted' ? 'Alertas ativos' : 'Ativar alertas'}
      </button>
    )
  }

  return (
    <Card className="border-primary/20">
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
          <div className="text-xs bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-muted-foreground">
            📱 <strong>iPhone/iPad:</strong> Para receber alertas, adicione o app à sua tela inicial:
            Safari → Compartilhar → "Adicionar à Tela de Início" → então ative os alertas.
          </div>
        )}
        {!isIOS && permission === 'unsupported' && (
          <p className="text-xs text-muted-foreground">Seu navegador não suporta notificações push. Tente abrir pelo Chrome.</p>
        )}
        {!isIOS && permission === 'denied' && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">
            Notificações bloqueadas. Toque no cadeado na barra de endereços e permita notificações.
          </div>
        )}
        {!isNotSupported && (permission === 'default' || permission === 'granted') && (
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
                <div className="text-xs font-semibold mb-2">Score mínimo para alertar</div>
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
                <div>
                  <div className="text-xs font-semibold">Só favoritas</div>
                  <div className="text-xs text-muted-foreground">Alertar apenas praias favoritas</div>
                </div>
                <button
                  onClick={() => { const s = { ...settings, favoriteOnly: !settings.favoriteOnly }; setSettings(s); saveNotificationSettings(s) }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.favoriteOnly ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.favoriteOnly ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
            {settings.enabled && permission === 'granted' && (
              <button onClick={handleTestNotification} className="w-full text-xs py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                Testar notificação agora
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
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [spots, setSpots] = useState<BeachCondition[]>([])
  const [allSpots, setAllSpots] = useState<BeachCondition[]>([])
  const [topSpot, setTopSpot] = useState<BeachCondition | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const navigate = useNavigate()

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

      const notifSettings = getSavedNotificationSettings()
      if (notifSettings.enabled) {
        await checkAndNotifyGoodConditions(allConditions, favs, notifSettings.minScore, notifSettings.favoriteOnly)
      }
    }

    updateData()
    const interval = setInterval(updateData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeRegion, showOnlyFavorites])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Waves className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Surf AI</h1>
                  <p className="text-xs text-muted-foreground">Florianópolis, SC</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
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
    <div className="min-h-screen bg-background">
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Surf AI</h1>
                <p className="text-xs text-muted-foreground">Florianópolis, SC</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Atualizado às {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <NotificationPanel spots={allSpots} favorites={favorites} />
        </div>

        <SwellAlert spots={allSpots} />

        {topSpot && (
          <Card className="bg-primary/5 border-primary/20">
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
                <div className="text-center bg-card rounded-lg p-4 border">
                  <div className="text-4xl font-bold text-primary">{Number(topSpot.score).toFixed(1)}</div>
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            A Inteligência Artificial analisa vento, swell, maré, batimetria e orientação das praias para indicar onde está melhor para surfar agora.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Todas as Praias</h2>
          <div className="flex items-center gap-2">
            <Button variant={showMap ? 'default' : 'outline'} size="sm" onClick={() => setShowMap(!showMap)}>
              <Map className="h-4 w-4 mr-2" />
              {showMap ? 'Ver Lista' : 'Ver Mapa'}
            </Button>
            <Button variant={showOnlyFavorites ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}>
              <Heart className={`h-4 w-4 mr-2 ${showOnlyFavorites ? 'fill-current' : ''}`} />
              Favoritas
            </Button>
          </div>
        </div>

        <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />

        {showMap ? (
          <BeachMap spots={spots.length > 0 ? spots : allSpots} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map((spot) => (<SpotCard key={spot.id} spot={spot} />))}
            </div>
            {spots.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{showOnlyFavorites ? 'Você ainda não tem praias favoritas. Clique no coração em uma praia para adicionar!' : 'Nenhuma praia encontrada nesta região.'}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
