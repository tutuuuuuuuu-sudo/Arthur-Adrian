import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSpotById, analyzeConditions } from '@/lib/surfData'
import { getWeatherForecast } from '@/lib/weatherData'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import {
  ArrowLeft, Waves, Wind, Navigation, Clock, Users,
  TrendingUp, Compass, AlertCircle, Thermometer, MapPin,
  Video, Heart, Calendar
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function SpotDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const spot = id ? getSpotById(id) : null
  const [favorite, setFavorite] = useState(false)
  const [loadingFav, setLoadingFav] = useState(true)

  useEffect(() => {
    if (id) {
      isFavorite(id).then(val => {
        setFavorite(val)
        setLoadingFav(false)
      })
    }
  }, [id])

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

  const forecast = getWeatherForecast(spot.id)

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
            <TabsT
              
