import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { BillingService } from '../../../../lib/billing-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    const { priceId, email } = await request.json();
    console.log('Received request:', { priceId, email });

    if (!priceId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const billingService = new BillingService();
    const { sessionId } = await billingService.createCheckoutSession(email, priceId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 