import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Store, Task } from "../types";
import {
  loadImportedStores,
  loadStoreOverrides,
  mergeStores,
  saveImportedStores,
  saveSheetConnection,
} from "../utils/localStoreOverrides";
import { parseSheetCSV } from "../utils/sheetParser";
import { useActor } from "./useActor";

// ─── Hardcoded fallback stores ───────────────────────────────────────────────
// Used when actor/backend is unavailable or returns an empty array.
// 30 stores across 5 brands — 14 Active, 8 Inactive, 8 Pending.
export const HARDCODED_STORES: Store[] = [
  // Pizza Hub — 6 Active, 2 Inactive, 2 Pending
  {
    id: "ph-001",
    brand: "Pizza Hub",
    name: "Pizza Hub Downtown",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Alice Chen",
    storeCode: "PH001",
    annualRevenue: 284000,
    revenue: [22000, 24000, 23000, 25000, 26000, 24000],
  },
  {
    id: "ph-002",
    brand: "Pizza Hub",
    name: "Pizza Hub Westside",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Bob Kim",
    storeCode: "PH002",
    annualRevenue: 210000,
    revenue: [17000, 18000, 17500, 18500, 17000, 18000],
  },
  {
    id: "ph-003",
    brand: "Pizza Hub",
    name: "Pizza Hub Midtown",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Alice Chen",
    storeCode: "PH003",
    annualRevenue: 310000,
    revenue: [25000, 26000, 27000, 25500, 26500, 27000],
  },
  {
    id: "ph-004",
    brand: "Pizza Hub",
    name: "Pizza Hub Northgate",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Carol Davis",
    storeCode: "PH004",
    annualRevenue: 195000,
    revenue: [16000, 16500, 15500, 16000, 17000, 16200],
  },
  {
    id: "ph-005",
    brand: "Pizza Hub",
    name: "Pizza Hub Eastpark",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Bob Kim",
    storeCode: "PH005",
    annualRevenue: 260000,
    revenue: [21000, 22000, 21500, 22500, 22000, 21800],
  },
  {
    id: "ph-006",
    brand: "Pizza Hub",
    name: "Pizza Hub Lakeview",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Alice Chen",
    storeCode: "PH006",
    annualRevenue: 175000,
    revenue: [14000, 14500, 15000, 14800, 15200, 14700],
  },
  {
    id: "ph-007",
    brand: "Pizza Hub",
    name: "Pizza Hub Riverside",
    status: "Inactive",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Carol Davis",
    storeCode: "PH007",
    annualRevenue: 110000,
    revenue: [10000, 9500, 9000, 8500, 9000, 8800],
  },
  {
    id: "ph-008",
    brand: "Pizza Hub",
    name: "Pizza Hub Uptown",
    status: "Inactive",
    subscriptionType: "Basic",
    history: "",
    telephony: "",
    salesRep: "Bob Kim",
    storeCode: "PH008",
    annualRevenue: 95000,
    revenue: [8000, 7800, 7500, 8000, 7900, 8100],
  },
  {
    id: "ph-009",
    brand: "Pizza Hub",
    name: "Pizza Hub Harbourview",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Alice Chen",
    storeCode: "PH009",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "ph-010",
    brand: "Pizza Hub",
    name: "Pizza Hub Greenmount",
    status: "Pending",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Carol Davis",
    storeCode: "PH010",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },

  // Burger Tow — 3 Active, 2 Inactive, 2 Pending
  {
    id: "bt-001",
    brand: "Burger Tow",
    name: "Burger Tow Central",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Dan Patel",
    storeCode: "BT001",
    annualRevenue: 320000,
    revenue: [26000, 27000, 28000, 27500, 26500, 27000],
  },
  {
    id: "bt-002",
    brand: "Burger Tow",
    name: "Burger Tow Southpark",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Eva Torres",
    storeCode: "BT002",
    annualRevenue: 240000,
    revenue: [20000, 20500, 19500, 20000, 21000, 20300],
  },
  {
    id: "bt-003",
    brand: "Burger Tow",
    name: "Burger Tow Crossroads",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Dan Patel",
    storeCode: "BT003",
    annualRevenue: 215000,
    revenue: [18000, 18500, 17800, 18200, 17500, 18100],
  },
  {
    id: "bt-004",
    brand: "Burger Tow",
    name: "Burger Tow Hillcrest",
    status: "Inactive",
    subscriptionType: "Basic",
    history: "",
    telephony: "",
    salesRep: "Eva Torres",
    storeCode: "BT004",
    annualRevenue: 88000,
    revenue: [7500, 7200, 7000, 7300, 7100, 7400],
  },
  {
    id: "bt-005",
    brand: "Burger Tow",
    name: "Burger Tow Bayfront",
    status: "Inactive",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Dan Patel",
    storeCode: "BT005",
    annualRevenue: 102000,
    revenue: [8500, 8200, 8800, 8400, 8600, 8700],
  },
  {
    id: "bt-006",
    brand: "Burger Tow",
    name: "Burger Tow Fairfield",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Eva Torres",
    storeCode: "BT006",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "bt-007",
    brand: "Burger Tow",
    name: "Burger Tow Thornton",
    status: "Pending",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Dan Patel",
    storeCode: "BT007",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },

  // Coffee Cor — 2 Active, 2 Inactive, 2 Pending
  {
    id: "cc-001",
    brand: "Coffee Cor",
    name: "Coffee Cor Midtown",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Fiona Walsh",
    storeCode: "CC001",
    annualRevenue: 185000,
    revenue: [15000, 15500, 15200, 15800, 16000, 15600],
  },
  {
    id: "cc-002",
    brand: "Coffee Cor",
    name: "Coffee Cor Airport",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "George Ito",
    storeCode: "CC002",
    annualRevenue: 145000,
    revenue: [12000, 12300, 11800, 12500, 12100, 12200],
  },
  {
    id: "cc-003",
    brand: "Coffee Cor",
    name: "Coffee Cor Station",
    status: "Inactive",
    subscriptionType: "Basic",
    history: "",
    telephony: "",
    salesRep: "Fiona Walsh",
    storeCode: "CC003",
    annualRevenue: 72000,
    revenue: [6000, 5800, 6100, 5900, 6200, 6000],
  },
  {
    id: "cc-004",
    brand: "Coffee Cor",
    name: "Coffee Cor Business Park",
    status: "Inactive",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "George Ito",
    storeCode: "CC004",
    annualRevenue: 89000,
    revenue: [7500, 7200, 7400, 7600, 7300, 7500],
  },
  {
    id: "cc-005",
    brand: "Coffee Cor",
    name: "Coffee Cor Waterfront",
    status: "Pending",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Fiona Walsh",
    storeCode: "CC005",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "cc-006",
    brand: "Coffee Cor",
    name: "Coffee Cor Suburbia",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "George Ito",
    storeCode: "CC006",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },

  // Taco Fiesta — 2 Active, 1 Inactive, 2 Pending
  {
    id: "tf-001",
    brand: "Taco Fiesta",
    name: "Taco Fiesta Market",
    status: "Active",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Hana Suzuki",
    storeCode: "TF001",
    annualRevenue: 165000,
    revenue: [13500, 14000, 13800, 14200, 13900, 14100],
  },
  {
    id: "tf-002",
    brand: "Taco Fiesta",
    name: "Taco Fiesta Plaza",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Ivan Brooks",
    storeCode: "TF002",
    annualRevenue: 198000,
    revenue: [16500, 16800, 17000, 16700, 16900, 17100],
  },
  {
    id: "tf-003",
    brand: "Taco Fiesta",
    name: "Taco Fiesta Suburbs",
    status: "Inactive",
    subscriptionType: "Basic",
    history: "",
    telephony: "",
    salesRep: "Hana Suzuki",
    storeCode: "TF003",
    annualRevenue: 78000,
    revenue: [6500, 6300, 6600, 6400, 6700, 6500],
  },
  {
    id: "tf-004",
    brand: "Taco Fiesta",
    name: "Taco Fiesta Eastside",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Ivan Brooks",
    storeCode: "TF004",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "tf-005",
    brand: "Taco Fiesta",
    name: "Taco Fiesta Northgate",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Hana Suzuki",
    storeCode: "TF005",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },

  // Urban Bite — 1 Active, 1 Inactive, 2 Pending
  {
    id: "ub-001",
    brand: "Urban Bite",
    name: "Urban Bite Downtown",
    status: "Active",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Julia Markov",
    storeCode: "UB001",
    annualRevenue: 225000,
    revenue: [18500, 19000, 18800, 19200, 18700, 19100],
  },
  {
    id: "ub-002",
    brand: "Urban Bite",
    name: "Urban Bite Rooftop",
    status: "Inactive",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Kevin Lee",
    storeCode: "UB002",
    annualRevenue: 115000,
    revenue: [9500, 9200, 9600, 9300, 9700, 9400],
  },
  {
    id: "ub-003",
    brand: "Urban Bite",
    name: "Urban Bite Courtyard",
    status: "Pending",
    subscriptionType: "Premium",
    history: "",
    telephony: "",
    salesRep: "Julia Markov",
    storeCode: "UB003",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
  {
    id: "ub-004",
    brand: "Urban Bite",
    name: "Urban Bite Strip Mall",
    status: "Pending",
    subscriptionType: "Standard",
    history: "",
    telephony: "",
    salesRep: "Kevin Lee",
    storeCode: "UB004",
    annualRevenue: 0,
    revenue: [0, 0, 0, 0, 0, 0],
  },
];
// Summary: 14 Active, 8 Inactive, 8 Pending = 30 total across 5 brands

export function useStores() {
  const { actor } = useActor();
  return useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: async () => {
      const backendStores: Store[] = actor
        ? ((await actor.getStores()) as Store[])
        : [];
      // Always re-read from localStorage on every queryFn execution so that
      // data saved by useSheetSync.sync() is picked up immediately on refetch.
      const importedStores = loadImportedStores();
      const overrides = loadStoreOverrides();
      const merged = mergeStores(backendStores, importedStores, overrides);
      // If backend returned nothing and no imports, fall back to hardcoded data
      // so the dashboard always has something meaningful to display.
      if (merged.length === 0) {
        return mergeStores(HARDCODED_STORES, importedStores, overrides);
      }
      return merged;
    },
    // Always run the query — don't block on actor being ready.
    // If actor is still fetching, backendStores will be [] but we fall back to hardcoded.
    enabled: true,
    // Keep staleTime low so invalidation always triggers a fresh fetch.
    staleTime: 0,
    // Ensure we immediately return hardcoded stores as placeholderData
    // so the UI is never empty while the actor initialises.
    placeholderData: HARDCODED_STORES,
  });
}

export function useTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks() as Promise<Task[]>;
    },
    enabled: !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      description: string;
      storeId: string;
      priority: string;
      dueDate: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.createTask(
        vars.title,
        vars.description,
        vars.storeId,
        vars.priority,
        vars.dueDate,
        BigInt(Date.now()),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { taskId: bigint; task: Task }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateTask(vars.taskId, vars.task);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteTask(taskId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useSheetSync() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync(url: string): Promise<void> {
    setIsSyncing(true);
    setError(null);

    try {
      if (!actor) {
        throw new Error(
          "Backend is not ready yet. Please try again in a moment.",
        );
      }

      // Route the fetch through the backend canister to avoid CORS issues.
      // fetchSheetCSV returns a Motoko Result<Text, Text> as a Candid variant
      // { __kind__: "ok", ok: string } | { __kind__: "err", err: string }.
      const result = await actor.fetchSheetCSV(url);

      // Unwrap the Result variant — handle both __kind__ and direct ok/err shapes
      // for forward compatibility.
      let csvText: string;
      if (result.__kind__ === "ok") {
        csvText = result.ok;
      } else if (result.__kind__ === "err") {
        throw new Error(
          result.err ||
            "The sheet could not be fetched. Ensure it is shared as 'Anyone with the link can view'.",
        );
      } else {
        // Fallback: try treating the result as a plain string (older backend builds)
        csvText = String(result);
      }

      if (!csvText || !csvText.trim()) {
        throw new Error(
          "The sheet returned empty data. Check that it has at least one data row.",
        );
      }

      const imported = parseSheetCSV(csvText);

      if (imported.length === 0) {
        throw new Error(
          "No valid store rows found. Ensure your sheet has the correct column headers (brand, name, status).",
        );
      }

      // Persist to localStorage BEFORE invalidating so that the queryFn
      // reads the latest data immediately when React Query refetches.
      saveImportedStores(imported);
      saveSheetConnection({
        url,
        lastSynced: new Date().toISOString(),
        importedCount: imported.length,
      });

      // Use refetchQueries (not just invalidate) to guarantee an immediate
      // re-execution of the queryFn even when staleTime is 0 and the cache
      // was recently populated. invalidateQueries is also called to ensure
      // any subscribed observers are notified.
      await qc.invalidateQueries({ queryKey: ["stores"] });
      await qc.refetchQueries({ queryKey: ["stores"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
    } finally {
      setIsSyncing(false);
    }
  }

  return { sync, isSyncing, error };
}
