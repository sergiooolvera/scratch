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

    if (event.type === "checkout.session.completed") {
        console.log("Pago exitoso!", session.metadata);
        const userId = session.metadata?.user_id;
        const cursoId = session.metadata?.curso_id;

        if (userId && cursoId) {
            // Registrar compra
            const { error } = await supabaseAdmin.from("ie_compras").insert({
                user_id: userId,
                curso_id: cursoId,
                pagado: true,
            });

            if (error) {
                console.error("Error guardando compra en DB:", error);
                return new NextResponse("Database Error", { status: 500 });
            }
            console.log(`Compra registrada en DB: User ${userId}, Curso ${cursoId}`);
        }
    }

    return new NextResponse(null, { status: 200 });
}
