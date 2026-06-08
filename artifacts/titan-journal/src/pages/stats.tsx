import { useGetTradeStats, useGetPnlHistory } from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { asArray, cn } from "@/lib/utils";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetTradeStats();
  const { data: pnlHistory, isLoading: histLoading } = useGetPnlHistory();
  const pnlHistoryData = asArray(pnlHistory);

  function pnlClass(v: number) { return v > 0 ? "profit" : v < 0 ? "loss" : "text-muted-foreground"; }
  function pnlSign(v: number) { return v > 0 ? "+" : ""; }

  const chartTooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="page-main">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance breakdown across all your trades</p>
      </div>

      {statsLoading ? (
        <div className="text-sm text-muted-foreground">Loading stats...</div>
      ) : !stats || typeof stats.totalTrades !== "number" || stats.totalTrades === 0 ? (
        <div className="text-sm text-muted-foreground">No trades yet. Start logging to see analytics.</div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-5 gap-3">
            <MiniStat label="Total Trades" value={String(stats.totalTrades)} />
            <MiniStat label="Total P&L" value={`${pnlSign(stats.totalPnl)}$${Math.abs(stats.totalPnl).toFixed(2)}`} valueClass={pnlClass(stats.totalPnl)} />
            <MiniStat label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} valueClass={stats.winRate >= 50 ? "profit" : "loss"} />
            <MiniStat label="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} />
            <MiniStat label="Risk Discipline" value={`${stats.riskDisciplineScore.toFixed(0)}%`} valueClass={stats.riskDisciplineScore >= 70 ? "profit" : "loss"} />
          </div>

          {/* Equity curve */}
          <div className="panel-padded">
            <h2 className="panel-title mb-4">Cumulative P&L</h2>
            {histLoading || pnlHistoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={pnlHistoryData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, "Cumulative P&L"]} />
                  <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Setup breakdown */}
            <div className="panel-padded">
              <h2 className="panel-title mb-4">P&L by Setup</h2>
              {asArray(stats?.setupBreakdown).length === 0 ? (
                <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={asArray(stats?.setupBreakdown)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="setup" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={55} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, "Total P&L"]} />
                    <Bar dataKey="totalPnl" radius={[3, 3, 0, 0]}>
                      {asArray(stats?.setupBreakdown).map((entry, i) => (
                        <Cell key={i} fill={entry.totalPnl >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Emotion breakdown */}
            <div className="panel-padded">
              <h2 className="panel-title mb-4">P&L by Emotion</h2>
              {asArray(stats?.emotionBreakdown).length === 0 ? (
                <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={asArray(stats?.emotionBreakdown)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="emotion" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={55} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, "Total P&L"]} />
                    <Bar dataKey="totalPnl" radius={[3, 3, 0, 0]}>
                      {asArray(stats?.emotionBreakdown).map((entry, i) => (
                        <Cell key={i} fill={entry.totalPnl >= 0 ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Setup detail table */}
          <div className="panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Setup Performance Detail</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium">Setup</th>
                  <th className="px-4 py-2.5 text-right font-medium">Trades</th>
                  <th className="px-4 py-2.5 text-right font-medium">Win Rate</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total P&L</th>
                </tr>
              </thead>
              <tbody>
                 {asArray(stats?.setupBreakdown).sort((a, b) => b.totalPnl - a.totalPnl).map((s) => (
                  <tr key={s.setup} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{s.setup}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{s.count}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs", s.winRate >= 50 ? "profit" : "loss")}>{s.winRate.toFixed(1)}%</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-medium", pnlClass(s.totalPnl))}>
                      {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="stat-card p-4">
      <p className="stat-label mb-2">{label}</p>
      <p className={cn("text-lg font-semibold font-mono tracking-tight tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}
