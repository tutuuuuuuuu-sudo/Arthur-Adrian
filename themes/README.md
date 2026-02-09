# Temas Disponíveis

Esta pasta contém os temas pré-configurados que servem como referência para a IA criar aplicações com diferentes estilos visuais.

## 📁 Estrutura

```
themes/
├── neon.tsx         - Tema vibrante com cores neon e alta saturação
├── vercel.tsx       - Design minimalista e limpo inspirado no Vercel
├── terracotta.tsx   - Cores terrosas e aconchegantes com tipografia mono
├── rose.tsx         - Paleta rosa e roxa com tipografia elegante
├── mint.tsx         - Tons verdes e mentolados com visual clean
├── classic.tsx      - Paleta terrosa e elegante com tipografia serifada clássica
├── neutral.tsx      - Design minimalista com cores neutras e acentos amarelos/dourados
├── bold.tsx         - Design tech/gaming com cores vibrantes, sem bordas arredondadas e sombras marcadas
├── brutalist.tsx    - Design neobrutalista com cores vibrantes, sombras duras sem blur e formas geométricas
├── paper.tsx        - Design minimalista com escala de cinza, tipografia única e sombras muito suaves
├── warm.tsx         - Paleta quente e aconchegante com tons de amarelo/laranja e sombras suaves
├── sky.tsx          - Design limpo e moderno com azul como cor primária, sem sombras e bordas arredondadas
├── index.tsx        - Exportação centralizada de todos os temas
└── README.md        - Este arquivo
```

## 🎨 Temas Disponíveis

### 1. Neon
- **Cores**: Rosa vibrante (#E91E63), roxo e ciano
- **Fontes**: Outfit, Fira Code
- **Estilo**: Moderno, vibrante, alta saturação
- **Uso**: Apps jovens, criativos, tech

### 2. Vercel
- **Cores**: Preto e branco puros, tons de cinza
- **Fontes**: Inter, SF Mono
- **Estilo**: Minimalista, clean, profissional
- **Uso**: Dashboards, ferramentas profissionais, SaaS

### 3. Terracotta
- **Cores**: Laranja terroso, tons marrons e creme
- **Fontes**: Geist Mono, JetBrains Mono
- **Estilo**: Aconchegante, orgânico, terroso
- **Uso**: Blogs, portfólios, sites culturais

### 4. Rose
- **Cores**: Rosa pastel, roxo claro, tons suaves
- **Fontes**: Poppins, Playfair Display, Space Mono
- **Estilo**: Elegante, feminino, sofisticado
- **Uso**: E-commerce de moda, beleza, lifestyle

### 5. Mint
- **Cores**: Verde menta, tons claros e refrescantes
- **Fontes**: Outfit
- **Estilo**: Clean, refrescante, moderno
- **Uso**: Apps de saúde, bem-estar, produtividade

### 6. Classic
- **Cores**: Paleta terrosa com tons amarelados e marrons
- **Fontes**: Libre Baskerville, Lora, IBM Plex Mono
- **Estilo**: Elegante, clássico, serifado
- **Uso**: Sites literários, editoriais, culturais

### 7. Neutral
- **Cores**: Preto e branco puros, acentos amarelos/dourados
- **Fontes**: Inter, Source Serif 4, JetBrains Mono
- **Estilo**: Minimalista, neutro, profissional
- **Uso**: Dashboards corporativos, aplicações empresariais, interfaces limpas

### 8. Bold
- **Cores**: Escala de cinza com acentos vibrantes (laranja, verde, azul)
- **Fontes**: Oxanium, Source Code Pro
- **Estilo**: Tech, gaming, sem bordas arredondadas, sombras marcadas
- **Uso**: Aplicações de gaming, dashboards tech, interfaces com visual forte

### 9. Brutalist
- **Cores**: Preto e branco puros com acentos vibrantes (laranja, amarelo, roxo)
- **Fontes**: DM Sans, Space Mono
- **Estilo**: Neobrutalista, sombras duras sem blur, formas geométricas, alto contraste
- **Uso**: Portfólios criativos, sites de arte, interfaces experimentais, design gráfico

### 10. Paper
- **Cores**: Escala de cinza pura com acentos mínimos (amarelo suave)
- **Fontes**: Architects Daughter, Times New Roman, Courier New/Fira Code
- **Estilo**: Minimalista, limpo, sombras muito suaves, tipografia única
- **Uso**: Blogs pessoais, portfólios criativos, sites de escrita, interfaces delicadas

### 11. Warm
- **Cores**: Tons quentes de amarelo/laranja no light, roxo/rosa no dark
- **Fontes**: Montserrat, Merriweather, Ubuntu Mono
- **Estilo**: Aconchegante, quente, sombras suaves com blur, tipografia legível
- **Uso**: Blogs, sites de receitas, e-commerce, aplicações com visual acolhedor

### 12. Sky
- **Cores**: Azul como primária, fundo branco no light e preto no dark
- **Fontes**: Open Sans, Georgia, Menlo
- **Estilo**: Limpo, moderno, sem sombras, bordas muito arredondadas (1.3rem)
- **Uso**: Redes sociais, aplicações de comunicação, dashboards modernos

## 🤖 Como a IA deve usar estes temas

### Quando o usuário não especificar um tema:
Use o tema **Neon** como padrão (é o mais versátil e moderno).

### Quando o usuário pedir um tema específico:
1. Identifique qual tema melhor atende à solicitação
2. Use as variáveis CSS desse tema
3. Aplique as fontes especificadas no tema
4. Mantenha a consistência do estilo

### Para aplicar um tema:
As variáveis CSS devem ser aplicadas no arquivo `src/index.css` na seção `:root` para o modo light e `.dark` para o modo dark.

Exemplo:
```css
@layer base {
  :root {
    --background: oklch(0.9816 0.0017 247.8390);
    --foreground: oklch(0.1649 0.0352 281.8285);
    /* ... demais variáveis do tema light */
  }

  .dark {
    --background: oklch(0.1649 0.0352 281.8285);
    --foreground: oklch(0.9513 0.0074 260.7315);
    /* ... demais variáveis do tema dark */
  }
}
```

## 📝 Estrutura de um Tema

Cada tema contém:

```typescript
{
  name: string,           // Nome do tema
  light: {                // Variáveis para modo claro
    '--background': string,
    '--foreground': string,
    '--primary': string,
    '--secondary': string,
    // ... todas as variáveis CSS
  },
  dark: {                 // Variáveis para modo escuro
    // ... mesmas propriedades do light
  }
}
```

## 🎯 Variáveis Incluídas em Cada Tema

### Cores Base
- `--background` - Cor de fundo principal
- `--foreground` - Cor do texto principal
- `--card` - Cor de fundo de cards
- `--card-foreground` - Cor do texto em cards
- `--popover` - Cor de fundo de popovers
- `--popover-foreground` - Cor do texto em popovers

### Cores Semânticas
- `--primary` - Cor primária (ações principais)
- `--primary-foreground` - Texto sobre primary
- `--secondary` - Cor secundária
- `--secondary-foreground` - Texto sobre secondary
- `--muted` - Cor suave/atenuada
- `--muted-foreground` - Texto suave
- `--accent` - Cor de destaque
- `--accent-foreground` - Texto sobre accent
- `--destructive` - Cor para ações destrutivas
- `--destructive-foreground` - Texto sobre destructive

### Borders e Inputs
- `--border` - Cor das bordas
- `--input` - Cor de fundo de inputs
- `--ring` - Cor do outline de foco

### Gráficos
- `--chart-1` até `--chart-5` - Cores para gráficos

### Sidebar
- `--sidebar` - Cor de fundo da sidebar
- `--sidebar-foreground` - Texto da sidebar
- `--sidebar-primary` - Cor primária da sidebar
- `--sidebar-accent` - Destaque da sidebar
- `--sidebar-border` - Borda da sidebar

### Tipografia
- `--font-sans` - Fonte sans-serif principal
- `--font-serif` - Fonte serif
- `--font-mono` - Fonte monoespaçada
- `--tracking-normal` - Letter spacing padrão

### Sombras
- `--shadow-2xs` até `--shadow-2xl` - Sombras em diferentes tamanhos
- `--shadow-x`, `--shadow-y`, `--shadow-blur`, `--shadow-spread` - Parâmetros da sombra
- `--shadow-opacity` - Opacidade da sombra
- `--shadow-color` - Cor da sombra

### Outros
- `--radius` - Border radius padrão
- `--spacing` - Espaçamento base

## ⚠️ Importante

- **NÃO modifique estes arquivos** - Eles servem apenas como referência
- **NÃO importe estes arquivos** no código da aplicação
- **USE as variáveis CSS** diretamente no `src/index.css`
- Os temas usam o formato **OKLCH** para cores (mais moderno que HSL/RGB)
- Sempre aplique AMBOS os modos (light e dark) ao usar um tema

## 🔄 Adicionando Novos Temas

Para adicionar um novo tema:
1. Crie um arquivo `.tsx` na pasta `themes/`
2. Exporte um objeto com a estrutura padrão
3. Adicione a exportação no `index.tsx`
4. Documente o tema neste README

## 📚 Referências

- [shadcn/ui Themes](https://ui.shadcn.com/themes)
- [OKLCH Color Space](https://oklch.com/)
- [Tailwind CSS Theming](https://tailwindcss.com/docs/customizing-colors)
