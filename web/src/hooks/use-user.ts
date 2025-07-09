import { useAuth } from '@/components/auth/AuthProvider';

export function useUser() {
  const { user, isLoading } = useAuth();

  return {
    user: user ? {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name,
    } : null,
    isLoading,
  };
} 