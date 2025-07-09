"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LandingHeader() {
  const [userInfo, setUserInfo] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    // Using getSession() for UI state management (acceptable for client-side display logic)
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        setUserInfo(session.user.email || session.user.user_metadata?.full_name || "User");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setUserInfo(session.user.email || session.user.user_metadata?.full_name || "User");
      } else {
        setUserInfo(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserInfo(null);
  };

  return (
    <header className="supports-backdrop-blur:bg-background/80 bg-background/40 sticky top-0 left-0 z-40 flex h-15 w-full flex-col items-center backdrop-blur-lg">
      <div className="container flex h-15 items-center justify-between px-3">
        <Link href="/" className="text-xl font-medium hover:opacity-80 transition-opacity">
          <span className="mr-1 text-2xl">🦌</span>
          DeerFlow
        </Link>
        <div className="flex items-center gap-4">
          {userInfo ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                  {userInfo}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline">
              <Link href="/auth">
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 