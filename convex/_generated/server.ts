/**
 * STUB — `npx convex dev` / `npx convex codegen` real fayllarni generatsiya qiladi.
 * Bu stub Convex deployment sozlanmagan holatda ham TypeScript tekshiruvi ishlashi uchun.
 */

export interface QueryChain {
  withIndex(indexName: string, predicate?: (q: any) => QueryChain): QueryChain;
  filter(predicate: (q: any) => QueryChain): QueryChain;
  order(order?: "asc" | "desc"): QueryChain;
  take(n: number): Promise<any[]>;
  collect(): Promise<any[]>;
  first(): Promise<any | null>;
  unique(): Promise<any | null>;
}

export interface Database {
  query(table: string): QueryChain;
  get(id: any): Promise<any | null>;
  insert(table: string, value: any): Promise<any>;
  patch(id: any, value: any): Promise<void>;
  delete(id: any): Promise<void>;
  replace(id: any, value: any): Promise<void>;
  insertOrIgnore(table: string, value: any): Promise<any>;
}

export interface QueryCtx {
  db: Database;
  auth: any;
  storage: any;
}

export interface MutationCtx {
  db: Database;
  auth: any;
  storage: any;
}

export interface ActionCtx {
  db: Database;
  auth: any;
  storage: any;
  scheduler: any;
  runMutation: any;
  runQuery: any;
  runAction: any;
}

export function query<Output>(def: {
  args?: any;
  handler: (ctx: QueryCtx, args: any) => Output | Promise<Output>;
}): any {
  return def;
}

export function mutation<Output>(def: {
  args?: any;
  handler: (ctx: MutationCtx, args: any) => Output | Promise<Output>;
}): any {
  return def;
}

export function action<Output>(def: {
  args?: any;
  handler: (ctx: ActionCtx, args: any) => Output | Promise<Output>;
}): any {
  return def;
}

export const internalQuery = query;
export const internalMutation = mutation;
export const internalAction = action;
export const httpAction = (def: any) => def;

export default { query, mutation, action, internalQuery, internalMutation, internalAction, httpAction };
