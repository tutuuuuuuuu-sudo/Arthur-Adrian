// PWAInstallBanner.tsx — Banner "Instalar App" para Android/iOS
// Aparece uma vez, pode ser dispensado, fica guardado no localStorage

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Não mostra se já foi dispensado ou já está instalado
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed') === 'true'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    if (wasDismissed || isStandalone) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS não tem beforeinstallprompt — mostra banner manual após 3s
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome — escuta o evento nativo
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') handleDismiss()
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!show || dismissed) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-4"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Instalar Surf AI</div>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Toque em <strong>Compartilhar</strong> <span className="text-base">⎙</span> e depois <strong>"Adicionar à Tela de Início"</strong> para instalar.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Instale para acesso rápido, funciona sem internet.
            </p>
          )}
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar agora
            </button>
          )}
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
