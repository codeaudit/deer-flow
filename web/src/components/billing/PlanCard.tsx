import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Plan } from '@/hooks/use-billing';
import { Check } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onUpgrade: (priceId: string) => void;
  isLoading?: boolean;
}

export function PlanCard({ plan, isCurrentPlan, onUpgrade, isLoading }: PlanCardProps) {
  return (
    <Card className={`flex flex-col ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="flex flex-col gap-y-3">
          <span>{plan.name}</span>
          <span className="text-3xl font-bold">
            ${plan.price}
            {plan.price > 0 && <span className="text-xl ml-1 text-muted-foreground">/month</span>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-x-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onUpgrade(plan.priceId)}
          disabled={isLoading || isCurrentPlan}
          variant={isCurrentPlan ? 'outline' : 'default'}
        >
          {isLoading
            ? 'Loading...'
            : isCurrentPlan
            ? 'Current Plan'
            : 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  );
} 