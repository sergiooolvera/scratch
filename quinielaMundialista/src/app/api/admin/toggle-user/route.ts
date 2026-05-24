import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, userId, isActive } = body;

    if (!adminId || !userId || isActive === undefined) {
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

    // 2. Update user profile active status
    const { error: updateError } = await supabaseAdmin
      .from('qui_profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `El usuario ha sido ${isActive ? 'activado' : 'desactivado'} exitosamente.` 
    });
  } catch (err: any) {
    console.error('Error in toggle-user API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
