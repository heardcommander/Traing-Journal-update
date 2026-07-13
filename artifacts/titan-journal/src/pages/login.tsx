import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Activity } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function useLoginRedirectTarget() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
    return "/";
  }, []);
}

export default function Login() {
  const { signIn, signUp, session, configError } = useAuth();
  const [, setLocation] = useLocation();
  const redirectTo = useLoginRedirectTarget();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) {
      setLocation(redirectTo);
    }
  }, [session, redirectTo, setLocation]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setMessage("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }

    setLocation(redirectTo);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Titan Journal</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Sign in to your trading journal" : "Create an account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {configError}
            </div>
          ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          )}
          {!configError && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
