import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase, supabaseConfigError } from "@/lib/supabase";

export type AuthResult = {
  error: string | null;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Wrong email or password. Try again or sign up.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirm your email first (check inbox), or disable email confirmation in Supabase for local dev.";
  }
  if (message.includes("User already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!supabase) return null;
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch((error) => {
        console.error("Supabase session fetch failed", error);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      try {
        const subscription = (sub as { subscription?: { unsubscribe?: () => void } })?.subscription ?? sub;
        subscription?.unsubscribe?.();
      } catch {
        // cleanup best-effort only
      }
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: supabaseConfigError ?? "Authentication is not configured." };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { error: friendlyAuthError(error.message) };
    }
    if (data.session) {
      setSession(data.session);
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { error: supabaseConfigError ?? "Authentication is not configured." };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      return { error: friendlyAuthError(error.message) };
    }
    if (data.session) {
      setSession(data.session);
      return { error: null };
    }
    return {
      error: null,
      needsEmailConfirmation: true,
    };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configError: supabaseConfigError,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
