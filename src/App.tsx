// Nota: O BrowserRouter está definido no main.tsx, então você pode usar Routes e Route diretamente aqui
import { ThemeToggle } from "@/components/theme-toggle";

export function App() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">lasy</h1>
      </div>
    </div>
  );
}

export default App;