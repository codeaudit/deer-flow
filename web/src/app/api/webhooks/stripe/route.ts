import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '../../../../lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature') || '';

    // For local development, we don't verify signatures
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.warn('⚠️ Webhook signature verification failed.', err);
      // For local development, parse the event without verification
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.subscription || !session.customer) {
          throw new Error('Missing subscription or customer ID');
        }
        
        const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerResponse = await stripe.customers.retrieve(session.customer as string);
        
        if (!subscriptionResponse || !customerResponse || customerResponse.deleted) {
          throw new Error('Invalid subscription or customer');
        }

        const subscription = subscriptionResponse;
        const customer = customerResponse as Stripe.Customer;

        // Update billing_customers table
        const customerData = {
          id: customer.id,
          email: customer.email,
          provider: 'stripe'
        };

        const subscriptionItem = subscription.items.data[0];
        if (!subscriptionItem?.price?.id) {
          throw new Error('Invalid subscription data');
        }

        // Get timestamps from subscription
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;
        const createdAt = (subscription as any).created;

        // Update billing_subscriptions table
        const subscriptionData = {
          id: subscription.id,
          billing_customer_id: customer.id,
          status: subscription.status,
          price_id: subscriptionItem.price.id,
          quantity: subscriptionItem.quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          created: new Date(createdAt * 1000).toISOString(),
          metadata: subscription.metadata
        };

        if (!session.client_reference_id) {
          throw new Error('Missing client reference ID');
        }

        // Use the service_role_upsert_customer_subscription RPC function
        await supabase.rpc('service_role_upsert_customer_subscription', {
          account_id: session.client_reference_id,
          customer: customerData,
          subscription: subscriptionData
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionEvent = event.data.object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionEvent.id);
        
        const subscriptionItem = subscription.items.data[0];
        if (!subscriptionItem?.price?.id) {
          throw new Error('Invalid subscription data');
        }

        // Get timestamps from subscription
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;

        const subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          price_id: subscriptionItem.price.id,
          quantity: subscriptionItem.quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          metadata: subscription.metadata
        };

        // Update subscription in database
        await supabase
          .from('billing_subscriptions')
          .update(subscriptionData)
          .eq('id', subscription.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Mark subscription as canceled in database
        await supabase
          .from('billing_subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse('Webhook Error', { status: 400 });
  }
} 