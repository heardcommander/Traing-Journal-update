import { useEffect, useState, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { LoadingScreen } from "@/components/loading-screen";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import AddTrade from "@/pages/add-trade";
import TradeDetail from "@/pages/trade-detail";
import Stats from "@/pages/stats";
import Rituals from "@/pages/rituals";
import AiCoach from "@/pages/ai-coach";
import ImportTrades from "@/pages/import-trades";
import Billing from "@/pages/billing";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {session ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route>
        <RequireAuth>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/trades/new" component={AddTrade} />
              <Route path="/trades/:id" component={TradeDetail} />
              <Route path="/trades" component={Trades} />
              <Route path="/import" component={ImportTrades} />
              <Route path="/stats" component={Stats} />
              <Route path="/billing" component={Billing} />
              <Route path="/rituals" component={Rituals} />
              <Route path="/ai" component={AiCoach} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function AppInner() {
  const [ready, setReady] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const timer = setTimeout(() => setReady(true), loading ? 150 : 500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <LoadingScreen isLoading={!ready || loading}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRoutes />
      </WouterRouter>
    </LoadingScreen>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppInner />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
