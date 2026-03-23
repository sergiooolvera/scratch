import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Usamos supabase-js client con la llave de servicio para saltar RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) {
            return new NextResponse("Webhook secret missing in env", { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const fulfillOrder = async (session: Stripe.Checkout.Session) => {
        const userId = session.metadata?.user_id;
        const cursoId = session.metadata?.curso_id;

        if (userId && cursoId) {
            // Verificar si ya existe para no duplicar (útil si hay reintento de webhook)
            const { data: existe } = await supabaseAdmin.from("ie_compras")
                                        .select("id").eq("user_id", userId).eq("curso_id", cursoId).single();
            if (existe) {
                console.log(`Compra ya existía: User ${userId}, Curso ${cursoId}`);
                return;
            }

            // Registrar compra
            const { error } = await supabaseAdmin.from("ie_compras").insert({
                user_id: userId,
                curso_id: cursoId,
                pagado: true,
            });

            if (error) {
                console.error("Error guardando compra en DB:", error);
                throw new Error("Database Error");
            }
            console.log(`Compra registrada en DB: User ${userId}, Curso ${cursoId}`);
        }
    }

    if (event.type === "checkout.session.completed") {
        if (session.payment_status === 'paid') {
            console.log("Pago exitoso inmediato (Tarjeta)!", session.metadata);
            await fulfillOrder(session);
        } else {
            console.log("Sesión completada pero pago pendiente (ej. OXXO). Esperando async_payment_succeeded.");
        }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
        console.log("Pago asíncrono exitoso (OXXO)!", session.metadata);
        await fulfillOrder(session);
    } else if (event.type === "checkout.session.async_payment_failed") {
        console.log("El pago asíncrono falló o expiró el ticket de OXXO.", session.metadata);
        // Opcional: Notificar al usuario que su recibo expiró o falló.
    }

    return new NextResponse(null, { status: 200 });
}
