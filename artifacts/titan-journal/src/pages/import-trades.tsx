import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Upload, FileSpreadsheet, Download, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { asArray } from "@/lib/utils";
import { authFetch } from "@/lib/auth-fetch";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ImportTrades() {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleImport() {
    if (!csv.trim()) {
      toast({ title: "Paste or upload a CSV first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch("/api/trades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0] ?? "Import failed");
      setResult(data);
      queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
      toast({ title: `Imported ${data.imported} trades` });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Import failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import trades</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload broker exports or spreadsheets. Your AI coach and analytics use this history.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            CSV format
          </CardTitle>
          <CardDescription>
            Required: <span className="font-mono text-xs">pair, type, pnl</span>. Optional: emotion, setup, date, notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href={`${base}/sample-trades.csv`} download>
            <Button variant="outline" size="sm" type="button">
              <Download className="h-4 w-4" />
              Download template
            </Button>
          </a>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Upload file
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Paste CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="pair,type,pnl,emotion,setup,date"
            className="w-full min-h-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={handleImport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import trades
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-border/80 bg-muted/20">
          <CardContent className="pt-6 space-y-2 text-sm">
            <p><span className="text-profit font-semibold">{result.imported}</span> trades imported</p>
            {result.skipped > 0 && <p className="text-muted-foreground">{result.skipped} rows skipped</p>}
            {asArray(result.errors).length > 0 && (
              <ul className="text-destructive text-xs font-mono list-disc pl-4">
                {asArray(result.errors).map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
            <Link href="/trades">
              <Button variant="link" className="px-0">
                View trade log <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

