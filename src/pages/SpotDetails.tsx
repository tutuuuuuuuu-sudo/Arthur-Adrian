import { useState, useEffect } from 'react'
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
import {
  ArrowLeft, Waves, Wind, Navigation, Clock, Users,
  TrendingUp, Compass, AlertCircle, Thermometer, MapPin,
  Video, Heart, Calendar, Star, Sun
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function SpotDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [spot, setSpot] = useState<BeachCondition | null>(null)
  const [loadingSpot, setLoadingSpot] = useState(true)
  const [favorite, setFavorite] = useState(false)
  const [loadingFav, setLoadingFav] = useState(true)
  const [forecast, setForecast] = useState<WeatherForecast[]>([])

  useEffect(() => {
    if (id) {
      fetchCurrentConditions().then(spots => {
        const found = spots.find(s => s.id === id) ?? null
        setSpot(found)
        setLoadingSpot(false)
        if (found) {
          // Passa as condições atuais para o "Hoje" da previsão ser consistente
          getWeatherForecast(found.id, {
            waveHeight: found.waveHeight,
            windSpeed: found.windSpeed,
            swellPeriod: found.swellPeriod,
            windDirection: found.windDirection,
            waterTemperature: found.waterConditions.temperature
          }).then(setForecast)
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

  const getScoreQuality = (score: number) => {
    if (score >= 8) return { text: 'EXCELENTE', color: 'text-primary' }
    if (score >= 6.5) return { text: 'BOM', color: 'text-accent' }
    if (score >= 5) return { text: 'REGULAR', color: 'text-muted-foreground' }
    return { text: 'RUIM', color: 'text-destructive' }
  }

  const getCrowdMessage = (crowd: string) => {
    if (crowd === 'Vazio') return 'Água tranquila, quase ninguém'
    if (crowd === 'Pouca gente') return 'Bom momento para surfar'
    return 'Mar bom atrai galera'
  }

  const quality = getScoreQuality(spot.score)

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
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{spot.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">{spot.region} da Ilha</Badge>
                <Badge variant="secondary" className="text-sm">{spot.level}</Badge>
              </div>
            </div>
            <div className="text-center bg-card rounded-xl p-6 border shadow-sm">
              <div className={`text-5xl font-bold ${quality.color}`}>
                {Number(spot.score).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Score AI</div>
              <div className={`text-xs font-semibold mt-2 ${quality.color}`}>{quality.text}</div>
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
                      <div className="text-lg font-semibold">{Number(spot.tideHeight).toFixed(1)}m</div>
                    </div>
                  </div>
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
            </div>

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

            {spot.score < 5 && (
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
                    {forecast.map((day, index) => (
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
                          <div className="text-2xl font-bold text-primary">{Number(day.score).toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">{day.condition}</div>
                        </div>
                      </div>
                    ))}
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
