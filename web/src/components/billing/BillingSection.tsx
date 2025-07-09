import { useUser } from '@/hooks/use-user';
import { useBilling } from '@/hooks/use-billing';
import { PlanCard } from './PlanCard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function BillingSection() {
  const { user } = useUser();
  const { createCheckoutSession, createBillingPortalSession, isLoading, plans } = useBilling();
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string) => {
    try {
      setError(null);
      if (!user?.email) {
        throw new Error('User email not found');
      }
      await createCheckoutSession(priceId, user.email);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      setError('Failed to process upgrade. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    try {
      setError(null);
      await createBillingPortalSession();
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError('Failed to open billing portal. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing</h2>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <Button
          variant="outline"
          onClick={handleManageSubscription}
          disabled={isLoading}
        >
          Manage Subscription
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onUpgrade={handleUpgrade}
            isLoading={isLoading}
            // TODO: Add logic to determine current plan
            isCurrentPlan={plan.id === 'free'}
          />
        ))}
      </div>
    </div>
  );
} 