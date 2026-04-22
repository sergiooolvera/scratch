require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.checkout.sessions.list({limit:10}).then(res => {
    console.log(JSON.stringify(res.data.map(s => ({id: s.id, metadata: s.metadata, email: s.customer_details?.email, amount: s.amount_total, payment_status: s.payment_status})), null, 2));
});
