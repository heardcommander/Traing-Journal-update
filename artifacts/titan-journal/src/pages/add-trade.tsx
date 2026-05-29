import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTrade, getListTradesQueryKey, getGetTradeStatsQueryKey, getGetPnlHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const schema = z.object({
  pair: z.string().min(1, "Required"),
  type: z.enum(["Buy", "Sell"]),
  pnl: z.coerce.number(),
  emotion: z.string().min(1, "Required"),
  setup: z.string().min(1, "Required"),
  notes: z.string().optional(),
  lessonsLearned: z.string().optional(),
  marketSession: z.string().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  tags: z.string().optional(),
  tradedAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EMOTION_OPTIONS = ["Calm", "Focused", "Confident", "Anxious", "Fearful", "Greedy", "FOMO", "Frustrated", "Overconfident", "Excited", "Bored", "Impatient"];
const SETUP_OPTIONS = ["Break and Retest", "Supply Zone Rejection", "Demand Zone", "Trend Follow", "Opening Range Breakout", "Scalp", "News Play", "Gap Fill", "Counter Trend", "Other"];
const SESSION_OPTIONS = ["London", "New York", "Asian", "London/NY Overlap", "Pre-Market", "After Hours"];

export default function AddTrade() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "Buy",
      tradedAt: new Date().toISOString().slice(0, 16),
    },
  });

  const createTrade = useCreateTrade();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  function onSubmit(data: FormData) {
    createTrade.mutate(
      {
        data: {
          pair: data.pair,
          type: data.type,
          pnl: data.pnl,
          emotion: data.emotion,
          setup: data.setup,
          notes: data.notes || undefined,
          lessonsLearned: data.lessonsLearned || undefined,
          marketSession: data.marketSession || undefined,
          stopLoss: data.stopLoss || undefined,
          takeProfit: data.takeProfit || undefined,
          confidence: data.confidence || undefined,
          rating: data.rating || undefined,
          tags: data.tags || undefined,
          tradedAt: data.tradedAt ? new Date(data.tradedAt).toISOString() : undefined,
        },
      },
      {
        onSuccess: (trade) => {
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTradeStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPnlHistoryQueryKey() });
          toast({ title: "Trade logged", description: `${trade.pair} ${trade.type}` });
          setLocation(`/trades/${trade.id}`);
        },
        onError: () => toast({ title: "Failed to save trade", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="page-main max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/trades" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-trades">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="page-title">Log Trade</h1>
          <p className="page-subtitle">Record a new trade in your journal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Core fields */}
        <div className="panel-padded space-y-4">
          <h2 className="stat-label">Core Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency Pair *" error={errors.pair?.message}>
              <input {...register("pair")} placeholder="e.g. EUR/USD" data-testid="input-pair" className={inputCls} />
            </Field>
            <Field label="Direction *" error={errors.type?.message}>
              <select {...register("type")} data-testid="select-type" className={inputCls}>
                <option value="Buy">Buy (Long)</option>
                <option value="Sell">Sell (Short)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="P&L ($) *" error={errors.pnl?.message}>
              <input {...register("pnl")} type="number" step="0.01" placeholder="e.g. 250.00 or -75.00" data-testid="input-pnl" className={inputCls} />
            </Field>
            <Field label="Trade Date & Time" error={errors.tradedAt?.message}>
              <input {...register("tradedAt")} type="datetime-local" data-testid="input-traded-at" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Setup *" error={errors.setup?.message}>
              <select {...register("setup")} data-testid="select-setup" className={inputCls}>
                <option value="">Select setup...</option>
                {SETUP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Emotional State *" error={errors.emotion?.message}>
              <select {...register("emotion")} data-testid="select-emotion" className={inputCls}>
                <option value="">Select emotion...</option>
                {EMOTION_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Risk management */}
        <div className="panel-padded space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Risk Management</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Stop Loss" error={errors.stopLoss?.message}>
              <input {...register("stopLoss")} type="number" step="0.00001" placeholder="e.g. 1.0820" data-testid="input-stop-loss" className={inputCls} />
            </Field>
            <Field label="Take Profit" error={errors.takeProfit?.message}>
              <input {...register("takeProfit")} type="number" step="0.00001" placeholder="e.g. 1.0950" data-testid="input-take-profit" className={inputCls} />
            </Field>
            <Field label="Market Session">
              <select {...register("marketSession")} data-testid="select-session" className={inputCls}>
                <option value="">Select...</option>
                {SESSION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Self assessment */}
        <div className="panel-padded space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Self Assessment</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Confidence (0–100)" error={errors.confidence?.message}>
              <input {...register("confidence")} type="number" min="0" max="100" placeholder="75" data-testid="input-confidence" className={inputCls} />
            </Field>
            <Field label="Rating (1–5)" error={errors.rating?.message}>
              <input {...register("rating")} type="number" min="1" max="5" placeholder="4" data-testid="input-rating" className={inputCls} />
            </Field>
          </div>
          <Field label="Tags (comma-separated)">
            <input {...register("tags")} placeholder="e.g. trend,breakout,high-volume" data-testid="input-tags" className={inputCls} />
          </Field>
        </div>

        {/* Journal */}
        <div className="panel-padded space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Journal</h2>
          <Field label="Trade Notes">
            <textarea {...register("notes")} rows={3} placeholder="What happened? Why did you enter? What was your reasoning?" data-testid="textarea-notes" className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Lessons Learned">
            <textarea {...register("lessonsLearned")} rows={3} placeholder="What would you do differently? What did this trade teach you?" data-testid="textarea-lessons" className={`${inputCls} resize-none`} />
          </Field>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || createTrade.isPending}
            data-testid="button-submit-trade"
            className="btn-primary px-6 disabled:opacity-50"
          >
            {createTrade.isPending ? "Saving..." : "Log Trade"}
          </button>
          <Link href="/trades">
            <button type="button" data-testid="button-cancel" className="px-6 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent/50 transition-colors text-foreground">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputCls = "input-field";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
