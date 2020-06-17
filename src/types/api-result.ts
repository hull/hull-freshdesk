export type ApiMethod = "query" | "insert" | "update" | "delete" | "bulkUpsert";

export interface ApiResultObject<T, U> {
  endpoint: string;
  method: ApiMethod;
  record: T | undefined;
  data: U;
  success: boolean;
  error?: string | string[];
}
