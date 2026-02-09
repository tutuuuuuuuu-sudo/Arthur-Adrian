/**
 * Exportação centralizada de todos os temas disponíveis
 * 
 * Este arquivo serve como ponto de referência para a IA conhecer
 * todos os temas disponíveis no sistema.
 * 
 * Cada tema contém:
 * - name: Nome do tema
 * - light: Variáveis CSS para modo claro
 * - dark: Variáveis CSS para modo escuro
 * 
 * As variáveis incluem:
 * - Cores (background, foreground, primary, secondary, etc)
 * - Fontes (sans, serif, mono)
 * - Sombras (shadow-xs, shadow-sm, shadow-md, shadow-lg, etc)
 * - Border radius
 * - Espaçamento e tracking
 */

export { neonTheme } from './neon';
export { vercelTheme } from './vercel';
export { terracottaTheme } from './terracotta';
export { roseTheme } from './rose';
export { mintTheme } from './mint';
export { classicTheme } from './classic';
export { neutralTheme } from './neutral';
export { boldTheme } from './bold';
export { brutalistTheme } from './brutalist';
export { paperTheme } from './paper';
export { warmTheme } from './warm';
export { skyTheme } from './sky';

/**
 * Interface de um tema
 */
export interface Theme {
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * Lista de todos os temas disponíveis
 * Importar individualmente de cada arquivo quando necessário
 */
export const AVAILABLE_THEMES = [
  'Neon',      // Tema vibrante com cores neon e alta saturação
  'Vercel',    // Design minimalista e limpo inspirado no Vercel
  'Terracotta',// Cores terrosas e aconchegantes com tipografia mono
  'Rose',      // Paleta rosa e roxa com tipografia elegante
  'Mint',      // Tons verdes e mentolados com visual clean
  'Classic',   // Paleta terrosa e elegante com tipografia serifada clássica
  'Neutral',   // Design minimalista com cores neutras e acentos amarelos/dourados
  'Bold',      // Design tech/gaming com cores vibrantes, sem bordas arredondadas e sombras marcadas
  'Brutalist', // Design neobrutalista com cores vibrantes, sombras duras sem blur e formas geométricas
  'Paper',     // Design minimalista com escala de cinza, tipografia única e sombras muito suaves
  'Warm',      // Paleta quente e aconchegante com tons de amarelo/laranja e sombras suaves
  'Sky',       // Design limpo e moderno com azul como cor primária, sem sombras e bordas arredondadas
] as const;

export type ThemeName = typeof AVAILABLE_THEMES[number];
