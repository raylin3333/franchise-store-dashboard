import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Pencil,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStores, useTasks } from "../hooks/useQueries";
import type { Store, Task } from "../types";
import { saveStoreOverride } from "../utils/localStoreOverrides";
import {
  formatCurrency,
  getChurnRisk,
  linearRegressionForecast,
} from "../utils/predictions";
import { OrnamentalCard } from "./OrnamentalCard";

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY = "#1A1A2E";
const BLUE = "#4A7CF7";
const CORNFLOWER = "#5B8DEF";
const MIST = "#4a6fa8";
const SKY = "#A0B8F0";
const BORDER = "#DCE4F5";
const LIGHT_BG = "#F0F4FF";

const MONTHS = [
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
const FORECAST_MONTHS = ["M+1", "M+2", "M+3"];

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-medium tracking-widest uppercase mb-3"
      style={{ color: MIST, letterSpacing: "0.12em" }}
    >
      {children}
    </p>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Active"
      ? "#2ECC71"
      : status === "Pending"
        ? CORNFLOWER
        : "#EF4444";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: color }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    Active: { bg: "#E8F8F0", text: "#1A7A4A" },
    Inactive: { bg: "#FEE8E8", text: "#C0392B" },
    Pending: { bg: LIGHT_BG, text: BLUE },
  };
  const s = styles[status] ?? { bg: LIGHT_BG, text: MIST };
  return (
    <span
      className="text-xs font-medium px-2.5 py-0.5 rounded-sm tracking-wider uppercase"
      style={{
        background: s.bg,
        color: s.text,
        letterSpacing: "0.06em",
        fontSize: "0.65rem",
      }}
    >
      {status}
    </span>
  );
}

function ChurnRiskBadge({ level }: { level: "high" | "medium" }) {
  const isHigh = level === "high";
  return (
    <span
      className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-sm tracking-wider uppercase"
      style={{
        background: isHigh ? "#FEE8E8" : "#FFF8E6",
        color: isHigh ? "#C0392B" : "#B7791F",
        letterSpacing: "0.06em",
        fontSize: "0.65rem",
      }}
    >
      <AlertTriangle className="w-3 h-3" />
      {isHigh ? "High" : "Medium"} Churn Risk
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    high: { bg: "#FEE8E8", text: "#C0392B" },
    medium: { bg: "#FFF8E6", text: "#B7791F" },
    low: { bg: LIGHT_BG, text: BLUE },
  };
  const s = styles[priority] ?? { bg: LIGHT_BG, text: MIST };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-sm capitalize tracking-wider"
      style={{ background: s.bg, color: s.text }}
    >
      {priority}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    todo: { bg: LIGHT_BG, text: MIST },
    inprogress: { bg: "#EEF3FE", text: BLUE },
    done: { bg: "#E8F8F0", text: "#1A7A4A" },
  };
  const s = styles[status] ?? { bg: LIGHT_BG, text: MIST };
  const label =
    status === "inprogress"
      ? "In Progress"
      : status === "todo"
        ? "To Do"
        : "Done";
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-sm tracking-wider uppercase"
      style={{
        background: s.bg,
        color: s.text,
        letterSpacing: "0.05em",
        fontSize: "0.6rem",
      }}
    >
      {label}
    </span>
  );
}

// ── Editable fields config ───────────────────────────────────────────────────

interface EditableField {
  key: keyof Store;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "revenue";
  options?: string[];
}

const EDITABLE_FIELDS: EditableField[] = [
  { key: "name", label: "Store Name", type: "text" },
  { key: "brand", label: "Brand", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Active", "Inactive", "Pending"],
  },
  { key: "subscriptionType", label: "Subscription Type", type: "text" },
  { key: "history", label: "History", type: "text" },
  { key: "telephony", label: "Telephony", type: "text" },
  { key: "salesRep", label: "Sales Rep", type: "text" },
  { key: "annualRevenue", label: "Annual Revenue", type: "number" },
  { key: "storeCode", label: "Store Code", type: "text" },
  { key: "revenue", label: "Revenue Array", type: "revenue" },
];

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  globalSearch: string;
}

export default function StoresTab({ globalSearch }: Props) {
  const { data: stores = [], isLoading } = useStores();
  const { data: tasks = [] } = useTasks();

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mobile: show detail view instead of list
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const brands = useMemo(
    () => Array.from(new Set(stores.map((s) => s.brand))).sort(),
    [stores],
  );
  const subscriptions = useMemo(
    () =>
      Array.from(
        new Set(
          stores.map((s) => s.subscriptionType).filter((v): v is string => !!v),
        ),
      ).sort(),
    [stores],
  );

  const effectiveSearch = globalSearch || search;

  const filtered = useMemo(() => {
    const q = effectiveSearch.toLowerCase();
    return stores.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        (s.storeCode ?? "").toLowerCase().includes(q);
      const matchBrand = brandFilter === "all" || s.brand === brandFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchSub = subFilter === "all" || s.subscriptionType === subFilter;
      return matchSearch && matchBrand && matchStatus && matchSub;
    });
  }, [stores, effectiveSearch, brandFilter, statusFilter, subFilter]);

  const selected = useMemo(() => {
    const inFiltered = filtered.find((s) => s.id === selectedId);
    return inFiltered ?? filtered[0] ?? null;
  }, [filtered, selectedId]);

  const storeTasks = useMemo(
    () => tasks.filter((t: Task) => t.storeId === selected?.id),
    [tasks, selected],
  );

  function handleStoreSelect(id: string) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function handleBackToList() {
    setMobileView("list");
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* ── Left sidebar — hidden on mobile when detail is shown ── */}
      <aside
        className={`
          shrink-0 border-r flex flex-col
          w-full md:w-64
          ${mobileView === "detail" ? "hidden md:flex" : "flex"}
          md:sticky md:top-0 md:h-screen
        `}
        style={{ background: "rgba(240,244,255,0.95)", borderColor: BORDER }}
      >
        <div
          className="px-4 md:px-5 pt-4 md:pt-5 pb-4 border-b"
          style={{ borderColor: BORDER }}
        >
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: MIST, letterSpacing: "0.12em" }}
          >
            Filter Stores
          </p>
          <div className="space-y-2.5">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: MIST }}
              />
              <Input
                data-ocid="stores.search_input"
                placeholder="Search stores…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded border"
                style={{
                  background: "#FFFFFF",
                  borderColor: BORDER,
                  color: NAVY,
                }}
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger
                data-ocid="stores.brand.select"
                className="h-8 text-xs rounded border"
                style={{
                  background: "#FFFFFF",
                  borderColor: BORDER,
                  color: NAVY,
                }}
              >
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                data-ocid="stores.status.select"
                className="h-8 text-xs rounded border"
                style={{
                  background: "#FFFFFF",
                  borderColor: BORDER,
                  color: NAVY,
                }}
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subFilter} onValueChange={setSubFilter}>
              <SelectTrigger
                data-ocid="stores.subscription.select"
                className="h-8 text-xs rounded border"
                style={{
                  background: "#FFFFFF",
                  borderColor: BORDER,
                  color: NAVY,
                }}
              >
                <SelectValue placeholder="All Subscriptions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                {subscriptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="stores.empty_state"
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <p
                className="text-xs tracking-wider uppercase"
                style={{ color: MIST }}
              >
                No stores found
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {filtered.map((store: Store, i) => (
                <button
                  key={store.id}
                  type="button"
                  data-ocid={`stores.item.${i + 1}`}
                  onClick={() => handleStoreSelect(store.id)}
                  className="w-full text-left px-4 py-3 rounded transition-colors"
                  style={{
                    background:
                      selected?.id === store.id ? "#EEF3FE" : "transparent",
                    borderLeft:
                      selected?.id === store.id
                        ? `2px solid ${BLUE}`
                        : "2px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={store.status} />
                    <span
                      className="font-medium truncate flex-1 text-xs"
                      style={{ color: selected?.id === store.id ? BLUE : NAVY }}
                    >
                      {store.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 pl-4">
                    <span
                      className="text-[10px] tracking-wider uppercase"
                      style={{ color: MIST, letterSpacing: "0.06em" }}
                    >
                      {store.brand}
                    </span>
                    <span className="text-[10px]" style={{ color: MIST }}>
                      {store.storeCode}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div
          className="px-5 py-3 border-t text-[10px] tracking-widest uppercase"
          style={{ borderColor: BORDER, color: MIST, letterSpacing: "0.1em" }}
        >
          {filtered.length} store{filtered.length !== 1 ? "s" : ""}
        </div>
      </aside>

      {/* ── Detail panel ── */}
      <main
        className={`
          flex-1 min-w-0
          ${mobileView === "list" ? "hidden md:block" : "block"}
        `}
        style={{ background: "transparent" }}
      >
        {selected ? (
          <StoreDetail
            store={selected}
            tasks={storeTasks}
            onBack={handleBackToList}
          />
        ) : (
          <div
            data-ocid="stores.panel"
            className="flex items-center justify-center min-h-[60vh]"
          >
            <p
              className="text-sm tracking-widest uppercase"
              style={{ color: MIST }}
            >
              Select a store to view details
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Store detail panel ───────────────────────────────────────────────────────

function StoreDetail({
  store,
  tasks,
  onBack,
}: {
  store: Store;
  tasks: Task[];
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const safeRevenue = useMemo<number[]>(
    () =>
      Array.isArray(store.revenue) && store.revenue.length > 0
        ? store.revenue
        : Array<number>(12).fill(0),
    [store.revenue],
  );

  const forecast = useMemo(
    () => linearRegressionForecast(safeRevenue, 3),
    [safeRevenue],
  );

  const churnRisk = useMemo(() => getChurnRisk(store.status), [store.status]);

  const revenueData = useMemo(
    () => MONTHS.map((month, i) => ({ month, revenue: safeRevenue[i] ?? 0 })),
    [safeRevenue],
  );

  const forecastData = useMemo(
    () => [
      ...MONTHS.slice(-3).map((month, i) => ({
        month,
        actual: safeRevenue[9 + i] ?? 0,
        forecast: null as number | null,
      })),
      ...FORECAST_MONTHS.map((month, i) => ({
        month,
        actual: null as number | null,
        forecast: Math.round(forecast[i] ?? 0),
      })),
    ],
    [safeRevenue, forecast],
  );

  const trend = useMemo<"up" | "down">(
    () =>
      (forecast[2] ?? 0) > (safeRevenue[safeRevenue.length - 1] ?? 0)
        ? "up"
        : "down",
    [forecast, safeRevenue],
  );

  function startEdit() {
    const vals: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field.key === "revenue") {
        vals.revenue = JSON.stringify(store.revenue ?? []);
      } else if (field.key === "annualRevenue") {
        vals.annualRevenue = String(store.annualRevenue ?? 0);
      } else {
        const rawValue = store[field.key];
        vals[field.key] =
          rawValue !== undefined && rawValue !== null ? String(rawValue) : "";
      }
    }
    setEditValues(vals);
    setRevenueError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setRevenueError(null);
  }

  function saveEdit() {
    let parsedRevenue: number[] | undefined;
    try {
      const raw = editValues.revenue?.trim();
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error("Must be an array");
        parsedRevenue = (parsed as unknown[]).map((v) => Number(v));
      }
    } catch {
      setRevenueError(
        "Invalid format. Use a JSON array like [10000, 12000, 11000]",
      );
      return;
    }

    const override: Partial<Store> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field.key === "revenue") {
        if (parsedRevenue !== undefined) override.revenue = parsedRevenue;
      } else if (field.key === "annualRevenue") {
        const n = Number(editValues.annualRevenue);
        override.annualRevenue = Number.isNaN(n) ? 0 : n;
      } else {
        (override as Record<string, string>)[field.key] =
          editValues[field.key] ?? "";
      }
    }

    saveStoreOverride(store.id, override);
    qc.invalidateQueries({ queryKey: ["stores"] });
    setIsEditing(false);
    setRevenueError(null);
  }

  function updateField(key: string, value: string) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-4 md:p-5 space-y-4 md:space-y-5">
      {/* Mobile back button */}
      <button
        type="button"
        onClick={onBack}
        className="md:hidden flex items-center gap-2 text-xs font-medium tracking-wider uppercase mb-2"
        style={{ color: MIST }}
        aria-label="Back to store list"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to stores
      </button>

      {/* Store Header */}
      <div
        className="border-b pb-4 md:pb-5 flex items-start justify-between gap-3"
        style={{ borderColor: BORDER }}
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium tracking-widest uppercase mb-2"
            style={{ color: CORNFLOWER, letterSpacing: "0.14em" }}
          >
            {store.brand} · {store.storeCode}
          </p>
          <h1
            className="font-display text-xl md:text-2xl font-semibold mb-3 truncate"
            style={{ color: NAVY }}
          >
            {store.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={store.status} />
            {churnRisk === "high" && <ChurnRiskBadge level="high" />}
            {churnRisk === "medium" && <ChurnRiskBadge level="medium" />}
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            data-ocid="store.edit_button"
            onClick={startEdit}
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity"
            style={{ borderColor: BORDER, color: MIST, background: LIGHT_BG }}
          >
            <Pencil className="w-3 h-3" />
            <span className="hidden sm:inline">Edit Store</span>
            <span className="sm:hidden">Edit</span>
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              data-ocid="store.save_button"
              onClick={saveEdit}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded tracking-wider uppercase hover:opacity-90 transition-opacity font-medium"
              style={{ background: BLUE, color: "#FFFFFF" }}
            >
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
              type="button"
              data-ocid="store.cancel_button"
              onClick={cancelEdit}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity"
              style={{ borderColor: BORDER, color: MIST, background: LIGHT_BG }}
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI / Edit fields */}
      <div>
        <SectionLabel>
          {isEditing ? "Edit Store Fields" : "Key Metrics"}
        </SectionLabel>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {EDITABLE_FIELDS.filter((f) => f.key !== "revenue").map(
                (field) => (
                  <OrnamentalCard key={field.key} padding="p-4">
                    <label
                      htmlFor={`edit-${field.key}`}
                      className="block text-[10px] font-medium tracking-widest uppercase mb-2"
                      style={{ color: MIST, letterSpacing: "0.1em" }}
                    >
                      {field.label}
                    </label>
                    {field.type === "select" && field.options ? (
                      <Select
                        value={editValues[field.key] ?? ""}
                        onValueChange={(v) => updateField(field.key, v)}
                      >
                        <SelectTrigger
                          data-ocid={`store.${field.key}.select`}
                          className="h-8 text-xs rounded border"
                          style={{
                            background: LIGHT_BG,
                            borderColor: BORDER,
                            color: NAVY,
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`edit-${field.key}`}
                        data-ocid={`store.${field.key}.input`}
                        type={field.type === "number" ? "number" : "text"}
                        value={editValues[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="h-8 text-xs rounded border"
                        style={{
                          background: LIGHT_BG,
                          borderColor: BORDER,
                          color: NAVY,
                        }}
                      />
                    )}
                  </OrnamentalCard>
                ),
              )}
            </div>

            <OrnamentalCard padding="p-4">
              <label
                htmlFor="edit-revenue"
                className="block text-[10px] font-medium tracking-widest uppercase mb-1"
                style={{ color: MIST, letterSpacing: "0.1em" }}
              >
                Revenue Array
              </label>
              <p
                className="text-[10px] mb-2"
                style={{ color: MIST, opacity: 0.8 }}
              >
                Format as JSON array, e.g.{" "}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: CORNFLOWER,
                  }}
                >
                  [10000, 12000, 11500]
                </span>
              </p>
              <Textarea
                id="edit-revenue"
                data-ocid="store.revenue.textarea"
                value={editValues.revenue ?? ""}
                onChange={(e) => {
                  updateField("revenue", e.target.value);
                  setRevenueError(null);
                }}
                rows={2}
                className="text-xs rounded border resize-none"
                style={{
                  background: LIGHT_BG,
                  borderColor: revenueError ? "#EF4444" : BORDER,
                  color: NAVY,
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                }}
              />
              {revenueError && (
                <p
                  data-ocid="store.revenue.error_state"
                  className="text-xs mt-1"
                  style={{ color: "#EF4444" }}
                >
                  {revenueError}
                </p>
              )}
            </OrnamentalCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                label: "Annual Revenue",
                value: formatCurrency(store.annualRevenue ?? 0),
              },
              { label: "Subscription", value: store.subscriptionType ?? "—" },
              { label: "History", value: store.history ?? "—" },
              { label: "Telephony", value: store.telephony ?? "—" },
              { label: "Sales Rep", value: store.salesRep ?? "N/A" },
              { label: "Store Code", value: store.storeCode ?? "—" },
              { label: "Franchise Company", value: "GlobalFranchise Corp." },
              { label: "Franchise Code", value: "GFC-2024" },
              { label: "Pre-Ring", value: "PRE-0042" },
            ].map(({ label, value }) => (
              <OrnamentalCard key={label} padding="p-4">
                <p
                  className="text-[10px] font-medium tracking-widest uppercase mb-2"
                  style={{ color: MIST, letterSpacing: "0.1em" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: NAVY }}
                >
                  {value}
                </p>
              </OrnamentalCard>
            ))}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Monthly Revenue */}
        <OrnamentalCard padding="p-0">
          <div className="pt-4 md:pt-5 pb-2 px-4 md:px-5">
            <p
              className="text-[10px] font-medium tracking-widest uppercase mb-1"
              style={{ color: MIST, letterSpacing: "0.12em" }}
            >
              Revenue
            </p>
            <h3
              className="font-display text-base font-semibold"
              style={{ color: NAVY }}
            >
              Monthly Revenue
            </h3>
          </div>
          <div className="px-2 pb-4 md:pb-5">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="cornflowerFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={CORNFLOWER}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={CORNFLOWER}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: MIST }} />
                  <YAxis
                    tick={{ fontSize: 9, fill: MIST }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CORNFLOWER}
                    strokeWidth={1.5}
                    fill="url(#cornflowerFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </OrnamentalCard>

        {/* Revenue Forecast */}
        <OrnamentalCard padding="p-0">
          <div className="pt-4 md:pt-5 pb-2 px-4 md:px-5">
            <p
              className="text-[10px] font-medium tracking-widest uppercase mb-1"
              style={{ color: MIST, letterSpacing: "0.12em" }}
            >
              Predictive AI
            </p>
            <div className="flex items-center justify-between">
              <h3
                className="font-display text-base font-semibold"
                style={{ color: NAVY }}
              >
                Revenue Forecast
              </h3>
              <span
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: trend === "up" ? "#2ECC71" : "#EF4444" }}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {trend === "up" ? "Upward" : "Downward"}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: MIST }}>
              Projected to reach {formatCurrency(forecast[2] ?? 0)} in 3 months
            </p>
          </div>
          <div className="px-2 pb-4 md:pb-5">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastData}
                  margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                >
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: MIST }} />
                  <YAxis
                    tick={{ fontSize: 9, fill: MIST }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === "actual" ? "Actual" : "Forecast",
                    ]}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine
                    x="Oct"
                    stroke={BORDER}
                    strokeDasharray="4 2"
                    label={{
                      value: "Forecast →",
                      fontSize: 9,
                      fill: MIST,
                      position: "insideTopRight",
                    }}
                  />
                  <Bar
                    dataKey="actual"
                    fill={CORNFLOWER}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar dataKey="forecast" fill={SKY} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </OrnamentalCard>
      </div>

      {/* Store Tasks */}
      <OrnamentalCard padding="p-0">
        <div className="pt-4 md:pt-5 pb-2 px-4 md:px-5">
          <p
            className="text-[10px] font-medium tracking-widest uppercase mb-1"
            style={{ color: MIST, letterSpacing: "0.12em" }}
          >
            Assigned Work
          </p>
          <h3
            className="font-display text-base font-semibold"
            style={{ color: NAVY }}
          >
            Tasks for this Store
          </h3>
        </div>
        <div className="px-4 md:px-5 pb-4 md:pb-5">
          {tasks.length === 0 ? (
            <p
              data-ocid="store.tasks.empty_state"
              className="text-xs py-6 text-center tracking-wider uppercase"
              style={{ color: MIST }}
            >
              No tasks assigned to this store
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: Task, i) => (
                <div
                  key={String(task.id)}
                  data-ocid={`store.tasks.item.${i + 1}`}
                  className="flex items-center justify-between py-3 border-b last:border-0 gap-3"
                  style={{ borderColor: BORDER }}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: NAVY }}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: MIST }}>
                      Due: {task.dueDate || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrnamentalCard>
    </div>
  );
}

export {
  StoreDetail,
  SectionLabel,
  StatusDot,
  StatusBadge,
  PriorityBadge,
  TaskStatusBadge,
};
