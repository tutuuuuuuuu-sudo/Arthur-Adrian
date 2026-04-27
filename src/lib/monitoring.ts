import * as Sentry from '@sentry/react'

// Inicializa o Sentry apenas se a DSN estiver configurada
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: 'surf-ai@1.0.0',
    tracesSampleRate: 0.2,        // 20% das transações
    replaysSessionSampleRate: 0,  // desativado para economizar cota
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    beforeSend(event) {
      // Não envia erros de extensões do browser
      const url = event.request?.url ?? ''
      if (url.includes('chrome-extension') || url.includes('moz-extension')) return null
      return event
    },
  })
}

// Captura erro avulso (pode ser chamado de qualquer lugar)
export function captureError(error: unknown, context?: Record<string, string>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context)
    Sentry.captureException(error)
  })
}
