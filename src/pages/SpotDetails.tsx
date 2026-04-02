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
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import { getComments, addComment, deleteComment, formatCommentTime, Comment } from '@/lib/comments'
import { supabase } from '@/lib/supabase'
import { usePremium } from '@/lib/premium'
import {
  ArrowLeft, Waves, Wind, Navigation, Clock, Users,
  TrendingUp, Compass, AlertCircle, Thermometer, MapPin,
  Video, Heart, Calendar, Star, Sun, Info, Maximize2, X,
  Share2, MessageCircle, Trash2, Send, ChevronDown, ChevronUp,
  ExternalLink, WifiOff, Lock, Crown
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const FIXED_DOMAIN = 'https://lasy-c2c60750-a786-490a-a8f2-7fef1fd0-arthurs-projects-d2bf211e.vercel.app'

const metersToFeet = (m: number): string => `${(m * 3.281).toFixed(1)}ft`

const getRatingInfo = (score: number) => {
  if (score >= 8.5) return { label: 'ÉPICO', color: 'text-purple-500', bg: 'bg-purple-500', bars: 5 }
  if (score >= 7) return { label: 'EXCELENTE', color: 'text-primary', bg: 'bg-primary', bars: 4 }
  if (score >= 5.5) return { label: 'BOM', color: 'text-accent', bg: 'bg-accent', bars: 3 }
  if (score >= 4) return { label: 'REGULAR', color: 'text-yellow-500', bg: 'bg-yellow-500', bars: 2 }
  return { label: 'RUIM', color: 'text-destructive', bg: 'bg-destructive', bars: 1 }
}

const directionNames: Record<string, string> = {
  'N': 'Norte', 'NNE': 'Nordeste', 'NE': 'Nordeste', 'ENE': 'Nordeste',
  'E': 'Leste', 'ESE': 'Sudeste', 'SE': 'Sudeste', 'SSE': 'Sudeste',
  'S': 'Sul', 'SSW': 'Sudoeste', 'SW': 'Sudoeste', 'WSW': 'Sudoeste',
  'W': 'Oeste', 'WNW': 'Noroeste', 'NW': 'Noroeste', 'NNW': 'Noroeste'
}

const getWindDirectionCode = (direction: string): string => direction.split(' ')[0]

const formatWindDirection = (direction: string) => {
  const code = getWindDirectionCode(direction)
  const name = directionNames[code] ?? code
  return { code, name }
}

const directionToDegrees = (direction: string): number => {
  const base = getWindDirectionCode(direction)
  const map: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
  }
  return map[base] ?? 0
}

const WindCompass = ({ direction, speed }: { direction: string, speed: number }) => {
  const degrees = directionToDegrees(direction)
  const { code, name } = formatWindDirection(direction)
  const getWindColor = (spd: number) => {
    if (spd <= 10) return '#22c55e'
    if (spd <= 20) return '#f59e0b'
    if (spd <= 30) return '#f97316'
    return '#ef4444'
  }
  const color = getWindColor(speed)
  const allDirs = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="62" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2,4" opacity="0.18" />
        <circle cx="70" cy="70" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-muted-foreground" opacity="0.14" />
        <circle cx="70" cy="70" r="28" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-muted-foreground" opacity="0.10" />
        <line x1="8" y1="70" x2="132" y2="70" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground" opacity="0.10" />
        <line x1="70" y1="8" x2="70" y2="132" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground" opacity="0.10" />
        {allDirs.map(deg => {
          const rad = (deg - 90) * Math.PI / 180
          const isCardinal = deg % 90 === 0
          const isMain = deg % 45 === 0
          const inner = isCardinal ? 50 : isMain ? 52 : 55
          const outer = isCardinal ? 62 : isMain ? 61 : 60
          return <line key={deg} x1={70 + inner * Math.cos(rad)} y1={70 + inner * Math.sin(rad)} x2={70 + outer * Math.cos(rad)} y2={70 + outer * Math.sin(rad)} stroke="currentColor" strokeWidth={isCardinal ? 1.5 : isMain ? 1 : 0.7} className="text-muted-foreground" opacity={isCardinal ? 0.45 : isMain ? 0.3 : 0.18} />
        })}
        <text x="70" y="7" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>N</text>
        <text x="70" y="136" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" className="text-muted-foreground" opacity="0.4">S</text>
        <text x="135" y="73" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" className="text-muted-foreground" opacity="0.4">L</text>
        <text x="5" y="73" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" className="text-muted-foreground" opacity="0.4">O</text>
        <g transform={`rotate(${degrees}, 70, 70)`}>
          <line x1="70" y1="70" x2="70" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="70,15 64,28 76,28" fill={color} />
          <line x1="70" y1="70" x2="70" y2="88" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.30" />
        </g>
        <circle cx="70" cy="70" r="5.5" fill={color} />
        <circle cx="70" cy="70" r="2.5" fill="white" />
      </svg>
      <div className="text-center space-y-0.5">
        <div className="text-lg font-bold" style={{ color }}>{speed}km/h</div>
        <div className="text-xs font-semibold text-foreground">{code} — {name}</div>
      </div>
    </div>
  )
}

const generateTideData = () => {
  const now = new Date()
  const points: { hour: number, height: number }[] = []
  const amplitude = 0.20, midLevel = 0.5, period = 12.4
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const phaseOffset = (dayOfYear * 0.8) % period
  for (let h = 0; h <= 24; h += 0.25) {
    const height = midLevel + amplitude * Math.cos((2 * Math.PI * (h + phaseOffset)) / period)
    points.push({ hour: h, height: Number(height.toFixed(2)) })
  }
  const tideEvents: { hour: number, type: 'alta' | 'baixa', height: number }[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].height, curr = points[i].height, next = points[i + 1].height
    if (curr > prev && curr > next && curr > midLevel + amplitude * 0.7) tideEvents.push({ hour: points[i].hour, type: 'alta', height: curr })
    if (curr < prev && curr < next && curr < midLevel - amplitude * 0.7) tideEvents.push({ hour: points[i].hour, type: 'baixa', height: curr })
  }
  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentHeight = midLevel + amplitude * Math.cos((2 * Math.PI * (currentHour + phaseOffset)) / period)
  return { points, amplitude, midLevel, phaseOffset, period, tideEvents, currentHeight: Number(currentHeight.toFixed(2)) }
}

const TideChartSVG = ({ tide, expanded = false }: { tide: string, expanded?: boolean }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, hour: number, height: number } | null>(null)
  const { points, midLevel, amplitude, phaseOffset, period, tideEvents, currentHeight } = generateTideData()
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const viewWidth = expanded ? 560 : 340, viewHeight = expanded ? 220 : 160
  const padding = { top: 40, bottom: 36, left: 32, right: 12 }
  const chartWidth = viewWidth - padding.left - padding.right, chartHeight = viewHeight - padding.top - padding.bottom
  const minH = midLevel - amplitude - 0.08, maxH = midLevel + amplitude + 0.08
  const xScale = (hour: number) => (hour / 24) * chartWidth + padding.left
  const yScale = (h: number) => chartHeight - ((h - minH) / (maxH - minH)) * chartHeight + padding.top
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.hour).toFixed(1)} ${yScale(p.height).toFixed(1)}`).join(' ')
  const areaData = pathData + ` L ${xScale(24).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)} L ${xScale(0).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)} Z`
  const currentX = xScale(currentHour), currentY = yScale(currentHeight)
  const formatHour = (h: number) => `${Math.floor(h).toString().padStart(2, '0')}:${Math.round((h - Math.floor(h)) * 60).toString().padStart(2, '0')}`
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) * (viewWidth / rect.width)
    const hour = Math.max(0, Math.min(24, (rawX - padding.left) / chartWidth * 24))
    const height = midLevel + amplitude * Math.cos((2 * Math.PI * (hour + phaseOffset)) / period)
    setTooltip({ x: rawX, y: yScale(height), hour, height: Number(height.toFixed(2)) })
  }
  const gradId = expanded ? 'tideGradExp' : 'tideGrad'
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div><div className="text-xs text-muted-foreground">Estado Atual</div><div className="text-xl font-bold">{tide}</div></div>
        <Separator orientation="vertical" className="h-10" />
        <div><div className="text-xs text-muted-foreground">Nível Agora</div><div className="text-xl font-bold text-cyan-500">~{currentHeight}m</div></div>
      </div>
      <div className="relative rounded-lg overflow-hidden bg-muted/10 border border-border/30 p-1">
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="overflow-visible cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
          <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" /></linearGradient></defs>
          <path d={areaData} fill={`url(#${gradId})`} />
          <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {tideEvents.map((event, i) => {
            const ex = xScale(event.hour), ey = yScale(event.height), isHigh = event.type === 'alta'
            const labelX = Math.min(Math.max(ex, padding.left + 24), viewWidth - padding.right - 24)
            return <g key={i}><circle cx={ex} cy={ey} r="3.5" fill={isHigh ? '#22c55e' : '#f59e0b'} /><text x={labelX} y={isHigh ? ey - 20 : ey + 24} textAnchor="middle" fontSize="8.5" fill={isHigh ? '#22c55e' : '#f59e0b'} fontWeight="600">{formatHour(event.hour)}</text></g>
          })}
          {[0, 6, 12, 18, 24].map(h => <g key={h}><text x={xScale(h)} y={viewHeight - 4} textAnchor="middle" fontSize="8" fill="#6b7280">{h === 24 ? '00h' : `${h}h`}</text></g>)}
          <line x1={currentX} y1={padding.top} x2={currentX} y2={chartHeight + padding.top} stroke="#ffffff" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
          <rect x={Math.min(currentX - 16, viewWidth - padding.right - 32)} y={padding.top - 14} width="32" height="13" rx="3" fill="#06b6d4" opacity="0.9" />
          <text x={Math.min(currentX, viewWidth - padding.right - 16)} y={padding.top - 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Agora</text>
          <circle cx={currentX} cy={currentY} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" />
          {tooltip && (<><line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={chartHeight + padding.top} stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" /><circle cx={tooltip.x} cy={tooltip.y} r="4" fill="white" stroke="#06b6d4" strokeWidth="2" /></>)}
        </svg>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        <span>Gráfico mostra o <strong>nível da maré</strong> — não o tamanho das ondas. Dados aproximados baseados no padrão semi-diurno de Florianópolis.</span>
      </div>
    </div>
  )
}

const TideChart = ({ tide }: { tide: string }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <div className="relative">
        <TideChartSVG tide={tide} />
        <button onClick={() => setExpanded(true)} className="absolute top-0 right-0 p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"><Maximize2 className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      {expanded && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Como vai estar o mar hoje?</h3>
              <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <TideChartSVG tide={tide} expanded={true} />
          </div>
        </div>
      )}
    </>
  )
}

const AnimatedProgress = ({ value }: { value: number }) => {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplayed(value), 100); return () => clearTimeout(t) }, [value])
  return <Progress value={displayed} className="h-2 transition-all duration-1000 ease-out" />
}

const SwellPeriodBadge = ({ period }: { period: number }) => {
  const [open, setOpen] = useState(false)
  const getInfo = (p: number) => {
    if (p >= 14) return { label: 'Épico', color: '#8b5cf6', desc: 'Swell de longo período — ondas perfeitas e muito potentes.' }
    if (p >= 12) return { label: 'Muito Bom', color: '#06b6d4', desc: 'Excelente ondulação — ondas longas, limpas e com energia.' }
    if (p >= 10) return { label: 'Bom', color: '#22c55e', desc: 'Boa ondulação — ondas bem formadas e surfáveis.' }
    if (p >= 8) return { label: 'Regular', color: '#f59e0b', desc: 'Ondulação moderada — surfável mas sem muita qualidade.' }
    return { label: 'Fraco', color: '#ef4444', desc: 'Vento local — ondas curtas e bagunçadas.' }
  }
  const info = getInfo(period)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5">
        <div className="text-lg font-semibold">{Math.round(period)}s</div>
        <span className="text-xs px-1.5 py-0.5 rounded font-bold text-white" style={{ backgroundColor: info.color }}>{info.label}</span>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && <div className="mt-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 border" style={{ borderColor: info.color + '40' }}>{info.desc}</div>}
    </div>
  )
}

const CommentsSection = ({ spot }: { spot: BeachCondition }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [spot.id])

  const loadComments = async () => {
    setLoading(true)
    setComments(await getComments(spot.id))
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId) return
    setSubmitting(true)
    const success = await addComment(spot.id, spot.name, newComment.trim(), spot.waveHeight, spot.score)
    if (success) { setNewComment(''); toast.success('Comentário adicionado!'); await loadComments() }
    else toast.error('Erro ao adicionar comentário.')
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    if (await deleteComment(commentId)) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comentário removido.')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Relatos do Dia
          {comments.length > 0 && <Badge variant="secondary" className="text-xs">{comments.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUserId ? (
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()} placeholder="Como está o mar agora?" className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary transition-colors" maxLength={280} />
            <button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/20 rounded-xl p-3 text-center">Faça login para deixar um relato</div>
        )}
        {loading ? <div className="flex justify-center py-4"><Waves className="h-5 w-5 text-primary animate-bounce" /></div>
          : comments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground"><MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" /><p className="text-xs">Nenhum relato ainda. Seja o primeiro!</p></div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, idx) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-muted/20 rounded-xl" style={{ animation: `slideInLeft 0.3s ${idx * 0.05}s ease-out both` }}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-primary">{comment.user_name.charAt(0).toUpperCase()}</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{comment.user_name}</span>
                      {comment.wave_height && <span className="text-xs text-muted-foreground">· {Number(comment.wave_height).toFixed(1)}m</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{formatCommentTime(comment.created_at)}</span>
                    </div>
                    <p className="text-sm break-words">{comment.content}</p>
                  </div>
                  {currentUserId === comment.user_id && <button onClick={() => handleDelete(comment.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  )
}

const ShareButton = ({ spot }: { spot: BeachCondition }) => {
  const handleShare = async () => {
    const rating = getRatingInfo(spot.score)
    const spotUrl = `${FIXED_DOMAIN}/spot/${spot.id}`
    const text = `🏄 ${spot.name} está ${rating.label} agora!\n\nScore: ${spot.score.toFixed(1)}/10\nOndas: ${spot.waveHeight.toFixed(1)}m · Período: ${Math.round(spot.swellPeriod)}s\nVento: ${Math.round(spot.windSpeed)}km/h · Água: ${spot.waterConditions.temperature}°C\n\nVeja mais: ${spotUrl}`
    if (navigator.share) { try { await navigator.share({ title: `Surf AI — ${spot.name}`, text, url: spotUrl }); return } catch (_) {} }
    await navigator.clipboard.writeText(text)
    toast.success('Condições copiadas! Cole no WhatsApp 📋')
  }
  return <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Compartilhar</Button>
}

const CameraPlayer = ({ spot }: { spot: BeachCondition }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  if (!spot.cameraEmbed) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-sm font-medium text-muted-foreground">Câmera não disponível para {spot.name}</p>
        <a href={`https://www.google.com/search?q=camera+ao+vivo+${encodeURIComponent(spot.name)}+Florianopolis`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
          Buscar câmeras de {spot.name} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black border border-border/30" style={{ aspectRatio: '16/9' }}>
        {!loaded && !error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/10"><div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /><span className="text-xs text-muted-foreground">Conectando câmera...</span></div>}
        {!error ? (
          <iframe src={spot.cameraEmbed} className="w-full h-full" style={{ border: 0, display: loaded ? 'block' : 'none' }} allowFullScreen loading="lazy" onLoad={() => setLoaded(true)} onError={() => setError(true)} title={`Câmera ao vivo — ${spot.name}`} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <WifiOff className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">Câmera temporariamente indisponível</p>
            {spot.cameraUrl && <a href={spot.cameraUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">Abrir no site original <ExternalLink className="h-3 w-3" /></a>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /><span>Ao vivo{spot.cameraSource ? ` · ${spot.cameraSource}` : ''}</span></div>
        {spot.cameraUrl && <a href={spot.cameraUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">Abrir em tela cheia <ExternalLink className="h-3 w-3" /></a>}
      </div>
      <p className="text-xs text-muted-foreground text-center">Confira as condições em tempo real antes de ir 🤙</p>
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
  const [visible, setVisible] = useState(false)
  const [showScoreExplainer, setShowScoreExplainer] = useState(false)
  const [usesFeet, setUsesFeet] = useState(false)
  const { isPremium } = usePremium()

  useEffect(() => {
    if (id) {
      fetchCurrentConditions().then(async spots => {
        const found = spots.find(s => s.id === id) ?? null
        setSpot(found)
        setLoadingSpot(false)
        setTimeout(() => setVisible(true), 50)
        if (found) {
          getWeatherForecast(found.id, {
            waveHeight: found.waveHeight, windSpeed: found.windSpeed,
            swellPeriod: found.swellPeriod, windDirection: found.windDirection,
            waterTemperature: found.waterConditions.temperature, score: found.score
          }, isPremium).then(setForecast)
        }
      })
      isFavorite(id).then(val => { setFavorite(val); setLoadingFav(false) })
    }
  }, [id, isPremium])

  if (loadingSpot) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><Waves className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" /><p className="text-muted-foreground text-sm">Buscando condições em tempo real...</p></div>
    </div>
  )

  if (!spot) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md"><CardHeader><CardTitle>Praia não encontrada</CardTitle></CardHeader><CardContent><Button onClick={() => navigate('/')}>Voltar para Home</Button></CardContent></Card>
    </div>
  )

  const handleToggleFavorite = async () => {
    const newState = await toggleFavorite(spot.id, spot.name)
    setFavorite(newState)
    toast.success(newState ? '❤️ Adicionado aos favoritos!' : '💔 Removido dos favoritos')
  }

  const rating = getRatingInfo(spot.score)
  const windInfo = formatWindDirection(spot.windDirection)

  const animStyles = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes scorePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .anim-slide { animation: slideUp 0.5s ease-out both; }
    .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  `

  // Temperatura do ar vem do forecast[0]
  const airTemp = forecast.length > 0 ? forecast[0].temperature : null

  return (
    <div className="min-h-screen bg-background">
      <style>{animStyles}</style>

      {showScoreExplainer && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowScoreExplainer(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Como calculamos o score</h3>
              <button onClick={() => setShowScoreExplainer(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className={`text-6xl font-bold text-center mb-1 ${rating.color}`}>{spot.score.toFixed(1)}</div>
            <div className={`text-center text-sm font-bold mb-6 ${rating.color}`}>{rating.label}</div>
            <div className="space-y-4">
              {[
                { label: 'Ondulação', value: spot.waveHeight >= 1.5 ? 9 : spot.waveHeight >= 1.0 ? 7 : spot.waveHeight >= 0.6 ? 5 : 4, desc: `${spot.waveHeight.toFixed(1)}m`, icon: '🌊' },
                { label: 'Período', value: spot.swellPeriod >= 14 ? 10 : spot.swellPeriod >= 12 ? 8 : spot.swellPeriod >= 10 ? 6 : 4, desc: `${Math.round(spot.swellPeriod)}s entre ondas`, icon: '⏱️' },
                { label: 'Vento', value: spot.windSpeed <= 10 ? 8 : spot.windSpeed <= 15 ? 6 : 4, desc: `${Math.round(spot.windSpeed)}km/h — ${spot.windDirection}`, icon: '💨' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold">{item.label}</span><span className="text-sm font-bold text-primary">{item.value}/10</span></div>
                    <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${item.value * 10}%` }} /></div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-5 text-center">Score calculado com base em ondulação, período, vento e orientação da praia</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/navigation')}><Navigation className="h-4 w-4 mr-2" />GPS</Button>
              <ShareButton spot={spot} />
              <Button variant={favorite ? 'default' : 'outline'} size="sm" onClick={handleToggleFavorite} disabled={loadingFav}>
                <Heart className={`h-4 w-4 mr-2 ${favorite ? 'fill-current' : ''}`} />{favorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{spot.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">{spot.region} da Ilha</Badge>
              <Badge variant="secondary" className="text-sm">{spot.level}</Badge>
              {/* Temperaturas no cabeçalho */}
              {airTemp && <Badge variant="outline" className="text-sm">☁️ Ar: {airTemp}°C</Badge>}
              <Badge variant="outline" className="text-sm">🌊 Água: {spot.waterConditions.temperature}°C</Badge>
            </div>
          </div>
          <div className="text-center bg-card rounded-xl p-5 border shadow-sm min-w-[120px] cursor-pointer hover:border-primary/50 transition-all active:scale-95" onClick={() => setShowScoreExplainer(true)}>
            <div className={`text-5xl font-bold ${rating.color}`}>{Number(spot.score).toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">Score AI</div>
            <div className={`text-xs font-bold mt-1 ${rating.color}`}>{rating.label}</div>
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1,2,3,4,5].map(i => <div key={i} className={`h-2 w-5 rounded-full ${i <= rating.bars ? rating.bg : 'bg-muted'}`} />)}
            </div>
            <div className="text-xs text-muted-foreground mt-2 opacity-60">Toque para entender</div>
          </div>
        </div>

        <Tabs defaultValue="now" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="now">Agora</TabsTrigger>
            <TabsTrigger value="forecast">Previsão 7 dias</TabsTrigger>
            <TabsTrigger value="camera">Câmera Ao Vivo</TabsTrigger>
          </TabsList>

          <TabsContent value="now" className="space-y-6">
            {spot.subRegions && spot.subRegions.length > 0 && (
              <Card className="bg-accent/5 border-accent/20 card-hover anim-slide">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" />Picos da Praia — Qual está melhor agora?</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {spot.subRegions.map((subRegion, idx) => (
                      <div key={subRegion.id} className={`flex items-start gap-3 p-3 rounded-lg ${subRegion.bestNow ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`} style={{ animation: `slideInLeft 0.4s ${idx * 0.08}s ease-out both` }}>
                        <div className="flex-shrink-0 mt-0.5">{subRegion.bestNow ? <Star className="h-4 w-4 text-primary fill-primary" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1" />}</div>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">{subRegion.name}{subRegion.bestNow && <Badge className="text-xs bg-primary text-primary-foreground">Melhor agora</Badge>}</div>
                          {subRegion.description && <div className="text-sm text-muted-foreground">{subRegion.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert className="bg-primary/5 border-primary/20 anim-slide">
              <TrendingUp className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Análise Inteligente</AlertTitle>
              <AlertDescription className="text-foreground">{analyzeConditions(spot)}</AlertDescription>
            </Alert>

            {spot.bestTimeWindow !== 'Não recomendado hoje' && (
              <Card className="bg-secondary/5 border-secondary/20 card-hover anim-slide">
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div><div className="text-sm font-semibold">Melhor Janela</div><div className="text-sm text-muted-foreground">{spot.bestTimeWindow}</div></div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Temperatura da água SEM descrição "Quentinha" — apenas números */}
            <Card className="card-hover anim-slide">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Thermometer className="h-5 w-5 text-chart-2" />Temperatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">☁️ Temperatura do Ar</div>
                    <div className="text-3xl font-bold">{airTemp ? `${airTemp}°C` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">🌊 Temperatura da Água</div>
                    <div className="text-3xl font-bold">{spot.waterConditions.temperature}°C</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Neoprene Recomendado</div>
                    <div className="text-base font-semibold">{spot.waterConditions.wetsuit.thickness}</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div><div className="text-xs text-muted-foreground">Prancha Recomendada</div><div className="text-base font-semibold">{spot.boardSuggestion}</div></div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="card-hover anim-slide">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Waves className="h-5 w-5 text-primary" />Ondulação</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Altura</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{usesFeet ? metersToFeet(spot.waveHeight) : `${Number(spot.waveHeight).toFixed(1)}m`}</span>
                        <button onClick={() => setUsesFeet(!usesFeet)} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">{usesFeet ? 'm' : 'ft'}</button>
                      </div>
                    </div>
                    <AnimatedProgress value={spot.waveHeight * 20} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div><div className="text-xs text-muted-foreground">Período</div><SwellPeriodBadge period={spot.swellPeriod} /></div>
                    <div><div className="text-xs text-muted-foreground">Direção</div><div className="text-lg font-semibold">{spot.swellDirection}</div></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover anim-slide">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wind className="h-5 w-5 text-accent" />Vento</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Velocidade</span><span className="text-2xl font-bold">{Math.round(spot.windSpeed)}km/h</span></div>
                        <AnimatedProgress value={Math.min(spot.windSpeed * 2.5, 100)} />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">Direção</div>
                        <div className="text-lg font-semibold">{windInfo.code} — {windInfo.name}</div>
                      </div>
                    </div>
                    <WindCompass direction={spot.windDirection} speed={Math.round(spot.windSpeed)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="anim-slide">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Navigation className="h-5 w-5 text-cyan-500" />Como vai estar o mar hoje?</CardTitle></CardHeader>
              <CardContent><TideChart tide={spot.tide} /></CardContent>
            </Card>

            <Card className="card-hover anim-slide">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-chart-3" />Crowd</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{spot.crowdLevel}</div>
                  <span className="text-xs text-muted-foreground">{spot.crowdMessage}</span>
                </div>
              </CardContent>
            </Card>

            {(spot.sunrise || spot.sunset) && (
              <Card className="bg-yellow-500/5 border-yellow-500/20 card-hover anim-slide">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sun className="h-5 w-5 text-yellow-500" />Luz do Dia</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-muted-foreground">🌅 Nascer do Sol</div><div className="text-lg font-semibold">{spot.sunrise}</div></div>
                    <div><div className="text-xs text-muted-foreground">🌇 Pôr do Sol</div><div className="text-lg font-semibold">{spot.sunset}</div></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="anim-slide"><CommentsSection spot={spot} /></div>

            {spot.score < 4 && (
              <Alert variant="destructive" className="anim-slide">
                <AlertCircle className="h-4 w-4" /><AlertTitle>Condições não ideais</AlertTitle>
                <AlertDescription>Este pico não está com boas condições. Considere outras praias ou aguarde melhora.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* ✅ Previsão 7 dias com bloqueio para usuários free */}
          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Previsão dos Próximos 7 Dias
                  {!isPremium && <Badge variant="outline" className="ml-auto text-xs text-yellow-500 border-yellow-500/40">2 dias grátis · <Crown className="h-3 w-3 inline mx-0.5" /> Premium para ver todos</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {forecast.length === 0 ? (
                  <div className="flex items-center justify-center py-8"><Waves className="h-6 w-6 text-primary animate-bounce mr-2" /><span className="text-muted-foreground text-sm">Carregando previsão...</span></div>
                ) : (
                  <div className="space-y-3">
                    {forecast.map((day, index) => {
                      const dayRating = getRatingInfo(day.score)
                      const isLocked = day.locked && !isPremium
                      return (
                        <div key={day.date}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'} ${isLocked ? 'opacity-50 select-none cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                          style={{ animation: `slideInLeft 0.4s ${index * 0.06}s ease-out both` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              <div className="font-bold">{day.dayName}</div>
                              <div className="text-xs text-muted-foreground">{new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                            </div>
                            <Separator orientation="vertical" className="h-12" />
                            {isLocked ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm">Exclusivo Premium</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-6">
                                <div className="text-center"><Waves className="h-4 w-4 mx-auto mb-1 text-primary" /><div className="text-sm font-semibold">{usesFeet ? metersToFeet(day.waveHeight) : `${Number(day.waveHeight).toFixed(1)}m`}</div></div>
                                <div className="text-center"><Wind className="h-4 w-4 mx-auto mb-1 text-accent" /><div className="text-sm font-semibold">{Math.round(day.windSpeed)}km/h</div></div>
                                <div className="text-center hidden md:block"><Thermometer className="h-4 w-4 mx-auto mb-1 text-chart-2" /><div className="text-sm font-semibold">{day.temperature}°C</div></div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {isLocked ? (
                              <button onClick={() => navigate('/premium')} className="flex items-center gap-1 text-xs text-yellow-500 hover:underline">
                                <Crown className="h-3.5 w-3.5" />Ver com Premium
                              </button>
                            ) : (
                              <>
                                <div className={`text-2xl font-bold ${dayRating.color}`}>{Number(day.score).toFixed(1)}</div>
                                <div className={`text-xs font-bold ${dayRating.color}`}>{dayRating.label}</div>
                                <div className="flex gap-0.5 mt-1 justify-end">{[1,2,3,4,5].map(i => <div key={i} className={`h-1 w-3 rounded-full ${i <= dayRating.bars ? dayRating.bg : 'bg-muted'}`} />)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {/* CTA para assinar se for free */}
                    {!isPremium && (
                      <button onClick={() => navigate('/premium')} className="w-full p-4 rounded-lg border border-dashed border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors text-center">
                        <Crown className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-yellow-500">Ver previsão completa de 7 dias</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Assine o Premium por R$ 19,90/mês</div>
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Câmera Ao Vivo — {spot.name}
                  {spot.cameraEmbed && <div className="flex items-center gap-1 ml-auto"><div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /><span className="text-xs text-red-500 font-bold">AO VIVO</span></div>}
                </CardTitle>
              </CardHeader>
              <CardContent><CameraPlayer spot={spot} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button size="lg" className="w-full" onClick={() => navigate('/')}>Ver Todas as Praias</Button>
      </main>
    </div>
  )
}
