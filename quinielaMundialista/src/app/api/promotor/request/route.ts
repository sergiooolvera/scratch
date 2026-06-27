import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación faltante.' }, { status: 401 });
    }

    // 1. Authenticate the user securely using Supabase Admin Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    }

    // 2. Fetch the profile to ensure it exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('qui_profiles')
      .select('id, role, seller_request_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado.' }, { status: 404 });
    }

    // 3. Update the request status to 'pending'
    const { error: updateError } = await supabaseAdmin
      .from('qui_profiles')
      .update({ 
        seller_request_status: 'pending'
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud para ser promotor enviada correctamente.' 
    });
  } catch (err: any) {
    console.error('Error in promoter request API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
