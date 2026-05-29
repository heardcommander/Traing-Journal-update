import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, PlusCircle, BarChart2, CheckSquare, Brain, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/trades", label: "Trade Log", icon: BookOpen, exact: true },
  { href: "/trades/new", label: "Add Trade", icon: PlusCircle, exact: true },
  { href: "/stats", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/rituals", label: "Rituals", icon: CheckSquare, exact: false },
  { href: "/ai", label: "AI Coach", icon: Brain, exact: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground block leading-tight">
                Titan Journal
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">
                Performance Tracker
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary/12 text-primary font-medium shadow-sm ring-1 ring-primary/20"
                    : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground font-medium">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto app-glow relative">
        {children}
      </main>
    </div>
  );
}
