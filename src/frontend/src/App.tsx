import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Bell,
  Building2,
  CheckSquare,
  Database,
  LayoutDashboard,
  Menu,
  Pencil,
  Search,
  Settings,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import DashboardTab from "./components/DashboardTab";
import DataSourcesPanel from "./components/DataSourcesPanel";
import PredictiveAITab from "./components/PredictiveAITab";
import StoresTab from "./components/StoresTab";
import TasksTab from "./components/TasksTab";

// Blue Palette
const PERIWINKLE = "#B8C6E8";
const NAVY = "#1A1A2E";
const BLUE = "#4A7CF7";
const MIST = "#8899BB";
const SKY = "#A0B8F0";
const BORDER = "#DCE4F5";

const NAV_ITEMS = [
  { value: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { value: "stores", icon: Store, label: "Stores" },
  { value: "tasks", icon: CheckSquare, label: "Tasks" },
  { value: "ai", icon: Sparkles, label: "AI Insights" },
] as const;

type TabValue = (typeof NAV_ITEMS)[number]["value"];

const NOTIFICATIONS = [
  { id: 1, text: "Store #42 revenue alert", time: "2m ago", unread: true },
  {
    id: 2,
    text: "New task assigned: Downtown branch",
    time: "18m ago",
    unread: true,
  },
  {
    id: 3,
    text: "AI forecast updated for 5 stores",
    time: "1h ago",
    unread: true,
  },
];

const SIDEBAR_W_EXPANDED = 220;

export default function App() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");

  // Mobile sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Company branding state (persisted in localStorage)
  const [companyName, setCompanyName] = useState<string>(
    () => localStorage.getItem("franchiseName") ?? "Your Franchise Co.",
  );
  const [companyLogo, setCompanyLogo] = useState<string | null>(() =>
    localStorage.getItem("franchiseLogo"),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data Sources panel
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click-outside: close notification dropdown
  useEffect(() => {
    if (!notifOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [notifOpen]);

  // Close mobile sidebar on tab change
  function handleTabChange(value: TabValue) {
    setActiveTab(value);
    setMobileSidebarOpen(false);
  }

  function openEdit() {
    setDraftName(companyName);
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditOpen(false);
  }

  function saveEdit() {
    const trimmed = draftName.trim() || "Your Franchise Co.";
    setCompanyName(trimmed);
    localStorage.setItem("franchiseName", trimmed);
    setEditOpen(false);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCompanyLogo(dataUrl);
      localStorage.setItem("franchiseLogo", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className="flex"
      style={{ background: PERIWINKLE, height: "100vh", overflow: "hidden" }}
    >
      {/* Decorative background pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('/assets/file-019d49ce-7bca-72fb-9254-23269b53d607.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: 0.12,
          filter: "hue-rotate(180deg) saturate(0.4) brightness(1.2)",
        }}
        aria-hidden="true"
      />

      {/* ── MOBILE OVERLAY BACKDROP ── */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 md:hidden w-full h-full cursor-default"
          style={{ background: "rgba(0,0,0,0.45)", border: "none", padding: 0 }}
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* ── SIDEBAR ── */}
      <nav
        data-ocid="sidebar"
        className={[
          "fixed left-0 top-0 h-screen z-50 flex flex-col border-r overflow-hidden transition-transform duration-300",
          // On mobile: hidden by default, slide in when open
          // On md+: always visible (translate-x-0)
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{
          width: SIDEBAR_W_EXPANDED,
          background: NAVY,
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "2px 0 20px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── Sidebar Brand Area ── */}
        <div
          className="flex items-center shrink-0 overflow-hidden"
          style={{
            height: 72,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            padding: "0 12px",
            justifyContent: "flex-start",
          }}
        >
          {/* Logo mark — always visible */}
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Logo"
              className="rounded object-cover shrink-0"
              style={{
                width: 32,
                height: 32,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          ) : (
            <div
              className="rounded flex items-center justify-center shrink-0"
              style={{
                width: 32,
                height: 32,
                background: `${BLUE}55`,
                border: `1px solid ${BLUE}88`,
              }}
            >
              <Building2 style={{ width: 16, height: 16, color: "#FFFFFF" }} />
            </div>
          )}

          {/* Company name + edit — always visible */}
          <div
            className="flex items-center gap-1.5 overflow-hidden"
            style={{
              maxWidth: 140,
              marginLeft: 10,
            }}
          >
            <span
              className="font-display text-sm font-semibold tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                color: "#FFFFFF",
                letterSpacing: "0.1em",
                maxWidth: 110,
              }}
            >
              {companyName}
            </span>
            <button
              type="button"
              data-ocid="sidebar.brand.edit_button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit();
              }}
              className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
              aria-label="Edit company name and logo"
            >
              <Pencil style={{ width: 11, height: 11, color: SKY }} />
            </button>
          </div>
        </div>

        {/* ── Inline Edit Panel (inside sidebar, below brand) ── */}
        {editOpen && (
          <div
            className="px-3 py-3 flex flex-col gap-2.5 border-b"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <p
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: SKY, letterSpacing: "0.12em" }}
            >
              Branding
            </p>
            <Input
              data-ocid="sidebar.name.input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Company name"
              className="h-7 text-xs rounded border"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
              }}
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-ocid="sidebar.upload_button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity flex-1"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  color: SKY,
                  background: "rgba(255,255,255,0.06)",
                  fontSize: "0.65rem",
                }}
              >
                Upload Logo
              </button>
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt="Preview"
                  className="w-6 h-6 rounded object-cover"
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-ocid="sidebar.save_button"
                onClick={saveEdit}
                className="text-xs px-3 py-1 rounded tracking-wider uppercase font-medium hover:opacity-90 transition-opacity flex-1"
                style={{
                  background: BLUE,
                  color: "#FFFFFF",
                  fontSize: "0.65rem",
                }}
              >
                Save
              </button>
              <button
                type="button"
                data-ocid="sidebar.cancel_button"
                onClick={cancelEdit}
                className="text-xs px-2 py-1 rounded border tracking-wider uppercase hover:opacity-80 transition-opacity"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  color: SKY,
                  background: "transparent",
                  fontSize: "0.65rem",
                }}
              >
                <X style={{ width: 10, height: 10 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Nav items ── */}
        <div className="flex flex-col gap-1 pt-3 px-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                data-ocid={`nav.${item.value}.tab`}
                onClick={() => handleTabChange(item.value)}
                aria-label={item.label}
                className="relative flex items-center rounded-lg overflow-hidden shrink-0 transition-all duration-200 group"
                style={{
                  height: 44,
                  minWidth: 44,
                  paddingLeft: 12,
                  justifyContent: "flex-start",
                  background: isActive ? `${BLUE}44` : "transparent",
                  border: `1px solid ${isActive ? `${BLUE}88` : "transparent"}`,
                  color: isActive ? "#FFFFFF" : SKY,
                }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r"
                    style={{ height: 24, background: SKY }}
                  />
                )}
                <Icon
                  className="shrink-0 transition-colors duration-200"
                  style={{
                    width: 18,
                    height: 18,
                    color: isActive ? "#FFFFFF" : SKY,
                    marginLeft: isActive ? 6 : 0,
                  }}
                />
                <span
                  className="text-xs font-medium tracking-widest uppercase whitespace-nowrap overflow-hidden"
                  style={{
                    maxWidth: 140,
                    marginLeft: 10,
                    letterSpacing: "0.1em",
                    color: isActive ? "#FFFFFF" : SKY,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Settings (pinned to bottom) ── */}
        <div
          className="px-2 pb-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 8,
          }}
        >
          <button
            type="button"
            data-ocid="nav.settings.tab"
            aria-label="Settings"
            className="relative flex items-center rounded-lg overflow-hidden shrink-0 transition-all duration-200 w-full"
            style={{
              height: 44,
              paddingLeft: 12,
              justifyContent: "flex-start",
              background: "transparent",
              border: "1px solid transparent",
              color: SKY,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(160,184,240,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <Settings
              className="shrink-0"
              style={{ width: 18, height: 18, color: SKY }}
            />
            <span
              className="text-xs font-medium tracking-widest uppercase whitespace-nowrap overflow-hidden"
              style={{
                maxWidth: 140,
                marginLeft: 10,
                letterSpacing: "0.1em",
                color: SKY,
              }}
            >
              Settings
            </span>
          </button>
        </div>
      </nav>

      {/* ── RIGHT SIDE WRAPPER — on md+ offset by sidebar, full-width on mobile ── */}
      <div
        className="flex flex-col md:ml-[220px]"
        style={{
          flex: 1,
          height: "100vh",
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ── CLEAN MINIMAL HEADER — scrolls with the page ── */}
        <header
          className="flex items-center px-3 md:px-5 shrink-0 gap-2"
          style={{
            height: 60,
            background: "transparent",
          }}
        >
          {/* ── Hamburger (mobile only) ── */}
          <button
            type="button"
            data-ocid="header.hamburger.toggle"
            aria-label="Open navigation menu"
            className="md:hidden flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.6)",
            }}
            onClick={() => setMobileSidebarOpen((v) => !v)}
          >
            <Menu style={{ width: 18, height: 18, color: NAVY }} />
          </button>

          {/* ── LEFT: Search bar ── */}
          <div
            className="flex items-center rounded-full px-1 py-1 flex-1 min-w-0"
            style={{ background: "rgba(255,255,255,0.6)", maxWidth: 320 }}
          >
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: 15, height: 15, color: "#4a6fa8" }}
              />
              <Input
                data-ocid="header.search_input"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-9 pr-3 h-7 text-sm rounded-full border-0"
                style={{
                  background: "transparent",
                  color: NAVY,
                  boxShadow: "none",
                  fontSize: "0.8125rem",
                }}
              />
            </div>
          </div>

          {/* ── RIGHT: Data Sources icon + Notifications + User ── */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* Data Sources icon */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                background: "rgba(255,255,255,0.6)",
              }}
            >
              <button
                type="button"
                data-ocid="header.datasources.open_modal_button"
                onClick={() => setDataSourcesOpen(true)}
                aria-label="Open Data Sources panel"
                className="relative flex items-center justify-center rounded-full hover:bg-black/5 transition-colors duration-150"
                style={{ width: 36, height: 36 }}
              >
                <Database style={{ width: 16, height: 16, color: "#4a6fa8" }} />
              </button>
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <button
                  type="button"
                  data-ocid="header.notifications.toggle"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative flex items-center justify-center rounded-full hover:bg-black/5 transition-colors duration-150"
                  style={{ width: 36, height: 36 }}
                >
                  <Bell style={{ width: 17, height: 17, color: NAVY }} />
                  {/* Badge */}
                  <span
                    className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                    style={{
                      width: 15,
                      height: 15,
                      background: "#EF4444",
                      fontSize: "0.55rem",
                      lineHeight: 1,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {NOTIFICATIONS.length}
                  </span>
                </button>
              </div>

              {/* Notification dropdown */}
              {notifOpen && (
                <div
                  data-ocid="header.notifications.popover"
                  className="absolute right-0 top-full mt-2 rounded-xl border shadow-xl overflow-hidden"
                  style={{
                    width: "min(300px, calc(100vw - 16px))",
                    background: "rgba(255,255,255,0.98)",
                    borderColor: BORDER,
                    zIndex: 70,
                    boxShadow: "0 8px 32px rgba(26,26,46,0.12)",
                  }}
                >
                  {/* Header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between border-b"
                    style={{ borderColor: BORDER }}
                  >
                    <span
                      className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: NAVY, letterSpacing: "0.12em" }}
                    >
                      Notifications
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${BLUE}18`,
                        color: BLUE,
                        fontSize: "0.65rem",
                      }}
                    >
                      {NOTIFICATIONS.length} new
                    </span>
                  </div>
                  {/* Items */}
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      data-ocid={`header.notifications.item.${n.id}`}
                      className="px-4 py-3 flex items-start gap-3 border-b hover:bg-black/[0.025] transition-colors cursor-pointer"
                      style={{ borderColor: `${BORDER}88` }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: BLUE }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium leading-snug"
                          style={{ color: NAVY }}
                        >
                          {n.text}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: MIST }}>
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Footer */}
                  <div className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      className="text-xs font-medium hover:underline transition-all"
                      style={{ color: BLUE, letterSpacing: "0.04em" }}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider — hidden on very small screens */}
            <span
              className="hidden sm:block mx-1.5 rounded-full"
              style={{ width: 1, height: 24, background: `${BORDER}` }}
            />

            {/* User profile */}
            <div
              data-ocid="header.user_profile"
              className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors duration-150"
              style={{
                userSelect: "none",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                style={{
                  width: 32,
                  height: 32,
                  background: BLUE,
                  color: "#FFFFFF",
                  fontSize: "0.8rem",
                  letterSpacing: "0.02em",
                }}
              >
                A
              </div>
              {/* Name — hidden on small screens */}
              <span
                className="text-sm font-medium hidden sm:block"
                style={{ color: NAVY, fontSize: "0.8125rem" }}
              >
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT AREA — flex-1, scrollable per-tab ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Dashboard tab — scrollable content */}
            <TabsContent
              value="dashboard"
              style={{
                flex: 1,
                margin: 0,
                display: activeTab === "dashboard" ? "flex" : "none",
                flexDirection: "column",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <DashboardTab
                globalSearch={globalSearch}
                onStoreClick={() => setActiveTab("stores")}
              />
            </TabsContent>

            {/* Stores tab — scrollable content */}
            <TabsContent
              value="stores"
              style={{
                flex: 1,
                margin: 0,
                display: activeTab === "stores" ? "flex" : "none",
                flexDirection: "column",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <StoresTab globalSearch={globalSearch} />
            </TabsContent>

            {/* Tasks tab — kanban, NO outer scroll; columns scroll internally */}
            <TabsContent
              value="tasks"
              style={{
                flex: 1,
                margin: 0,
                display: activeTab === "tasks" ? "flex" : "none",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <TasksTab />
            </TabsContent>

            {/* AI tab — scrollable content */}
            <TabsContent
              value="ai"
              style={{
                flex: 1,
                margin: 0,
                display: activeTab === "ai" ? "flex" : "none",
                flexDirection: "column",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <PredictiveAITab />
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <footer
            className="border-t px-4 md:px-8 py-3 md:py-4 text-center text-xs tracking-wider uppercase shrink-0"
            style={{
              borderColor: BORDER,
              color: "#4a6fa8",
              background: `${NAVY}e8`,
              letterSpacing: "0.08em",
              backdropFilter: "blur(6px)",
            }}
          >
            &copy; {new Date().getFullYear()} &mdash; Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: SKY }}
              className="hover:underline"
            >
              caffeine.ai
            </a>
          </footer>
          <Toaster />
        </div>
      </div>
      {/* ── end RIGHT SIDE WRAPPER ── */}

      {/* Data Sources Panel */}
      <DataSourcesPanel
        open={dataSourcesOpen}
        onOpenChange={setDataSourcesOpen}
      />
    </div>
  );
}
