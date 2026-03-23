import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchCurrentConditions, analyzeConditions, BeachCondition } from '@/lib/surfData'
import { getWeatherForecast, WeatherForecast } from '@/lib/weatherData'
import { getWindyForecast, TidePoint } from '@/lib/weatherApi'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import {
  ArrowLeft, Waves, Wind, Navigation, Clock, Users,
  TrendingUp, Compass, AlertCircle, Thermometer, MapPin,
  Video, Heart, Calendar, Star, Sun, Info
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const getRatingInfo = (score: number) => {
  if (score >= 8.5) return { label: 'ÉPICO', color: 'text-purple-500', bg: 'bg-purple-500', bars: 5 }
  if (score >= 7) return { label: 'EXCELENTE', color: 'text-primary', bg: 'bg-primary', bars: 4 }
  if (score >= 5.5) return { label: 'BOM', color: 'text-accent', bg: 'bg-accent', bars: 3 }
  if (score >= 4) return { label: 'REGULAR', color: 'text-yellow-500', bg: 'bg-yellow-500', bars: 2 }
  return { label: 'RUIM', color: 'text-destructive', bg: 'bg-destructive', bars: 1 }
}

// Gera curva suave interpolando os extremos reais da Stormglass
const generateRealTideCurve = (tideEvents: TidePoint[]) => {
  const points: { hour: number, height: number }[] = []

  if (tideEvents.length === 0) return points

  // Converte os extremos para horas do dia
  const events = tideEvents.map(e => {
    const d = new Date(e.time)
    const hour = d.getHours() + d.getMinutes() / 60
    return { hour, height: e.height, type: e.type }
  }).sort((a, b) => a.hour - b.hour)

  // Adiciona pontos extras antes e depois para a curva ficar contínua
  const first = events[0]
  const last = events[events.length - 1]

  // Ponto antes do início (espelha o primeiro)
  const prevType = first.type === 'high' ? 'low' : 'high'
  const prevHeight = prevType === 'high'
    ? Math.max(...events.map(e => e.height))
    : Math.min(...events.map(e => e.height))
  const extendedEvents = [
    { hour: first.hour - 6.2, height: prevHeight, type: prevType },
    ...events,
    { hour: last.hour + 6.2, height: last.type === 'high' ? Math.min(...events.map(e => e.height)) : Math.max(...events.map(e => e.height)), type: last.type === 'high' ? 'low' : 'high' }
  ]

  // Interpola com seno entre cada par de extremos
  for (let i = 0; i < extendedEvents.length - 1; i++) {
    const a = extendedEvents[i]
    const b = extendedEvents[i + 1]
    const steps = Math.round((b.hour - a.hour) / 0.25)

    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const hour = a.hour + (b.hour - a.hour) * t
      if (hour < 0 || hour > 24) continue
      // Interpolação cosseno para curva suave
      const cosT = (1 - Math.cos(t * Math.PI)) / 2
      const height = a.height + (b.height - a.height) * cosT
      points.push({ hour, height: Number(height.toFixed(2)) })
    }
  }

  return points.filter(p => p.hour >= 0 && p.hour <= 24).sort((a, b) => a.hour - b.hour)
}

const TideChart = ({ tide, tideData }: { tide: string, tideData: TidePoint[] }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, hour: number, height: number } | null>(null)

  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60

  const points = generateRealTideCurve(tideData)
  const hasRealData = points.length > 0

  const allHeights = points.map(p => p.height)
  const minH = hasRealData ? Math.min(...allHeights) - 0.1 : 0.1
  const maxH = hasRealData ? Math.max(...allHeights) + 0.1 : 0.9

  const viewWidth = 340
  const viewHeight = 120
  const padding = { top: 20, bottom: 24, left: 28, right: 12 }
  const chartWidth = viewWidth - padding.left - padding.right
  const chartHeight = viewHeight - padding.top - padding.bottom

  const xScale = (hour: number) => (hour / 24) * chartWidth + padding.left
  const yScale = (h: number) => chartHeight - ((h - minH) / (maxH - minH)) * chartHeight + padding.top

  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(p.hour).toFixed(1)} ${yScale(p.height).toFixed(1)}`
  ).join(' ')

  const areaData = points.length > 0
    ? pathData +
      ` L ${xScale(points[points.length - 1].hour).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)}` +
      ` L ${xScale(points[0].hour).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)} Z`
    : ''

  // Altura atual interpolada
  const getCurrentHeight = () => {
    if (points.length === 0) return null
    const before = points.filter(p => p.hour <= currentHour)
    const after = points.filter(p => p.hour > currentHour)
    if (before.length === 0 || after.length === 0) return null
    const a = before[before.length - 1]
    const b = after[0]
    const t = (currentHour - a.hour) / (b.hour - a.hour)
    return Number((a.height + (b.height - a.height) * t).toFixed(2))
  }

  const currentHeight = getCurrentHeight()
  const currentX = xScale(currentHour)
  const currentY = currentHeight != null ? yScale(currentHeight) : null

  const formatHour = (h: number) => {
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = viewWidth / rect.width
    const rawX = (e.clientX - rect.left) * scaleX
    const hour = Math.max(0, Math.min(24, (rawX - padding.left) / chartWidth * 24))

    const before = points.filter(p => p.hour <= hour)
    const after = points.filter(p => p.hour > hour)
    if (before.length === 0 || after.length === 0) return

    const a = before[before.length - 1]
    const b = after[0]
    const t = (hour - a.hour) / (b.hour - a.hour)
    const height = a.height + (b.height - a.height) * t

    setTooltip({ x: rawX, y: yScale(height), hour, height: Number(height.toFixed(2)) })
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Estado Atual</div>
          <div className="text-xl font-bold">{tide}</div>
        </div>
        {currentHeight != null && (
          <>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <div className="text-xs text-muted-foreground">Altura da Maré Agora</div>
              <div className="text-xl font-bold text-cyan-500">{currentHeight}m</div>
            </div>
          </>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden bg-muted/10 border border-border/30 p-1">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((t, i) => (
            <line key={i}
              x1={padding.left} y1={yScale(minH + (maxH - minH) * t)}
              x2={viewWidth - padding.right} y2={yScale(minH + (maxH - minH) * t)}
              stroke="#ffffff" strokeWidth="0.3" opacity="0.1"
            />
          ))}

          {hasRealData && <path d={areaData} fill="url(#tideGrad)" />}
          {hasRealData && <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Marcadores de extremos reais */}
          {tideData.map((event, i) => {
            const d = new Date(event.time)
            const hour = d.getHours() + d.getMinutes() / 60
            if (hour < 0 || hour > 24) return null
            const isHigh = event.type === 'high'
            const y = yScale(event.height)
            return (
              <g key={i}>
                <text x={xScale(hour)} y={isHigh ? y - 8 : y + 14}
                  textAnchor="middle" fontSize="10"
                  fill={isHigh ? '#22c55e' : '#f59e0b'} fontWeight="bold"
                >
                  {isHigh ? '▲' : '▼'}
                </text>
                <text x={xScale(hour)} y={isHigh ? y - 18 : y + 24}
                  textAnchor="middle" fontSize="7"
                  fill={isHigh ? '#22c55e' : '#f59e0b'}
                >
                  {formatHour(hour)}
                </text>
                <text x={xScale(hour)} y={isHigh ? y - 27 : y + 33}
                  textAnchor="middle" fontSize="7"
                  fill={isHigh ? '#22c55e' : '#f59e0b'}
                >
                  {event.height.toFixed(2)}m
                </text>
              </g>
            )
          })}

          {/* Escala Y */}
          {[minH, (minH + maxH) / 2, maxH].map((h, i) => (
            <text key={i} x={padding.left - 4} y={yScale(h) + 3}
              textAnchor="end" fontSize="7" fill="#6b7280"
            >
              {h.toFixed(1)}
            </text>
          ))}

          {/* Horas */}
          {[0, 6, 12, 18, 24].map(h => (
            <g key={h}>
              <line x1={xScale(h)} y1={chartHeight + padding.top}
                x2={xScale(h)} y2={chartHeight + padding.top + 3}
                stroke="#6b7280" strokeWidth="0.8"
              />
              <text x={xScale(h)} y={viewHeight - 4}
                textAnchor="middle" fontSize="8" fill="#6b7280"
              >
                {h === 24 ? '00h' : `${h}h`}
              </text>
            </g>
          ))}

          {/* Linha Agora */}
          <line x1={currentX} y1={padding.top}
            x2={currentX} y2={chartHeight + padding.top}
            stroke="#ffffff" strokeWidth="1" strokeDasharray="3,2" opacity="0.4"
          />
          <rect
            x={Math.min(currentX - 16, viewWidth - padding.right - 32)}
            y={padding.top - 14} width="32" height="13" rx="3"
            fill="#06b6d4" opacity="0.9"
          />
          <text
            x={Math.min(currentX, viewWidth - padding.right - 16)}
            y={padding.top - 4}
            textAnchor="middle" fontSize="8" fill="white" fontWeight="bold"
          >
            Agora
          </text>

          {currentY != null && (
            <circle cx={currentX} cy={currentY} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" />
          )}

          {/* Tooltip */}
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={padding.top}
                x2={tooltip.x} y2={chartHeight + padding.top}
                stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="white" stroke="#06b6d4" strokeWidth="2" />
              {(() => {
                const tipW = 80
                const tipH = 36
                const tipX = Math.min(Math.max(tooltip.x - tipW / 2, padding.left), viewWidth - padding.right - tipW)
                const tipY = tooltip.y < viewHeight / 2 ? tooltip.y + 10 : tooltip.y - tipH - 10
                return (
                  <g>
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="5" fill="#1e293b" opacity="0.95" />
                    <text x={tipX + tipW / 2} y={tipY + 13} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">
                      {formatHour(tooltip.hour)}
                    </text>
                    <text x={tipX + tipW / 2} y={tipY + 26} textAnchor="middle" fontSize="9" fill="#06b6d4">
                      Maré: {tooltip.height.toFixed(2)}m
                    </text>
                  </g>
                )
              })()}
            </>
          )}
        </svg>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="text-green-500 font-bold">▲</span>
          <span>Maré Alta</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-500 font-bold">▼</span>
          <span>Maré Baixa</span>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        <span>Este gráfico mostra a variação da <strong>maré</strong> ao longo do dia — não o tamanho das ondas. Dados fornecidos pela Stormglass.</span>
      </div>
    </div>
  )
}

export default function SpotDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [spot, setSpot] = useState<BeachCondition | null>(null)
  const [loadingSpot, setLoadingSpot] = useState(true)
  const [favorite, setFavorite] = useState(false)
  const [loadingFav, setLoadingFav] = useState(true)
  const [forecast, setForecast] = useState<WeatherForecast[]>([])
  const [tideData, setTideData] = useState<TidePoint[]>([])

  useEffect(() => {
    if (id) {
      fetchCurrentConditions().then(async spots => {
        const found = spots.find(s => s.id === id) ?? null
        setSpot(found)
        setLoadingSpot(false)
        if (found) {
          getWeatherForecast(found.id, {
            waveHeight: found.waveHeight,
            windSpeed: found.windSpeed,
            swellPeriod: found.swellPeriod,
            windDirection: found.windDirection,
            waterTemperature: found.waterConditions.temperature,
            score: found.score
          }).then(setForecast)

          // Busca dados reais de maré
          const tideRes = await getWindyForecast(found.lat, found.lng, found.lat, true)
          if (tideRes?.tideData) {
            setTideData(tideRes.tideData)
          }
        }
      })
      isFavorite(id).then(val => {
        setFavorite(val)
        setLoadingFav(false)
      })
    }
  }, [id])

  if (loadingSpot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground text-sm">Buscando condições em tempo real...</p>
        </div>
      </div>
    )
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Praia não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Voltar para Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleToggleFavorite = async () => {
    const newState = await toggleFavorite(spot.id, spot.name)
    setFavorite(newState)
    toast.success(newState ? '❤️ Adicionado aos favoritos!' : '💔 Removido dos favoritos')
  }

  const getCrowdMessage = (crowd: string) => {
    if (crowd === 'Vazio') return 'Água tranquila, quase ninguém'
    if (crowd === 'Pouca gente') return 'Bom momento para surfar'
    return 'Mar bom atrai galera'
  }

  const rating = getRatingInfo(spot.score)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant={favorite ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleFavorite}
                disabled={loadingFav}
              >
                <Heart className={`h-4 w-4 mr-2 ${favorite ? 'fill-current' : ''}`} />
                {favorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{spot.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">{spot.region} da Ilha</Badge>
              <Badge variant="secondary" className="text-sm">{spot.level}</Badge>
            </div>
          </div>
          <div className="text-center bg-card rounded-xl p-5 border shadow-sm min-w-[120px]">
            <div className={`text-5xl font-bold ${rating.color}`}>
              {Number(spot.score).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Score AI</div>
            <div className={`text-xs font-bold mt-1 ${rating.color}`}>{rating.label}</div>
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-2 w-5 rounded-full ${i <= rating.bars ? rating.bg : 'bg-muted'}`} />
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="now" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="now">Agora</TabsTrigger>
            <TabsTrigger value="forecast">Previsão 7 dias</TabsTrigger>
            <TabsTrigger value="camera" disabled={!spot.cameraEmbed}>Câmera Ao Vivo</TabsTrigger>
          </TabsList>

          <TabsContent value="now" className="space-y-6">
            {spot.subRegions && spot.subRegions.length > 0 && (
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    Picos da Praia — Qual está melhor agora?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {spot.subRegions.map((subRegion) => (
                      <div key={subRegion.id} className={`flex items-start gap-3 p-3 rounded-lg ${subRegion.bestNow ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}>
                        <div className="flex-shrink-0 mt-0.5">
                          {subRegion.bestNow
                            ? <Star className="h-4 w-4 text-primary fill-primary" />
                            : <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {subRegion.name}
                            {subRegion.bestNow && <Badge className="text-xs bg-primary text-primary-foreground">Melhor agora</Badge>}
                          </div>
                          {subRegion.description && (
                            <div className="text-sm text-muted-foreground">{subRegion.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert className="bg-primary/5 border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Análise Inteligente</AlertTitle>
              <AlertDescription className="text-foreground">
                {analyzeConditions(spot)}
              </AlertDescription>
            </Alert>

            {spot.bestTimeWindow !== 'Não recomendado hoje' && spot.bestTimeWindow !== 'Condições ruins' && (
              <Card className="bg-secondary/5 border-secondary/20">
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Melhor Janela</div>
                    <div className="text-sm text-muted-foreground">{spot.bestTimeWindow}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-chart-2/5 border-chart-2/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-chart-2" />
                  Temperatura da Água
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{spot.waterConditions.temperature}°C</div>
                    <div className="text-sm text-muted-foreground mt-1">{spot.waterConditions.wetsuit.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Neoprene Recomendado</div>
                    <div className="text-lg font-semibold">{spot.waterConditions.wetsuit.thickness}</div>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  {spot.waterConditions.temperature >= 24 && '☀️ Água quentinha, pode até surfar de lycra!'}
                  {spot.waterConditions.temperature >= 20 && spot.waterConditions.temperature < 24 && '🌤️ Temperatura agradável para sessões longas'}
                  {spot.waterConditions.temperature >= 18 && spot.waterConditions.temperature < 20 && '🌊 Use um 4/3mm para maior conforto'}
                  {spot.waterConditions.temperature < 18 && '🥶 Água bem fria, considere touca e botinhas'}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Waves className="h-5 w-5 text-primary" />
                    Ondulação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Altura</span>
                      <span className="text-2xl font-bold">{Number(spot.waveHeight).toFixed(1)}m</span>
                    </div>
                    <Progress value={spot.waveHeight * 20} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Período</div>
                      <div className="text-lg font-semibold">{Math.round(spot.swellPeriod)}s</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Direção</div>
                      <div className="text-lg font-semibold">{spot.swellDirection}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wind className="h-5 w-5 text-accent" />
                    Vento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Velocidade</span>
                      <span className="text-2xl font-bold">{Math.round(spot.windSpeed)}km/h</span>
                    </div>
                    <Progress value={Math.min(spot.windSpeed * 2.5, 100)} className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">Direção</div>
                    <div className="text-lg font-semibold">{spot.windDirection}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Maré Real */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-cyan-500" />
                  Como vai estar o mar hoje?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TideChart tide={spot.tide} tideData={tideData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-chart-3" />
                  Crowd
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{spot.crowdLevel}</div>
                  <span className="text-xs text-muted-foreground">{getCrowdMessage(spot.crowdLevel)}</span>
                </div>
              </CardContent>
            </Card>

            {(spot.sunrise || spot.sunset) && (
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    Luz do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">🌅 Nascer do Sol</div>
                      <div className="text-lg font-semibold">{spot.sunrise}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">🌇 Pôr do Sol</div>
                      <div className="text-lg font-semibold">{spot.sunset}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-secondary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="h-5 w-5 text-secondary" />
                  Prancha Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{spot.boardSuggestion}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Baseado nas condições atuais do mar e nível de experiência recomendado.
                </p>
              </CardContent>
            </Card>

            {spot.score < 4 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Condições não ideais</AlertTitle>
                <AlertDescription>
                  Este pico não está com boas condições no momento. Considere outras praias ou aguarde melhora.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Previsão dos Próximos 7 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {forecast.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Waves className="h-6 w-6 text-primary animate-bounce mr-2" />
                    <span className="text-muted-foreground text-sm">Carregando previsão...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {forecast.map((day, index) => {
                      const dayRating = getRatingInfo(day.score)
                      return (
                        <div key={day.date} className={`flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              <div className="font-bold">{day.dayName}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </div>
                            <Separator orientation="vertical" className="h-12" />
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <Waves className="h-4 w-4 mx-auto mb-1 text-primary" />
                                <div className="text-sm font-semibold">{Number(day.waveHeight).toFixed(1)}m</div>
                              </div>
                              <div className="text-center">
                                <Wind className="h-4 w-4 mx-auto mb-1 text-accent" />
                                <div className="text-sm font-semibold">{Math.round(day.windSpeed)}km/h</div>
                              </div>
                              <div className="text-center hidden md:block">
                                <Thermometer className="h-4 w-4 mx-auto mb-1 text-chart-2" />
                                <div className="text-sm font-semibold">{day.temperature}°C</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${dayRating.color}`}>{Number(day.score).toFixed(1)}</div>
                            <div className={`text-xs font-bold ${dayRating.color}`}>{dayRating.label}</div>
                            <div className="flex gap-0.5 mt-1 justify-end">
                              {[1,2,3,4,5].map(i => (
                                <div key={i} className={`h-1 w-3 rounded-full ${i <= dayRating.bars ? dayRating.bg : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            {spot.cameraEmbed ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Câmera Ao Vivo - {spot.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={spot.cameraEmbed}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Confira as condições em tempo real antes de ir
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Video className="h-4 w-4" />
                <AlertTitle>Câmera não disponível</AlertTitle>
                <AlertDescription>
                  Não há câmera ao vivo disponível para esta praia no momento.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <Button size="lg" className="w-full" onClick={() => navigate('/')}>
          Ver Todas as Praias
        </Button>
      </main>
    </div>
  )
}
