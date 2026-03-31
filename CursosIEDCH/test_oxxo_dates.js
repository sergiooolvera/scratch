const Stripe = require('stripe');
const fs = require('fs');
const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const lines = envFile.split('\n');
const envVars = {};
lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    }
});
const stripe = new Stripe(envVars['STRIPE_SECRET_KEY']);

async function testOxxoDates() {
    const sessions = await stripe.checkout.sessions.list({ 
        limit: 100,
        expand: ['data.payment_intent.latest_charge']
    });
    
    sessions.data.forEach(s => {
        const pi = s.payment_intent;
        if (pi && pi.next_action?.type === 'display_oxxo_details' || (pi && pi.payment_method_types?.includes('oxxo'))) {
            const charge = pi.latest_charge;
            console.log(`OXXO - Status: ${s.payment_status}`);
            console.log(`- Generado (Session created): ${new Date(s.created * 1000).toLocaleString()}`);
            if (charge) {
                console.log(`- Pago (Charge created): ${new Date(charge.created * 1000).toLocaleString()}`);
            }
        }
    });
}
testOxxoDates();
