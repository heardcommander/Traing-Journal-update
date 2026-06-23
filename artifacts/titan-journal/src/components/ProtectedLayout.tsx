import { useEffect, type ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import AddTrade from "@/pages/add-trade";
import TradeDetail from "@/pages/trade-detail";
import Stats from "@/pages/stats";
import Rituals from "@/pages/rituals";
import AiCoach from "@/pages/ai-coach";
import NotFound from "@/pages/not-found";

function LoadingScreen({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      {children ?? "Loading…"}
    </div>
  );
}

export default function ProtectedLayout() {
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      setLocation(`/login?next=${next}`);
    }
  }, [loading, session, setLocation]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return null;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/trades/new" component={AddTrade} />
        <Route path="/trades/:id" component={TradeDetail} />
        <Route path="/trades" component={Trades} />
        <Route path="/stats" component={Stats} />
        <Route path="/rituals" component={Rituals} />
        <Route path="/ai" component={AiCoach} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}
