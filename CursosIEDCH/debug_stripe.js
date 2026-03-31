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

async function debugSessions() {
    const sessions = await stripe.checkout.sessions.list({ 
        limit: 10,
        expand: ['data.payment_intent', 'data.line_items', 'data.total_details']
    });
    
    sessions.data.forEach(s => {
        console.log(`Session: ${s.id}`);
        console.log(` Customer Email: ${s.customer_details?.email || s.metadata?.email}`);
        console.log(` Status: ${s.status}, Payment Status: ${s.payment_status}`);
        console.log(` Payment Method Types (Session):`, s.payment_method_types);
        console.log(` Payment Intent Method (actual):`, s.payment_intent?.payment_method_types);
        console.log(` Amount Discount: ${s.total_details?.amount_discount}`);
        console.log('---');
    });
}
debugSessions();
