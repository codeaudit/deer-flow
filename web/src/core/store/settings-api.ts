import { resolveServiceURL } from "@/core/api/resolve-service-url";
import { createBrowserClient } from "@supabase/ssr";

// Helper to get the current session token (async)
async function getAccessToken() {
  if (typeof window === "undefined") return undefined;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function fetchSettings(): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(resolveServiceURL("settings"), {
    method: 'GET',
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return data.settings;
}

export async function updateSettings(settings: any): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(resolveServiceURL("settings"), {
    method: 'POST',
    headers,
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  const data = await res.json();
  return data.settings;
} 