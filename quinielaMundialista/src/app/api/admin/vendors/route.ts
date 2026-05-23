// src/app/api/admin/vendors/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/vendors
export async function GET(request: Request) {
  try {
    // 1. Get ALL approved vendors (role = 'vendedor')
    const { data: vendorProfiles, error: vendorError } = await supabase
      .from('qui_profiles')
      .select('id, username, full_name, is_active, created_at')
      .eq('role', 'vendedor')
      .order('created_at', { ascending: false });

    if (vendorError) {
      console.error('Error fetching vendor profiles:', vendorError);
      return NextResponse.json({ success: false, error: vendorError.message }, { status: 500 });
    }

    if (!vendorProfiles || vendorProfiles.length === 0) {
      return NextResponse.json({ success: true, vendors: [] }, { status: 200 });
    }

    const vendorIds = vendorProfiles.map(v => v.id);

    // 2. Get all coupons for these vendors in a single query
    //    The 'used_by' field is the client who redeemed the coupon
    const { data: coupons, error: couponsError } = await supabase
      .from('qui_coupons')
      .select('seller_id, used_by')
      .in('seller_id', vendorIds);

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError);
      return NextResponse.json({ success: false, error: couponsError.message }, { status: 500 });
    }

    // 3. Build seller -> unique client IDs map (only used coupons where used_by is not null)
    const sellerClientMap = new Map<string, Set<string>>();
    for (const vendorId of vendorIds) {
      sellerClientMap.set(vendorId, new Set());
    }
    for (const coupon of (coupons || [])) {
      if (coupon.seller_id && coupon.used_by) {
        sellerClientMap.get(coupon.seller_id)?.add(coupon.used_by);
      }
    }

    // 4. Also include users who have referred_by pointing to the vendor
    const { data: referredUsers, error: referredError } = await supabase
      .from('qui_profiles')
      .select('id, referred_by')
      .in('referred_by', vendorIds);

    if (!referredError && referredUsers) {
      for (const ru of referredUsers) {
        if (ru.referred_by && sellerClientMap.has(ru.referred_by)) {
          sellerClientMap.get(ru.referred_by)!.add(ru.id);
        }
      }
    }

    // 5. Batch-fetch all unique client profiles
    const allClientIds = new Set<string>();
    for (const clientSet of sellerClientMap.values()) {
      for (const id of clientSet) {
        allClientIds.add(id);
      }
    }

    const clientProfilesMap = new Map<string, any>();
    if (allClientIds.size > 0) {
      const { data: clientProfiles, error: clientError } = await supabase
        .from('qui_profiles')
        .select('id, username, full_name, is_active')
        .in('id', Array.from(allClientIds));

      if (!clientError && clientProfiles) {
        for (const cp of clientProfiles) {
          clientProfilesMap.set(cp.id, cp);
        }
      }
    }

    // 6. Assemble vendor data with their clients
    const vendorData = vendorProfiles.map((vendor) => {
      const clientIds = Array.from(sellerClientMap.get(vendor.id) || []);
      const clients = clientIds
        .map(cid => clientProfilesMap.get(cid))
        .filter(Boolean)
        .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''));

      return {
        id: vendor.id,
        username: vendor.username,
        full_name: vendor.full_name,
        is_active: vendor.is_active,
        client_count: clients.length,
        clients,
      };
    });

    return NextResponse.json({ success: true, vendors: vendorData }, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error in vendors API:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
