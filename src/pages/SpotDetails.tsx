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
import {
  ArrowLeft, Waves, Wind, Navigation, Clock, Users,
  TrendingUp, Compass, AlertCircle, Thermometer, MapPin,
  Video, Heart, Calendar, Star, Sun, Info, Maximize2, X,
  Share2, MessageCircle, Trash2, Send, ChevronDown, ChevronUp
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const FIXED_DOMAIN = 'https://lasy-c2c60750-a786-490a-a8f2-7fef1f-self.vercel.app'

const getRatingInfo = (score: number) => {
  if (score >= 8.5) return { label: 'ÉPICO', color: 'text-purple-500', bg: 'bg-purple-500', bars: 5 }
  if (score >= 7) return { label: 'EXCELENTE', color: 'text-primary', bg: 'bg-primary', bars: 4 }
  if (score >= 5.5) return { label: 'BOM', color: 'text-accent', bg: 'bg-accent', bars: 3 }
  if (score >= 4) return { label: 'REGULAR', color: 'text-yellow-500', bg: 'bg-yellow-500', bars: 2 }
  return { label: 'RUIM', color: 'text-destructive', bg: 'bg-destructive', bars: 1 }
}

const directionNames: Record<string, string> = {
  'N': 'Norte', 'NNE': 'Norte-Nordeste', 'NE': 'Nordeste', 'ENE': 'Leste-Nordeste',
  'E': 'Leste', 'ESE': 'Leste-Sudeste', 'SE': 'Sudeste', 'SSE': 'Sul-Sudeste',
  'S': 'Sul', 'SSW': 'Sul-Sudoeste', 'SW': 'Sudoeste', 'WSW': 'Oeste-Sudoeste',
  'W': 'Oeste', 'WNW': 'Oeste-Noroeste', 'NW': 'Noroeste', 'NNW': 'Norte-Noroeste'
}

const getWindDirectionCode = (direction: string): string => direction.split(' ')[0]

const formatWindDirection = (direction: string) => {
  const code = getWindDirectionCode(direction)
  const name = directionNames[code] ?? code
  const isOffshore = direction.includes('Terral')
  const isLateral = direction.includes('Lateral')
  const type = isOffshore ? 'Terral ✓' : isLateral ? 'Lateral' : 'Frontal ✗'
  return { code, name, type, isOffshore }
}

const directionToDegrees = (direction: string): number => {
  const base = getWindDirectionCode(direction)
  const map: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
  }
  return map[base] ?? 0
}

const WindCompass = ({ direction, speed }: { direction: string, speed: number }) => {
  const degrees = directionToDegrees(direction)
  const { code, name, type, isOffshore } = formatWindDirection(direction)
  const getWindColor = (spd: number) => {
    if (spd <= 10) return '#22c55e'
    if (spd <= 20) return '#f59e0b'
    if (spd <= 30) return '#f97316'
    return '#ef4444'
  }
  const color = getWindColor(speed)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="50" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" opacity="0.4" />
        <circle cx="55" cy="55" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" opacity="0.2" />
        {[{ label: 'N', x: 55, y: 8 }, { label: 'S', x: 55, y: 104 }, { label: 'L', x: 104, y: 57 }, { label: 'O', x: 6, y: 57 }].map(({ label, x, y }) => (
          <text key={label} x={x} y={y} textAnchor="middle" fontSize="9" fontWeight="bold"
            fill={label === 'N' ? color : 'currentColor'}
            className={label !== 'N' ? 'text-muted-foreground' : ''}
            opacity={label !== 'N' ? 0.5 : 1}
          >{label}</text>
        ))}
        {[45, 135, 225, 315].map(deg => {
          const rad = (deg - 90) * Math.PI / 180
          return <line key={deg} x1={55 + 42 * Math.cos(rad)} y1={55 + 42 * Math.sin(rad)} x2={55 + 48 * Math.cos(rad)} y2={55 + 48 * Math.sin(rad)} stroke="currentColor" strokeWidth="1" className="text-border" opacity="0.3" />
        })}
        <line x1="55" y1="10" x2="55" y2="100" stroke="currentColor" strokeWidth="0.3" className="text-border" opacity="0.15" />
        <line x1="10" y1="55" x2="100" y2="55" stroke="currentColor" strokeWidth="0.3" className="text-border" opacity="0.15" />
        <g transform={`rotate(${degrees}, 55, 55)`}>
          <line x1="55" y1="55" x2="55" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="55,14 50,24 60,24" fill={color} />
          <line x1="55" y1="55" x2="55" y2="75" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </g>
        <circle cx="55" cy="55" r="4" fill={color} />
        <circle cx="55" cy="55" r="2" fill="white" />
      </svg>
      <div className="text-center">
        <div className="text-base font-bold" style={{ color }}>{speed}km/h</div>
        <div className="text-xs font-semibold">{code} — {name}</div>
        <div className={`text-xs mt-0.5 ${isOffshore ? 'text-green-500' : 'text-muted-foreground'}`}>{type}</div>
      </div>
    </div>
  )
}

const generateTideData = () => {
  const now = new Date()
  const points: { hour: number, height: number }[] = []
  const amplitude = 0.20
  const midLevel = 0.5
  const period = 12.4
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const phaseOffset = (dayOfYear * 0.8) % period
  for (let h = 0; h <= 24; h += 0.25) {
    const height = midLevel + amplitude * Math.cos((2 * Math.PI * (h + phaseOffset)) / period)
    points.push({ hour: h, height: Number(height.toFixed(2)) })
  }
  const tideEvents: { hour: number, type: 'alta' | 'baixa', height: number }[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].height
    const curr = points[i].height
    const next = points[i + 1].height
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
  const viewWidth = expanded ? 560 : 340
  const viewHeight = expanded ? 220 : 160
  const padding = { top: 40, bottom: 36, left: 32, right: 12 }
  const chartWidth = viewWidth - padding.left - padding.right
  const chartHeight = viewHeight - padding.top - padding.bottom
  const minH = midLevel - amplitude - 0.08
  const maxH = midLevel + amplitude + 0.08
  const xScale = (hour: number) => (hour / 24) * chartWidth + padding.left
  const yScale = (h: number) => chartHeight - ((h - minH) / (maxH - minH)) * chartHeight + padding.top
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.hour).toFixed(1)} ${yScale(p.height).toFixed(1)}`).join(' ')
  const areaData = pathData + ` L ${xScale(24).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)} L ${xScale(0).toFixed(1)} ${(chartHeight + padding.top).toFixed(1)} Z`
  const currentX = xScale(currentHour)
  const currentY = yScale(currentHeight)
  const formatHour = (h: number) => `${Math.floor(h).toString().padStart(2, '0')}:${Math.round((h - Math.floor(h)) * 60).toString().padStart(2, '0')}`
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = viewWidth / rect.width
    const rawX = (e.clientX - rect.left) * scaleX
    const hour = Math.max(0, Math.min(24, (rawX - padding.left) / chartWidth * 24))
    const height = midLevel + amplitude * Math.cos((2 * Math.PI * (hour + phaseOffset)) / period)
    setTooltip({ x: rawX, y: yScale(height), hour, height: Number(height.toFixed(2)) })
  }
  const gradId = expanded ? 'tideGradExp' : 'tideGrad'
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Estado Atual da Maré</div>
          <div className="text-xl font-bold">{tide}</div>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <div className="text-xs text-muted-foreground">Nível da Maré Agora</div>
          <div className="text-xl font-bold text-cyan-500">~{currentHeight}m</div>
        </div>
      </div>
      <div className="relative rounded-lg overflow-hidden bg-muted/10 border border-border/30 p-1">
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="overflow-visible cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t, i) => (<line key={i} x1={padding.left} y1={yScale(minH + (maxH - minH) * t)} x2={viewWidth - padding.right} y2={yScale(minH + (maxH - minH) * t)} stroke="#ffffff" strokeWidth="0.3" opacity="0.1" />))}
          <path d={areaData} fill={`url(#${gradId})`} />
          <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {tideEvents.map((event, i) => {
            const ex = xScale(event.hour), ey = yScale(event.height)
            const isHigh = event.type === 'alta'
            const labelX = Math.min(Math.max(ex, padding.left + 24), viewWidth - padding.right - 24)
            return (
              <g key={i}>
                <circle cx={ex} cy={ey} r="3.5" fill={isHigh ? '#22c55e' : '#f59e0b'} />
                <text x={labelX} y={isHigh ? ey - 8 : ey + 12} textAnchor="middle" fontSize="11" fill={isHigh ? '#22c55e' : '#f59e0b'} fontWeight="bold">{isHigh ? '▲' : '▼'}</text>
                <text x={labelX} y={isHigh ? ey - 20 : ey + 24} textAnchor="middle" fontSize={expanded ? "9" : "8.5"} fill={isHigh ? '#22c55e' : '#f59e0b'} fontWeight="600">{formatHour(event.hour)}</text>
                <text x={labelX} y={isHigh ? ey - 10 : ey + 34} textAnchor="middle" fontSize={expanded ? "8" : "7.5"} fill={isHigh ? '#22c55e' : '#f59e0b'} opacity="0.9">~{event.height.toFixed(1)}m</text>
              </g>
            )
          })}
          {[midLevel - amplitude, midLevel, midLevel + amplitude].map((h, i) => (<text key={i} x={padding.left - 4} y={yScale(h) + 3} textAnchor="end" fontSize="7" fill="#6b7280">{h.toFixed(1)}</text>))}
          {[0, 6, 12, 18, 24].map(h => (
            <g key={h}>
              <line x1={xScale(h)} y1={chartHeight + padding.top} x2={xScale(h)} y2={chartHeight + padding.top + 3} stroke="#6b7280" strokeWidth="0.8" />
              <text x={xScale(h)} y={viewHeight - 4} textAnchor="middle" fontSize="8" fill="#6b7280">{h === 24 ? '00h' : `${h}h`}</text>
            </g>
          ))}
          <line x1={currentX} y1={padding.top} x2={currentX} y2={chartHeight + padding.top} stroke="#ffffff" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
          <rect x={Math.min(currentX - 16, viewWidth - padding.right - 32)} y={padding.top - 14} width="32" height="13" rx="3" fill="#06b6d4" opacity="0.9" />
          <text x={Math.min(currentX, viewWidth - padding.right - 16)} y={padding.top - 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Agora</text>
          <circle cx={currentX} cy={currentY} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" />
          {tooltip && (
            <>
              <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={chartHeight + padding.top} stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
              <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="white" stroke="#06b6d4" strokeWidth="2" />
              {(() => {
                const tipW = 88, tipH = 36
                const tipX = Math.min(Math.max(tooltip.x - tipW / 2, padding.left), viewWidth - padding.right - tipW)
                const tipY = tooltip.y < viewHeight / 2 ? tooltip.y + 10 : tooltip.y - tipH - 10
                return (
                  <g>
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="5" fill="#1e293b" opacity="0.95" />
                    <text x={tipX + tipW / 2} y={tipY + 13} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{formatHour(tooltip.hour)}</text>
                    <text x={tipX + tipW / 2} y={tipY + 26} textAnchor="middle" fontSize="9" fill="#06b6d4">Maré: ~{tooltip.height.toFixed(2)}m</text>
                  </g>
                )
              })()}
            </>
          )}
        </svg>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><span className="text-green-500 font-bold">▲</span><span>Maré Alta</span></div>
        <div className="flex items-center gap-1"><span className="text-yellow-500 font-bold">▼</span><span>Maré Baixa</span></div>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        <span>Este gráfico mostra o <strong>nível da maré</strong> — não o tamanho das ondas. Dados aproximados baseados no padrão semi-diurno de Florianópolis.</span>
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
        <button onClick={() => setExpanded(true)} className="absolute top-0 right-0 p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      {expanded && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-cyan-500" />
                <h3 className="text-lg font-bold">Como vai estar o mar hoje?</h3>
              </div>
              <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
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
      {open && (
        <div className="mt-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 border" style={{ borderColor: info.color + '40' }}>
          {info.desc}
        </div>
      )}
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
    const data = await getComments(spot.id)
    setComments(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId) return
    setSubmitting(true)
    const success = await addComment(spot.id, spot.name, newComment.trim(), spot.waveHeight, spot.score)
    if (success) {
      setNewComment('')
      toast.success('Comentário adicionado!')
      await loadComments()
    } else {
      toast.error('Erro ao adicionar comentário. Você precisa estar logado.')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId)
    if (success) {
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
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder="Como está o mar agora? Compartilhe com outros surfistas..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary transition-colors"
              maxLength={280}
            />
            <button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/20 rounded-xl p-3 text-center">
            Faça login para deixar um relato sobre as condições
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-4"><Waves className="h-5 w-5 text-primary animate-bounce" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">Nenhum relato ainda. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment, idx) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-muted/20 rounded-xl" style={{ animation: `slideInLeft 0.3s ${idx * 0.05}s ease-out both` }}>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{comment.user_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{comment.user_name}</span>
                    {comment.wave_height && <span className="text-xs text-muted-foreground">· {Number(comment.wave_height).toFixed(1)}m</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{formatCommentTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm break-words">{comment.content}</p>
                </div>
                {currentUserId === comment.user_id && (
                  <button onClick={() => handleDelete(comment.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Botão de compartilhar — corrigido com domínio fixo e sem duplicar URL
const ShareButton = ({ spot }: { spot: BeachCondition }) => {
  const handleShare = async () => {
    const rating = getRatingInfo(spot.score)
    const spotUrl = `${FIXED_DOMAIN}/spot/${spot.id}`
    const text = `🏄 ${spot.name} está ${rating.label} agora!\n\nScore: ${spot.score.toFixed(1)}/10\nOndas: ${spot.waveHeight.toFixed(1)}m · Período: ${Math.round(spot.swellPeriod)}s\nVento: ${Math.round(spot.windSpeed)}km/h · Água: ${spot.waterConditions.temperature}°C\n\nVeja mais: ${spotUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `Surf AI — ${spot.name}`, text, url: spotUrl })
        return
      } catch (_) {}
    }
    await navigator.clipboard.writeText(text)
    toast.success('Condições copiadas! Cole no WhatsApp ou onde quiser 📋')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      Compartilhar
    </Button>
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

  useEffect(() => {
    if (id) {
      fetchCurrentConditions().then(async spots => {
        const found = spots.find(s => s.id === id) ?? null
        setSpot(found)
        setLoadingSpot(false)
        setTimeout(() => setVisible(true), 50)
        if (found) {
          getWeatherForecast(found.id, {
            waveHeight: found.waveHeight,
            windSpeed: found.windSpeed,
            swellPeriod: found.swellPeriod,
            windDirection: found.windDirection,
            waterTemperature: found.waterConditions.temperature,
            score: found.score
          }).then(setForecast)
        }
      })
      isFavorite(id).then(val => { setFavorite(val); setLoadingFav(false) })
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
          <CardHeader><CardTitle>Praia não encontrada</CardTitle></CardHeader>
          <CardContent><Button onClick={() => navigate('/')}>Voltar para Home</Button></CardContent>
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
  const windInfo = formatWindDirection(spot.windDirection)

  const animStyles = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes scorePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .anim-slide { animation: slideUp 0.5s ease-out both; }
    .anim-left { animation: slideInLeft 0.5s ease-out both; }
    .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  `

  return (
    <div className="min-h-screen bg-background">
      <style>{animStyles}</style>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <ShareButton spot={spot} />
              <Button variant={favorite ? 'default' : 'outline'} size="sm" onClick={handleToggleFavorite} disabled={loadingFav}>
                <Heart className={`h-4 w-4 mr-2 ${favorite ? 'fill-current' : ''}`} />
                {favorite ? 'Favoritado' : 'Favoritar'}
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
            </div>
          </div>
          <div className="text-center bg-card rounded-xl p-5 border shadow-sm min-w-[120px]" style={{ animation: visible ? 'slideUp 0.6s 0.1s ease-out both' : 'none' }}>
            <div className={`text-5xl font-bold ${rating.color}`} style={{ animation: visible ? 'scorePulse 0.8s 0.5s ease-in-out' : 'none' }}>
              {Number(spot.score).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Score AI</div>
            <div className={`text-xs font-bold mt-1 ${rating.color}`}>{rating.label}</div>
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-2 w-5 rounded-full transition-all duration-500 ${i <= rating.bars ? rating.bg : 'bg-muted'}`} style={{ transitionDelay: `${i * 80}ms` }} />
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
              <Card className="bg-accent/5 border-accent/20 card-hover anim-slide" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    Picos da Praia — Qual está melhor agora?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {spot.subRegions.map((subRegion, idx) => (
                      <div key={subRegion.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${subRegion.bestNow ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                        style={{ animation: `slideInLeft 0.4s ${idx * 0.08}s ease-out both` }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {subRegion.bestNow ? <Star className="h-4 w-4 text-primary fill-primary" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {subRegion.name}
                            {subRegion.bestNow && <Badge className="text-xs bg-primary text-primary-foreground">Melhor agora</Badge>}
                          </div>
                          {subRegion.description && <div className="text-sm text-muted-foreground">{subRegion.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert className="bg-primary/5 border-primary/20 anim-slide" style={{ animationDelay: '0.15s' }}>
              <TrendingUp className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Análise Inteligente</AlertTitle>
              <AlertDescription className="text-foreground">{analyzeConditions(spot)}</AlertDescription>
            </Alert>

            {spot.bestTimeWindow !== 'Não recomendado hoje' && spot.bestTimeWindow !== 'Condições ruins' && (
              <Card className="bg-secondary/5 border-secondary/20 card-hover anim-slide" style={{ animationDelay: '0.2s' }}>
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Melhor Janela</div>
                    <div className="text-sm text-muted-foreground">{spot.bestTimeWindow}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-chart-2/5 border-chart-2/20 card-hover anim-slide" style={{ animationDelay: '0.25s' }}>
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
                <Separator />
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Prancha Recomendada</div>
                    <div className="text-base font-semibold">{spot.boardSuggestion}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="card-hover anim-slide" style={{ animationDelay: '0.3s' }}>
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
                    <AnimatedProgress value={spot.waveHeight * 20} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Período</div>
                      <SwellPeriodBadge period={spot.swellPeriod} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Direção</div>
                      <div className="text-lg font-semibold">{spot.swellDirection}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover anim-slide" style={{ animationDelay: '0.35s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wind className="h-5 w-5 text-accent" />
                    Vento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Velocidade</span>
                          <span className="text-2xl font-bold">{Math.round(spot.windSpeed)}km/h</span>
                        </div>
                        <AnimatedProgress value={Math.min(spot.windSpeed * 2.5, 100)} />
                      </div>
                      <div className="pt-2 border-t space-y-1">
                        <div className="text-xs text-muted-foreground">Direção</div>
                        <div className="text-lg font-semibold">{windInfo.code} — {windInfo.name}</div>
                        <div className={`text-xs font-medium ${windInfo.isOffshore ? 'text-green-500' : 'text-muted-foreground'}`}>{windInfo.type}</div>
                      </div>
                    </div>
                    <WindCompass direction={spot.windDirection} speed={Math.round(spot.windSpeed)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="anim-slide" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-cyan-500" />
                  Como vai estar o mar hoje?
                </CardTitle>
              </CardHeader>
              <CardContent><TideChart tide={spot.tide} /></CardContent>
            </Card>

            <Card className="card-hover anim-slide" style={{ animationDelay: '0.45s' }}>
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
              <Card className="bg-yellow-500/5 border-yellow-500/20 card-hover anim-slide" style={{ animationDelay: '0.5s' }}>
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

            <div className="anim-slide" style={{ animationDelay: '0.55s' }}>
              <CommentsSection spot={spot} />
            </div>

            {spot.score < 4 && (
              <Alert variant="destructive" className="anim-slide" style={{ animationDelay: '0.6s' }}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Condições não ideais</AlertTitle>
                <AlertDescription>Este pico não está com boas condições no momento. Considere outras praias ou aguarde melhora.</AlertDescription>
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
                        <div key={day.date}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.01] ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                          style={{ animation: `slideInLeft 0.4s ${index * 0.06}s ease-out both` }}
                        >
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
                    <iframe src={spot.cameraEmbed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Confira as condições em tempo real antes de ir</p>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Video className="h-4 w-4" />
                <AlertTitle>Câmera não disponível</AlertTitle>
                <AlertDescription>Não há câmera ao vivo disponível para esta praia no momento.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <Button size="lg" className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]" onClick={() => navigate('/')}>
          Ver Todas as Praias
        </Button>
      </main>
    </div>
  )
}
