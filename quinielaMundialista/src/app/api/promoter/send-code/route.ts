import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación faltante.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    }

    const { phone } = await req.json();
    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: 'Número de teléfono inválido.' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('qui_promoter_info')
      .upsert({
        user_id: user.id,
        phone: phone.trim(),
        verification_code: code,
        code_expires_at: expiresAt,
        phone_verified: false,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      if (upsertError.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'La tabla qui_promoter_info no existe. Ejecuta la migración SQL primero.' }, { status: 500 });
      }
      throw upsertError;
    }

    return NextResponse.json({ success: true, message: 'Código de verificación generado.' });
  } catch (err: any) {
    console.error('Error in send-code:', err.message);
    return NextResponse.json({ error: `Error interno: ${err.message}` }, { status: 500 });
  }
}
