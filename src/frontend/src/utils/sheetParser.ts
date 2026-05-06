import type { Store } from "../types";

export const CSV_TEMPLATE_HEADERS =
  "id,brand,name,status,subscriptionType,history,telephony,salesRep,annualRevenue,storeCode,revenue";

export function generateTemplateCSV(): string {
  const row1 =
    'STORE-001,Pizza Hub,Pizza Hub Downtown,Active,Premium,3 years,VoIP,Jane Smith,480000,PH-001,"[42000,44000,41000,46000,48000,50000,47000,52000,55000,53000,56000,60000]"';
  const row2 =
    'STORE-002,Burger Tow,Burger Tow Westside,Pending,Standard,1 year,Landline,Mark Davis,210000,BT-002,"[18000,19000,17500,20000,21000,19500,22000,21500,20000,23000,22500,24000]"';
  return [CSV_TEMPLATE_HEADERS, row1, row2].join("\n");
}

function parseRevenue(raw: string): number[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  // Try JSON array format first
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
      }
    } catch {
      // fall through to comma-separated parsing
    }
  }
  // Try comma-separated numbers
  return trimmed
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseSheetCSV(csvText: string): Partial<Store>[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  // Fuzzy column resolver: maps each raw header to a Store field by checking
  // whether the header *contains* the key term (case-insensitive, spaces stripped).
  function resolveField(rawHeader: string): keyof Store | undefined {
    const h = rawHeader.toLowerCase().replace(/\s+/g, "");
    if (!h) return undefined;
    // Exact / prefix matches first
    if (h === "id" || h === "storeid") return "id";
    if (h === "storecode" || h === "code") return "storeCode";
    if (h === "revenue") return "revenue";
    if (h === "annualrevenue" || h === "annual_revenue") return "annualRevenue";
    if (
      h === "subscriptiontype" ||
      h === "subscription_type" ||
      h === "subscription"
    )
      return "subscriptionType";
    if (h === "salesrep" || h === "sales_rep" || h === "salesrepresentative")
      return "salesRep";
    if (h === "telephony" || h === "phone") return "telephony";
    if (h === "history") return "history";
    // Fuzzy / contains matches for the most critical fields
    if (h.includes("status")) return "status";
    if (h.includes("brand")) return "brand";
    if (h.includes("name") && !h.includes("sales")) return "name";
    if (h.includes("code")) return "storeCode";
    if (h.includes("revenue") && h.includes("annual")) return "annualRevenue";
    if (h.includes("revenue")) return "revenue";
    return undefined;
  }

  const results: Partial<Store>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => v === "")) continue;

    const store: Partial<Store> = {};

    for (let j = 0; j < headers.length; j++) {
      const field = resolveField(headers[j]);
      if (!field) continue;

      const raw = (values[j] ?? "").trim();

      if (field === "revenue") {
        const parsed = parseRevenue(raw);
        if (parsed.length > 0) store.revenue = parsed;
      } else if (field === "annualRevenue") {
        const num = Number(raw.replace(/[^0-9.-]/g, ""));
        store.annualRevenue = Number.isNaN(num) ? 0 : num;
      } else {
        (store as Record<string, unknown>)[field as string] = raw;
      }
    }

    // Only include rows that have at least an id or name
    if (store.id || store.name) {
      results.push(store);
    }
  }

  return results;
}
