import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { SpotCard } from '@/components/surf/SpotCard'
import { RegionFilter } from '@/components/surf/RegionFilter'
import { getCurrentConditions, getTopSpots, getSpotsByRegion, analyzeConditions, BeachCondition } from '@/lib/surfData'
import { Waves, TrendingUp, MapPin, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Home() {
  const [activeRegion, setActiveRegion] = useState<string>('all')
  const [spots, setSpots] = useState<BeachCondition[]>([])
  const [topSpot, setTopSpot] = useState<BeachCondition | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const updateData = () => {
      setCurrentTime(new Date())

      if (activeRegion === 'all') {
        setSpots(getCurrentConditions())
      } else {
        setSpots(getSpotsByRegion(activeRegion as BeachCondition['region']))
      }

      const top = getTopSpots(1)[0]
      setTopSpot(top)
    }

    updateData()

    // Atualizar a cada minuto
    const interval = setInterval(updateData, 60000)
    return () => clearInterval(interval)
  }, [activeRegion])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Waves className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Surf IA</h1>
                <p className="text-xs text-muted-foreground">Florianópolis, SC</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Atualização em tempo real */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Atualizado às {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Melhor Pico Agora */}
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
                  <div className="text-4xl font-bold text-primary">{topSpot.score.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Score IA</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Ondas</div>
                  <div className="text-lg font-semibold">{topSpot.waveHeight}m</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Período</div>
                  <div className="text-lg font-semibold">{topSpot.swellPeriod}s</div>
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

        {/* Info sobre IA */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            A Inteligência Artificial analisa vento, swell, maré, batimetria e orientação das praias para indicar onde está melhor para surfar agora.
          </AlertDescription>
        </Alert>

        {/* Filtro de Região */}
        <div>
          <h2 className="text-xl font-bold mb-4">Todas as Praias</h2>
          <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />
        </div>

        {/* Lista de Spots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>

        {spots.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma praia encontrada nesta região.</p>
          </div>
        )}
      </main>
    </div>
  )
}
