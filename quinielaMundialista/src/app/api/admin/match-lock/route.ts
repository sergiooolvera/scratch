import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { matchId, isLocked, adminId } = await req.json();

    if (!matchId || isLocked === undefined || !adminId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // 1. Verify that the requester is an admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada. Requiere rol de Administrador.' }, { status: 403 });
    }

    // 2. Update the match lock status
    const { error: updateError } = await supabaseAdmin
      .from('qui_matches')
      .update({ is_locked: isLocked })
      .eq('id', matchId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Partido ${isLocked ? 'bloqueado' : 'desbloqueado'} exitosamente.` 
    });
  } catch (err: any) {
    console.error('Error toggling match lock:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
