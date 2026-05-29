import { useGetTradeStats, useGetPnlHistory, useListTrades, useListRituals, useListRitualCompletions, getListRitualCompletionsQueryKey, useCreateRitualCompletion, useDeleteRitualCompletion } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Target, Activity, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { asArray, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TODAY = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetTradeStats();
  const { data: pnlHistory, isLoading: histLoading } = useGetPnlHistory();
  const { data: trades } = useListTrades();
  const { data: ritualsData } = useListRituals();
  const { data: completionsData } = useListRitualCompletions({ date: TODAY }, { query: { queryKey: getListRitualCompletionsQueryKey({ date: TODAY }) } });
  const rituals = asArray(ritualsData);
  const completions = asArray(completionsData);
  const createCompletion = useCreateRitualCompletion();
  const deleteCompletion = useDeleteRitualCompletion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListRitualCompletionsQueryKey({ date: TODAY }) });

  function toggleRitual(ritualId: number) {
    const existing = completions?.find((c) => c.ritualId === ritualId);
    if (existing) {
      deleteCompletion.mutate({ id: existing.id }, { onSuccess: invalidate });
    } else {
      createCompletion.mutate({ data: { ritualId, completedDate: TODAY } }, { onSuccess: invalidate });
    }
  }

  const completedCount = completions?.length ?? 0;
  const totalRituals = rituals?.length ?? 0;

  const recentTrades = asArray(trades).slice(0, 5);

  const pnlChartData = pnlHistory?.slice(-30) ?? [];

  function pnlClass(v: number) {
    return v > 0 ? "profit" : v < 0 ? "loss" : "text-muted-foreground";
  }
  function pnlDisplay(v: number) {
    return v > 0 ? `+$${v.toFixed(2)}` : v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`;
  }

  return (
    <div className="page-main">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={statsLoading ? "—" : pnlDisplay(stats?.totalPnl ?? 0)}
          valueClass={pnlClass(stats?.totalPnl ?? 0)}
          icon={stats && stats.totalPnl >= 0 ? <TrendingUp className="h-4 w-4 text-chart-2" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          sub={`${stats?.totalTrades ?? 0} trades`}
          data-testid="stat-total-pnl"
        />
        <StatCard
          label="Win Rate"
          value={statsLoading ? "—" : `${(stats?.winRate ?? 0).toFixed(1)}%`}
          valueClass={stats && stats.winRate >= 50 ? "profit" : "loss"}
          icon={<Target className="h-4 w-4 text-primary" />}
          sub={`${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`}
          data-testid="stat-win-rate"
        />
        <StatCard
          label="Best Setup"
          value={stats?.bestSetup ?? "—"}
          valueClass="text-foreground"
          icon={<Activity className="h-4 w-4 text-chart-3" />}
          sub="by total P&L"
          data-testid="stat-best-setup"
        />
        <StatCard
          label="Risk Discipline"
          value={statsLoading ? "—" : `${(stats?.riskDisciplineScore ?? 0).toFixed(0)}%`}
          valueClass={(stats?.riskDisciplineScore ?? 0) >= 70 ? "profit" : "loss"}
          icon={<Activity className="h-4 w-4 text-chart-4" />}
          sub="stops placed"
          data-testid="stat-risk-discipline"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Equity curve */}
        <div className="col-span-2 panel-padded">
          <h2 className="panel-title mb-4">Equity Curve (Last 30 Days)</h2>
          {histLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : pnlChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No trades yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={pnlChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={55} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Cumulative P&L"]}
                />
                <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's rituals */}
        <div className="panel-padded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="panel-title">Today's Rituals</h2>
            <span className="text-xs text-muted-foreground font-mono">{completedCount}/{totalRituals}</span>
          </div>
          {!rituals || rituals.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <Link href="/rituals" className="underline">Add rituals</Link> to track daily habits.
            </div>
          ) : (
            <div className="space-y-2">
              {rituals.map((r) => {
                const done = completions?.some((c) => c.ritualId === r.id);
                return (
                  <button
                    key={r.id}
                    data-testid={`ritual-toggle-${r.id}`}
                    onClick={() => toggleRitual(r.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 text-left text-sm px-2 py-1.5 rounded transition-colors",
                      done ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                      done ? "bg-chart-2 border-chart-2" : "border-border"
                    )}>
                      {done && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <span className={cn("flex-1 line-clamp-1", done && "line-through opacity-60")}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {totalRituals > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-2 rounded-full transition-all"
                  style={{ width: `${totalRituals > 0 ? (completedCount / totalRituals) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="panel-title">Recent Trades</h2>
          <Link href="/trades" className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid="link-all-trades">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No trades yet. <Link href="/trades/new" className="text-primary hover:underline">Log your first trade</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header border-b border-border bg-muted/20">
                <th className="px-4 py-2 text-left font-medium">Pair</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Setup</th>
                <th className="px-4 py-2 text-left font-medium">Emotion</th>
                <th className="px-4 py-2 text-right font-medium">P&L</th>
                <th className="px-4 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/trades/${t.id}`} className="font-medium hover:text-primary transition-colors" data-testid={`trade-pair-${t.id}`}>
                      {t.pair}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={t.type === "Buy" ? "badge-buy" : "badge-sell"}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.setup}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.emotion}</td>
                  <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-medium", pnlClass(t.pnl))} data-testid={`trade-pnl-${t.id}`}>
                    {t.pnl > 0 ? `+$${t.pnl.toFixed(2)}` : t.pnl < 0 ? `-$${Math.abs(t.pnl).toFixed(2)}` : `$${t.pnl.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                    {new Date(t.tradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, valueClass, icon, sub, "data-testid": testId }: { label: string; value: string; valueClass?: string; icon: React.ReactNode; sub?: string; "data-testid"?: string }) {
  return (
    <div className="stat-card" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <p className="stat-label">{label}</p>
        {icon}
      </div>
      <p className={cn("stat-value", valueClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
