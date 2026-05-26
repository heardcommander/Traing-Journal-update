import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  BookOpen,
  Brain,
  CheckSquare,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Plus,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<"free" | "pro">("free");

  useEffect(() => {
    authFetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setPlan(d.plan ?? "free"))
      .catch(() => {});
  }, [location]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/trades", label: "Trade Log", icon: BookOpen, exact: true },
    { href: "/import", label: "Import", icon: Upload, exact: true },
    { href: "/stats", label: "Analytics", icon: BarChart2, exact: false },
    { href: "/rituals", label: "Rituals", icon: CheckSquare, exact: false },
    { href: "/ai", label: "AI Coach", icon: Brain, exact: false },
    { href: "/billing", label: "Plan", icon: CreditCard, exact: true },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row bg-background text-foreground">
      <aside className="w-full lg:w-[260px] border-b lg:border-b-0 lg:border-r border-border/60 bg-card/50 backdrop-blur-sm flex flex-col z-10 lg:fixed lg:inset-y-0">
        <div className="flex h-[4.25rem] items-center justify-between px-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight block leading-tight">Titan Journal</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Trading OS</span>
            </div>
          </div>
          <Badge variant={plan === "pro" ? "default" : "secondary"} className="text-[10px] uppercase">
            {plan}
          </Badge>
        </div>

        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <Link href="/trades/new" className="block mb-5 px-1">
            <Button className="w-full shadow-sm" size="default">
              <Plus className="h-4 w-4" />
              Log trade
            </Button>
          </Link>

          <p className="px-3 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Menu
          </p>

          {navItems.map((item) => {
            const isActive = item.exact
              ? location === item.href
              : location === item.href || location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block px-1">
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/60 space-y-3">
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => {
              await signOut();
              setLocation("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:pl-[260px] min-h-screen">
        <div className="h-full p-5 lg:p-8 max-w-6xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
