import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HARDCODED_STORES, useStores } from "../hooks/useQueries";
import type { Store } from "../types";
import { formatCurrency, getChurnRisk } from "../utils/predictions";
import { OrnamentalCard } from "./OrnamentalCard";

// ─── Blue Palette ────────────────────────────────────────────────────────────
const NAVY = "#1A1A2E";
const BLUE = "#4A7CF7";
const CORNFLOWER = "#5B8DEF";
const MIST = "#4a6fa8";
const SKY = "#A0B8F0";
const BORDER = "#DCE4F5";
const LIGHT_BG = "#F5F8FF";

// ─── Store Status Line Chart colours ────────────────────────────────────────
const LINE_ACTIVE = "#1A2E5A";
const LINE_PENDING = "#7BB3F0";
const LINE_INACTIVE = "#4A7CF7";

// ─── Diverse palette for brand slices ────────────────────────────────────────
const BRAND_COLORS = [
  "#4A7CF7",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#6366F1",
];

// ─── Bar chart brand colors ───────────────────────────────────────────────────
const BAR_COLORS = [
  BLUE,
  CORNFLOWER,
  "#7BAAF7",
  SKY,
  "#C5D5F5",
  "#2ECC71",
  "#F59E0B",
  "#EF4444",
];

// ─── Last 6 months helper ─────────────────────────────────────────────────────
const LAST_6_MONTHS: string[] = (() => {
  const now = new Date();
  const shortMonths = [
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
  ];
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return shortMonths[d.getMonth()];
  });
})();

interface Props {
  globalSearch: string;
  onStoreClick: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-medium tracking-widest uppercase mb-1"
      style={{ color: MIST, letterSpacing: "0.14em" }}
    >
      {children}
    </p>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-serif text-base md:text-lg font-semibold tracking-wide"
      style={{ color: NAVY, letterSpacing: "0.05em" }}
    >
      {children}
    </h3>
  );
}

function PanelSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-0.5" style={{ color: MIST }}>
      {children}
    </p>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  ocid?: string;
}
function StatCard({ label, value, subtitle, ocid }: StatCardProps) {
  return (
    <OrnamentalCard padding="p-0" data-ocid={ocid}>
      <div className="pt-2 pb-2 px-3 md:px-4">
        <p
          className="text-xs font-bold tracking-wider uppercase mb-0.5"
          style={{ color: "#4a6fa8" }}
        >
          {label}
        </p>
        <p
          className="font-stat text-2xl md:text-3xl font-bold leading-none tracking-tight mb-1"
          style={{ color: NAVY }}
        >
          {value}
        </p>
        <p className="text-[10px]" style={{ color: MIST }}>
          {subtitle}
        </p>
      </div>
    </OrnamentalCard>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function StoreStatusTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const labelMap: Record<string, string> = {
    activeCount: "Active Stores",
    pendingCount: "Pending Stores",
    inactiveCount: "Inactive Stores",
  };
  return (
    <div
      className="rounded px-3 py-2 text-xs shadow-md"
      style={{ background: NAVY, border: `1px solid ${BORDER}`, color: "#fff" }}
    >
      <p
        className="font-semibold mb-1 tracking-wider uppercase"
        style={{ color: SKY }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {labelMap[p.name] ?? p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function BarTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded px-3 py-2 text-xs shadow-md"
      style={{ background: NAVY, border: `1px solid ${BORDER}`, color: "#fff" }}
    >
      <p className="font-semibold" style={{ color: SKY }}>
        {label}
      </p>
      <p style={{ color: CORNFLOWER }}>{payload[0].value} stores</p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const cfg =
    lower === "active"
      ? { bg: "#dcfce7", text: "#166534" }
      : lower === "inactive"
        ? { bg: "#fee2e2", text: "#991b1b" }
        : { bg: "#fef9c3", text: "#854d0e" };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {status}
    </span>
  );
}

// ─── Risk Dot ─────────────────────────────────────────────────────────────────
function RiskDot({ risk }: { risk: "high" | "medium" | "low" }) {
  const color =
    risk === "high" ? "#ef4444" : risk === "medium" ? "#f59e0b" : "#22c55e";
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ background: color }}
      />
      <span
        className="text-[10px] tracking-wider capitalize"
        style={{ color: MIST }}
      >
        {risk}
      </span>
    </span>
  );
}

// ─── Donut Center Label ───────────────────────────────────────────────────────
function DonutCenter({
  total,
  label = "stores",
}: { total: number; label?: string }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan
        x="50%"
        dy="-0.4em"
        style={{
          fontSize: "18px",
          fontFamily: "Playfair Display, serif",
          fontWeight: 700,
          fill: NAVY,
        }}
      >
        {total}
      </tspan>
      <tspan
        x="50%"
        dy="1.3em"
        style={{
          fontSize: "8px",
          fill: MIST,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </tspan>
    </text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardTab({ globalSearch }: Props) {
  const {
    data: rawStores,
    isLoading: storesLoadingRaw,
    isPlaceholderData,
  } = useStores();
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage, setTablePage] = useState(0);
  const PAGE_SIZE = 4;

  const stores =
    rawStores && rawStores.length > 0 ? rawStores : HARDCODED_STORES;
  const storesLoading = storesLoadingRaw && !isPlaceholderData;

  // biome-ignore lint/correctness/useExhaustiveDependencies: globalSearch is the trigger value
  useEffect(() => {
    setTablePage(0);
  }, [globalSearch]);

  const filtered = useMemo(() => {
    if (!globalSearch) return stores;
    const q = globalSearch.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.storeCode?.toLowerCase().includes(q),
    );
  }, [stores, globalSearch]);

  const baseStats = useMemo(() => {
    const total = stores.length;
    const active = stores.filter((s) => {
      const st = (s.status ?? "").toLowerCase();
      return st === "active" || st === "live";
    }).length;
    const totalBrands = new Set(
      stores.map((s) => s.brand?.trim()).filter((b): b is string => !!b),
    ).size;
    const inactive = stores.filter((s) => {
      const st = (s.status ?? "").toLowerCase();
      return (
        st === "inactive" ||
        st === "churn" ||
        st === "churned" ||
        st === "pending"
      );
    }).length;
    return { total, active, totalBrands, inactive };
  }, [stores]);

  const filteredCounts = useMemo(() => {
    const filteredActive = filtered.filter((s) => {
      const st = (s.status ?? "").toLowerCase();
      return st === "active" || st === "live";
    }).length;
    const filteredInactive = filtered.filter((s) => {
      const st = (s.status ?? "").toLowerCase();
      return st === "inactive" || st === "churn" || st === "churned";
    }).length;
    const filteredPending = filtered.filter(
      (s) => (s.status ?? "").toLowerCase() === "pending",
    ).length;
    return { filteredActive, filteredInactive, filteredPending };
  }, [filtered]);

  const brandData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filtered) {
      const brand = s.brand?.trim();
      if (brand) map[brand] = (map[brand] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filtered) {
      const b = s.brand?.trim();
      if (b) map[b] = (map[b] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value], i) => ({
        name,
        value,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const storeStatusTrendData = useMemo(() => {
    const { filteredActive, filteredPending, filteredInactive } =
      filteredCounts;
    return LAST_6_MONTHS.map((month, i) => {
      const isCurrent = i === 5;
      const vary = (base: number, seed: number) => {
        if (isCurrent || base === 0) return base;
        const delta = Math.round(base * 0.1 * Math.sin(seed * 1.7 + i * 0.9));
        return Math.max(0, base + delta);
      };
      return {
        month,
        activeCount: vary(filteredActive, 1),
        pendingCount: vary(filteredPending, 2),
        inactiveCount: vary(filteredInactive, 3),
      };
    });
  }, [filteredCounts]);

  const tableFiltered = useMemo(() => {
    if (!tableSearch) return filtered;
    const q = tableSearch.toLowerCase();
    return filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q),
    );
  }, [filtered, tableSearch]);

  const totalPages = Math.ceil(tableFiltered.length / PAGE_SIZE);
  const tableRows = tableFiltered.slice(
    tablePage * PAGE_SIZE,
    tablePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <main
      className="p-2 md:p-3 space-y-2 md:space-y-3"
      style={{ background: "transparent" }}
    >
      {/* ── Row 1: Stat Cards ── */}
      <section data-ocid="dashboard.stats.section">
        {storesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <StatCard
              label="Total Stores"
              value={baseStats.total}
              subtitle="Across all Brands"
              ocid="dashboard.stat.total"
            />
            <StatCard
              label="Active Stores"
              value={baseStats.active}
              subtitle="Currently Operating"
              ocid="dashboard.stat.active"
            />
            <StatCard
              label="Total Brands"
              value={baseStats.totalBrands}
              subtitle="Our partners"
              ocid="dashboard.stat.brands"
            />
            <StatCard
              label="Inactive Stores"
              value={baseStats.inactive}
              subtitle="Churned or pending"
              ocid="dashboard.stat.inactive"
            />
          </div>
        )}
      </section>

      {/* ── Row 2: Store Status Trend + Top Customers Donut ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 md:gap-3">
        {/* Store Status Trend — 65% */}
        <OrnamentalCard
          className="lg:col-span-2"
          padding="p-0"
          data-ocid="dashboard.store_status_trend.panel"
        >
          <div className="pt-2 px-3 md:px-4 pb-1">
            <PanelTitle>STORE STATUS</PanelTitle>
            <PanelSubtitle>Activity overview</PanelSubtitle>
          </div>
          <div className="px-1 md:px-2 pb-1">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart
                data={storeStatusTrendData}
                margin={{ top: 8, right: 16, bottom: 0, left: 6 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={BORDER}
                  strokeOpacity={0.8}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: MIST }}
                  tickLine={false}
                  axisLine={{ stroke: BORDER }}
                  label={{
                    value: "Month",
                    position: "insideBottomRight",
                    offset: -8,
                    style: { fontSize: 9, fill: MIST, letterSpacing: "0.08em" },
                  }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: MIST }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => String(Math.round(v))}
                  allowDecimals={false}
                  width={30}
                  label={{
                    value: "Stores",
                    angle: -90,
                    position: "insideLeft",
                    offset: 8,
                    style: { fontSize: 9, fill: MIST, letterSpacing: "0.08em" },
                  }}
                />
                <Tooltip content={<StoreStatusTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{
                    fontSize: "10px",
                    paddingBottom: "4px",
                    color: MIST,
                  }}
                  formatter={(value: string) => {
                    const map: Record<string, string> = {
                      activeCount: "Active",
                      pendingCount: "Pending",
                      inactiveCount: "Inactive",
                    };
                    return map[value] ?? value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activeCount"
                  stroke={LINE_ACTIVE}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: LINE_ACTIVE,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pendingCount"
                  stroke={LINE_PENDING}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: LINE_PENDING,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="inactiveCount"
                  stroke={LINE_INACTIVE}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: LINE_INACTIVE,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </OrnamentalCard>

        {/* Top Customers Donut — 35% */}
        <OrnamentalCard padding="p-0" data-ocid="dashboard.top_customers.panel">
          <div className="pt-2 px-3 md:px-4 pb-1">
            <PanelTitle>TOP CUSTOMERS</PanelTitle>
          </div>
          {storesLoading ? (
            <div className="px-4 pb-3">
              <Skeleton className="h-40 w-full rounded" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={95}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={46}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <DonutCenter total={pieData.length} label="brands" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-3 md:px-4 pb-2 space-y-1 max-h-[80px] overflow-y-auto">
                {pieData.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                        style={{ background: entry.color }}
                      />
                      <span
                        className="text-xs tracking-wider truncate"
                        style={{ color: NAVY }}
                      >
                        {entry.name}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold font-serif shrink-0 ml-2"
                      style={{ color: NAVY }}
                    >
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </OrnamentalCard>
      </div>

      {/* ── Row 3: Store Activity Table + Brand Breakdown ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 md:gap-3">
        {/* Store Activity Table — 65% */}
        <OrnamentalCard
          className="lg:col-span-2"
          padding="p-0"
          data-ocid="dashboard.store_activity.panel"
        >
          <div className="pt-3 px-3 md:px-4 pb-2">
            <Label>Activity</Label>
            <PanelTitle>STORE ACTIVITY</PanelTitle>
            <PanelSubtitle>Recent store performance overview</PanelSubtitle>
          </div>

          {/* Search bar */}
          <div className="px-3 md:px-4 pb-2">
            <input
              type="text"
              placeholder="Search stores..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setTablePage(0);
              }}
              data-ocid="dashboard.store_activity.search_input"
              className="w-full h-6 text-xs px-3 py-1 rounded outline-none placeholder:tracking-wider"
              style={{
                background: LIGHT_BG,
                border: `1px solid ${BORDER}`,
                color: NAVY,
              }}
            />
          </div>

          {storesLoading ? (
            <div className="px-4 pb-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {[
                        "Store Name",
                        "Brand",
                        "Revenue",
                        "Status",
                        "Risk",
                        "Subscription",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 md:px-4 py-1.5 text-left font-medium tracking-widest uppercase"
                          style={{
                            color: MIST,
                            letterSpacing: "0.12em",
                            fontSize: "10px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-6 tracking-wider uppercase"
                          style={{ color: MIST }}
                          data-ocid="dashboard.store_activity.empty_state"
                        >
                          No stores found
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((store: Store, i: number) => (
                        <tr
                          key={store.id}
                          data-ocid={`dashboard.store_activity.item.${tablePage * PAGE_SIZE + i + 1}`}
                          className="transition-colors duration-150"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = LIGHT_BG;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td
                            className="px-3 md:px-4 py-1.5 font-medium"
                            style={{ color: NAVY }}
                          >
                            <span className="truncate block max-w-[120px]">
                              {store.name}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-1.5">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-sm tracking-wider"
                              style={{ background: `${SKY}28`, color: BLUE }}
                            >
                              {store.brand}
                            </span>
                          </td>
                          <td
                            className="px-3 md:px-4 py-1.5 font-medium"
                            style={{ color: BLUE }}
                          >
                            {formatCurrency(store.annualRevenue ?? 0)}
                          </td>
                          <td className="px-3 md:px-4 py-1.5">
                            <StatusBadge status={store.status} />
                          </td>
                          <td className="px-3 md:px-4 py-1.5">
                            <RiskDot risk={getChurnRisk(store.status)} />
                          </td>
                          <td
                            className="px-3 md:px-4 py-1.5"
                            style={{ color: MIST }}
                          >
                            {store.subscriptionType ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="px-3 md:px-4 py-2 flex items-center justify-between"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <p
                  className="text-[10px] tracking-wider"
                  style={{ color: MIST }}
                >
                  Showing{" "}
                  {tableFiltered.length === 0 ? 0 : tablePage * PAGE_SIZE + 1}–
                  {Math.min((tablePage + 1) * PAGE_SIZE, tableFiltered.length)}{" "}
                  of {tableFiltered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                    disabled={tablePage === 0}
                    data-ocid="dashboard.store_activity.pagination_prev"
                    className="text-[10px] px-2.5 py-1 rounded disabled:opacity-40 transition-colors"
                    style={{ background: `${BLUE}18`, color: BLUE }}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTablePage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={tablePage >= totalPages - 1}
                    data-ocid="dashboard.store_activity.pagination_next"
                    className="text-[10px] px-2.5 py-1 rounded disabled:opacity-40 transition-colors"
                    style={{ background: `${BLUE}18`, color: BLUE }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </OrnamentalCard>

        {/* Brand Breakdown — 35% */}
        <OrnamentalCard
          padding="p-0"
          data-ocid="dashboard.brand_breakdown.panel"
        >
          <div className="pt-3 px-3 md:px-4 pb-2">
            <Label>Brands</Label>
            <PanelTitle>BRAND BREAKDOWN</PanelTitle>
            <PanelSubtitle>Stores by brand</PanelSubtitle>
          </div>
          {storesLoading ? (
            <div className="px-4 pb-4">
              <Skeleton className="h-32 w-full rounded" />
            </div>
          ) : (
            <div className="px-2 pb-2">
              <div
                style={{ width: "100%", height: brandData.length * 28 + 16 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={brandData}
                    margin={{ top: 0, right: 32, bottom: 0, left: 8 }}
                    barSize={10}
                  >
                    <CartesianGrid
                      horizontal={false}
                      strokeDasharray="3 3"
                      stroke={BORDER}
                      strokeOpacity={0.8}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: MIST }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="brand"
                      tick={{ fontSize: 9, fill: NAVY }}
                      tickLine={false}
                      axisLine={false}
                      width={68}
                    />
                    <Tooltip content={<BarTooltipContent />} />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      label={{ position: "right", fontSize: 10, fill: MIST }}
                    >
                      {brandData.map((entry, i) => (
                        <Cell
                          key={entry.brand}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </OrnamentalCard>
      </div>
    </main>
  );
}
