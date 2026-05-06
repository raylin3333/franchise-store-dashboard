import type { Store } from "../types";

export interface SheetConnection {
  url: string;
  lastSynced: string | null;
  importedCount: number;
}

const SHEET_CONNECTION_KEY = "franchiseSheetConnection";
const IMPORTED_STORES_KEY = "franchiseImportedStores";
const STORE_OVERRIDES_KEY = "franchiseStoreOverrides";

export function saveSheetConnection(conn: SheetConnection): void {
  try {
    localStorage.setItem(SHEET_CONNECTION_KEY, JSON.stringify(conn));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadSheetConnection(): SheetConnection | null {
  try {
    const raw = localStorage.getItem(SHEET_CONNECTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SheetConnection;
  } catch {
    return null;
  }
}

export function saveImportedStores(stores: Partial<Store>[]): void {
  try {
    localStorage.setItem(IMPORTED_STORES_KEY, JSON.stringify(stores));
  } catch {
    // localStorage may be full
  }
}

export function loadImportedStores(): Partial<Store>[] {
  try {
    const raw = localStorage.getItem(IMPORTED_STORES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Partial<Store>[];
  } catch {
    return [];
  }
}

export function saveStoreOverride(
  storeId: string,
  override: Partial<Store>,
): void {
  try {
    const existing = loadStoreOverrides();
    existing[storeId] = { ...existing[storeId], ...override };
    localStorage.setItem(STORE_OVERRIDES_KEY, JSON.stringify(existing));
  } catch {
    // localStorage may be full
  }
}

export function loadStoreOverrides(): Record<string, Partial<Store>> {
  try {
    const raw = localStorage.getItem(STORE_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Partial<Store>>;
  } catch {
    return {};
  }
}

const STORE_DEFAULTS: Omit<Store, "id" | "name" | "brand" | "status"> = {
  subscriptionType: "",
  history: "",
  telephony: "",
  salesRep: "",
  storeCode: "",
  annualRevenue: 0,
  revenue: [],
};

export function mergeStores(
  backendStores: Store[] | undefined,
  importedStores: Partial<Store>[] | undefined,
  overrides: Record<string, Partial<Store>> | undefined,
): Store[] {
  // Build a map from backend stores
  const storeMap = new Map<string, Store>();
  for (const store of backendStores ?? []) {
    storeMap.set(store.id, { ...store });
  }

  // Merge imported stores
  for (const imported of importedStores ?? []) {
    if (!imported.id && !imported.name) continue;

    const id = imported.id || `imported-${imported.name}`;

    if (storeMap.has(id)) {
      // Merge imported data into existing store (existing values take priority)
      const existing = storeMap.get(id)!;
      const merged: Store = { ...STORE_DEFAULTS, ...imported, ...existing, id };
      storeMap.set(id, merged);
    } else {
      // New store from import
      const newStore: Store = {
        ...STORE_DEFAULTS,
        status: "Active",
        name: imported.name || "Unknown Store",
        brand: imported.brand || "Unknown",
        ...imported,
        id,
      };
      storeMap.set(id, newStore);
    }
  }

  // Apply manual overrides (highest priority)
  for (const [id, override] of Object.entries(overrides ?? {})) {
    if (storeMap.has(id)) {
      const existing = storeMap.get(id)!;
      storeMap.set(id, { ...existing, ...override, id });
    }
  }

  return Array.from(storeMap.values());
}
