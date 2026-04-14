import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Waves, Zap, Bell, BarChart3, Clock, Shield,
  ArrowRight, CheckCircle2, Wind, Droplets, TrendingUp,
  MapPin, Crown, ChevronRight
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Score de IA em tempo real',
    desc: 'Inteligência artificial analisa altura, período, vento e maré para gerar uma nota de 0 a 10 para cada praia.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: MapPin,
    title: '17 praias monitoradas',
    desc: 'Cobertura completa de Florianópolis — do Santinho ao Naufragados, todas as 4 regiões da ilha.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Previsão de 14 dias',
    desc: 'Planeje seus surfs com antecedência. Dados de ondas, vento e maré para as próximas 2 semanas.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Bell,
    title: 'Alertas personalizados',
    desc: 'Seja notificado quando o seu spot favorito atingir o score que você definiu.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: Clock,
    title: 'Histórico e tendências',
    desc: 'Veja como eram as condições nos últimos dias e identifique os melhores padrões de swell.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Waves,
    title: 'Log de sessões',
    desc: 'Registre suas sessões, dê notas, anote memórias. Seu diário de surf digital completo.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
]

const PREMIUM_BENEFITS = [
  { icon: BarChart3, title: 'Previsão 14 dias', desc: 'Veja as condições dos próximos 14 dias' },
  { icon: Bell, title: 'Alertas de ondas', desc: 'Notificações quando seu spot estiver perfeito' },
  { icon: TrendingUp, title: 'Histórico completo', desc: 'Consulte como estava o mar nos últimos 7 dias' },
  { icon: Shield, title: 'Sem anúncios', desc: 'Experiência limpa, sem interrupções' },
  { icon: Crown, title: 'Badge Premium', desc: 'Selo exclusivo de surfista premium no perfil' },
  { icon: Zap, title: 'Acesso antecipado', desc: 'Seja o primeiro a testar novos recursos' },
]

const STATS = [
  { value: '17', label: 'Praias monitoradas' },
  { value: '24/7', label: 'Atualização contínua' },
  { value: 'IA', label: 'Score inteligente' },
  { value: '4', label: 'Regiões da ilha' },
]

function ScoreCard({ beach, score, condition, wave }: { beach: string; score: number; condition: string; wave: string }) {
  const color = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-orange-400'
  const bg = score >= 8 ? 'bg-green-400/10 border-green-400/20' : score >= 6 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-orange-400/10 border-orange-400/20'
  return (
    <div className={`rounded-2xl border p-4 ${bg} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">{beach}</span>
        <div className={`text-2xl font-black ${color}`}>{score}</div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Waves className="h-3 w-3" />{wave}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3" />{condition}
        </span>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <span className="font-black text-lg tracking-tight">Surf AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Entrar</Button>
            <Button size="sm" onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary/90">
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Glow bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.6 0.16 200 / 0.15), transparent)',
          }}
        />

        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
              <Zap className="h-3 w-3 mr-1.5 fill-current" />
              Powered by Inteligência Artificial
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              O surf de{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.75 0.16 200), oklch(0.55 0.18 220))' }}
              >
                Florianópolis
              </span>
              <br />na palma da mão.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Score de IA em tempo real para 17 praias. Previsão de ondas, alertas personalizados
              e histórico completo — tudo que você precisa para não perder a melhor sessão.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => navigate('/login')}
                className="text-base font-bold px-8 h-12 bg-primary hover:bg-primary/90 shadow-lg"
                style={{ boxShadow: '0 0 32px oklch(0.6 0.16 200 / 0.35)' }}>
                Criar conta grátis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}
                className="text-base font-bold px-8 h-12 border-primary/30 hover:border-primary/60 hover:bg-primary/5">
                <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                Assinar Premium — R$ 29,90/mês
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Gratuito para sempre · Cancele quando quiser · Sem cartão para começar
            </p>
          </div>

          {/* App mockup cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <ScoreCard beach="Praia Mole" score={9} condition="NE 15km/h" wave="1.2m" />
            <ScoreCard beach="Joaquina" score={7} condition="S 12km/h" wave="0.9m" />
            <ScoreCard beach="Campeche" score={8} condition="E 10km/h" wave="1.0m" />
            <ScoreCard beach="Santinho" score={5} condition="NE 22km/h" wave="0.8m" />
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(0.6 0.16 200 / 0.3), transparent)' }} />
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-primary">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 mb-4">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Tudo que você precisa<br />para surfar mais e melhor.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Construído por surfistas, para surfistas. Dados reais, análise inteligente, decisão rápida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-300"
              >
                <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAVE SEPARATOR */}
      <div className="relative h-24 overflow-hidden">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
          style={{ fill: 'oklch(0.6 0.16 200 / 0.05)' }}>
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" />
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
          style={{ fill: 'oklch(0.6 0.16 200 / 0.03)', transform: 'translateX(50px)' }}>
          <path d="M0,40 C400,100 800,10 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* PREMIUM */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.55 0.18 60 / 0.05), transparent)',
          }}
        />

        <div className="container mx-auto px-4 max-w-4xl relative">
          <div className="text-center mb-14">
            <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 mb-4">
              <Crown className="h-3 w-3 mr-1.5" />
              Premium
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Leve seu surf ao<br />
              <span className="text-yellow-400">próximo nível.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Por menos que uma garrafa de Gatorade por dia — acesse todas as ferramentas
              de um surfista de alto nível.
            </p>
          </div>

          <div
            className="rounded-3xl border border-yellow-500/20 p-8 md:p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, oklch(0.2 0.02 240), oklch(0.22 0.04 220))' }}
          >
            {/* Glow corner */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, oklch(0.6 0.16 60 / 0.12), transparent)' }}
            />

            <div className="grid md:grid-cols-2 gap-10 items-center relative">
              <div className="space-y-6">
                <div className="space-y-3">
                  {PREMIUM_BENEFITS.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{title}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center md:text-right space-y-6">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Apenas</div>
                  <div className="flex items-end justify-center md:justify-end gap-1">
                    <span className="text-6xl font-black text-yellow-400">29</span>
                    <div className="mb-2">
                      <div className="text-xl font-bold text-yellow-400">,90</div>
                      <div className="text-xs text-muted-foreground">R$/mês</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Cancele quando quiser</div>
                </div>

                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full md:w-auto font-bold px-10 h-13 text-base"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.7 0.18 60), oklch(0.6 0.22 50))',
                    color: 'oklch(0.1 0.02 240)',
                    boxShadow: '0 0 32px oklch(0.6 0.18 60 / 0.4)',
                  }}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar Premium agora
                </Button>

                <div className="flex items-center justify-center md:justify-end gap-4 text-xs text-muted-foreground">
                  {['Pagamento seguro', 'Sem fidelidade', 'Suporte prioritário'].map(t => (
                    <span key={t} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Como funciona?</h2>
            <p className="text-muted-foreground">Em menos de 1 minuto você já sabe se vale a pena ir surfar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Droplets,
                title: 'Dados em tempo real',
                desc: 'Coletamos dados de ondas, vento e maré de múltiplas fontes meteorológicas a cada hora.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'IA calcula o score',
                desc: 'Nossa IA analisa todos os parâmetros e gera uma nota de 0 a 10 considerando o seu nível.',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Você decide em segundos',
                desc: 'Veja o score, compare praias e tome a melhor decisão — sem desperdício de tempo ou gasolina.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="rounded-2xl border border-border/50 bg-card/40 p-6 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl font-black text-primary/20 leading-none">{step}</div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                {step !== '03' && (
                  <ChevronRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div
            className="rounded-3xl p-12 border border-primary/20"
            style={{
              background: 'linear-gradient(135deg, oklch(0.2 0.04 220 / 0.8), oklch(0.18 0.06 210 / 0.8))',
              boxShadow: '0 0 80px oklch(0.6 0.16 200 / 0.1)',
            }}
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Waves className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Pronto para surfar<br />com inteligência?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Crie sua conta grátis agora e nunca mais chegue na praia com o mar ruim.
              Upgrade para Premium quando quiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/login')}
                className="font-bold px-10 h-12 text-base bg-primary hover:bg-primary/90"
                style={{ boxShadow: '0 0 32px oklch(0.6 0.16 200 / 0.4)' }}>
                Criar conta gratuita
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6">
              {['Grátis para sempre', 'Sem cartão', 'Setup em 1 min'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Waves className="h-4 w-4 text-primary" />
            </div>
            <span className="font-black text-sm">Surf AI</span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Florianópolis, SC · Dados atualizados a cada hora · Feito com 🤙 para surfistas
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </button>
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}
              className="text-xs border-primary/30 hover:bg-primary/5">
              Começar grátis
            </Button>
          </div>
        </div>
      </footer>

    </div>
  )
}
