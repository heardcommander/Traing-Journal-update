import { useState } from "react";
import { useGetTrade, getGetTradeQueryKey, useUpdateTrade, useDeleteTrade, getListTradesQueryKey, getGetTradeStatsQueryKey, getGetPnlHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Edit2, Trash2, Check, X, Star } from "lucide-react";
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

export default function TradeDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const { data: trade, isLoading } = useGetTrade(id, { query: { queryKey: getGetTradeQueryKey(id) } });
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string | number>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading) return <div className="page-main text-sm text-muted-foreground">Loading...</div>;
  if (!trade) return <div className="page-main text-sm text-muted-foreground">Trade not found. <Link href="/trades" className="text-primary">Back to trades</Link></div>;

  function pnlClass(v: number) { return v > 0 ? "profit" : v < 0 ? "loss" : "text-muted-foreground"; }
  function pnlDisplay(v: number) { return v > 0 ? `+$${v.toFixed(2)}` : v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`; }

  function startEdit() {
    setEditData({
      notes: trade?.notes ?? "",
      lessonsLearned: trade?.lessonsLearned ?? "",
      rating: trade?.rating ?? "",
      confidence: trade?.confidence ?? "",
      tags: trade?.tags ?? "",
    });
    setEditing(true);
  }

  function saveEdit() {
    updateTrade.mutate(
      {
        id,
        data: {
          notes: editData.notes as string || undefined,
          lessonsLearned: editData.lessonsLearned as string || undefined,
          rating: editData.rating ? Number(editData.rating) : undefined,
          confidence: editData.confidence ? Number(editData.confidence) : undefined,
          tags: editData.tags as string || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTradeQueryKey(id) });
          setEditing(false);
          toast({ title: "Trade updated" });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    deleteTrade.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTradeStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPnlHistoryQueryKey() });
        toast({ title: "Trade deleted" });
        setLocation("/trades");
      },
      onError: () => toast({ title: "Delete failed", variant: "destructive" }),
    });
  }

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {trade.pair} trade from {new Date(trade.tradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Trade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="page-main max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/trades" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="page-title">{trade.pair}</h1>
              <p className="text-sm text-muted-foreground">{new Date(trade.tradedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={startEdit} data-testid="button-edit" className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent/50 transition-colors text-foreground">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => setShowDeleteDialog(true)} data-testid="button-delete" className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-destructive/50 rounded-md hover:bg-destructive/10 transition-colors text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={saveEdit} disabled={updateTrade.isPending} data-testid="button-save" className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" /> {updateTrade.isPending ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)} data-testid="button-cancel" className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-border rounded-md hover:bg-accent/50 transition-colors text-foreground">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* P&L hero */}
        <div className="panel p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Profit / Loss</p>
            <p className={cn("text-3xl font-mono font-bold tracking-tight", pnlClass(trade.pnl))} data-testid="text-pnl">
              {pnlDisplay(trade.pnl)}
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Direction</p>
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", trade.type === "Buy" ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive")}>
                {trade.type}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Setup</p>
              <p className="font-medium">{trade.setup}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Emotion</p>
              <p className="font-medium">{trade.emotion}</p>
            </div>
            {trade.marketSession && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Session</p>
                <p className="font-medium">{trade.marketSession}</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk & Assessment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="panel p-4 space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Management</h2>
            <DetailRow label="Stop Loss" value={trade.stopLoss != null ? `$${Number(trade.stopLoss).toFixed(5)}` : "—"} />
            <DetailRow label="Take Profit" value={trade.takeProfit != null ? `$${Number(trade.takeProfit).toFixed(5)}` : "—"} />
          </div>
          <div className="panel p-4 space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Self Assessment</h2>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              {editing ? (
                <input
                  type="number" min="0" max="100"
                  value={editData.confidence as string}
                  onChange={(e) => setEditData({ ...editData, confidence: e.target.value })}
                  data-testid="input-confidence"
                  placeholder="0–100"
                  className="w-20 px-2 py-1 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                />
              ) : (
                <p className="text-sm font-medium font-mono">{trade.confidence != null ? `${trade.confidence}%` : "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              {editing ? (
                <input
                  type="number" min="1" max="5"
                  value={editData.rating as string}
                  onChange={(e) => setEditData({ ...editData, rating: e.target.value })}
                  data-testid="input-rating"
                  className="w-20 px-2 py-1 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                />
              ) : (
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={cn("h-4 w-4", s <= (trade.rating ?? 0) ? "text-chart-3 fill-chart-3" : "text-border")} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {(trade.tags || editing) && (
          <div className="panel p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tags</h2>
            {editing ? (
              <input
                value={editData.tags as string}
                onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                placeholder="trend, breakout, ..."
                data-testid="input-tags"
                className="w-full px-3 py-2 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            ) : trade.tags ? (
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.split(",").map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">{tag.trim()}</span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Notes */}
        <div className="panel p-4 space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trade Notes</h2>
          {editing ? (
            <textarea
              value={editData.notes as string}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              rows={4}
              placeholder="What happened during this trade?"
              data-testid="textarea-notes"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground resize-none"
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{trade.notes || <span className="text-muted-foreground italic">No notes recorded</span>}</p>
          )}
        </div>

        {/* Lessons */}
        <div className="panel p-4 space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lessons Learned</h2>
          {editing ? (
            <textarea
              value={editData.lessonsLearned as string}
              onChange={(e) => setEditData({ ...editData, lessonsLearned: e.target.value })}
              rows={4}
              placeholder="What would you do differently?"
              data-testid="textarea-lessons"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring text-foreground resize-none"
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{trade.lessonsLearned || <span className="text-muted-foreground italic">No lessons recorded</span>}</p>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono")}>{value}</p>
    </div>
  );
}
