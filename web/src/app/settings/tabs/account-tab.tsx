import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tab } from "./types";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingSection } from '@/components/billing/BillingSection';

export const AccountTab: Tab = ({ settings, onChange }) => {
  const { user, isLoading: userLoading } = useUser();
  const { account, isLoading: accountLoading } = useAuth();
  const isLoading = userLoading || accountLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Account</h2>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user || !account) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Account</h2>
        </div>
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              Please sign in to view account details
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Account</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Name</label>
                <p className="text-sm">{account.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account ID</label>
                <p className="text-sm font-mono">{account.account_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <p className="text-sm">{account.personal_account ? 'Personal Account' : 'Team Account'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BillingSection />
    </div>
  );
};

AccountTab.displayName = "Account"; 