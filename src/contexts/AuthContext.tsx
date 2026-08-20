import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  currency: string;
}

export interface Branding {
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  defaultTemplate: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  business: Business | null;
  branding: Branding | null;
  businessLoading: boolean;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  business: null,
  branding: null,
  businessLoading: true,
  signOut: async () => {},
  refreshBusiness: async () => {},
});

async function fetchBusiness(token: string) {
  const res = await fetch('/api/businesses/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { business: null, branding: null };
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);

  const loadBusiness = useCallback(async (token: string) => {
    setBusinessLoading(true);
    try {
      const data = await fetchBusiness(token);
      setBusiness(data.business ?? null);
      setBranding(data.branding ?? null);
    } catch {
      setBusiness(null);
      setBranding(null);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  const refreshBusiness = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.access_token) {
      await loadBusiness(currentSession.access_token);
    }
  }, [loadBusiness]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.access_token) {
        loadBusiness(session.access_token);
      } else {
        setBusinessLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.access_token) {
        loadBusiness(session.access_token);
      } else {
        setBusiness(null);
        setBranding(null);
        setBusinessLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadBusiness]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setBusiness(null);
    setBranding(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, business, branding, businessLoading, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
