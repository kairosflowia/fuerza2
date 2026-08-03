import "server-only";import Stripe from "stripe";
export function getStripe(){const key=process.env.STRIPE_SECRET_KEY?.trim();if(!key)throw new Error("Stripe no está configurado.");return new Stripe(key);}
export function stripeConfigured(){return Boolean(process.env.STRIPE_SECRET_KEY?.trim()&&process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()&&process.env.STRIPE_WEBHOOK_SECRET?.trim());}
