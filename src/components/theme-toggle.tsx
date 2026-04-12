import { useTheme } from "next-themes"
import { useEffect } from "react"

// ✅ Tema fixo escuro — sem botão de toggle
// Força dark mode silenciosamente na montagem
export function ThemeToggle() {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme('dark') }, [setTheme])
  return null
}
