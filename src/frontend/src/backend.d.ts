import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Task {
    id: bigint;
    status: string;
    title: string;
    storeId: string;
    createdAt: bigint;
    dueDate: string;
    description: string;
    priority: string;
}
export interface Store {
    id: string;
    status: string;
    salesRep: string;
    revenue: Array<number>;
    name: string;
    subscriptionType: string;
    history: string;
    storeCode: string;
    brand: string;
    telephony: string;
    annualRevenue: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    createTask(title: string, description: string, storeId: string, priority: string, dueDate: string, createdAt: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    fetchSheetCSV(sheetUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllTasks(): Promise<Array<Task>>;
    getStoreById(id: string): Promise<Store>;
    getStores(): Promise<Array<Store>>;
    getStoresByBrand(brand: string): Promise<Array<Store>>;
    getStoresByStatus(status: string): Promise<Array<Store>>;
    getStoresBySubscription(subscriptionType: string): Promise<Array<Store>>;
    getTasksByPriority(priority: string): Promise<Array<Task>>;
    getTasksByStatus(status: string): Promise<Array<Task>>;
    getTasksByStore(storeId: string): Promise<Array<Task>>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateTask(taskId: bigint, task: Task): Promise<void>;
}
