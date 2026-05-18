export interface ParsedTradeRow {
  pair: string;
  type: "Buy" | "Sell";
  pnl: number;
  emotion: string;
  setup: string;
  notes?: string;
  lessonsLearned?: string;
  marketSession?: string;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  rating?: number;
  tags?: string;
  tradedAt?: Date;
}

const COLUMN_ALIASES: Record<string, keyof ParsedTradeRow | "date"> = {
  pair: "pair",
  symbol: "pair",
  instrument: "pair",
  ticker: "pair",
  type: "type",
  side: "type",
  direction: "type",
  pnl: "pnl",
  profit: "pnl",
  "p&l": "pnl",
  pl: "pnl",
  result: "pnl",
  emotion: "emotion",
  mood: "emotion",
  psychology: "emotion",
  setup: "setup",
  strategy: "setup",
  pattern: "setup",
  notes: "notes",
  note: "notes",
  journal: "notes",
  lessons: "lessonsLearned",
  lessonslearned: "lessonsLearned",
  session: "marketSession",
  marketsession: "marketSession",
  stoploss: "stopLoss",
  sl: "stopLoss",
  takeprofit: "takeProfit",
  tp: "takeProfit",
  confidence: "confidence",
  rating: "rating",
  tags: "tags",
  date: "date",
  tradedat: "date",
  traded_at: "date",
  time: "date",
  datetime: "date",
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeType(raw: string): "Buy" | "Sell" | null {
  const v = raw.trim().toLowerCase();
  if (["buy", "long", "b"].includes(v)) return "Buy";
  if (["sell", "short", "s"].includes(v)) return "Sell";
  return null;
}

function parseDate(raw: string): Date | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function parseTradesCsv(csv: string): { rows: ParsedTradeRow[]; errors: string[] } {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and at least one data row."] };
  }

  const headers = parseCsvLine(lines[0]!).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const colMap: (keyof ParsedTradeRow | "date" | null)[] = headers.map((h) => COLUMN_ALIASES[h] ?? null);

  const rows: ParsedTradeRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const record: Record<string, string> = {};
    for (let c = 0; c < colMap.length; c++) {
      const key = colMap[c];
      if (key && key !== "date") record[key] = cells[c] ?? "";
      if (key === "date") record.date = cells[c] ?? "";
    }

    const pair = (record.pair ?? "").trim();
    const type = normalizeType(record.type ?? "");
    const pnl = parseFloat(String(record.pnl ?? "").replace(/[$,]/g, ""));
    const emotion = (record.emotion ?? "Neutral").trim() || "Neutral";
    const setup = (record.setup ?? "Imported").trim() || "Imported";

    if (!pair) {
      errors.push(`Row ${i + 1}: missing pair/symbol`);
      continue;
    }
    if (!type) {
      errors.push(`Row ${i + 1}: invalid type (use Buy/Sell or Long/Short)`);
      continue;
    }
    if (Number.isNaN(pnl)) {
      errors.push(`Row ${i + 1}: invalid PnL`);
      continue;
    }

    const row: ParsedTradeRow = {
      pair,
      type,
      pnl,
      emotion,
      setup,
      notes: record.notes || undefined,
      lessonsLearned: record.lessonsLearned || undefined,
      marketSession: record.marketSession || undefined,
      tradedAt: parseDate(record.date ?? "") ?? new Date(),
    };

    if (record.stopLoss) {
      const sl = parseFloat(record.stopLoss.replace(/[$,]/g, ""));
      if (!Number.isNaN(sl)) row.stopLoss = sl;
    }
    if (record.takeProfit) {
      const tp = parseFloat(record.takeProfit.replace(/[$,]/g, ""));
      if (!Number.isNaN(tp)) row.takeProfit = tp;
    }
    if (record.confidence) {
      const c = parseInt(record.confidence, 10);
      if (!Number.isNaN(c)) row.confidence = c;
    }
    if (record.rating) {
      const r = parseInt(record.rating, 10);
      if (!Number.isNaN(r)) row.rating = r;
    }
    if (record.tags) row.tags = record.tags;

    rows.push(row);
  }

  return { rows, errors };
}
