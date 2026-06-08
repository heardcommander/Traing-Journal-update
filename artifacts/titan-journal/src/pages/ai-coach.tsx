import { useState } from "react";
import { useAnalyzeTrading } from "@workspace/api-client-react";
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { asArray, cn } from "@/lib/utils";

type AiAnalysis = {
  patterns: string[];
  strengths: string[];
  improvements: string[];
  psychologyInsight: string;
  tipOfTheDay: string;
  generatedAt: string;
};

export default function AiCoach() {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const analyzeTrading = useAnalyzeTrading();

  function runAnalysis() {
    analyzeTrading.mutate({ data: {} }, {
      onSuccess: (data) => setAnalysis(data as unknown as AiAnalysis),
    });
  }

  return (
    <div className="page-main max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">AI Coach</h1>
        <p className="page-subtitle">Pattern analysis and performance insights powered by AI</p>
      </div>

      {!analysis && !analyzeTrading.isPending && (
        <div className="panel p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold mb-1">Analyze Your Trading Patterns</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your AI coach reviews your trade history to identify behavioral patterns, psychological tendencies, and specific improvement opportunities.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            data-testid="button-analyze"
            className="btn-primary px-5"
          >
            <Sparkles className="h-4 w-4" />
            Analyze My Trades
          </button>
        </div>
      )}

      {analyzeTrading.isPending && (
        <div className="panel p-10 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Analyzing your trading patterns...</p>
        </div>
      )}

      {analyzeTrading.isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          Analysis failed. Please try again.
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Tip of the day */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Today's Insight</p>
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed" data-testid="text-tip">{analysis.tipOfTheDay}</p>
          </div>

          {/* Psychology insight */}
          <div className="panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-chart-4 flex-shrink-0" />
              <h2 className="text-sm font-medium">Psychology Profile</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed pl-6" data-testid="text-psychology">{analysis.psychologyInsight}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="panel p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-2 flex-shrink-0" />
                <h2 className="text-sm font-medium">Strengths</h2>
              </div>
              <ul className="space-y-2 pl-6">
                {asArray(analysis.strengths).map((s, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2" data-testid={`text-strength-${i}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-chart-2 flex-shrink-0 mt-1.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="panel p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-chart-3 flex-shrink-0" />
                <h2 className="text-sm font-medium">Areas to Improve</h2>
              </div>
              <ul className="space-y-2 pl-6">
                {asArray(analysis.improvements).map((imp, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2" data-testid={`text-improvement-${i}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-chart-3 flex-shrink-0 mt-1.5" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Patterns */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-medium">Behavioral Patterns</h2>
            <div className="space-y-2">
              {asArray(analysis.patterns).map((p, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`text-pattern-${i}`}>
                  <span className="text-xs font-mono text-muted-foreground flex-shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm text-foreground leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Analysis generated {new Date(analysis.generatedAt).toLocaleString()}
            </p>
            <button
              onClick={runAnalysis}
              disabled={analyzeTrading.isPending}
              data-testid="button-reanalyze"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", analyzeTrading.isPending && "animate-spin")} />
              Run again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
