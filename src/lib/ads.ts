import { supabase } from './supabase'

export interface Ad {
  id: string
  empresa: string
  slogan: string
  imagem_url: string
  link_url: string
  beach_ids: string[]
  posicao: 'banner' | 'card'
  ativo: boolean
}

// Cache local de anúncios para não bater no banco toda hora
let cachedAds: Ad[] | null = null
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function fetchAds(): Promise<Ad[]> {
  const now = Date.now()
  if (cachedAds && (now - lastFetch) < CACHE_DURATION) return cachedAds

  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('ativo', true)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error || !data) return getPlaceholderAds()

    cachedAds = data as Ad[]
    lastFetch = now
    return cachedAds
  } catch {
    return getPlaceholderAds()
  }
}

export function getPlaceholderAds(): Ad[] {
  return [
    {
      id: 'placeholder-1',
      empresa: 'Sua Empresa Aqui',
      slogan: 'Anuncie para surfistas de Floripa • surfaifloripa@gmail.com',
      imagem_url: '',
      link_url: 'mailto:surfaifloripa@gmail.com',
      beach_ids: [],
      posicao: 'banner',
      ativo: true,
    },
    {
      id: 'placeholder-2',
      empresa: 'Sua Empresa Aqui',
      slogan: 'Alcance surfistas locais • surfaifloripa@gmail.com',
      imagem_url: '',
      link_url: 'mailto:surfaifloripa@gmail.com',
      beach_ids: [],
      posicao: 'card',
      ativo: true,
    },
  ]
}

// Retorna anúncios filtrados para uma praia específica ou geral
export function getAdsForSpot(ads: Ad[], spotId: string, posicao: 'banner' | 'card'): Ad[] {
  const filtered = ads.filter(ad =>
    ad.posicao === posicao &&
    (ad.beach_ids.length === 0 || ad.beach_ids.includes(spotId))
  )
  if (filtered.length > 0) return filtered
  return getPlaceholderAds().filter(a => a.posicao === posicao)
}

// Insere novo anúncio no Supabase (para uso futuro no painel admin)
export async function insertAd(ad: Omit<Ad, 'id'>): Promise<boolean> {
  const { error } = await supabase.from('ads').insert([ad])
  if (error) { console.error('[ads] erro ao inserir:', error); return false }
  cachedAds = null // limpa cache
  return true
}
