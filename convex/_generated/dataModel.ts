/**
 * STUB — `npx convex dev` / `npx convex codegen` real fayllarni generatsiya qiladi.
 */

export type TableNames =
  | "users"
  | "rooms"
  | "typingResults"
  | "achievements"
  | "userAchievements"
  | "reports"
  | "announcements"
  | "adminLogs"
  | "typingTexts"
  | "coinTransactions"
  | "settings"
  | "chatMessages"
  | "authAccounts"
  | "authSessions"
  | "authVerificationTokens"
  | "authRefreshTokens";

export type Id<TableName extends TableNames> = string & { __tableName?: TableName };
export type GenericId<TableName extends string> = string & { __tableName?: TableName };

export type Doc<TableName extends TableNames> = {
  _id: Id<TableName>;
  _creationTime: number;
} & Record<string, any>;

export type GenericDoc<DataModel, TableName extends keyof DataModel> = Record<string, any>;
