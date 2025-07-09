import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  priceId: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '$5 free AI tokens included',
      'Public projects',
      'Basic Models',
      'Community support'
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE!
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 20,
    features: [
      '$20 AI token credits/month',
      'Private projects',
      'Premium AI Models',
      'Community support'
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS!
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50,
    features: [
      '$50 AI token credits/month',
      'Private projects',
      'Premium AI Models',
      'Community support'
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 200,
    features: [
      '$200 AI token credits/month',
      'Private projects',
      'Premium AI Models',
      'Priority support'
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTRA!
  }
];

export const useBilling = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (priceId: string, email: string) => {
    setIsLoading(true);
    try {
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, email }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        throw new Error(`API error: ${response.status} ${errorData}`);
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error('No sessionId returned from API');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createBillingPortalSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${response.status} ${errorData}`);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    createBillingPortalSession,
    isLoading,
    plans: PLANS
  };
}; 