require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
});
const fs = require('fs');

async function run() {
    try {
        console.log("Searching for sessions...");
        const query = await stripe.checkout.sessions.list({ 
            payment_intent: 'pi_3TGoz5KqGRBtPX4z15KkPZih',
            limit: 1 
        });
        const session = query.data[0];
        
        let out = {};
        if (session) {
            out.session = session;
        } else {
            console.log("No session found. Searching for payment intent directly...");
            const pi = await stripe.paymentIntents.retrieve('pi_3TGoz5KqGRBtPX4z15KkPZih');
            out.pi = pi;
        }
        
        fs.writeFileSync('tmp_oxxo.json', JSON.stringify(out, null, 2));
        console.log("Done");
    } catch (e) {
        console.error(e.message);
        fs.writeFileSync('tmp_oxxo.json', JSON.stringify({ error: e.message }, null, 2));
    }
}
run();
