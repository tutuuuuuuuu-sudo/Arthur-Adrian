import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Waves, Zap, Bell, BarChart3, Clock, Shield,
  ArrowRight, CheckCircle2, Wind, Droplets, TrendingUp,
  MapPin, Crown, ChevronRight, ChevronDown, X, Check,
  Star, Quote
} from 'lucide-react'

// ─── Dados ───────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Zap, title: 'Score de IA em tempo real', desc: 'Inteligência artificial analisa altura, período, vento e maré para gerar uma nota de 0 a 10 para cada praia.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: MapPin, title: '17 praias monitoradas', desc: 'Cobertura completa de Florianópolis — do Santinho ao Naufragados, todas as 4 regiões da ilha.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: BarChart3, title: 'Previsão de 14 dias', desc: 'Planeje seus surfs com antecedência. Dados de ondas, vento e maré para as próximas 2 semanas.', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { icon: Bell, title: 'Alertas personalizados', desc: 'Seja notificado quando o seu spot favorito atingir o score que você definiu.', color: 'text-green-400', bg: 'bg-green-400/10' },
  { icon: Clock, title: 'Histórico e tendências', desc: 'Veja como eram as condições nos últimos dias e identifique os melhores padrões de swell.', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { icon: Waves, title: 'Log de sessões', desc: 'Registre suas sessões, dê notas, anote memórias. Seu diário de surf digital completo.', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
]

const TESTIMONIALS = [
  { name: 'Lucas T.', role: 'Intermediário · mora em Coqueiros', avatar: 'LT', stars: 5, text: 'Ontem o score da Joaquina estava 8.2 às 7h da manhã. Fui, e estava perfeito — 1m, período de 12s, sem ninguém. Antes eu ia na sorte. Agora eu só vou quando vale.' },
  { name: 'Ana F.', role: 'Iniciante · aprendendo em Moçambique', avatar: 'AF', stars: 5, text: 'O app identificou que sou iniciante e começou a mostrar "Ideal para você" nas praias com mar calmo. Isso mudou tudo — finalmente parei de ir na praia errada pro meu nível.' },
  { name: 'Bruno M.', role: 'Avançado · frequenta o Campeche e Mole', avatar: 'BM', stars: 5, text: 'Usei a previsão de 14 dias pra planejar uma semana de folga do trabalho. Acertou 5 dos 6 dias. O dia que errou foi por frente fria imprevista — isso não tem app que segure.' },
]

const PLAN_FEATURES = [
  { label: 'Score de IA em tempo real', free: true, premium: true },
  { label: '17 praias monitoradas', free: true, premium: true },
  { label: 'Favoritos e comparação', free: true, premium: true },
  { label: 'Log de sessões', free: true, premium: true },
  { label: 'Previsão de ondas', free: '3 dias', premium: '14 dias' },
  { label: 'Histórico de condições', free: false, premium: true },
  { label: 'Alertas de ondas push', free: false, premium: true },
  { label: 'Navegação até a praia', free: false, premium: true },
  { label: 'Badge Premium no perfil', free: false, premium: true },
  { label: 'Experiência sem anúncios', free: false, premium: true },
  { label: 'Acesso antecipado a recursos', free: false, premium: true },
]

const FAQS = [
  { q: 'O app funciona para todas as praias de Florianópolis?', a: 'Sim! Monitoramos 17 praias distribuídas pelas 4 regiões da ilha: Norte, Leste, Centro e Sul. Cobrimos desde o Santinho até o Naufragados, passando por Praia Mole, Joaquina, Campeche e muito mais.' },
  { q: 'Os dados são atualizados com que frequência?', a: 'Os dados de ondas, vento e maré são atualizados a cada hora, 24 horas por dia, 7 dias por semana. O score de IA é recalculado automaticamente a cada nova atualização.' },
  { q: 'O plano gratuito tem alguma limitação?', a: 'No plano gratuito você tem acesso ao score de IA em tempo real, previsão para os próximos 3 dias, favoritos, log de sessões e comparação de praias. Para previsão de 14 dias, alertas push, histórico completo e navegação, é necessário o Premium.' },
  { q: 'Posso cancelar o Premium quando quiser?', a: 'Sim, sem multa e sem burocracia. Você pode cancelar a qualquer momento pelo próprio app. O acesso Premium continua até o fim do período pago.' },
  { q: 'Como funciona o score de IA?', a: 'Nossa IA analisa múltiplas variáveis em conjunto: altura e período das ondas, direção e intensidade do vento, fase da maré, swell predominante e histórico da praia. O resultado é uma nota de 0 a 10 que representa a qualidade real das condições para surfar.' },
  { q: 'O app funciona no iPhone e no Android?', a: 'Sim! O Surf AI é um Progressive Web App (PWA), ou seja, funciona diretamente no navegador do seu celular, sem precisar baixar nada na loja. Adicione à tela inicial e use como um app nativo.' },
]

const STATS = [
  { value: 17, suffix: '', label: 'Praias monitoradas' },
  { value: 24, suffix: '/7', label: 'Atualização contínua' },
  { value: 14, suffix: ' dias', label: 'Previsão Premium' },
  { value: 4, suffix: '', label: 'Regiões da ilha' },
]

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const MOCK_SPOTS = [
  { beach: 'Praia Mole',  score: 9.1, wave: '1.2m', wind: 'NE 12km/h', period: '13s', color: '#8b5cf6', label: 'ÉPICO' },
  { beach: 'Joaquina',    score: 7.8, wave: '1.0m', wind: 'E 15km/h',  period: '11s', color: '#06b6d4', label: 'EXCELENTE' },
  { beach: 'Campeche',    score: 6.5, wave: '0.8m', wind: 'S 18km/h',  period: '10s', color: '#22c55e', label: 'BOM' },
  { beach: 'Santinho',    score: 4.2, wave: '0.6m', wind: 'NE 25km/h', period: '7s',  color: '#f59e0b', label: 'REGULAR' },
]

function AppMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260, height: 520 }}>
      {/* Brilho atrás do celular */}
      <div className="absolute inset-0 rounded-[40px] blur-2xl opacity-20"
        style={{ background: 'oklch(0.6 0.16 200)' }} />

      {/* Frame do celular */}
      <div className="relative w-full h-full rounded-[36px] border-[3px] overflow-hidden shadow-2xl"
        style={{ borderColor: 'oklch(0.35 0.04 240)', background: 'oklch(0.15 0.02 240)' }}>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl z-10"
          style={{ background: 'oklch(0.12 0.02 240)' }} />

        {/* Tela do app */}
        <div className="h-full overflow-hidden pt-5"
          style={{ background: 'oklch(0.15 0.02 240)' }}>

          {/* Header */}
          <div className="px-3 pt-2 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full flex items-center justify-center"
                style={{ background: 'oklch(0.6 0.16 200 / 0.2)' }}>
                <Waves className="h-3.5 w-3.5" style={{ color: 'oklch(0.6 0.16 200)' }} />
              </div>
              <div>
                <div className="text-[11px] font-black text-white leading-none">Surf AI</div>
                <div className="text-[8px]" style={{ color: 'oklch(0.6 0.02 220)' }}>Florianópolis</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: 'oklch(0.6 0.16 200)' }} />
              <span className="text-[8px]" style={{ color: 'oklch(0.6 0.02 220)' }}>ao vivo</span>
            </div>
          </div>

          {/* Card do melhor pico */}
          <div className="mx-3 mb-2 rounded-xl p-3"
            style={{ background: 'oklch(0.8 0.18 290 / 0.12)', border: '1px solid oklch(0.8 0.18 290 / 0.25)' }}>
            <div className="text-[9px] font-semibold mb-1" style={{ color: 'oklch(0.6 0.16 200)' }}>
              Melhor pico agora
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-black text-white">Praia Mole</div>
                <div className="text-[9px]" style={{ color: 'oklch(0.6 0.02 220)' }}>Norte da Ilha · 1.2m · 13s</div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-black leading-none" style={{ color: '#8b5cf6' }}>9.1</div>
                <div className="text-[8px] font-bold" style={{ color: '#8b5cf6' }}>ÉPICO</div>
              </div>
            </div>
          </div>

          {/* Lista de praias */}
          <div className="px-3 mb-1">
            <div className="text-[9px] font-semibold mb-1.5" style={{ color: 'oklch(0.6 0.02 220)' }}>
              Todas as praias
            </div>
            <div className="space-y-1.5">
              {MOCK_SPOTS.map(spot => (
                <div key={spot.beach} className="flex items-center justify-between rounded-lg px-2.5 py-2"
                  style={{ background: 'oklch(0.2 0.02 240)', border: '1px solid oklch(0.3 0.03 240)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-white truncate">{spot.beach}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[8px]" style={{ color: 'oklch(0.6 0.02 220)' }}>
                        <Waves className="h-2 w-2" />{spot.wave}
                      </span>
                      <span className="flex items-center gap-0.5 text-[8px]" style={{ color: 'oklch(0.6 0.02 220)' }}>
                        <Wind className="h-2 w-2" />{spot.wind}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-[14px] font-black leading-none" style={{ color: spot.color }}>
                      {spot.score}
                    </div>
                    <div className="text-[7px] font-bold" style={{ color: spot.color }}>{spot.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge flutuante de "ao vivo" */}
      <div className="absolute -right-3 top-24 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg flex items-center gap-1.5"
        style={{ background: 'oklch(0.2 0.02 240)', border: '1px solid oklch(0.3 0.03 240)', color: 'white' }}>
        <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
        Tempo real
      </div>

      {/* Badge flutuante de "IA" */}
      <div className="absolute -left-3 bottom-32 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg"
        style={{ background: 'oklch(0.6 0.16 200)', color: 'white' }}>
        Score IA
      </div>
    </div>
  )
}

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1200
        const steps = 40
        const increment = value / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= value) { setCount(value); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, duration / steps)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return <div ref={ref} className="text-4xl md:text-5xl font-black text-primary">{count}{suffix}</div>
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-card/60 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
            {a}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-green-400 mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  return <span className="text-xs font-semibold text-primary">{value}</span>
}

// ─── Página principal ─────────────────────────────────────────────────────────

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

      {/* URGENCY BANNER */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-4 text-center">
        <p className="text-xs text-yellow-400 font-semibold">
          Lançamento — <span className="font-black">R$ 29,90/mês</span> · Menos de R$1 por dia · Cancele quando quiser · Sem cartão para começar
        </p>
      </div>

      {/* HERO */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.6 0.16 200 / 0.15), transparent)' }} />

        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide">
              <Zap className="h-3 w-3 mr-1.5 fill-current" />
              Powered by Inteligência Artificial
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              O surf de{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, oklch(0.75 0.16 200), oklch(0.55 0.18 220))' }}>
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
                className="text-base font-bold px-8 h-12 bg-primary hover:bg-primary/90"
                style={{ boxShadow: '0 0 32px oklch(0.6 0.16 200 / 0.35)' }}>
                Criar conta grátis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login?plan=premium')}
                className="text-base font-bold px-8 h-12 border-yellow-500/40 hover:border-yellow-500/70 hover:bg-yellow-500/5">
                <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                Assinar Premium — R$ 29,90/mês
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Gratuito para sempre · Cancele quando quiser · Sem cartão para começar
            </p>
          </div>

          <div className="mt-16 flex justify-center">
            <AppMockup />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(0.6 0.16 200 / 0.3), transparent)' }} />
        </div>
      </section>

      {/* STATS ANIMADOS */}
      <section className="py-12 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <AnimatedNumber value={value} suffix={suffix} />
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
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Tudo que você precisa<br />para surfar mais e melhor.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Construído por surfistas, para surfistas. Dados reais, análise inteligente, decisão rápida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card transition-all duration-300">
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

      {/* DEPOIMENTOS */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 mb-4">Depoimentos</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Quem surfa com o Surf AI<br />não volta atrás.
            </h2>
            <p className="text-muted-foreground">Veja o que os surfistas de Floripa estão dizendo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, avatar, stars, text }) => (
              <div key={name}
                className="rounded-2xl border border-border/50 bg-card/50 p-6 flex flex-col gap-4 hover:border-primary/20 transition-colors">
                <Quote className="h-6 w-6 text-primary/30" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{text}"</p>
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{name}</div>
                      <div className="text-xs text-muted-foreground">{role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAVE SEPARATOR */}
      <div className="relative h-20 overflow-hidden">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
          style={{ fill: 'oklch(0.6 0.16 200 / 0.05)' }}>
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* COMPARATIVO PLANOS */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 mb-4">Planos</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Grátis ou Premium?</h2>
            <p className="text-muted-foreground">Compare e veja o quanto você está deixando na mesa.</p>
          </div>

          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-card/80 border-b border-border/50">
              <div className="p-4 text-sm font-semibold text-muted-foreground">Recurso</div>
              <div className="p-4 text-center border-l border-border/50">
                <div className="text-sm font-bold">Grátis</div>
                <div className="text-xs text-muted-foreground">R$ 0</div>
              </div>
              <div className="p-4 text-center border-l border-border/50"
                style={{ background: 'oklch(0.6 0.16 200 / 0.08)' }}>
                <div className="text-sm font-bold text-primary flex items-center justify-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-yellow-400" />Premium
                </div>
                <div className="text-xs text-yellow-400 font-semibold">R$ 29,90/mês</div>
              </div>
            </div>

            {/* Rows */}
            {PLAN_FEATURES.map(({ label, free, premium }, i) => (
              <div key={label}
                className={`grid grid-cols-3 border-b border-border/30 last:border-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-card/30'}`}>
                <div className="p-4 text-sm text-muted-foreground">{label}</div>
                <div className="p-4 text-center border-l border-border/30 flex items-center justify-center">
                  <PlanCell value={free} />
                </div>
                <div className="p-4 text-center border-l border-border/30 flex items-center justify-center"
                  style={{ background: 'oklch(0.6 0.16 200 / 0.04)' }}>
                  <PlanCell value={premium} />
                </div>
              </div>
            ))}

            {/* Footer CTA */}
            <div className="grid grid-cols-3 bg-card/60 border-t border-border/50">
              <div className="p-4" />
              <div className="p-4 text-center border-l border-border/50">
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate('/login')}>
                  Criar conta
                </Button>
              </div>
              <div className="p-4 text-center border-l border-border/50">
                <Button size="sm" className="w-full text-xs bg-primary hover:bg-primary/90" onClick={() => navigate('/login?plan=premium')}
                  style={{ boxShadow: '0 0 16px oklch(0.6 0.16 200 / 0.3)' }}>
                  <Crown className="h-3 w-3 mr-1" />
                  Assinar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM PRICING */}
      <section className="py-20 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.55 0.18 60 / 0.05), transparent)' }} />

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

          <div className="rounded-3xl border border-yellow-500/20 p-8 md:p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, oklch(0.2 0.02 240), oklch(0.22 0.04 220))' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, oklch(0.6 0.16 60 / 0.12), transparent)' }} />

            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold text-yellow-400">Oferta de lançamento — preço especial</span>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center relative">
              <div className="space-y-3">
                {[
                  { icon: BarChart3, title: 'Previsão 14 dias', desc: 'Veja as condições dos próximos 14 dias' },
                  { icon: Bell, title: 'Alertas de ondas', desc: 'Notificações quando seu spot estiver perfeito' },
                  { icon: TrendingUp, title: 'Histórico completo', desc: 'Consulte como estava o mar nos últimos 7 dias' },
                  { icon: Shield, title: 'Sem anúncios', desc: 'Experiência limpa, sem interrupções' },
                  { icon: Crown, title: 'Badge Premium', desc: 'Selo exclusivo de surfista premium no perfil' },
                  { icon: Zap, title: 'Acesso antecipado', desc: 'Seja o primeiro a testar novos recursos' },
                ].map(({ icon: Icon, title, desc }) => (
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

                <Button size="lg" onClick={() => navigate('/login?plan=premium')}
                  className="w-full font-bold px-10 h-12 text-base"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.7 0.18 60), oklch(0.6 0.22 50))',
                    color: 'oklch(0.1 0.02 240)',
                    boxShadow: '0 0 32px oklch(0.6 0.18 60 / 0.4)',
                  }}>
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar Premium agora
                </Button>

                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs text-muted-foreground">
                  {['Pagamento seguro', 'Sem fidelidade', 'Suporte prioritário'].map(t => (
                    <span key={t} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Como funciona?</h2>
            <p className="text-muted-foreground">Em menos de 1 minuto você já sabe se vale a pena ir surfar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Droplets, title: 'Dados em tempo real', desc: 'Coletamos dados de ondas, vento e maré de múltiplas fontes meteorológicas a cada hora.' },
              { step: '02', icon: Zap, title: 'IA calcula o score', desc: 'Nossa IA analisa todos os parâmetros e gera uma nota de 0 a 10 considerando o seu nível.' },
              { step: '03', icon: TrendingUp, title: 'Você decide em segundos', desc: 'Veja o score, compare praias e tome a melhor decisão — sem desperdício de tempo ou gasolina.' },
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

      {/* FAQ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Perguntas frequentes</h2>
            <p className="text-muted-foreground">Tudo que você precisa saber antes de começar.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="rounded-3xl p-12 border border-primary/20"
            style={{
              background: 'linear-gradient(135deg, oklch(0.2 0.04 220 / 0.8), oklch(0.18 0.06 210 / 0.8))',
              boxShadow: '0 0 80px oklch(0.6 0.16 200 / 0.1)',
            }}>
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
            <Button size="lg" onClick={() => navigate('/login')}
              className="font-bold px-10 h-12 text-base bg-primary hover:bg-primary/90"
              style={{ boxShadow: '0 0 32px oklch(0.6 0.16 200 / 0.4)' }}>
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <div className="flex items-center justify-center gap-6 mt-6">
              {['Grátis para sempre', 'Sem cartão', 'Setup em 1 min'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />{t}
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
            <button onClick={() => navigate('/login')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Entrar</button>
            <Button size="sm" variant="outline" onClick={() => navigate('/login')} className="text-xs border-primary/30 hover:bg-primary/5">
              Começar grátis
            </Button>
          </div>
        </div>
      </footer>

    </div>
  )
}
