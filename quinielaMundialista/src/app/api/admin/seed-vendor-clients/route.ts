// src/app/api/admin/seed-vendor-clients/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'QM-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Falta adminId.' }, { status: 400 });
    }

    // Verify admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    // 1. Find or create 2 test vendors
    const vendorDefs = [
      { name: 'Carlos Vendedor', username: 'carlos_vendedor' },
      { name: 'María Ventas', username: 'maria_ventas' },
    ];

    const vendorIds: string[] = [];

    for (const vDef of vendorDefs) {
      const email = `${vDef.username}@quimundial.test`;

      // Check if user already exists
      const { data: existing } = await supabaseAdmin
        .from('qui_profiles')
        .select('id')
        .eq('username', vDef.username)
        .maybeSingle();

      if (existing) {
        // Update to vendedor role
        await supabaseAdmin
          .from('qui_profiles')
          .update({ role: 'vendedor', seller_request_status: 'approved', is_active: true })
          .eq('id', existing.id);
        vendorIds.push(existing.id);
      } else {
        // Create new auth user
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'vendedor_test_123',
          email_confirm: true,
          user_metadata: { full_name: vDef.name, username: vDef.username },
        });

        if (authErr || !authData?.user) {
          console.error('Error creating vendor:', authErr?.message);
          continue;
        }

        // Update profile
        await supabaseAdmin
          .from('qui_profiles')
          .update({
            full_name: vDef.name,
            username: vDef.username,
            role: 'vendedor',
            seller_request_status: 'approved',
            is_active: true,
          })
          .eq('id', authData.user.id);

        vendorIds.push(authData.user.id);
      }
    }

    if (vendorIds.length === 0) {
      return NextResponse.json({ error: 'No se pudo crear ningún vendedor.' }, { status: 500 });
    }

    // 2. Find or create test client users
    const clientDefs = [
      { name: 'Ana López', username: 'ana_lopez' },
      { name: 'Roberto Díaz', username: 'roberto_diaz' },
      { name: 'Sofía Martínez', username: 'sofia_mtz' },
      { name: 'Diego Fernández', username: 'diego_fdz' },
      { name: 'Lucía Torres', username: 'lucia_torres' },
      { name: 'Paco Ramírez', username: 'paco_ramirez' },
    ];

    const clientIds: string[] = [];

    for (const cDef of clientDefs) {
      const email = `${cDef.username}@quimundial.test`;

      const { data: existing } = await supabaseAdmin
        .from('qui_profiles')
        .select('id')
        .eq('username', cDef.username)
        .maybeSingle();

      if (existing) {
        clientIds.push(existing.id);
      } else {
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'cliente_test_123',
          email_confirm: true,
          user_metadata: { full_name: cDef.name, username: cDef.username },
        });

        if (authErr || !authData?.user) {
          console.error('Error creating client:', authErr?.message);
          continue;
        }

        await supabaseAdmin
          .from('qui_profiles')
          .update({
            full_name: cDef.name,
            username: cDef.username,
            is_active: true,
          })
          .eq('id', authData.user.id);

        clientIds.push(authData.user.id);
      }
    }

    // 3. Create coupons and assign clients to vendors
    //    Vendor 0 gets clients 0,1,2,3  |  Vendor 1 gets clients 4,5
    const assignments = [
      { vendorIdx: 0, clientIdxList: [0, 1, 2, 3] },
      { vendorIdx: 1, clientIdxList: [4, 5] },
    ];

    let couponsCreated = 0;

    for (const assignment of assignments) {
      const vendorId = vendorIds[assignment.vendorIdx];
      if (!vendorId) continue;

      for (const cIdx of assignment.clientIdxList) {
        const clientId = clientIds[cIdx];
        if (!clientId) continue;

        // Check if an assignment already exists for this pair
        const { data: existingCoupon } = await supabaseAdmin
          .from('qui_coupons')
          .select('id')
          .eq('seller_id', vendorId)
          .eq('used_by', clientId)
          .maybeSingle();

        if (existingCoupon) continue; // Already linked

        const code = generateCode();

        const { error: insertErr } = await supabaseAdmin
          .from('qui_coupons')
          .insert({
            code,
            seller_id: vendorId,
            price_paid: 200,
            status: 'used',
            used_by: clientId,
            used_at: new Date().toISOString(),
          });

        if (!insertErr) {
          couponsCreated++;
        }

        // Also set referred_by on the client profile
        await supabaseAdmin
          .from('qui_profiles')
          .update({ referred_by: vendorId, is_active: true })
          .eq('id', clientId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Se crearon ${vendorIds.length} vendedores y se asociaron ${couponsCreated} cupones con ${clientIds.length} clientes de prueba.`,
      vendors: vendorIds.length,
      clients: clientIds.length,
      coupons: couponsCreated,
    });
  } catch (err: any) {
    console.error('Error seeding vendor-client data:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
