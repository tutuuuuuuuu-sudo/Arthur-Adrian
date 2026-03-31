import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // O MP envia GET para validar o endpoint — responde 200
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Valida variáveis de ambiente
  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[mp-webhook] Variáveis de ambiente faltando')
    return res.status(500).json({ error: 'Configuração incompleta' })
  }

  try {
    const { type, data } = req.body

    console.log('[mp-webhook] Notificação recebida:', { type, data })

    // Só processa notificações de pagamento
    if (type !== 'payment') {
      return res.status(200).json({ ok: true, message: 'Evento ignorado' })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return res.status(400).json({ error: 'payment id não encontrado' })
    }

    // Busca detalhes do pagamento no MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    })

    if (!mpResponse.ok) {
      console.error('[mp-webhook] Erro ao buscar pagamento no MP:', paymentId)
      return res.status(500).json({ error: 'Erro ao buscar pagamento' })
    }

    const payment = await mpResponse.json()

    console.log('[mp-webhook] Pagamento:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      amount: payment.transaction_amount,
      method: payment.payment_type_id,
    })

    // Só ativa premium para pagamentos aprovados
    if (payment.status !== 'approved') {
      return res.status(200).json({ ok: true, message: `Status ${payment.status} ignorado` })
    }

    const userId = payment.external_reference
    if (!userId) {
      console.error('[mp-webhook] external_reference (userId) não encontrado')
      return res.status(400).json({ error: 'userId não encontrado no pagamento' })
    }

    // Conecta ao Supabase com service key (bypassa RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Chama a função SQL que ativa o premium
    const { error } = await supabase.rpc('activate_premium', {
      p_user_id: userId,
      p_mp_payment_id: String(payment.id),
      p_mp_preference_id: payment.preference_id ?? '',
      p_amount: payment.transaction_amount,
      p_payment_method: payment.payment_type_id ?? 'unknown',
    })

    if (error) {
      console.error('[mp-webhook] Erro ao ativar premium no Supabase:', error)
      return res.status(500).json({ error: 'Erro ao ativar premium' })
    }

    console.log('[mp-webhook] ✅ Premium ativado para userId:', userId)
    return res.status(200).json({ ok: true, message: 'Premium ativado com sucesso' })

  } catch (error) {
    console.error('[mp-webhook] Erro interno:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
