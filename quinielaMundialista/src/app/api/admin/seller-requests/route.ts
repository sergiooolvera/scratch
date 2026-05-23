import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Fetch all profiles with 'pending' status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'Parámetro adminId faltante.' }, { status: 400 });
    }

    // Verify admin privileges
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada.' }, { status: 403 });
    }

    // Fetch pending applications
    const { data: pendingRequests, error: fetchError } = await supabaseAdmin
      .from('qui_profiles')
      .select('id, full_name, username, created_at, points')
      .eq('seller_request_status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, requests: pendingRequests });
  } catch (err: any) {
    console.error('Error fetching seller requests:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}

// POST: Approve or Reject application
export async function POST(req: Request) {
  try {
    const { adminId, targetUserId, action } = await req.json();

    if (!adminId || !targetUserId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parámetros inválidos o incompletos.' }, { status: 400 });
    }

    // 1. Verify admin privileges
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada.' }, { status: 403 });
    }

    if (action === 'approve') {
      // 2a. Update profile: set status approved, role vendedor
      const { error: updateError } = await supabaseAdmin
        .from('qui_profiles')
        .update({ 
          seller_request_status: 'approved',
          role: 'vendedor' 
        })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      // 2b. Inject system notification for the target user
      await supabaseAdmin
        .from('qui_notifications')
        .insert({
          user_id: targetUserId,
          message: '¡Felicidades! Tu solicitud para ser vendedor ha sido aprobada. Ya tienes acceso completo a tu panel en el menú superior.',
          read: false
        });

      return NextResponse.json({ success: true, message: 'Solicitud aprobada y rol de vendedor activado.' });
    } else {
      // 3a. Update profile: set status rejected, keep standard role
      const { error: updateError } = await supabaseAdmin
        .from('qui_profiles')
        .update({ 
          seller_request_status: 'rejected'
        })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      // 3b. Inject system notification for the target user
      await supabaseAdmin
        .from('qui_notifications')
        .insert({
          user_id: targetUserId,
          message: 'Tu solicitud para ser vendedor ha sido declinada. Si consideras que es un error, por favor ponte en contacto con soporte técnico.',
          read: false
        });

      return NextResponse.json({ success: true, message: 'Solicitud rechazada.' });
    }
  } catch (err: any) {
    console.error('Error in seller-requests action API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
