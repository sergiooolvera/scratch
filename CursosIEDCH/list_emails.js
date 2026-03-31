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

async function findEsme() {
    const sessions = await stripe.checkout.sessions.list({ limit: 50 });
    sessions.data.forEach(s => {
        console.log(`- ${s.customer_details?.email} | ${s.metadata?.email} | ${s.payment_status}`);
    });
}
findEsme();
