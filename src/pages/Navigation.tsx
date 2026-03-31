import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchCurrentConditions, BeachCondition } from '@/lib/surfData'
import { ArrowLeft, Navigation, Waves, MapPin, ExternalLink } from 'lucide-react'

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

const getLocationDesc = (id: string): string => {
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
  return map[id] ?? 'Florianópolis'
}

// Coordenadas e endereços precisos de cada praia
const BEACH_DESTINATIONS: Record<string, { lat: number, lng: number, address: string }> = {
  'campeche':       { lat: -27.6710, lng: -48.4765, address: 'Av. Pequeno Príncipe, Praia do Campeche, Florianópolis' },
  'novo-campeche':  { lat: -27.6400, lng: -48.4630, address: 'Praia do Novo Campeche, Florianópolis' },
  'morro-pedras':   { lat: -27.6761, lng: -48.4842, address: 'Praia do Morro das Pedras, Florianópolis' },
  'matadeiro':      { lat: -27.7342, lng: -48.5167, address: 'Praia do Matadeiro, Florianópolis' },
  'lagoinha-leste': { lat: -27.7892, lng: -48.5289, address: 'Lagoinha do Leste, Florianópolis' },
  'acores':         { lat: -27.7572, lng: -48.5125, address: 'Praia dos Açores, Florianópolis' },
  'solidao':        { lat: -27.7456, lng: -48.5089, address: 'Praia da Solidão, Florianópolis' },
  'armacao':        { lat: -27.7447, lng: -48.5044, address: 'Praia da Armação, Florianópolis' },
  'naufragados':    { lat: -27.8456, lng: -48.5623, address: 'Praia de Naufragados, Florianópolis' },
  'joaquina':       { lat: -27.6214, lng: -48.4433, address: 'Praia da Joaquina, Florianópolis' },
  'mole':           { lat: -27.5989, lng: -48.4381, address: 'Praia Mole, Florianópolis' },
  'mocambique':     { lat: -27.5647, lng: -48.4208, address: 'Praia de Moçambique, Florianópolis' },
  'barra-lagoa':    { lat: -27.5767, lng: -48.4194, address: 'Praia da Barra da Lagoa, Florianópolis' },
  'santinho':       { lat: -27.4433, lng: -48.3917, address: 'Praia do Santinho, Florianópolis' },
  'ponta-aranhas':  { lat: -27.4256, lng: -48.3889, address: 'Ponta das Aranhas, Florianópolis' },
  'canajure':       { lat: -27.4189, lng: -48.3945, address: 'Praia do Canajurê, Florianópolis' },
}

// Sub-picos do Campeche com endereços reais
const CAMPECHE_SUBSPOTS = [
  {
    id: 'lomba-sabao',
    name: 'Lomba do Sabão',
    address: 'Rua Lomba do Sabão, Campeche, Florianópolis',
    lat: -27.6750, lng: -48.4780,
  },
  {
    id: 'palanque',
    name: 'Palanque',
    address: 'Servidão Caminho dos Surfistas, Campeche, Florianópolis',
    lat: -27.6720, lng: -48.4772,
  },
  {
    id: 'principal',
    name: 'Principal',
    address: 'Av. Pequeno Príncipe, Praia do Campeche, Florianópolis',
    lat: -27.6683, lng: -48.4760,
  },
]

// ✅ CORREÇÃO TS6133: parâmetro 'address' renomeado para '_address'
// O endereço está armazenado em BEACH_DESTINATIONS e CAMPECHE_SUBSPOTS.
// As URLs de navegação usam apenas lat/lng — o parâmetro de texto não é consumido
// pelas URLs do Google Maps, Waze ou Apple Maps nesta implementação.
const openNavigation = (lat: number, lng: number, _address: string, app: 'google' | 'waze' | 'apple') => {
  const urls = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`,
    apple: `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
  }
  window.open(urls[app], '_blank')
}

const NavModal = ({
  name,
  score,
  beachId,
  lat,
  lng,
  waveHeight,
  windSpeed,
  swellPeriod,
  waterTemp,
  onClose
}: {
  name: string
  score: number
  beachId: string
  lat: number
  lng: number
  waveHeight: number
  windSpeed: number
  swellPeriod: number
  waterTemp: number
  onClose: () => void
}) => {
  const color = getScoreColor(score)
  const isCampeche = beachId === 'campeche'
  const [selectedSubspot, setSelectedSubspot] = useState<typeof CAMPECHE_SUBSPOTS[0] | null>(null)
  const dest = BEACH_DESTINATIONS[beachId] ?? { lat, lng, address: name }

  const activeLat = selectedSubspot?.lat ?? dest.lat
  const activeLng = selectedSubspot?.lng ?? dest.lng
  const activeAddress = selectedSubspot?.address ?? dest.address

  return (
    <div
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end justify-center p-4"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden mb-4"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: color + '30', background: color + '10' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold">{name}</h2>
            <div className="text-2xl font-bold" style={{ color }}>{score.toFixed(1)}</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{getLocationDesc(beachId)}</span>
            <span>·</span>
            <span style={{ color }}>{getScoreLabel(score)}</span>
          </div>
          <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
            <span>🌊 {waveHeight.toFixed(1)}m</span>
            <span>💨 {Math.round(windSpeed)}km/h</span>
            <span>⏱️ {Math.round(swellPeriod)}s</span>
            <span>🌡️ {waterTemp}°C</span>
          </div>
        </div>

        {/* Sub-picos do Campeche */}
        {isCampeche && (
          <div className="px-5 pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Escolha o pico do Campeche:</p>
            <div className="grid grid-cols-3 gap-2 mb-1">
              {CAMPECHE_SUBSPOTS.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubspot(selectedSubspot?.id === sub.id ? null : sub)}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedSubspot?.id === sub.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
            {selectedSubspot && (
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {selectedSubspot.address}
              </p>
            )}
          </div>
        )}

        {/* Opções de navegação */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold text-center text-muted-foreground mb-4">
            Como quer ir até {selectedSubspot?.name ?? name}?
          </p>

          <button
            onClick={() => openNavigation(activeLat, activeLng, activeAddress, 'google')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🗺️</span>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm group-hover:text-blue-500 transition-colors">Google Maps</div>
              <div className="text-xs text-muted-foreground">Abre com rota completa</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            onClick={() => openNavigation(activeLat, activeLng, activeAddress, 'waze')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🚗</span>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm group-hover:text-cyan-500 transition-colors">Waze</div>
              <div className="text-xs text-muted-foreground">Melhor para trânsito em tempo real</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
          </button>

          <button
            onClick={() => openNavigation(activeLat, activeLng, activeAddress, 'apple')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gray-400/50 hover:bg-gray-400/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-400/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🍎</span>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm group-hover:text-gray-300 transition-colors">Apple Maps</div>
              <div className="text-xs text-muted-foreground">Para usuários iPhone/iPad</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gray-300 transition-colors" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NavigationPage() {
  const navigate = useNavigate()
  const [spots, setSpots] = useState<BeachCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState<BeachCondition | null>(null)
  const [activeRegion, setActiveRegion] = useState<string>('all')

  useEffect(() => {
    fetchCurrentConditions().then(data => {
      setSpots(data.sort((a, b) => b.score - a.score))
      setLoading(false)
    })
  }, [])

  const regions = ['all', 'Sul', 'Leste', 'Norte']
  const regionLabels: Record<string, string> = {
    all: 'Todas', Sul: 'Sul', Leste: 'Leste', Norte: 'Norte'
  }

  const filtered = activeRegion === 'all'
    ? spots
    : spots.filter(s => s.region === activeRegion)

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
              <Navigation className="h-5 w-5 text-primary" />
              Me Leva ao Pico
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Escolha uma praia e te levamos até lá 🤙</p>
        </div>

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

        {loading ? (
          <div className="flex justify-center py-20">
            <Waves className="h-10 w-10 text-primary animate-bounce" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((spot, idx) => {
              const color = getScoreColor(spot.score)
              return (
                <Card
                  key={spot.id}
                  className="cursor-pointer hover:border-primary/40 transition-all active:scale-[0.98]"
                  style={{ animation: `slideInLeft 0.3s ${idx * 0.04}s ease-out both` }}
                  onClick={() => setSelectedSpot(spot)}
                >
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                        style={{ backgroundColor: color }}
                      >
                        {spot.score.toFixed(1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{spot.name}</div>
                        <div className="text-xs text-muted-foreground">{getLocationDesc(spot.id)}</div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>🌊 {spot.waveHeight.toFixed(1)}m</span>
                          <span>💨 {Math.round(spot.windSpeed)}km/h</span>
                          <span>⏱️ {Math.round(spot.swellPeriod)}s</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30">
                          <Navigation className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs text-primary font-medium">Ir</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {selectedSpot && (
        <NavModal
          name={selectedSpot.name}
          score={selectedSpot.score}
          beachId={selectedSpot.id}
          lat={selectedSpot.lat}
          lng={selectedSpot.lng}
          waveHeight={selectedSpot.waveHeight}
          windSpeed={selectedSpot.windSpeed}
          swellPeriod={selectedSpot.swellPeriod}
          waterTemp={selectedSpot.waterConditions.temperature}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  )
}
