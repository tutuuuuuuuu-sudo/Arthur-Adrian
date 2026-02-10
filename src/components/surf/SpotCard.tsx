import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BeachCondition } from '@/lib/surfData'
import { Waves, Wind, Clock, Users, Thermometer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SpotCardProps {
  spot: BeachCondition
}

export function SpotCard({ spot }: SpotCardProps) {
  const navigate = useNavigate()

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-primary font-bold'
    if (score >= 6.5) return 'text-accent font-semibold'
    if (score >= 5) return 'text-muted-foreground'
    return 'text-destructive'
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Iniciante':
        return 'bg-chart-2/20 text-chart-2 border-chart-2/30'
      case 'Intermediário':
        return 'bg-accent/20 text-accent border-accent/30'
      case 'Avançado':
        return 'bg-primary/20 text-primary border-primary/30'
      default:
        return 'bg-muted'
    }
  }

  const getCrowdColor = (crowd: string) => {
    switch (crowd) {
      case 'Vazio':
        return 'bg-chart-2/20 text-chart-2'
      case 'Pouca gente':
        return 'bg-accent/20 text-accent'
      case 'Cheio':
        return 'bg-destructive/20 text-destructive'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/spot/${spot.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{spot.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {spot.region}
            </Badge>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(spot.score)}`}>
              {spot.score.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold">{spot.waveHeight}m</div>
              <div className="text-xs text-muted-foreground">Altura</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-accent" />
            <div>
              <div className="text-sm font-semibold">{spot.windSpeed}km/h</div>
              <div className="text-xs text-muted-foreground">{spot.windDirection}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
          <Thermometer className="h-4 w-4 text-chart-2" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">{spot.waterConditions.temperature}°C</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{spot.waterConditions.wetsuit.thickness}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
          <Clock className="h-3.5 w-3.5" />
          <span>{spot.bestTimeWindow}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getLevelColor(spot.level)} variant="outline">
            {spot.level}
          </Badge>
          <Badge className={getCrowdColor(spot.crowdLevel)} variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {spot.crowdLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
