import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Link2,
  Link2Off,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useSheetSync } from "../hooks/useQueries";
import type { SheetConnection } from "../utils/localStoreOverrides";
import {
  loadSheetConnection,
  saveImportedStores,
  saveSheetConnection,
} from "../utils/localStoreOverrides";
import {
  CSV_TEMPLATE_HEADERS,
  generateTemplateCSV,
} from "../utils/sheetParser";

// Blue palette constants
const NAVY = "#1A1A2E";
const BLUE = "#4A7CF7";
const CORNFLOWER = "#5B8DEF";
const MIST = "#4a6fa8";
const BORDER = "#DCE4F5";
const LIGHT_BG = "#F0F4FF";

interface DataSourcesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DataSourcesPanel({
  open,
  onOpenChange,
}: DataSourcesPanelProps) {
  const [sheetUrl, setSheetUrl] = useState(() => {
    const conn = loadSheetConnection();
    return conn?.url ?? "";
  });
  const [connection, setConnection] = useState<SheetConnection | null>(() =>
    loadSheetConnection(),
  );

  const { sync, isSyncing, error } = useSheetSync();
  const qc = useQueryClient();

  const columnHeaders = CSV_TEMPLATE_HEADERS.split(",");

  function handleDownloadTemplate() {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "franchise-stores-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleConnect() {
    if (!sheetUrl.trim()) return;
    await sync(sheetUrl.trim());
    const updated = loadSheetConnection();
    setConnection(updated);
  }

  async function handleSyncNow() {
    if (!connection?.url) return;
    await sync(connection.url);
    const updated = loadSheetConnection();
    setConnection(updated);
  }

  function handleDisconnect() {
    saveSheetConnection({ url: "", lastSynced: null, importedCount: 0 });
    saveImportedStores([]);
    setSheetUrl("");
    setConnection(null);
    // Refetch stores so the dashboard immediately reverts to hardcoded data
    void qc.refetchQueries({ queryKey: ["stores"] });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-ocid="datasources.sheet"
        style={{
          background: "#FFFFFF",
          borderLeft: `1px solid ${BORDER}`,
          color: NAVY,
          width: "min(480px, 100vw)",
          maxWidth: "480px",
          overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(26,26,46,0.08)",
        }}
      >
        <SheetHeader className="pb-6 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 shrink-0" style={{ color: BLUE }} />
            <SheetTitle
              className="font-display text-xl font-semibold tracking-wide"
              style={{ color: NAVY }}
            >
              Data Sources
            </SheetTitle>
          </div>
          <p
            className="text-xs tracking-wider uppercase mt-1"
            style={{ color: MIST, letterSpacing: "0.1em" }}
          >
            Connect Google Sheets · Import Stores
          </p>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* ── Connected Sheet Section ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4" style={{ color: CORNFLOWER }} />
              <h3
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: CORNFLOWER, letterSpacing: "0.12em" }}
              >
                Connected Sheet
              </h3>
            </div>

            {/* Connection status */}
            {connection?.url && connection.url !== "" ? (
              <div
                className="rounded border p-4 space-y-3 mb-4"
                style={{
                  borderColor: BORDER,
                  background: LIGHT_BG,
                }}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "#2ECC71" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium tracking-wider uppercase mb-1"
                      style={{ color: MIST, letterSpacing: "0.08em" }}
                    >
                      Connected
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: NAVY }}
                      title={connection.url}
                    >
                      {connection.url}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded border p-2.5"
                    style={{
                      borderColor: BORDER,
                      background: "#FFFFFF",
                    }}
                  >
                    <p
                      className="text-[10px] tracking-widest uppercase mb-1"
                      style={{ color: MIST }}
                    >
                      Last Synced
                    </p>
                    <p className="text-xs font-medium" style={{ color: NAVY }}>
                      {connection.lastSynced
                        ? new Date(connection.lastSynced).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <div
                    className="rounded border p-2.5"
                    style={{
                      borderColor: BORDER,
                      background: "#FFFFFF",
                    }}
                  >
                    <p
                      className="text-[10px] tracking-widest uppercase mb-1"
                      style={{ color: MIST }}
                    >
                      Stores Imported
                    </p>
                    <p className="text-xs font-medium" style={{ color: NAVY }}>
                      {connection.importedCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-ocid="datasources.sync_now.button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity disabled:opacity-50"
                    style={{
                      borderColor: BORDER,
                      color: MIST,
                      background: "#FFFFFF",
                    }}
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Sync Now
                  </button>
                  <button
                    type="button"
                    data-ocid="datasources.disconnect.button"
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity"
                    style={{
                      borderColor: "#FECACA",
                      color: "#EF4444",
                      background: "#FEF2F2",
                    }}
                  >
                    <Link2Off className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : null}

            {/* URL input + connect */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="sheet-url-input"
                  className="block text-xs font-medium tracking-wider uppercase mb-2"
                  style={{ color: MIST, letterSpacing: "0.08em" }}
                >
                  Google Sheets URL
                </label>
                <Input
                  id="sheet-url-input"
                  data-ocid="datasources.sheet_url.input"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="h-9 text-xs rounded border"
                  style={{
                    background: LIGHT_BG,
                    borderColor: BORDER,
                    color: NAVY,
                  }}
                />
              </div>

              <div
                className="rounded border px-3 py-2.5 flex items-start gap-2"
                style={{
                  borderColor: "#BFDBFE",
                  background: "#EFF6FF",
                }}
              >
                <AlertCircle
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: CORNFLOWER }}
                />
                <p className="text-xs leading-relaxed" style={{ color: MIST }}>
                  Set your Google Sheet to{" "}
                  <strong style={{ color: NAVY }}>
                    &ldquo;Anyone with the link can view&rdquo;
                  </strong>{" "}
                  in Share settings before connecting.
                </p>
              </div>

              <button
                type="button"
                data-ocid="datasources.connect.button"
                onClick={handleConnect}
                disabled={isSyncing || !sheetUrl.trim()}
                className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded tracking-wider uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{
                  background: BLUE,
                  color: "#FFFFFF",
                }}
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                {isSyncing ? "Syncing…" : "Connect & Sync"}
              </button>

              {/* Error display */}
              {error && (
                <div
                  data-ocid="datasources.error_state"
                  className="rounded border px-3 py-2.5 flex items-start gap-2"
                  style={{
                    borderColor: "#FECACA",
                    background: "#FEF2F2",
                  }}
                >
                  <AlertCircle
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{ color: "#EF4444" }}
                  />
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#EF4444" }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Divider */}
          <div
            className="border-t"
            style={{ borderColor: BORDER, opacity: 0.7 }}
          />

          {/* ── CSV Template Section ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-4 h-4" style={{ color: CORNFLOWER }} />
              <h3
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: CORNFLOWER, letterSpacing: "0.12em" }}
              >
                CSV Template
              </h3>
            </div>

            <p className="text-xs leading-relaxed mb-4" style={{ color: MIST }}>
              Format your Google Sheet with these exact column headers. Download
              the template to get started with 2 example rows.
            </p>

            {/* Column headers display */}
            <div
              className="rounded border p-3 mb-4"
              style={{
                borderColor: BORDER,
                background: LIGHT_BG,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <p
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: MIST }}
              >
                Required Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {columnHeaders.map((col) => (
                  <span
                    key={col}
                    className="text-[11px] px-2 py-0.5 rounded-sm border"
                    style={{
                      borderColor: BORDER,
                      color: BLUE,
                      background: "#FFFFFF",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="rounded border p-3 mb-4 space-y-1.5"
              style={{
                borderColor: BORDER,
                background: "#FAFBFF",
              }}
            >
              <p
                className="text-[10px] tracking-widest uppercase mb-2"
                style={{ color: MIST }}
              >
                Notes
              </p>
              <p className="text-xs" style={{ color: NAVY }}>
                • <span style={{ color: CORNFLOWER }}>revenue</span>: JSON array{" "}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: MIST,
                  }}
                >
                  [42000, 44000, …]
                </span>
              </p>
              <p className="text-xs" style={{ color: NAVY }}>
                • <span style={{ color: CORNFLOWER }}>annualRevenue</span>:
                numeric value (e.g.{" "}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: MIST,
                  }}
                >
                  480000
                </span>
                )
              </p>
              <p className="text-xs" style={{ color: NAVY }}>
                • <span style={{ color: CORNFLOWER }}>status</span>: Active /
                Pending / Inactive
              </p>
              <p className="text-xs" style={{ color: NAVY }}>
                • Sheet data merges with existing stores — it won&apos;t delete
                anything.
              </p>
            </div>

            <button
              type="button"
              data-ocid="datasources.download_template.button"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 h-9 text-xs font-medium rounded border tracking-wider uppercase hover:opacity-80 transition-opacity"
              style={{
                borderColor: BORDER,
                color: MIST,
                background: "#FFFFFF",
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
