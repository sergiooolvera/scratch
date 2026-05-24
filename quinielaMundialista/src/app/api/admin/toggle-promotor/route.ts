import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, userId, approve } = body;

    if (!adminId || !userId || approve === undefined) {
      return NextResponse.json({ error: 'Parámetros obligatorios faltantes.' }, { status: 400 });
    }

    // 1. Verify the requester is an admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
    }

    // 2. Perform promoter status toggle
    const updates = approve 
      ? { role: 'promotor', seller_request_status: 'approved' }
      : { role: 'user', seller_request_status: 'none' };

    const { error: updateError } = await supabaseAdmin
      .from('qui_profiles')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `El usuario ha sido ${approve ? 'aprobado como promotor' : 'removido del rol de promotor'} exitosamente.` 
    });
  } catch (err: any) {
    console.error('Error in toggle-promotor API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
