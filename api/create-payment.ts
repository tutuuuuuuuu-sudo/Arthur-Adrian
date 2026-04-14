import type { VercelRequest, VercelResponse } from '@vercel/node'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, userEmail } = req.body

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'userId e userEmail são obrigatórios' })
  }

  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado' })
  }

  try {
    const preference = {
      items: [
        {
          id: 'surf-ai-premium-mensal',
          title: 'Surf AI Premium — Mensal',
          description: 'Acesso completo ao Surf AI Floripa por 30 dias',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 29.90,
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${process.env.VITE_APP_URL ?? 'https://surfaifloripa.com.br'}/premium?status=success`,
        failure: `${process.env.VITE_APP_URL ?? 'https://surfaifloripa.com.br'}/premium?status=failure`,
        pending: `${process.env.VITE_APP_URL ?? 'https://surfaifloripa.com.br'}/premium?status=pending`,
      },
      auto_return: 'approved',
      external_reference: userId,
      notification_url: `${process.env.VITE_APP_URL ?? 'https://surfaifloripa.com.br'}/api/mp-webhook`,
      statement_descriptor: 'SURF AI FLORIPA',
      expires: false,
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[create-payment] Erro do MP:', errorData)
      return res.status(500).json({ error: 'Erro ao criar preferência no Mercado Pago' })
    }

    const data = await response.json()

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,         // URL de pagamento (produção)
      sandbox_init_point: data.sandbox_init_point, // URL de pagamento (teste)
    })
  } catch (error) {
    console.error('[create-payment] Erro interno:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
