import { useGetTradeStats, useGetPnlHistory, useListTrades } from "@workspace/api-client-react";
import { Loader2, TrendingUp, AlertTriangle, BarChart2, Activity, Target, Zap, CalendarDays } from "lucide-react";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className="bg-card border-card-border rounded-sm">
      <CardContent className="p-6">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
        <div className={`text-3xl font-bold font-mono ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-mono">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "2px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
};

const ITEM_STYLE = { color: "hsl(var(--foreground))" };

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetTradeStats();
  const { data: pnlHistory, isLoading: historyLoading } = useGetPnlHistory();
  const { data: trades, isLoading: tradesLoading } = useListTrades();

  const isLoading = statsLoading || historyLoading || tradesLoading;

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const avgWin =
    trades && trades.filter((t) => t.pnl > 0).length > 0
      ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) /
        trades.filter((t) => t.pnl > 0).length
      : 0;

  const avgLoss =
    trades && trades.filter((t) => t.pnl <= 0).length > 0
      ? trades.filter((t) => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) /
        trades.filter((t) => t.pnl <= 0).length
      : 0;

  const rr = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const t of trades ?? []) {
    if (t.pnl > 0) {
      curWin++;
      curLoss = 0;
    } else {
      curLoss++;
      curWin = 0;
    }
    if (curWin > longestWinStreak) longestWinStreak = curWin;
    if (curLoss > longestLossStreak) longestLossStreak = curLoss;
  }

  const profitFactor = stats.losses > 0 ? stats.wins / stats.losses : stats.wins;

  const winLosePieData = [
    { name: "Wins", value: stats.wins, color: "hsl(var(--profit))" },
    { name: "Losses", value: stats.losses, color: "hsl(var(--loss))" },
  ];

  const chartHistory = (pnlHistory ?? []).map((h) => ({
    ...h,
    label: format(new Date(h.date + "T12:00:00"), "MMM d"),
  }));

  const isEquityPositive =
    chartHistory.length > 0
      ? chartHistory[chartHistory.length - 1].cumulativePnl >= 0
      : true;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Every number tells you something. Every pattern tells you more.
        </p>
      </div>

      {/* Top-line metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <div className="col-span-2">
          <StatCard
            label="Total PnL"
            value={`${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toFixed(2)}`}
            sub={`${stats.totalTrades} trades total`}
            accent={stats.totalPnl >= 0}
          />
        </div>
        <div className="col-span-2">
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.wins}W / ${stats.losses}L`}
          />
        </div>
        <div className="col-span-2">
          <StatCard
            label="Profit Factor"
            value={profitFactor > 0 ? profitFactor.toFixed(2) : "—"}
            sub="Wins / Losses"
            accent
          />
        </div>
        <div className="col-span-2">
          <StatCard
            label="Reward:Risk"
            value={rr > 0 ? `${rr.toFixed(2)}:1` : "—"}
            sub={`Avg win $${avgWin.toFixed(0)} / Avg loss $${Math.abs(avgLoss).toFixed(0)}`}
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Avg Win" value={`+$${avgWin.toFixed(2)}`} sub="Per winning trade" />
        <StatCard label="Avg Loss" value={`-$${Math.abs(avgLoss).toFixed(2)}`} sub="Per losing trade" />
        <StatCard
          label="Best Win Streak"
          value={`${longestWinStreak}`}
          sub="Consecutive wins"
          accent
        />
        <StatCard
          label="Worst Loss Streak"
          value={`${longestLossStreak}`}
          sub="Consecutive losses"
        />
      </div>

      {/* Equity Curve */}
      <Card className="bg-card border-card-border rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" /> Equity Curve
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] pt-2">
          {chartHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
              No trade history yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isEquityPositive ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isEquityPositive ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="var(--font-mono)"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  fontFamily="var(--font-mono)"
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                <RechartsTooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={ITEM_STYLE}
                  formatter={(v: number, name: string) => [
                    `$${v.toFixed(2)}`,
                    name === "cumulativePnl" ? "Cumulative PnL" : "Daily PnL",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke={isEquityPositive ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Daily PnL bars + Win/Loss Pie */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="bg-card border-card-border rounded-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Daily PnL
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] pt-2">
              {chartHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                      fontFamily="var(--font-mono)"
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <RechartsTooltip
                      contentStyle={TOOLTIP_STYLE}
                      itemStyle={ITEM_STYLE}
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Daily PnL"]}
                    />
                    <Bar dataKey="dailyPnl" radius={[2, 2, 0, 0]}>
                      {chartHistory.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.dailyPnl >= 0
                              ? "hsl(var(--profit))"
                              : "hsl(var(--loss))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-card-border rounded-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Win / Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] pt-2 flex items-center justify-center">
            {stats.totalTrades === 0 ? (
              <div className="text-muted-foreground font-mono text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLosePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {winLosePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs font-mono text-foreground">{value}</span>
                    )}
                  />
                  <RechartsTooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={ITEM_STYLE}
                    formatter={(v: number) => [v, "Trades"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup + Emotion charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-card-border rounded-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Setup Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {stats.setupBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                No setup data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.setupBreakdown}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="setup"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="var(--font-mono)"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                    fontFamily="var(--font-mono)"
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={ITEM_STYLE}
                    formatter={(v: number, name: string) => [
                      name === "totalPnl" ? `$${v.toFixed(2)}` : `${v.toFixed(1)}%`,
                      name === "totalPnl" ? "Total PnL" : "Win Rate",
                    ]}
                  />
                  <Bar dataKey="totalPnl" radius={[2, 2, 0, 0]}>
                    {stats.setupBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border rounded-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Psychology Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {stats.emotionBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                No emotion data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.emotionBreakdown}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                    fontFamily="var(--font-mono)"
                  />
                  <YAxis
                    type="category"
                    dataKey="emotion"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="var(--font-mono)"
                    width={80}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--border))" />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={ITEM_STYLE}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "PnL"]}
                  />
                  <Bar dataKey="totalPnl" radius={[0, 2, 2, 0]}>
                    {stats.emotionBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap */}
      <Card className="bg-card border-card-border rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Trading Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <CalendarHeatmap />
        </CardContent>
      </Card>

      {/* Setup detail table */}
      <Card className="bg-card border-card-border rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" /> Setup Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.setupBreakdown.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground font-mono text-sm">No data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 font-mono text-xs uppercase text-muted-foreground">Setup</th>
                    <th className="text-right px-6 py-3 font-mono text-xs uppercase text-muted-foreground">Trades</th>
                    <th className="text-right px-6 py-3 font-mono text-xs uppercase text-muted-foreground">Win Rate</th>
                    <th className="text-right px-6 py-3 font-mono text-xs uppercase text-muted-foreground">Total PnL</th>
                    <th className="text-right px-6 py-3 font-mono text-xs uppercase text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...stats.setupBreakdown]
                    .sort((a, b) => b.totalPnl - a.totalPnl)
                    .map((s) => {
                      const grade =
                        s.winRate >= 70 && s.totalPnl > 0
                          ? "A"
                          : s.winRate >= 55 && s.totalPnl > 0
                          ? "B"
                          : s.totalPnl > 0
                          ? "C"
                          : "D";
                      const gradeColor =
                        grade === "A"
                          ? "text-profit"
                          : grade === "B"
                          ? "text-primary"
                          : grade === "C"
                          ? "text-muted-foreground"
                          : "text-loss";
                      return (
                        <tr key={s.setup} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-6 py-4 font-medium">{s.setup}</td>
                          <td className="px-6 py-4 text-right font-mono text-muted-foreground">{s.count}</td>
                          <td className="px-6 py-4 text-right font-mono">{s.winRate.toFixed(1)}%</td>
                          <td className={`px-6 py-4 text-right font-mono font-bold ${s.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                            {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="outline" className={`font-mono rounded-sm text-xs ${gradeColor} border-current`}>
                              {grade}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
