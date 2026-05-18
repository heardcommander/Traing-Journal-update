import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { useGetPnlHistory } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface DayData {
  date: string;
  dailyPnl: number;
  tradeCount: number;
}

function getIntensityClass(pnl: number, max: number): string {
  if (pnl === 0) return "";
  const ratio = Math.abs(pnl) / max;
  if (pnl > 0) {
    if (ratio > 0.75) return "bg-profit opacity-100";
    if (ratio > 0.4) return "bg-profit opacity-70";
    return "bg-profit opacity-40";
  } else {
    if (ratio > 0.75) return "bg-loss opacity-100";
    if (ratio > 0.4) return "bg-loss opacity-70";
    return "bg-loss opacity-40";
  }
}

function MonthGrid({ year, month, dataMap, maxAbs }: {
  year: number;
  month: number;
  dataMap: Map<string, DayData>;
  maxAbs: number;
}) {
  const firstDay = startOfMonth(new Date(year, month));
  const lastDay = endOfMonth(firstDay);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPad = getDay(firstDay);

  return (
    <div className="flex-shrink-0">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 text-center">
        {format(firstDay, "MMM yyyy")}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[9px] text-muted-foreground text-center font-mono py-0.5">
            {d}
          </div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="w-8 h-8" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const data = dataMap.get(key);
          const pnl = data?.dailyPnl ?? 0;
          const intensityClass = data ? getIntensityClass(pnl, maxAbs) : "";

          return (
            <div
              key={key}
              title={data ? `${key}\nPnL: $${pnl.toFixed(2)}\n${data.tradeCount} trade${data.tradeCount !== 1 ? "s" : ""}` : format(day, "MMM d")}
              className={`w-8 h-8 rounded-[3px] flex items-center justify-center text-[10px] font-mono transition-all cursor-default
                ${data ? intensityClass || "bg-secondary/30" : "bg-secondary/10"}
                ${data ? "hover:ring-1 hover:ring-primary/60" : ""}
              `}
            >
              <span className={`${data ? "text-foreground/80" : "text-muted-foreground/30"} text-[9px]`}>
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarHeatmap() {
  const { data: history, isLoading } = useGetPnlHistory();

  const { dataMap, maxAbs, months } = useMemo(() => {
    const map = new Map<string, DayData>();
    let max = 0;

    for (const entry of history ?? []) {
      map.set(entry.date, entry);
      if (Math.abs(entry.dailyPnl) > max) max = Math.abs(entry.dailyPnl);
    }

    const now = new Date();
    const monthList = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

    return { dataMap: map, maxAbs: max || 1, months: monthList };
  }, [history]);

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-6 overflow-x-auto pb-2">
        {months.map(({ year, month }) => (
          <MonthGrid key={`${year}-${month}`} year={year} month={month} dataMap={dataMap} maxAbs={maxAbs} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-secondary/10" />
          <div className="w-3 h-3 rounded-[2px] bg-profit opacity-30" />
          <div className="w-3 h-3 rounded-[2px] bg-profit opacity-60" />
          <div className="w-3 h-3 rounded-[2px] bg-profit opacity-100" />
        </div>
        <span>More profit</span>
        <span className="mx-2">|</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-loss opacity-30" />
          <div className="w-3 h-3 rounded-[2px] bg-loss opacity-60" />
          <div className="w-3 h-3 rounded-[2px] bg-loss opacity-100" />
        </div>
        <span>More loss</span>
      </div>
    </div>
  );
}
