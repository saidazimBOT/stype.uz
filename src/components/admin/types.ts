export type Role = "user" | "admin" | "owner";
export type Difficulty = "easy" | "medium" | "hard";
export type ReqType = "wpm" | "accuracy" | "tests" | "races" | "coins" | "xp";
export type ReportStatus = "pending" | "reviewed" | "resolved";

export interface AdminUser {
  _id: string;
  username: string;
  avatar: string;
  coins: number;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  races: number;
  bestWpm: number;
  lastSeen: number;
  role: Role;
  banned: boolean;
  bannedReason: string;
  createdAt: number;
}

/** Ro'yxatdan o'tganlar bo'limi — sign up qilgan foydalanuvchi */
export interface RegisteredUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: Role;
  signedUpAt: number;
  lastSeen: number;
}

export interface AdminStats {
  totals: {
    users: number;
    online: number;
    newToday: number;
    testsToday: number;
    tests7d: number;
    tests30d: number;
    newUsers7d: number;
    newUsers30d: number;
    avgWpm: number;
    avgAcc: number;
    avgWpm7d: number;
    avgAcc7d: number;
    avgWpm30d: number;
    avgAcc30d: number;
    bestWpm: number;
  };
  series: {
    date: string;
    label: string;
    tests: number;
    wpm: number;
    newUsers: number;
  }[];
}

export interface TextItem {
  _id: string;
  text: string;
  lang: string;
  difficulty: Difficulty;
  category: string;
  enabled: boolean;
  createdByName: string;
  createdAt: number;
}

export interface AchievementItem {
  _id: string;
  key: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  reqType: ReqType;
  reqGoal: number;
  xpReward: number;
  coinReward: number;
  enabled: boolean;
  order: number;
}

export interface ReportItem {
  _id: string;
  reporterName: string;
  targetName: string;
  reason: string;
  details: string;
  status: ReportStatus;
  adminNote: string;
  adminName: string;
  createdAt: number;
  updatedAt: number;
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  body: string;
  enabled: boolean;
  scheduledFor: number | null;
  expiresAt: number | null;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
}

export interface LogItem {
  _id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  createdAt: number;
}

export interface TxItem {
  _id: string;
  username: string;
  kind: "coins" | "xp";
  amount: number;
  balanceAfter: number;
  reason: string;
  adminName: string;
  createdAt: number;
}

export interface UserProfile {
  user: AdminUser;
  results: {
    wpm: number;
    accuracy: number;
    errors: number;
    lang: string;
    duration: number;
    createdAt: number;
  }[];
  achievements: {
    key: string;
    title: string;
    icon: string;
    color: string;
    unlockedAt: number;
  }[];
  transactions: {
    kind: "coins" | "xp";
    amount: number;
    balanceAfter: number;
    reason: string;
    adminName: string;
    createdAt: number;
  }[];
}

export interface PublicSettings {
  siteName: string;
  logo: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementsEnabled: boolean;
  registrationOpen: boolean;
}

export interface AdminSettings extends PublicSettings {
  updatedAt: number;
  updatedByName: string;
}
