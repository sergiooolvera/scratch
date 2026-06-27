import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      // 2. Delete a single notification owned by this user
      const { error } = await supabaseAdmin
        .from('qui_notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      return NextResponse.json({ success: true, message: 'Notificación eliminada.' });
    } else {
      // 3. Delete all notifications for this user
      const { error } = await supabaseAdmin
        .from('qui_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      return NextResponse.json({ success: true, message: 'Todas las notificaciones eliminadas.' });
    }
  } catch (err: any) {
    console.error('Error in delete notification API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
