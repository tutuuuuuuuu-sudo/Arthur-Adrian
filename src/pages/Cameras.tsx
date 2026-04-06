import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Camera, ExternalLink, Wifi, WifiOff } from 'lucide-react'

// ─── Dados das câmeras disponíveis gratuitamente ──────────────────────────────
//
// Fontes pesquisadas e verificadas:
//  - SkylineWebcams: iframe público, sem restrição de embed
//  - ClimaAoVivo: iframes públicos de condições meteorológicas
//  - CondicaoAtual: câmeras de surf (algumas com embed)
//
// Praias sem câmera gratuita disponível recebem status 'soon'

type CameraStatus = 'live' | 'soon'
type CameraSource = 'skylinewebcams' | 'condicaoatual' | 'climaaovivo'

interface BeachCamera {
  id: string
  name: string
  region: string
  status: CameraStatus
  source?: CameraSource
  embedUrl?: string
  embedType?: 'iframe' | 'windy' | 'youtube'
  sourceUrl?: string
  description?: string
}

// ─── FONTES DE CÂMERAS ──────────────────────────────────────────────────────
// SkylineWebcams: embed público gratuito — Barra da Lagoa ✅
// Windy Webcams: embed público gratuito — Joaquina ✅ (ID 1385233278)
// YouTube Live: embed gratuito — canais locais de Floripa
// CondicaoAtual: câmeras de surf SC
// ClimaAoVivo: condições meteorológicas

const CAMERAS: BeachCamera[] = [
  {
    id: 'barra-lagoa',
    name: 'Barra da Lagoa',
    region: 'Leste',
    status: 'live',
    source: 'skylinewebcams',
    embedUrl: 'https://www.skylinewebcams.com/embed/barra-da-lagoa.html',
    sourceUrl: 'https://www.skylinewebcams.com/webcam/brasil/santa-catarina/florianopolis/barra-da-lagoa.html',
    description: 'Vista HD da praia e canal — SkylineWebcams',
  },
  {
    id: 'joaquina',
    name: 'Joaquina',
    region: 'Leste',
    status: 'live',
    source: 'condicaoatual',
    embedUrl: 'https://webcams.windy.com/webcams/1385233278/player/400/225/content.js',
    embedType: 'windy',
    sourceUrl: 'https://www.windy.com/webcams/1385233278',
    description: 'Câmera ao vivo — Windy Webcams',
  },
  {
    id: 'mole',
    name: 'Praia Mole',
    region: 'Leste',
    status: 'live',
    source: 'condicaoatual',
    embedUrl: 'https://www.skylinewebcams.com/embed/florianopolis.html',
    sourceUrl: 'https://www.skylinewebcams.com/webcam/brasil/santa-catarina/florianopolis/florianopolis.html',
    description: 'Vista de Florianópolis — SkylineWebcams',
  },
  {
    id: 'santinho',
    name: 'Santinho',
    region: 'Norte',
    status: 'live',
    source: 'climaaovivo',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCFbbd8kMazLUHniw08-IzUg&autoplay=1&mute=1',
    embedType: 'youtube',
    sourceUrl: 'https://www.youtube.com/@barradalagoaonline',
    description: 'Barra da Lagoa Online — YouTube ao vivo',
  },
  {
    id: 'campeche',
    name: 'Campeche',
    region: 'Sul',
    status: 'soon',
    description: 'Câmera em breve',
  },
  {
    id: 'mocambique',
    name: 'Moçambique',
    region: 'Leste',
    status: 'soon',
    description: 'Câmera em breve',
  },
  {
    id: 'armacao',
    name: 'Armação',
    region: 'Sul',
    status: 'soon',
    description: 'Câmera em breve',
  },
  {
    id: 'morro-pedras',
    name: 'Morro das Pedras',
    region: 'Sul',
    status: 'soon',
    description: 'Câmera em breve',
  },
]

const regionColors: Record<string, string> = {
  Leste: '#06b6d4',
  Sul: '#22c55e',
  Norte: '#8b5cf6',
}

// ─── Componente de câmera individual ─────────────────────────────────────────

const CameraCard = ({ camera }: { camera: BeachCamera }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const color = regionColors[camera.region] ?? '#888'
  const isLive = camera.status === 'live'

  return (
    <Card className="overflow-hidden border-border/40 hover:border-primary/30 transition-all">
      {/* Header da câmera */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${color}12`, borderBottom: `1px solid ${color}25` }}
      >
        <div className="flex items-center gap-2.5">
          <Camera className="h-4 w-4" style={{ color }} />
          <div>
            <div className="font-semibold text-sm">{camera.name}</div>
            <div className="text-xs text-muted-foreground">{camera.region} da Ilha</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-500">AO VIVO</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Em breve</span>
            </>
          )}
        </div>
      </div>

      {/* Área do player */}
      {isLive && camera.embedUrl && !error ? (
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Conectando câmera...</span>
            </div>
          )}
          <iframe
            src={camera.embedType === 'windy'
              ? `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=12&overlay=wind&product=ecmwf&level=surface&lat=-27.62&lon=-48.49&detailLat=-27.6294&detailLon=-48.449&detail=true&pressure=true&message=true&webcam=${camera.embedUrl.match(/\/([0-9]+)\//)?.[1]}`
              : camera.embedUrl}
            className="w-full h-full"
            style={{ border: 0, display: loaded ? 'block' : 'none' }}
            allowFullScreen
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={`Câmera ao vivo — ${camera.name}`}
            allow="autoplay; encrypted-media"
          />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/10">
              <WifiOff className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-xs text-muted-foreground">Câmera temporariamente indisponível</p>
              {camera.sourceUrl && (
                <a
                  href={camera.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
                >
                  Abrir no site original <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 py-10 bg-muted/5"
          style={{ aspectRatio: '16/9' }}
        >
          <Camera className="h-10 w-10 text-muted-foreground opacity-20" />
          <p className="text-xs text-muted-foreground text-center px-4">
            {camera.description ?? 'Câmera em breve'}
          </p>
        </div>
      )}

      {/* Footer com descrição e link externo */}
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {camera.description}
          </p>
          {isLive && camera.sourceUrl && (
            <a
              href={camera.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CamerasPage() {
  const navigate = useNavigate()
  const [activeRegion, setActiveRegion] = useState<string>('all')

  const regions = ['all', 'Leste', 'Sul', 'Norte']
  const regionLabels: Record<string, string> = {
    all: 'Todas', Leste: 'Leste', Sul: 'Sul', Norte: 'Norte',
  }

  const liveCount = CAMERAS.filter(c => c.status === 'live').length
  const filtered = activeRegion === 'all'
    ? CAMERAS
    : CAMERAS.filter(c => c.region === activeRegion)

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Câmeras ao Vivo
            </h1>
            <div className="flex items-center gap-1.5 text-xs">
              <Wifi className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-medium">{liveCount} online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
        {/* Info */}
        <div
          className="text-center space-y-1"
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        >
          <p className="text-sm text-muted-foreground">
            Confira as condições em tempo real antes de ir para o pico 🤙
          </p>
          <p className="text-xs text-muted-foreground/60">
            Câmeras gratuitas de parceiros — disponibilidade pode variar
          </p>
        </div>

        {/* Filtro de região */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeRegion === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {regionLabels[r]}
            </button>
          ))}
        </div>

        {/* Grid de câmeras */}
        <div className="space-y-4">
          {filtered.map((camera, idx) => (
            <div
              key={camera.id}
              style={{ animation: `slideUp 0.35s ${idx * 0.06}s ease-out both` }}
            >
              <CameraCard camera={camera} />
            </div>
          ))}
        </div>

        {/* Aviso sobre câmeras em breve */}
        <div
          className="text-center py-4 border border-dashed border-border/40 rounded-xl"
          style={{ animation: 'fadeIn 0.5s 0.3s ease-out both' }}
        >
          <p className="text-xs text-muted-foreground">
            Conhece alguma câmera ao vivo em Floripa?{' '}
            <a
              href="mailto:surfaifloripa@gmail.com"
              className="text-primary hover:underline"
            >
              Manda o link pra gente
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
