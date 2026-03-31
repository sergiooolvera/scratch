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

async function getRecentEvents() {
    const events = await stripe.events.list({
        type: 'checkout.session.async_payment_succeeded',
        limit: 5
    });
    
    events.data.forEach(e => {
        const session = e.data.object;
        console.log(`Event ID: ${e.id}`);
        console.log(`Session ID: ${session.id}`);
        console.log(`Customer Email: ${session.customer_details?.email}`);
        console.log(`Metadata:`, session.metadata);
        console.log('---');
    });
}

getRecentEvents();
