import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { BillingService } from '@/lib/billing-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get customer ID from billing_customers table
    const { data: customerData, error: customerError } = await supabase
      .from('billing_customers')
      .select('id')
      .eq('account_id', session.user.id)
      .single();

    if (customerError || !customerData) {
      return new NextResponse('No billing customer found', { status: 404 });
    }

    const billingService = new BillingService();
    const { url } = await billingService.createBillingPortalSession(customerData.id);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 