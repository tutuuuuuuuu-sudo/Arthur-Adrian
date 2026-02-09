import { StrictMode, lazy, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "next-themes"

import "./index.css"
import { ErrorBoundary } from "./components/error-boundary"
import { Spinner } from "@/components/ui/spinner"

// --- Captura de Erros do Vite (HMR) ---
// Ouve erros de compilação vindos do servidor Vite via WebSocket
if (import.meta.hot) {
  import.meta.hot.on('vite:error', (data: any) => {
    // Dispara um evento customizado que o ErrorBoundary pode ouvir
    window.dispatchEvent(new CustomEvent('vite:error', { detail: data.err }))
  })
}

// Importação Lazy (Preguiçosa) - Isso isola o App
// Se o App.tsx tiver erro de sintaxe, o erro acontece aqui na importação
// e o ErrorBoundary consegue capturar!
const App = lazy(() => import("./App.tsx"))

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <Spinner className="size-10 text-primary" />
            </div>
          }>
            <App />
          </Suspense>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
