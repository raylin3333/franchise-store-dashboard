// Local type definitions for the Franchise Dashboard
// These mirror the data shapes used throughout the app

export interface Store {
  id: string;
  brand: string;
  name: string;
  status: string;
  // Fields below may be absent in CSV-imported stores
  subscriptionType?: string;
  history?: string;
  telephony?: string;
  salesRep?: string;
  annualRevenue?: number;
  storeCode?: string;
  revenue?: number[];
}

export interface Task {
  id: bigint;
  title: string;
  description: string;
  storeId: string;
  priority: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}
