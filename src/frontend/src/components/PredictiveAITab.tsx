import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Brain,
  DollarSign,
  Flame,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStores } from "../hooks/useQueries";
import type { Store } from "../types";
import {
  formatCurrency,
  getChurnRisk,
  linearRegressionForecast,
} from "../utils/predictions";
import { OrnamentalCard } from "./OrnamentalCard";

// ── Palette ────────────────────────────────────────────────────────────────────
const NAVY = "#1A1A2E";
const BLUE_PRIMARY = "#4A7CF7";
const CORNFLOWER = "#5B8DEF";
const MIST = "#4a6fa8";
const SKY_BLUE = "#A0B8F0";
const BORDER = "#DCE4F5";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan+1",
  "Feb+1",
  "Mar+1",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Safely normalise a store's revenue array — filters non-finite values. */
function safeRevenue(store: Store): number[] {
  if (!Array.isArray(store.revenue)) return [];
  return store.revenue.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
}

/** Linear slope of a series; 0 for empty / degenerate series. */
function getSlope(revenue: number[]): number {
  const n = revenue.length;
  if (n < 2) return 0;
  const sumX = (n * (n - 1)) / 2; // 0+1+…+(n-1)
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = revenue.reduce((a, b) => a + b, 0);
  const sumXY = revenue.reduce((acc, y, i) => acc + i * y, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/** Forecasted growth % over next `ahead` months vs. historical average. */
function growthPercent(revenue: number[], ahead = 3): number {
  if (revenue.length === 0) return 0;
  const avg = revenue.reduce((a, b) => a + b, 0) / revenue.length;
  if (avg === 0) return 0;
  const forecast = linearRegressionForecast(revenue, ahead);
  const forecasted = forecast[ahead - 1] ?? 0;
  return ((forecasted - avg) / avg) * 100;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-medium tracking-widest uppercase mb-1"
      style={{ color: MIST, letterSpacing: "0.12em" }}
    >
      {children}
    </p>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
  bg?: string;
}

function InsightCard({
  icon,
  label,
  value,
  sub,
  accentColor,
  bg,
}: InsightCardProps) {
  return (
    <OrnamentalCard
      className="flex-1 min-w-0"
      padding="p-0"
      style={{ background: bg ?? "#FFFFFF" }}
    >
      <div className="pt-4 md:pt-6 pb-4 md:pb-5 px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-medium tracking-widest uppercase mb-2"
              style={{ color: MIST, letterSpacing: "0.12em" }}
            >
              {label}
            </p>
            <p
              className="font-display text-2xl font-semibold leading-tight"
              style={{ color: accentColor ?? NAVY }}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs mt-1" style={{ color: MIST }}>
                {sub}
              </p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded flex items-center justify-center shrink-0"
            style={{ background: accentColor ? `${accentColor}22` : "#EEF2FF" }}
          >
            {icon}
          </div>
        </div>
      </div>
    </OrnamentalCard>
  );
}

interface ChurnGroup {
  level: "high" | "medium" | "low";
  stores: Store[];
}

const CHURN_CONFIG = {
  high: {
    label: "High Risk",
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />,
  },
  medium: {
    label: "Medium Risk",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: <ShieldCheck className="w-4 h-4" style={{ color: "#F59E0B" }} />,
  },
  low: {
    label: "Low Risk",
    color: "#22C55E",
    bg: "#F0FDF4",
    icon: <ShieldCheck className="w-4 h-4" style={{ color: "#22C55E" }} />,
  },
} as const;

function ChurnColumn({ level, stores }: ChurnGroup) {
  const cfg = CHURN_CONFIG[level];
  return (
    <div className="flex-1 min-w-0">
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ background: cfg.bg, borderColor: BORDER }}
      >
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: cfg.color, letterSpacing: "0.08em" }}
          >
            {cfg.label}
          </span>
        </div>
        <Badge
          className="text-xs font-bold"
          style={
            {
              background: cfg.color,
              color: "#fff",
              border: "none",
            } as React.CSSProperties
          }
        >
          {stores.length}
        </Badge>
      </div>
      <ScrollArea
        className="h-48 border-x border-b rounded-b"
        style={{ borderColor: BORDER }}
      >
        <div className="p-2 space-y-1">
          {stores.length === 0 ? (
            <p
              className="text-xs text-center py-4 tracking-wider uppercase"
              style={{ color: MIST }}
            >
              None
            </p>
          ) : (
            stores.map((s) => (
              <div
                key={s.id}
                className="rounded px-3 py-2 flex items-center justify-between gap-2"
                style={{ background: cfg.bg }}
              >
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: NAVY }}
                >
                  {s.name}
                </span>
                <span
                  className="text-[10px] shrink-0 rounded-sm px-1.5 py-0.5 tracking-wider uppercase font-semibold"
                  style={{
                    color: cfg.color,
                    background: `${cfg.color}20`,
                    letterSpacing: "0.05em",
                    fontSize: "0.58rem",
                  }}
                >
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StoreRankCard({
  rank,
  store,
  pct,
  growing,
}: {
  rank: number;
  store: Store;
  pct: number;
  growing: boolean;
}) {
  const accentColor = growing ? "#22C55E" : "#EF4444";
  const bgColor = growing ? "#F0FDF4" : "#FEF2F2";
  return (
    <OrnamentalCard padding="p-3" style={{ background: "#FFFFFF" }}>
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: BLUE_PRIMARY, color: "#fff" }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: NAVY }}>
            {store.name}
          </p>
          <p
            className="text-[10px] tracking-wider uppercase"
            style={{ color: MIST }}
          >
            {store.brand}
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-bold"
          style={{ background: bgColor, color: accentColor }}
        >
          {growing ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(pct).toFixed(1)}%
        </div>
      </div>
    </OrnamentalCard>
  );
}

// ── Store Prediction Lookup ────────────────────────────────────────────────────

interface StorePrediction {
  store: Store;
  churnRisk: "high" | "medium" | "low";
  slope: number;
  pct: number;
  forecast: number[];
  avg: number;
}

function StorePredictionLookup({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StorePrediction | null>(null);

  const results = useMemo<StorePrediction[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stores
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
      .slice(0, 8)
      .map((store) => {
        const rev = safeRevenue(store).slice(0, 12);
        const forecast = linearRegressionForecast(rev, 3);
        const avg =
          rev.length > 0 ? rev.reduce((a, b) => a + b, 0) / rev.length : 0;
        return {
          store,
          churnRisk: getChurnRisk(store.status),
          slope: getSlope(rev),
          pct: growthPercent(rev),
          forecast,
          avg,
        };
      });
  }, [query, stores]);

  const churnCfg = selected ? CHURN_CONFIG[selected.churnRisk] : null;

  return (
    <OrnamentalCard padding="p-0" data-ocid="ai.lookup.panel">
      <div className="pb-3 pt-6 px-6">
        <SectionLabel>Store Intelligence</SectionLabel>
        <h3
          className="font-display text-base font-semibold flex items-center gap-2"
          style={{ color: NAVY }}
        >
          <Search className="w-4 h-4" style={{ color: BLUE_PRIMARY }} />
          Store Prediction Lookup
        </h3>
      </div>
      <div className="px-6 pb-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4"
            style={{ color: MIST }}
          />
          <Input
            data-ocid="ai.lookup.search_input"
            placeholder="Search by store name or brand…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="pl-9 text-sm rounded-lg border"
            style={{
              borderColor: BORDER,
              color: NAVY,
              background: "#FAFBFF",
            }}
          />
        </div>

        {/* Results list */}
        {query.trim() !== "" && results.length === 0 && (
          <p
            className="text-xs text-center py-3 tracking-wider uppercase"
            style={{ color: MIST }}
            data-ocid="ai.lookup.empty_state"
          >
            No stores match your search
          </p>
        )}

        {results.length > 0 && !selected && (
          <div className="space-y-1" data-ocid="ai.lookup.list">
            {results.map((r, i) => (
              <button
                key={r.store.id}
                type="button"
                data-ocid={`ai.lookup.item.${i + 1}`}
                onClick={() => setSelected(r)}
                className="w-full text-left rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 hover:bg-blue-50/60"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: NAVY }}
                  >
                    {r.store.name}
                  </p>
                  <p
                    className="text-[10px] tracking-wider uppercase"
                    style={{ color: MIST }}
                  >
                    {r.store.brand}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider"
                    style={{
                      color: CHURN_CONFIG[r.churnRisk].color,
                      background: `${CHURN_CONFIG[r.churnRisk].color}18`,
                    }}
                  >
                    {r.store.status}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-bold"
                    style={{ color: r.slope >= 0 ? "#22C55E" : "#EF4444" }}
                  >
                    {r.slope >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(r.pct).toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected store detail */}
        {selected && churnCfg && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  {selected.store.name}
                </p>
                <p
                  className="text-[10px] tracking-wider uppercase"
                  style={{ color: MIST }}
                >
                  {selected.store.brand}
                </p>
              </div>
              <button
                type="button"
                data-ocid="ai.lookup.close_button"
                onClick={() => setSelected(null)}
                className="text-xs px-3 py-1 rounded border transition-colors hover:bg-blue-50/60"
                style={{ borderColor: BORDER, color: MIST }}
              >
                ← Back
              </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className="rounded-lg px-3 py-3 border"
                style={{ borderColor: BORDER, background: "#FAFBFF" }}
              >
                <p
                  className="text-[10px] tracking-widest uppercase mb-1"
                  style={{ color: MIST }}
                >
                  Status
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: churnCfg.color }}
                >
                  {selected.store.status}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-3 border"
                style={{ borderColor: BORDER, background: "#FAFBFF" }}
              >
                <p
                  className="text-[10px] tracking-widest uppercase mb-1"
                  style={{ color: MIST }}
                >
                  Churn Risk
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: churnCfg.color }}
                >
                  {churnCfg.label}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-3 border"
                style={{ borderColor: BORDER, background: "#FAFBFF" }}
              >
                <p
                  className="text-[10px] tracking-widest uppercase mb-1"
                  style={{ color: MIST }}
                >
                  Avg Monthly
                </p>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  {formatCurrency(selected.avg)}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-3 border"
                style={{ borderColor: BORDER, background: "#FAFBFF" }}
              >
                <p
                  className="text-[10px] tracking-widest uppercase mb-1"
                  style={{ color: MIST }}
                >
                  Growth Trend
                </p>
                <p
                  className="text-sm font-semibold flex items-center gap-1"
                  style={{ color: selected.slope >= 0 ? "#22C55E" : "#EF4444" }}
                >
                  {selected.slope >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(selected.pct).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* 3-month forecast */}
            <div>
              <p
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: MIST, letterSpacing: "0.12em" }}
              >
                3-Month Revenue Forecast
              </p>
              <div className="flex gap-2">
                {(["Jan+1", "Feb+1", "Mar+1"] as const).map((label, i) => (
                  <div
                    key={label}
                    className="flex-1 rounded-lg border px-3 py-2.5 text-center"
                    style={{ borderColor: BORDER, background: "#FAFBFF" }}
                  >
                    <p
                      className="text-[10px] tracking-wider uppercase mb-1"
                      style={{ color: MIST }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: BLUE_PRIMARY }}
                    >
                      {formatCurrency(selected.forecast[i] ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </OrnamentalCard>
  );
}

// ── Chart tooltip value formatter ──────────────────────────────────────────────
function tooltipFormatter(
  value: number | string | Array<number | string>,
): [string, string] {
  const num = typeof value === "number" ? value : Number(value);
  return [formatCurrency(Number.isFinite(num) ? num : 0), ""];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PredictiveAITab() {
  const { data: stores = [], isLoading } = useStores();

  if (isLoading) {
    return (
      <div
        className="p-8 space-y-4"
        data-ocid="ai.loading_state"
        style={{ background: "transparent" }}
      >
        {(["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"] as const).map(
          (k) => (
            <Skeleton key={k} className="h-32 w-full rounded" />
          ),
        )}
      </div>
    );
  }

  // ── Portfolio forecast ────────────────────────────────────────────────────────
  const portfolioMonthly: number[] = Array(12).fill(0);
  for (const s of stores) {
    const rev = safeRevenue(s).slice(0, 12);
    for (let i = 0; i < 12; i++) {
      portfolioMonthly[i] += rev[i] ?? 0;
    }
  }
  const portfolioForecast = linearRegressionForecast(portfolioMonthly, 3);
  const chartData = MONTH_LABELS.map((month, i) => ({
    month,
    revenue: i < 12 ? portfolioMonthly[i] : null,
    forecast:
      i >= 11
        ? i === 11
          ? portfolioMonthly[11]
          : portfolioForecast[i - 12]
        : null,
  }));

  // ── Churn risk ────────────────────────────────────────────────────────────────
  const churnGroups: Record<"high" | "medium" | "low", Store[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const s of stores) {
    churnGroups[getChurnRisk(s.status)].push(s);
  }

  // ── Store growth sorting ──────────────────────────────────────────────────────
  const withSlope = stores.map((s) => {
    const rev = safeRevenue(s).slice(0, 12);
    return { store: s, slope: getSlope(rev), pct: growthPercent(rev) };
  });
  const fastest = [...withSlope]
    .filter((x) => x.slope > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  const declining = [...withSlope]
    .filter((x) => x.slope < 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  // ── AI Insight metrics ────────────────────────────────────────────────────────
  const highRiskCount = churnGroups.high.length;
  const projectedQ = portfolioForecast.reduce((a, b) => a + b, 0);

  const brandGrowth: Record<string, number[]> = {};
  for (const { store, pct } of withSlope) {
    if (!brandGrowth[store.brand]) brandGrowth[store.brand] = [];
    brandGrowth[store.brand].push(pct);
  }
  const topBrand =
    Object.entries(brandGrowth)
      .map(([brand, pcts]) => ({
        brand,
        avg: pcts.reduce((a, b) => a + b, 0) / pcts.length,
      }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;

  const decliningCount = withSlope.filter((x) => x.slope < 0).length;
  const growingCount = withSlope.filter((x) => x.slope > 0).length;

  return (
    <div
      className="p-4 md:p-8 space-y-6 md:space-y-8"
      style={{ background: "transparent", minHeight: "100%" }}
      data-ocid="ai.section"
    >
      {/* Page header */}
      <div className="border-b pb-6" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded flex items-center justify-center"
            style={{ background: BLUE_PRIMARY }}
          >
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p
              className="text-[10px] font-medium tracking-widest uppercase mb-1"
              style={{ color: MIST, letterSpacing: "0.12em" }}
            >
              Machine Learning
            </p>
            <h2
              className="font-display text-2xl font-semibold"
              style={{ color: NAVY }}
            >
              Predictive AI Insights
            </h2>
          </div>
        </div>
      </div>

      {/* Insight cards row */}
      <div data-ocid="ai.panel">
        <SectionLabel>Key Signals</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          <InsightCard
            icon={
              <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
            }
            label="High Churn Risk"
            value={String(highRiskCount)}
            sub="Require immediate attention"
            accentColor="#EF4444"
            bg="#FEF2F2"
          />
          <InsightCard
            icon={
              <DollarSign className="w-5 h-5" style={{ color: BLUE_PRIMARY }} />
            }
            label="Portfolio Forecast (Qtr)"
            value={formatCurrency(projectedQ)}
            sub="Combined revenue projection"
            accentColor={NAVY}
          />
          <InsightCard
            icon={<Flame className="w-5 h-5" style={{ color: CORNFLOWER }} />}
            label="Top Performing Brand"
            value={topBrand?.brand ?? "—"}
            sub={
              topBrand ? `${topBrand.avg.toFixed(1)}% avg growth` : undefined
            }
            accentColor={BLUE_PRIMARY}
          />
          <InsightCard
            icon={
              <TrendingDown className="w-5 h-5" style={{ color: "#EF4444" }} />
            }
            label="Declining Stores"
            value={String(decliningCount)}
            sub="Negative revenue trend"
            accentColor="#EF4444"
          />
          <InsightCard
            icon={
              <TrendingUp className="w-5 h-5" style={{ color: "#22C55E" }} />
            }
            label="Growing Stores"
            value={String(growingCount)}
            sub="Positive revenue trend"
            accentColor="#22C55E"
            bg="#F0FDF4"
          />
          <InsightCard
            icon={
              <Sparkles className="w-5 h-5" style={{ color: CORNFLOWER }} />
            }
            label="Total Stores Tracked"
            value={String(stores.length)}
            sub="Across all brands"
            accentColor={NAVY}
          />
        </div>
      </div>

      {/* Portfolio Revenue Forecast chart */}
      <OrnamentalCard padding="p-0">
        <div className="pb-2 pt-6 px-6">
          <SectionLabel>Revenue Trends</SectionLabel>
          <div className="flex items-center gap-2">
            <h3
              className="font-display text-base font-semibold flex items-center gap-2"
              style={{ color: NAVY }}
            >
              <DollarSign className="w-4 h-4" style={{ color: BLUE_PRIMARY }} />
              Portfolio Revenue Forecast
            </h3>
            <Badge
              className="text-[10px] ml-auto font-medium tracking-wider uppercase"
              style={
                {
                  background: "#EEF2FF",
                  color: BLUE_PRIMARY,
                  border: "none",
                  letterSpacing: "0.06em",
                } as React.CSSProperties
              }
            >
              12 months + 3-month forecast
            </Badge>
          </div>
        </div>
        <div className="pt-0 px-2 pb-6">
          {/* Explicit pixel height required for ResponsiveContainer to size correctly */}
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={BLUE_PRIMARY}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={BLUE_PRIMARY}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SKY_BLUE} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={SKY_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: MIST }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: MIST }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `$${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `$${(v / 1_000).toFixed(0)}K`
                        : `$${v}`
                  }
                  width={60}
                />
                <Tooltip
                  formatter={tooltipFormatter}
                  contentStyle={{
                    background: "#FFFFFF",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: NAVY,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={BLUE_PRIMARY}
                  strokeWidth={1.5}
                  fill="url(#revenueGrad)"
                  connectNulls={false}
                  dot={false}
                  name="Historical"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke={SKY_BLUE}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  fill="url(#forecastGrad)"
                  connectNulls={false}
                  dot={false}
                  name="Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2 justify-end px-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-px" style={{ background: BLUE_PRIMARY }} />
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ color: MIST }}
              >
                Historical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-px border-dashed border-t"
                style={{ borderColor: SKY_BLUE }}
              />
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ color: MIST }}
              >
                Forecast
              </span>
            </div>
          </div>
        </div>
      </OrnamentalCard>

      {/* Churn Risk Breakdown */}
      <OrnamentalCard padding="p-0">
        <div className="pb-3 pt-6 px-6">
          <SectionLabel>Risk Assessment</SectionLabel>
          <h3
            className="font-display text-base font-semibold flex items-center gap-2"
            style={{ color: NAVY }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
            Churn Risk Breakdown
          </h3>
        </div>
        <div className="pt-0 px-6 pb-6">
          <div
            className="flex flex-col sm:flex-row gap-3"
            data-ocid="ai.churn.panel"
          >
            <ChurnColumn level="high" stores={churnGroups.high} />
            <ChurnColumn level="medium" stores={churnGroups.medium} />
            <ChurnColumn level="low" stores={churnGroups.low} />
          </div>
        </div>
      </OrnamentalCard>

      {/* Growth tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OrnamentalCard padding="p-0" data-ocid="ai.growing.panel">
          <div className="pb-3 pt-6 px-6">
            <SectionLabel>Performance</SectionLabel>
            <h3
              className="font-display text-base font-semibold flex items-center gap-2"
              style={{ color: NAVY }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: "#22C55E" }} />
              Fastest Growing Stores
            </h3>
          </div>
          <div className="pt-0 px-6 pb-6 space-y-4">
            {fastest.length === 0 ? (
              <p
                className="text-xs text-center py-4 tracking-wider uppercase"
                style={{ color: MIST }}
                data-ocid="ai.growing.empty_state"
              >
                No growing stores detected
              </p>
            ) : (
              fastest.map(({ store, pct }, i) => (
                <div key={store.id} data-ocid={`ai.growing.item.${i + 1}`}>
                  <StoreRankCard rank={i + 1} store={store} pct={pct} growing />
                </div>
              ))
            )}
          </div>
        </OrnamentalCard>

        <OrnamentalCard padding="p-0" data-ocid="ai.declining.panel">
          <div className="pb-3 pt-6 px-6">
            <SectionLabel>Watch List</SectionLabel>
            <h3
              className="font-display text-base font-semibold flex items-center gap-2"
              style={{ color: NAVY }}
            >
              <TrendingDown className="w-4 h-4" style={{ color: "#EF4444" }} />
              Declining Stores
            </h3>
          </div>
          <div className="pt-0 px-6 pb-6 space-y-4">
            {declining.length === 0 ? (
              <p
                className="text-xs text-center py-4 tracking-wider uppercase"
                style={{ color: MIST }}
                data-ocid="ai.declining.empty_state"
              >
                No declining stores detected
              </p>
            ) : (
              declining.map(({ store, pct }, i) => (
                <div key={store.id} data-ocid={`ai.declining.item.${i + 1}`}>
                  <StoreRankCard
                    rank={i + 1}
                    store={store}
                    pct={pct}
                    growing={false}
                  />
                </div>
              ))
            )}
          </div>
        </OrnamentalCard>
      </div>

      {/* Store Prediction Lookup */}
      <StorePredictionLookup stores={stores} />
    </div>
  );
}
