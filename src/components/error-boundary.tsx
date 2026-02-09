import React, { Component, type ErrorInfo } from "react"
import { AlertTriangle, FileWarning, Terminal, RefreshCw, XCircle, Code, ShieldAlert, Layers, FileCode, ClipboardCopy, Check, Send, KeyRound, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Props {
  children: React.ReactNode
}

interface ViteError {
  message: string
  stack: string
  id: string
  frame: string
  loc?: {
    file?: string
    line: number
    column: number
  }
  plugin?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  viteError: ViteError | null
  isCopied: boolean
  isSending: boolean
}

type ErrorType = 'syntax' | 'env' | 'network' | 'runtime' | 'aggregate' | 'unknown'

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      viteError: null,
      isCopied: false,
      isSending: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidMount() {
    // Escuta erros de compilação do Vite
    window.addEventListener('vite:error', this.handleViteError as EventListener)
    
    // Captura erros de event handlers (síncronos)
    window.addEventListener('error', this.handleGlobalError)

    // Captura erros de carregamento de recursos (img, script, css) - fase de captura
    window.addEventListener('error', this.handleResourceError, true)
    
    // Captura erros de promises não tratadas (assíncronos)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('vite:error', this.handleViteError as EventListener)
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('error', this.handleResourceError, true)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  handleViteError = (event: CustomEvent<ViteError>) => {
    // Recebe o erro detalhado do Vite e força a atualização do estado
    this.setState({ 
      hasError: true, 
      viteError: event.detail,
      // Se já temos um erro genérico (Failed to fetch...), esse erro do Vite é a causa raiz
      // e deve ter prioridade na exibição.
    })
  }

  handleResourceError = (event: Event) => {
    // Ignora erros de script (que são ErrorEvents e já tratados pelo handleGlobalError)
    if (event instanceof ErrorEvent) return

    const target = event.target as HTMLElement
    
    if (!target || !target.tagName) return
    
    const tagName = target.tagName.toUpperCase()
    const src = (target as any).src || (target as any).href || (target as any).data || 'unknown'
    
    // Recursos críticos que quebram a aplicação
    const criticalResources = ['SCRIPT', 'LINK']
    
    // Recursos de mídia que apenas logamos (não quebram a app)
    const mediaResources = ['IMG', 'VIDEO', 'AUDIO', 'SOURCE']
    
    // Recursos embarcados que podem ou não ser críticos
    const embeddedResources = ['IFRAME', 'EMBED', 'OBJECT']
    
    if (criticalResources.includes(tagName)) {
      // Erro crítico - quebra a aplicação
      const error = new Error(`Falha ao carregar recurso crítico (${tagName}): ${src}`)
      this.setState({
        hasError: true,
        error,
        errorInfo: null
      })
    } else if (mediaResources.includes(tagName)) {
      // Apenas aviso - não quebra a aplicação
      console.warn(`Falha ao carregar mídia (${tagName}): ${src}`)
    } else if (embeddedResources.includes(tagName)) {
      // Aviso mais específico para conteúdo embarcado
      console.warn(`Falha ao carregar conteúdo embarcado (${tagName}): ${src}`)
    } else {
      // Qualquer outro tipo de recurso
      console.warn(`Falha ao carregar recurso (${tagName}): ${src}`)
    }
  }

  handleGlobalError = (event: ErrorEvent) => {
    // Captura erros síncronos de event handlers
    console.error("Global error:", event.error)
    
    // Previne o erro de aparecer no console novamente
    event.preventDefault()
    
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: null
    })
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Captura erros de promises não tratadas
    console.error("Unhandled promise rejection:", event.reason)
    
    // Previne o erro de aparecer no console novamente
    event.preventDefault()
    
    // Garante que o reason é um Error
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    this.setState({
      hasError: true,
      error,
      errorInfo: null
    })
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  // Extrair TODAS as variáveis de ambiente do erro
  extractAllEnvVarNames(error: Error): string[] {
    const message = error.message;
    const allVars = new Set<string>();
    
    // Padrões comuns de variáveis de ambiente
    const patterns = [
      /NEXT_PUBLIC_[A-Z0-9_]+/g,
      /VITE_[A-Z0-9_]+/g,
      /REACT_APP_[A-Z0-9_]+/g,
      /[A-Z_]+_(URL|KEY|SECRET|TOKEN|ID|API_KEY|ENDPOINT)/g,
      /import\.meta\.env\.([A-Z0-9_]+)/g,
      /process\.env\.([A-Z0-9_]+)/g,
    ];
    
    for (const pattern of patterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        // Se o match veio de import.meta.env ou process.env, pegar o grupo de captura
        if (pattern.source.includes('import\\.meta\\.env') || pattern.source.includes('process\\.env')) {
          const fullMatch = match[0];
          const varName = fullMatch.split('.').pop();
          if (varName) allVars.add(varName);
        } else {
          allVars.add(match[0]);
        }
      }
    }
    
    return Array.from(allVars);
  }

  // Extrair nome da variável de ambiente do erro (compatibilidade - retorna a primeira)
  extractEnvVarName(error: Error): string | null {
    const vars = this.extractAllEnvVarNames(error);
    return vars.length > 0 ? vars[0] : null;
  }

  // Obter informações sobre onde conseguir a API key
  getApiKeyInfo(envVarName: string): { name: string; url: string; description: string } | null {
    const varLower = envVarName.toLowerCase();
    
    // OpenAI
    if (varLower.includes('openai')) {
      return {
        name: 'OpenAI',
        url: 'https://platform.openai.com/api-keys',
        description: 'Crie sua chave API no painel da OpenAI'
      };
    }
    
    // Anthropic / Claude
    if (varLower.includes('anthropic') || varLower.includes('claude')) {
      return {
        name: 'Anthropic',
        url: 'https://console.anthropic.com/settings/keys',
        description: 'Crie sua chave API no console da Anthropic'
      };
    }
    
    // Supabase
    if (varLower.includes('supabase')) {
      return {
        name: 'Supabase',
        url: 'https://supabase.com/dashboard/project/_/settings/api',
        description: 'Encontre suas chaves no dashboard do Supabase'
      };
    }
    
    // Google (Gemini, etc)
    if (varLower.includes('google') || varLower.includes('gemini')) {
      return {
        name: 'Google AI',
        url: 'https://aistudio.google.com/app/apikey',
        description: 'Crie sua chave API no Google AI Studio'
      };
    }
    
    // Stripe
    if (varLower.includes('stripe')) {
      return {
        name: 'Stripe',
        url: 'https://dashboard.stripe.com/apikeys',
        description: 'Encontre suas chaves no dashboard do Stripe'
      };
    }
    
    // GitHub
    if (varLower.includes('github')) {
      return {
        name: 'GitHub',
        url: 'https://github.com/settings/tokens',
        description: 'Crie um token de acesso pessoal no GitHub'
      };
    }
    
    // Vercel
    if (varLower.includes('vercel')) {
      return {
        name: 'Vercel',
        url: 'https://vercel.com/account/tokens',
        description: 'Crie um token no dashboard da Vercel'
      };
    }
    
    return null;
  }

  getErrorType(error: Error): ErrorType {
    if (this.state.viteError) return 'syntax' // Se tem erro do Vite, é sintaxe/compilação

    if (error instanceof AggregateError) {
      return 'aggregate'
    }

    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    const name = error.name

    // Erros de Ambiente / Configuração
    if (
      message.includes('env') || 
      message.includes('environment') || 
      message.includes('variable') ||
      message.includes('import.meta.env') ||
      message.includes('process.env') ||
      stack.includes('env')
    ) {
      return 'env'
    }

    // Erros de Sintaxe / Referência
    if (
      name === 'SyntaxError' || 
      name === 'ReferenceError' ||
      message.includes('is not defined') ||
      message.includes('unexpected token') ||
      message.includes('failed to fetch dynamically imported module') // Erro de sintaxe via Lazy Load
    ) {
      return 'syntax'
    }

    // Erros de Rede / Importação Dinâmica (Vite)
    if (
      message.includes('failed to fetch') || 
      message.includes('network request') ||
      message.includes('failed to load module') ||
      message.includes('falha ao carregar recurso') ||
      name === 'TypeError' && message.includes('fetch')
    ) {
      return 'network'
    }

    return 'runtime'
  }

  getErrorConfig(type: ErrorType) {
    switch (type) {
      case 'aggregate':
        return {
          title: 'Múltiplos Erros',
          description: 'Foram detectados vários erros críticos simultaneamente.',
          icon: Layers,
          color: 'text-purple-500',
          borderColor: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
        }
      case 'env':
        return {
          title: 'Erro de Configuração',
          description: 'Parece que há uma variável de ambiente faltando ou mal configurada.',
          icon: ShieldAlert,
          color: 'text-orange-500',
          borderColor: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
        }
      case 'syntax':
        return {
          title: 'Erro de Sintaxe',
          description: 'Um erro de sintaxe ou referência foi encontrado. O código não pôde ser compilado.',
          icon: Code,
          color: 'text-red-500',
          borderColor: 'border-red-200 bg-red-50 dark:bg-red-950/20'
        }
      case 'network':
        return {
          title: 'Erro de Conexão',
          description: 'Falha ao carregar recursos ou conectar com o servidor.',
          icon: FileWarning,
          color: 'text-blue-500',
          borderColor: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
        }
      default:
        return {
          title: 'Erro Inesperado',
          description: 'Ocorreu um erro durante a execução da aplicação.',
          icon: AlertTriangle,
          color: 'text-destructive',
          borderColor: 'border-destructive/50 bg-destructive/10'
        }
    }
  }

  // Limpar URLs da sandbox para mostrar apenas o caminho do arquivo
  cleanSandboxUrl = (message: string): string => {
    // Remove URLs da sandbox e mantém apenas o caminho do arquivo
    // Exemplo: https://8080-{uuid}-{token}.lasy.uk/src/App.tsx?t=123 -> src/App.tsx
    // Suporta tanto lasy.uk quanto lasy.app
    return message.replace(
      /https?:\/\/8080-[a-f0-9-]+-[a-zA-Z0-9_-]+\.lasy\.(uk|app)\//gi,
      ''
    ).replace(/\?t=\d+/g, '') // Remove timestamps
  }

  handleReset = () => {
    // Se for erro de Vite (sintaxe), reload pode não resolver se o código não mudar,
    // mas é a melhor ação disponível.
    window.location.reload()
  }

  getErrorText = () => {
    const { viteError, error, errorInfo } = this.state
    let textToCopy = ''

    if (viteError) {
      textToCopy = `Erro de Compilação (Vite):\n`
      textToCopy += `Mensagem: ${this.cleanSandboxUrl(viteError.message)}\n`
      if (viteError.loc) {
        textToCopy += `Arquivo: ${viteError.id}\nLinha: ${viteError.loc.line}, Coluna: ${viteError.loc.column}\n`
      }
      if (viteError.frame) {
        textToCopy += `\nTrecho do Código:\n${viteError.frame}\n`
      }
    } else if (error) {
      textToCopy = `Erro: ${this.cleanSandboxUrl(error.toString())}\n`
      
      if (error instanceof AggregateError) {
        textToCopy += `\nErros Agregados (${error.errors.length}):\n`
        error.errors.forEach((err, index) => {
          textToCopy += `\n--- Erro ${index + 1} ---\n${this.cleanSandboxUrl(err.toString())}\n`
        })
      }

      if (errorInfo && errorInfo.componentStack) {
        textToCopy += `\nComponent Stack:\n${this.cleanSandboxUrl(errorInfo.componentStack)}`
      }
      
      if (error.stack) {
        textToCopy += `\n\nStack Trace Original:\n${this.cleanSandboxUrl(error.stack)}`
      }
    }

    return textToCopy
  }

  getFormattedErrorMessage = (asMarkdown = true) => {
    // Determinar tipo de erro
    const { viteError, error } = this.state
    const errorType = this.getErrorType(error || new Error('Unknown'))
    const typeLabel = viteError ? 'Compilação' : 
                     errorType === 'syntax' ? 'Sintaxe' :
                     errorType === 'env' ? 'Configuração' :
                     errorType === 'network' ? 'Rede' :
                     errorType === 'aggregate' ? 'Múltiplos' : 'Runtime'
    
    let message = ''
    
    if (asMarkdown) {
      // Formato Markdown (para UI do chat)
      message = `**Erro na Preview:** ${this.cleanSandboxUrl(viteError ? viteError.message : (error?.message || 'Erro desconhecido'))}\n\n`
      message += `**Tipo:** \`${typeLabel}\`\n\n`
      
      // ✅ Tratar múltiplos erros (AggregateError)
      if (error instanceof AggregateError && error.errors.length > 0) {
        message += `**Erros Detectados (${error.errors.length}):**\n\n`
        error.errors.forEach((err, index) => {
          message += `**Erro ${index + 1}:**\n\`\`\`text\n${this.cleanSandboxUrl(err.toString())}\n\`\`\`\n\n`
        })
      } else if (viteError) {
        if (viteError.loc) {
          message += `**Localização:**\n- Arquivo: \`${viteError.id}\`\n- Linha: ${viteError.loc.line}, Coluna: ${viteError.loc.column}\n\n`
        }
        if (viteError.frame) {
          message += `**Trecho do Código:**\n\`\`\`typescript\n${viteError.frame}\n\`\`\`\n\n`
        }
      } else if (error?.stack) {
        const stackLines = this.cleanSandboxUrl(error.stack).split('\n').slice(0, 5).join('\n')
        message += `**Stack Trace:**\n\`\`\`text\n${stackLines}\n\`\`\`\n\n`
      }
      
      message += `**Instruções:**\n`
      message += `1. Revise o código e corrija o erro acima\n`
      message += `2. **Se você não souber que erro é esse, rode a build para obter mais detalhes**\n`
      message += `3. Verifique se todas as dependências estão instaladas corretamente\n`
    } else {
      // Formato Texto Plano (para copiar)
      message = `ERRO NA PREVIEW: ${this.cleanSandboxUrl(viteError ? viteError.message : (error?.message || 'Erro desconhecido'))}\n\n`
      message += `TIPO: ${typeLabel}\n\n`
      
      // ✅ Tratar múltiplos erros (AggregateError)
      if (error instanceof AggregateError && error.errors.length > 0) {
        message += `ERROS DETECTADOS (${error.errors.length}):\n\n`
        error.errors.forEach((err, index) => {
          message += `Erro ${index + 1}:\n${this.cleanSandboxUrl(err.toString())}\n\n`
        })
      } else if (viteError) {
        if (viteError.loc) {
          message += `LOCALIZAÇÃO:\n- Arquivo: ${viteError.id}\n- Linha: ${viteError.loc.line}, Coluna: ${viteError.loc.column}\n\n`
        }
        if (viteError.frame) {
          message += `TRECHO DO CÓDIGO:\n${viteError.frame}\n\n`
        }
      } else if (error?.stack) {
        const stackLines = this.cleanSandboxUrl(error.stack).split('\n').slice(0, 5).join('\n')
        message += `STACK TRACE:\n${stackLines}\n\n`
      }
      
      message += `INSTRUÇÕES:\n`
      message += `1. Revise o código e corrija o erro acima\n`
      message += `2. Se você não souber que erro é esse, rode a build para obter mais detalhes\n`
      message += `3. Verifique se todas as dependências estão instaladas corretamente\n`
    }
    
    return message
  }

  handleCopyError = async () => {
    const textToCopy = this.getFormattedErrorMessage(false) // ✅ Usa formato texto plano (sem markdown)

    if (!textToCopy) return

    try {
      // Tentar usar Clipboard API moderna
      await navigator.clipboard.writeText(textToCopy)
      this.setState({ isCopied: true })
      toast.success("Erro copiado!")
      setTimeout(() => this.setState({ isCopied: false }), 2000)
    } catch (clipboardError) {
      console.warn('Clipboard API falhou, tentando fallback:', clipboardError)
      
      // Fallback: criar textarea temporário
      try {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        textarea.style.pointerEvents = 'none'
        document.body.appendChild(textarea)
        textarea.select()
        
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (success) {
          this.setState({ isCopied: true })
          toast.success("Erro copiado!")
          setTimeout(() => this.setState({ isCopied: false }), 2000)
        } else {
          toast.error("Não foi possível copiar o erro")
        }
      } catch (fallbackError) {
        console.error('Fallback de cópia também falhou:', fallbackError)
        toast.error("Não foi possível copiar o erro")
      }
    }
  }

  handleSendToAI = () => {
    const errorText = this.getErrorText()
    
    if (!errorText) {
      toast.error("Nenhum erro para enviar")
      return
    }

    this.setState({ isSending: true })

    try {
      // ✅ Usa formato markdown para enviar para IA (renderiza card bonito)
      const message = this.getFormattedErrorMessage(true)
      
      window.parent.postMessage({
        type: 'send-error-to-ai',
        message: message
      }, '*')

      toast.success("Erro enviado para correção!")
      
      // Reset estado de erro após enviar (opcional)
      setTimeout(() => {
        this.setState({ 
          hasError: false,
          error: null,
          errorInfo: null,
          viteError: null,
          isSending: false
        })
      }, 1000)
    } catch (err) {
      console.error('Erro ao enviar para IA:', err)
      toast.error("Falha ao enviar erro")
      this.setState({ isSending: false })
    }
  }

  handleOpenEnvVars = () => {
    const error = this.state.error || new Error('Unknown Error')
    const envVarNames = this.extractAllEnvVarNames(error)
    
    try {
      // Enviar TODAS as variáveis para o modal pré-preencher
      window.parent.postMessage({
        type: 'open-env-vars',
        envVars: envVarNames // Array com todas as variáveis
      }, '*')
      
      toast.success("Abrindo gerenciador de variáveis...")
    } catch (err) {
      console.error('Erro ao abrir gerenciador:', err)
      toast.error("Falha ao abrir gerenciador")
    }
  }

  render() {
    // Se tiver erro do Vite OU erro normal capturado
    if (this.state.hasError) {
      const error = this.state.error || new Error('Unknown Error')
      const errorType = this.getErrorType(error)
      const config = this.getErrorConfig(errorType)
      const Icon = config.icon
      const isAggregate = errorType === 'aggregate'
      const viteError = this.state.viteError
      const isEnvError = errorType === 'env'
      const envVarNames = isEnvError ? this.extractAllEnvVarNames(error) : []
      const hasMultipleEnvVars = envVarNames.length > 1
      
      // Limpar mensagens de erro das URLs da sandbox
      const cleanErrorMessage = (msg: string) => this.cleanSandboxUrl(msg)

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-xl shadow-lg border-muted">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <CardTitle className="text-base">{config.title}</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 px-4 py-3">
              {/* ✅ ERRO DE ENV: UI compacta e amigável */}
              {isEnvError && envVarNames.length > 0 ? (
                <>
                  {/* Card único com todas as informações */}
                  <div className="rounded-lg border border-muted bg-muted/30 p-4 space-y-3">
                    {/* Mensagem */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {hasMultipleEnvVars 
                        ? 'Sua aplicação precisa de algumas chaves de acesso para funcionar.'
                        : 'Sua aplicação precisa de uma chave de acesso para funcionar.'}
                    </p>

                    {/* Variáveis necessárias */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {hasMultipleEnvVars ? 'Variáveis necessárias:' : 'Variável necessária:'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {envVarNames.map((varName, index) => (
                          <code key={index} className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded border block">
                            {varName}
                          </code>
                        ))}
                      </div>
                    </div>

                    {/* Link para obter a chave - agrupar por serviço */}
                    {(() => {
                      // Agrupar variáveis por serviço
                      const services = new Map<string, string[]>();
                      
                      for (const varName of envVarNames) {
                        const apiKeyInfo = this.getApiKeyInfo(varName);
                        if (apiKeyInfo) {
                          const existing = services.get(apiKeyInfo.name) || [];
                          existing.push(varName);
                          services.set(apiKeyInfo.name, existing);
                        }
                      }

                      // Se todas as variáveis são do mesmo serviço, mostrar um botão
                      if (services.size === 1) {
                        const firstVar = envVarNames[0];
                        const apiKeyInfo = this.getApiKeyInfo(firstVar);
                        
                        if (apiKeyInfo) {
                          return (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {apiKeyInfo.description}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 w-full"
                                onClick={() => window.open(apiKeyInfo.url, '_blank')}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Obter {hasMultipleEnvVars ? 'chaves' : 'chave'} {apiKeyInfo.name}
                              </Button>
                            </div>
                          );
                        }
                      } else if (services.size > 1) {
                        // Múltiplos serviços - mostrar lista de botões
                        return (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Onde obter as chaves:</p>
                            {Array.from(services.entries()).map(([serviceName, vars]) => {
                              const firstVar = vars[0];
                              const apiKeyInfo = this.getApiKeyInfo(firstVar);
                              
                              if (!apiKeyInfo) return null;
                              
                              return (
                                <Button
                                  key={serviceName}
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 w-full"
                                  onClick={() => window.open(apiKeyInfo.url, '_blank')}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {serviceName} ({vars.length} {vars.length > 1 ? 'variáveis' : 'variável'})
                                </Button>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Instruções compactas */}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Clique em <strong>Configurar Variável</strong> abaixo para adicionar {hasMultipleEnvVars ? 'as chaves' : 'sua chave'}.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Se tiver erro do Vite com detalhes de código */}
                  {viteError ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                    <div className="flex items-start gap-2">
                      <FileCode className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight">
                          {cleanErrorMessage(viteError.message)}
                        </p>
                        {viteError.loc && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {viteError.id.split('/').pop()}:{viteError.loc.line}:{viteError.loc.column}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                    {viteError.frame && (
                      <ScrollArea className="h-[180px] w-full rounded-md border bg-muted/30">
                        <pre className="p-3 text-xs font-mono leading-relaxed">
                          {viteError.frame}
                        </pre>
                      </ScrollArea>
                    )}
                  </div>
                ) : isAggregate && error instanceof AggregateError ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {error.errors.map((err, index) => (
                    <div key={index} className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Erro {index + 1}
                          </p>
                          <p className="font-mono text-xs break-all">
                            {cleanErrorMessage(err.toString())}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs break-all leading-relaxed">
                          {cleanErrorMessage(error.toString())}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                  {/* Stack Trace compacto */}
                  {!viteError && this.state.errorInfo && (
                    <details className="group">
                      <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        <Terminal className="h-3 w-3" />
                        Ver Stack Trace
                      </summary>
                      <ScrollArea className="mt-2 h-[100px] w-full rounded-md border bg-muted/30">
                        <code className="block p-2 text-xs font-mono whitespace-pre text-muted-foreground">
                          {this.state.errorInfo.componentStack}
                        </code>
                      </ScrollArea>
                    </details>
                  )}
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-center gap-2 p-3 border-t">
              <Button 
                size="sm"
                variant="outline" 
                onClick={this.handleCopyError} 
                className="gap-1.5"
                disabled={this.state.isSending}
              >
                {this.state.isCopied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                {this.state.isCopied ? "Copiado" : "Copiar"}
              </Button>
              {isEnvError && envVarNames.length > 0 ? (
                <Button 
                  size="sm"
                  variant="default"
                  onClick={this.handleOpenEnvVars}
                  className="gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {hasMultipleEnvVars ? 'Configurar Variáveis' : 'Configurar Variável'}
                </Button>
              ) : (
                <Button 
                  size="sm"
                  variant="default"
                  onClick={this.handleSendToAI}
                  className="gap-1.5"
                  disabled={this.state.isSending}
                >
                  <Send className="h-3.5 w-3.5" />
                  {this.state.isSending ? "Enviando..." : "Enviar para IA"}
                </Button>
              )}
              <Button size="sm" onClick={this.handleReset} variant="secondary" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Recarregar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
