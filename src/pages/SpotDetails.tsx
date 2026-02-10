import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { getSpotById, analyzeConditions } from '@/lib/surfData'
import {
  ArrowLeft,
  Waves,
  Wind,
  Navigation,
  Clock,
  Users,
  TrendingUp,
  Compass,
  AlertCircle,
  Thermometer,
  MapPin,
  Video
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SpotDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const spot = id ? getSpotById(id) : null

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

  const getScoreQuality = (score: number) => {
    if (score >= 8) return { text: 'EXCELENTE', color: 'text-primary' }
    if (score >= 6.5) return { text: 'BOM', color: 'text-accent' }
    if (score >= 5) return { text: 'REGULAR', color: 'text-muted-foreground' }
    return { text: 'RUIM', color: 'text-destructive' }
  }

  const quality = getScoreQuality(spot.score)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{spot.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  {spot.region} da Ilha
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {spot.level}
                </Badge>
              </div>
            </div>
            <div className="text-center bg-card rounded-xl p-6 border shadow-sm">
              <div className={`text-5xl font-bold ${quality.color}`}>
                {spot.score.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Score IA</div>
              <div className={`text-xs font-semibold mt-2 ${quality.color}`}>
                {quality.text}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-regiões da Praia */}
        {spot.subRegions && spot.subRegions.length > 0 && (
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Regiões da Praia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {spot.subRegions.map((subRegion) => (
                  <div key={subRegion.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">{subRegion.name}</div>
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

        {/* Análise da IA */}
        <Alert className="bg-primary/5 border-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Análise Inteligente</AlertTitle>
          <AlertDescription className="text-foreground">
            {analyzeConditions(spot)}
          </AlertDescription>
        </Alert>

        {/* Janela Ideal */}
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

        {/* Temperatura da Água & Neoprene */}
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
                <div className="text-sm text-muted-foreground mt-1">
                  {spot.waterConditions.wetsuit.description}
                </div>
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

        {/* Câmera Ao Vivo Surfline */}
        {spot.surflineUrl && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Câmera Ao Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={spot.surflineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  <Video className="h-4 w-4 mr-2" />
                  Ver câmera ao vivo no Surfline
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Confira as condições em tempo real antes de ir
              </p>
            </CardContent>
          </Card>
        )}

        {/* Condições Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ondas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                Ondas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Altura</span>
                  <span className="text-2xl font-bold">{spot.waveHeight}m</span>
                </div>
                <Progress value={spot.waveHeight * 20} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Período</div>
                  <div className="text-lg font-semibold">{spot.swellPeriod}s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Direção</div>
                  <div className="text-lg font-semibold">{spot.swellDirection}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vento */}
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
                  <span className="text-2xl font-bold">{spot.windSpeed}km/h</span>
                </div>
                <Progress value={Math.min(spot.windSpeed * 2.5, 100)} className="h-2" />
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Direção</div>
                <div className="text-lg font-semibold">{spot.windDirection}</div>
              </div>
            </CardContent>
          </Card>

          {/* Maré */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-5 w-5 text-chart-2" />
                Maré
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Estado</div>
                  <div className="text-lg font-semibold">{spot.tide}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Altura</div>
                  <div className="text-lg font-semibold">{spot.tideHeight}m</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crowd */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-3" />
                Lotação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{spot.crowdLevel}</div>
                {spot.crowdLevel === 'Vazio' && <span className="text-xs text-muted-foreground">Aproveite!</span>}
                {spot.crowdLevel === 'Pouca gente' && <span className="text-xs text-muted-foreground">Bom momento</span>}
                {spot.crowdLevel === 'Cheio' && <span className="text-xs text-muted-foreground">Evite se possível</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recomendação de Prancha */}
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

        {/* Aviso de Condições Ruins */}
        {spot.score < 5 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Condições não ideais</AlertTitle>
            <AlertDescription>
              Este pico não está com boas condições no momento. Considere outras praias ou aguarde melhora.
            </AlertDescription>
          </Alert>
        )}

        {/* Botão de Ação */}
        <Button size="lg" className="w-full" onClick={() => navigate('/')}>
          Ver Todas as Praias
        </Button>
      </main>
    </div>
  )
}
