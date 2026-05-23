import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Parámetro userId faltante o inválido.' }, { status: 400 });
    }

    // Update the profile request status to 'pending' using supabaseAdmin to bypass any RLS restriction
    const { error } = await supabaseAdmin
      .from('qui_profiles')
      .update({ seller_request_status: 'pending' })
      .eq('id', userId);

    if (error) {
      console.error('Database update error in seller request:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tu solicitud de activación de vendedor ha sido enviada con éxito al administrador.' 
    });
  } catch (err: any) {
    console.error('Server error inside seller request route:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
