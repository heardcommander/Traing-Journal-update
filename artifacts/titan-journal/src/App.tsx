import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import AddTrade from "@/pages/add-trade";
import TradeDetail from "@/pages/trade-detail";
import Stats from "@/pages/stats";
import Rituals from "@/pages/rituals";
import AiCoach from "@/pages/ai-coach";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
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

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "/"}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
