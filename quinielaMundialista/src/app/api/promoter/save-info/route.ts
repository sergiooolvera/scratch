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

    const { full_name, phone, clabe, bank_name } = await req.json();

    if (!full_name || full_name.trim().length < 3) {
      return NextResponse.json({ error: 'El nombre completo es obligatorio.' }, { status: 400 });
    }

    const updates: any = { full_name: full_name.trim() };
    if (phone) updates.phone = phone.trim();
    if (clabe) updates.clabe = clabe.trim();
    if (bank_name) updates.bank_name = bank_name.trim();

    const { error: upsertError } = await supabaseAdmin
      .from('qui_promoter_info')
      .upsert({
        user_id: user.id,
        ...updates,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      if (upsertError.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'La tabla qui_promoter_info no existe. Ejecuta la migración SQL primero.' }, { status: 500 });
      }
      throw upsertError;
    }

    return NextResponse.json({ success: true, message: 'Datos guardados correctamente.' });
  } catch (err: any) {
    console.error('Error in save-info:', err.message);
    return NextResponse.json({ error: `Error interno: ${err.message}` }, { status: 500 });
  }
}
