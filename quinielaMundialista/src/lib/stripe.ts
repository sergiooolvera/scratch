import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  console.warn('Stripe Secret Key is missing from environment variables.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any, // Standard stable API version
});
