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

async function findEsmeralda() {
    const sessions = await stripe.checkout.sessions.list({ 
        limit: 100,
        expand: ['data.payment_intent.payment_method']
    });
    
    const esmeralda = sessions.data.find(s => s.customer_details?.email === 'esmecflores_267@hotmail.com');
    if (esmeralda) {
        console.log('--- ESMERALDA SESSION ---');
        console.log(JSON.stringify(esmeralda, null, 2));
    } else {
        console.log('Esmeralda session not found in last 100');
    }
}
findEsmeralda();
