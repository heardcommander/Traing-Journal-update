import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { CreditCard, Sparkles, Check, Loader2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/auth-fetch";

interface BillingStatus {
  plan: "free" | "pro";
  email: string | null;
  currentPeriodEnd: string | null;
  payfastConfigured: boolean;
  proPriceZar: string;
  paymentMethods: { payfast: boolean; manualEft: boolean };
}

function submitPayfastForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function Billing() {
  const search = useSearch();
  const { toast } = useToast();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch("/api/billing/status")
      .then((r) => r.json())
      .then((data: BillingStatus) => {
        setStatus(data);
        if (data.email) setEmail(data.email);
      });
  }, []);

  useEffect(() => {
    if (search.includes("success=1")) {
      toast({
        title: "Thanks!",
        description: "Pro unlocks once PayFast confirms (usually under a minute).",
      });
    }
  }, [search, toast]);

  async function payWithPayfast() {
    setLoading(true);
    try {
      const res = await authFetch("/api/billing/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      submitPayfastForm(data.action, data.fields);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Checkout failed", variant: "destructive" });
      setLoading(false);
    }
  }

  const isPro = status?.plan === "pro";
  const price = status?.proPriceZar ?? "149.00";

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan & billing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Built for South Africa — PayFast (card, EFT, SnapScan) or manual EFT. No Stripe required.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isPro ? "default" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
        {status?.currentPeriodEnd && isPro && (
          <span className="text-xs text-muted-foreground">
            Active until {new Date(status.currentPeriodEnd).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          name="Free"
          price="R0"
          active={!isPro}
          features={["Unlimited trades", "CSV import", "Analytics & rituals", "Rule-based AI coach"]}
        />
        <PlanCard
          name="Pro"
          price={`R${price}/mo`}
          active={isPro}
          highlight
          features={["Everything in Free", "GPT AI coach", "Priority features", "Cancel anytime"]}
        />
      </div>

      {!isPro && (
        <Card className="border-primary/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Upgrade with PayFast
            </CardTitle>
            <CardDescription>
              {status?.paymentMethods.payfast
                ? "Pay in ZAR — card, instant EFT, SnapScan, and more."
                : "Add PayFast keys to .env (see DEPLOY-SA.md). Sandbox is free for testing."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={payWithPayfast}
              disabled={loading || !status?.paymentMethods.payfast}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pay R{price} with PayFast
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPro && status?.paymentMethods.manualEft && (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Manual EFT (South Africa)
            </CardTitle>
            <CardDescription>
              No payment gateway yet? Users can EFT you directly; you enable Pro in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Send <strong className="text-foreground">R{price}</strong> via EFT with reference <strong className="font-mono">TITAN-PRO</strong></p>
            <p>2. Email proof of payment to your support address</p>
            <p>3. Run: <code className="text-xs bg-muted px-1 rounded">UPDATE account SET plan = &apos;pro&apos;</code> in Neon SQL (temporary until auth is added)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlanCard({
  name,
  price,
  active,
  highlight,
  features,
}: {
  name: string;
  price: string;
  active: boolean;
  highlight?: boolean;
  features: string[];
}) {
  return (
    <Card className={`border-border/80 ${highlight ? "ring-1 ring-primary/40" : ""} ${active ? "bg-primary/5" : ""}`}>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <p className="text-2xl font-semibold font-mono tracking-tight">{price}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-profit shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
