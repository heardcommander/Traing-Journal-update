import { useState } from "react";
import { useListTrades, getListTradesQueryKey, useDeleteTrade } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Trades() {
  const [search, setSearch] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [emotionFilter, setEmotionFilter] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: trades, isLoading } = useListTrades(
    { search: search || undefined, setup: setupFilter || undefined, emotion: emotionFilter || undefined },
    { query: { queryKey: getListTradesQueryKey({ search: search || undefined, setup: setupFilter || undefined, emotion: emotionFilter || undefined }) } }
  );

  const deleteTrade = useDeleteTrade();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function confirmDelete() {
    if (deleteId == null) return;
    deleteTrade.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        toast({ title: "Trade deleted" });
        setDeleteId(null);
      },
      onError: () => { toast({ title: "Delete failed", variant: "destructive" }); setDeleteId(null); },
    });
  }

  function pnlClass(v: number) { return v > 0 ? "profit" : v < 0 ? "loss" : "text-muted-foreground"; }
  function pnlDisplay(v: number) { return v > 0 ? `+$${v.toFixed(2)}` : v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`; }

  const setupOptions = [...new Set(trades?.map((t) => t.setup) ?? [])];
  const emotionOptions = [...new Set(trades?.map((t) => t.emotion) ?? [])];

  return (
    <>
    <AlertDialog open={deleteId != null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the trade from your journal. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete Trade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Trade Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trades?.length ?? 0} trades recorded</p>
        </div>
        <Link href="/trades/new" data-testid="button-add-trade">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Trade
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search pair, setup, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={setupFilter}
          onChange={(e) => setSetupFilter(e.target.value)}
          data-testid="select-setup-filter"
          className="text-sm bg-input border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All setups</option>
          {setupOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={emotionFilter}
          onChange={(e) => setEmotionFilter(e.target.value)}
          data-testid="select-emotion-filter"
          className="text-sm bg-input border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All emotions</option>
          {emotionOptions.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading trades...</div>
        ) : !trades || trades.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground mb-3">No trades found.</p>
            <Link href="/trades/new" className="text-primary text-sm hover:underline" data-testid="link-add-first-trade">Log your first trade</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium">Pair</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Setup</th>
                <th className="px-4 py-2.5 text-left font-medium">Emotion</th>
                <th className="px-4 py-2.5 text-left font-medium">Session</th>
                <th className="px-4 py-2.5 text-left font-medium">Confidence</th>
                <th className="px-4 py-2.5 text-right font-medium">P&L</th>
                <th className="px-4 py-2.5 text-right font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors" data-testid={`row-trade-${t.id}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/trades/${t.id}`} className="font-medium hover:text-primary transition-colors" data-testid={`link-trade-${t.id}`}>
                      {t.pair}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", t.type === "Buy" ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive")}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.setup}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.emotion}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.marketSession ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{t.confidence != null ? `${t.confidence}%` : "—"}</td>
                  <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-medium", pnlClass(t.pnl))} data-testid={`text-pnl-${t.id}`}>
                    {pnlDisplay(t.pnl)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                    {new Date(t.tradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setDeleteId(t.id)}
                      data-testid={`button-delete-trade-${t.id}`}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  );
}
