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
import { Waves, TrendingUp, MapPin, Info, Heart, Settings, Bell, BellOff, Map, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// Widget explicativo de período do swell
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
      <button
        className="w-full text-left"
        onClick={() => setOpen(!open)}
      >
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

// Mapa interativo das praias
const BeachMap = ({ spots }: { spots: BeachCondition[] }) => {
  const navigate = useNavigate()
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null)

  const getScoreColor = (score: number): string => {
    if (score >= 8.5) return '#8b5cf6'
    if (score >= 7) return '#06b6d4'
    if (score >= 5.5) return '#22c55e'
    if (score >= 4) return '#f59e0b'
    return '#ef4444'
  }

  // Coordenadas normalizadas para o SVG (baseado nas coords reais de Florianópolis)
  // Lat: -27.44 (norte) a -27.85 (sul) | Lng: -48.60 (oeste) a -48.38 (leste)
  const latMin = -27.86
  const latMax = -27.43
  const lngMin = -48.60
  const lngMax = -48.37

  const toX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * 340
  const toY = (lat: number) => ((lat - latMax) / (latMin - latMax)) * 460

  const hovered = spots.find(s => s.id === hoveredSpot)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Mapa das Praias — Clique para ver detalhes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full rounded-xl overflow-hidden bg-[#0d2137] border border-border/30">
          <svg
            width="100%"
            viewBox="0 0 360 480"
            className="block"
          >
            {/* Fundo do mar */}
            <rect width="360" height="480" fill="#0d2137" />

            {/* Silhueta da ilha de Florianópolis — simplificada */}
            <path
              d="M 120,20 C 140,15 160,18 175,25 C 185,30 195,35 200,45
                 C 210,60 205,75 200,88 C 195,100 188,112 183,125
                 C 178,138 175,150 173,163 C 170,178 170,192 168,205
                 C 165,220 160,233 158,247 C 155,262 155,275 153,288
                 C 150,303 145,316 142,328 C 138,342 135,355 133,368
                 C 130,382 128,395 127,408 C 125,422 125,438 123,450
                 C 121,462 118,470 115,475
                 C 105,472 95,465 88,455 C 80,443 75,430 72,418
                 C 68,405 67,392 68,378 C 70,364 74,352 77,338
                 C 80,324 82,311 83,297 C 84,282 83,268 84,254
                 C 85,239 87,226 88,212 C 89,197 89,183 90,168
                 C 91,153 92,139 94,125 C 96,110 99,97 102,83
                 C 105,69 108,56 113,44 C 116,35 118,27 120,20 Z"
              fill="#1a3a2a"
              stroke="#2a5a3a"
              strokeWidth="1"
              opacity="0.9"
            />

            {/* Labels das regiões */}
            {[
              { label: 'Norte', x: 155, y: 55 },
              { label: 'Leste', x: 175, y: 200 },
              { label: 'Sul', x: 115, y: 380 },
            ].map(r => (
              <text key={r.label} x={r.x} y={r.y} textAnchor="middle"
                fontSize="8" fill="#ffffff" opacity="0.3" fontWeight="600"
              >{r.label}</text>
            ))}

            {/* Pontos das praias */}
            {spots.map(spot => {
              const x = toX(spot.lng)
              const y = toY(spot.lat)
              const color = getScoreColor(spot.score)
              const isHovered = hoveredSpot === spot.id

              return (
                <g
                  key={spot.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/spot/${spot.id}`)}
                  onMouseEnter={() => setHoveredSpot(spot.id)}
                  onMouseLeave={() => setHoveredSpot(null)}
                >
                  {/* Pulso externo */}
                  {isHovered && (
                    <circle cx={x} cy={y} r="12" fill={color} opacity="0.2" />
                  )}
                  {/* Círculo do score */}
                  <circle
                    cx={x} cy={y}
                    r={isHovered ? 9 : 7}
                    fill={color}
                    stroke="white"
                    strokeWidth={isHovered ? 2 : 1.5}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {/* Score dentro do círculo */}
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="5.5"
                    fill="white" fontWeight="bold"
                  >
                    {spot.score.toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* Tooltip do spot hovereado */}
            {hovered && (() => {
              const x = Math.min(Math.max(toX(hovered.lng), 60), 300)
              const y = Math.min(Math.max(toY(hovered.lat) - 40, 10), 430)
              return (
                <g>
                  <rect x={x - 50} y={y} width="100" height="36" rx="6"
                    fill="#1e293b" stroke={getScoreColor(hovered.score)} strokeWidth="1" opacity="0.97"
                  />
                  <text x={x} y={y + 13} textAnchor="middle" fontSize="8.5"
                    fill="white" fontWeight="bold"
                  >{hovered.name}</text>
                  <text x={x} y={y + 26} textAnchor="middle" fontSize="7.5"
                    fill={getScoreColor(hovered.score)}
                  >Score {hovered.score.toFixed(1)} · {hovered.waveHeight.toFixed(1)}m</text>
                </g>
              )
            })()}
          </svg>

          {/* Legenda */}
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-1">
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
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Toque em um ponto para ver as condições detalhadas
        </p>
      </CardContent>
    </Card>
  )
}

// Banner de alerta de swell grande
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
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Painel de configuração de notificações
const NotificationPanel = ({ spots, favorites }: { spots: BeachCondition[], favorites: string[] }) => {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [settings, setSettings] = useState(getSavedNotificationSettings())
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

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
        {settings.enabled && permission === 'granted'
          ? <Bell className="h-3.5 w-3.5" />
          : <BellOff className="h-3.5 w-3.5" />
        }
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
          <button onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'unsupported' && (
          <p className="text-xs text-muted-foreground">Seu dispositivo não suporta notificações push.</p>
        )}

        {permission === 'denied' && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">
            Notificações bloqueadas. Acesse as configurações do seu navegador para permitir.
          </div>
        )}

        {(permission === 'default' || permission === 'granted') && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Receber alertas</div>
                <div className="text-xs text-muted-foreground">Quando as condições estiverem boas</div>
              </div>
              <button
                onClick={settings.enabled && permission === 'granted' ? handleDisable : handleEnable}
                disabled={loading}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.enabled && permission === 'granted' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  settings.enabled && permission === 'granted' ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-2">Score mínimo para alertar</div>
                <div className="flex gap-2">
                  {[6, 7, 8, 9].map(score => (
                    <button
                      key={score}
                      onClick={() => {
                        const newSettings = { ...settings, minScore: score }
                        setSettings(newSettings)
                        saveNotificationSettings(newSettings)
                      }}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                        settings.minScore === score
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {score}+
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">Só favoritas</div>
                  <div className="text-xs text-muted-foreground">Alertar apenas praias favoritas</div>
                </div>
                <button
                  onClick={() => {
                    const newSettings = { ...settings, favoriteOnly: !settings.favoriteOnly }
                    setSettings(newSettings)
                    saveNotificationSettings(newSettings)
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.favoriteOnly ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    settings.favoriteOnly ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {settings.enabled && permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                className="w-full text-xs py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
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

      if (activeRegion !== 'all') {
        filtered = filtered.filter(spot => spot.region === activeRegion)
      }

      if (showOnlyFavorites) {
        filtered = filtered.filter(spot => favs.includes(spot.id))
      }

      filtered = filtered.sort((a, b) => b.score - a.score)

      setSpots(filtered)
      setTopSpot(allConditions.sort((a, b) => b.score - a.score)[0] ?? null)
      setLoading(false)

      // Verifica se deve enviar notificação
      const notifSettings = getSavedNotificationSettings()
      if (notifSettings.enabled) {
        await checkAndNotifyGoodConditions(
          allConditions,
          favs,
          notifSettings.minScore,
          notifSettings.favoriteOnly
        )
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

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Barra de status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Atualizado às {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <NotificationPanel spots={allSpots} favorites={favorites} />
        </div>

        {/* Alerta de swell grande */}
        <SwellAlert spots={allSpots} />

        {/* Melhor pico */}
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analyzeConditions(topSpot)}
                  </p>
                </div>
                <div className="text-center bg-card rounded-lg p-4 border">
                  <div className="text-4xl font-bold text-primary">{Number(topSpot.score).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Score IA</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Ondas</div>
                  <div className="text-lg font-semibold">{Number(topSpot.waveHeight).toFixed(1)}m</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Período</div>
                  <div className="text-lg font-semibold">{Math.round(topSpot.swellPeriod)}s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Maré</div>
                  <div className="text-lg font-semibold">{topSpot.tide}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Água</div>
                  <div className="text-lg font-semibold">{topSpot.waterConditions.temperature}°C</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Prancha</div>
                  <div className="text-sm font-medium leading-tight">{topSpot.boardSuggestion}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget swell period */}
        <SwellPeriodWidget />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            A Inteligência Artificial analisa vento, swell, maré, batimetria e orientação das praias para indicar onde está melhor para surfar agora.
          </AlertDescription>
        </Alert>

        {/* Toggle do mapa */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Todas as Praias</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={showMap ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              <Map className="h-4 w-4 mr-2" />
              {showMap ? 'Ver Lista' : 'Ver Mapa'}
            </Button>
            <Button
              variant={showOnlyFavorites ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              <Heart className={`h-4 w-4 mr-2 ${showOnlyFavorites ? 'fill-current' : ''}`} />
              {showOnlyFavorites ? 'Favoritas' : 'Favoritas'}
            </Button>
          </div>
        </div>

        <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />

        {/* Mapa ou lista */}
        {showMap ? (
          <BeachMap spots={spots.length > 0 ? spots : allSpots} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
            {spots.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>
                  {showOnlyFavorites
                    ? 'Você ainda não tem praias favoritas. Clique no coração em uma praia para adicionar!'
                    : 'Nenhuma praia encontrada nesta região.'}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
