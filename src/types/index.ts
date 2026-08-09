import type { IconType } from "react-icons";

// ── Theme Types ──────────────────────────────────────────────────────────
export interface ThemeColors {
  name: string;
  accent: string;
  bg: string;
  surface: string;
  color: string;
}

export interface ThemeGroup {
  name: string;
  themes: string[];
}

// ── Text/Typing Types ────────────────────────────────────────────────────
export interface TextPool {
  [lang: string]: string[];
}

export interface LanguageInfo {
  [code: string]: string;
}

export interface LanguageGroup {
  name: string;
  langs: string[];
}

// ── Leaderboard Types ────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  name: string;
  country: string;
  countryName: string;
  wpm: number;
  acc: number;
  lang: string;
  avatar: string;
  color: string;
  isMe?: boolean;
}

export interface CountryStats {
  flag: string;
  name: string;
  totalWpm: number;
  count: number;
  bestWpm: number;
  players: LeaderboardEntry[];
  avgWpm: number;
}

// ── History Types ────────────────────────────────────────────────────────
export interface TestResult {
  wpm: number;
  accuracy: number;
  errors: number;
  /** To'g'ri yozilgan belgilar soni — WPM shu qiymatga asoslanadi */
  correct: number;
  /** Jami bosilgan belgilar (xatolar bilan birga) */
  total: number;
  /** Test davomiyligi — soniyalarda */
  time: number;
  /** Foydalanuvchi ID (Convex token) — tizimga kirgan bo'lsa */
  userId?: string;
  lang: string;
  duration: number | string;
  date: string;
  recordingId?: number;
}

// ── Mission Types ────────────────────────────────────────────────────────
export interface Reward {
  xp: number;
  badge?: IconType;
  coins?: number;
}

export interface Mission {
  id: string;
  icon: IconType;
  title: string;
  desc: string;
  goal: number;
  type: string;
  reward: Reward;
  season?: string;
}

export interface ActiveMission extends Mission {
  progress: number;
  completed: boolean;
}

export interface SeasonEvent {
  id: string;
  name: string;
  desc: string;
  start: string;
  end: string;
  missions: Mission[];
  isActive: () => boolean;
}

// ── Daily Login Types ────────────────────────────────────────────────────
export interface DailyState {
  lastLogin: string | null;
  streak: number;
  claimedToday: boolean;
  totalLogins: number;
  rewards: Record<string, number>;
  totalXp?: number;
  totalCoins?: number;
}

// ── Replay Types ─────────────────────────────────────────────────────────
export interface ReplayEvent {
  type: string;
  key?: string;
  correct?: boolean;
  time: number;
}

export interface ReplayRecording {
  text: string;
  events: ReplayEvent[];
  startTime: number;
  wpm: number;
  accuracy: number;
  date: string;
  id?: number;
}

// ── Friend Types ─────────────────────────────────────────────────────────
export interface FriendUser {
  name: string;
  country: string;
  status: "online" | "idle" | "offline";
  wpm: number;
  avatar: string;
  color: string;
  addedAt?: number;
}

export interface FriendRequest {
  name: string;
  sent: number;
}

// ── Chat Types ───────────────────────────────────────────────────────────
export interface ChatUser {
  name: string;
  color: string;
  avatar: string;
}

export interface ChatMessage {
  id: number;
  user: ChatUser;
  text: string;
  time: string;
}

// ── Game Types ───────────────────────────────────────────────────────────
export interface GameInfo {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface BotRacer {
  id: number;
  name: string;
  color: string;
  progress: number;
  wpm: number;
  speed: number;
  finished: boolean;
  finishTime: number;
}

// ── Multiplayer Race Types ───────────────────────────────────────────────
export type RaceState = "idle" | "waiting" | "racing" | "finished";

// ── Settings/Preferences Types ───────────────────────────────────────────
export interface UserPreferences {
  theme: string;
  lang: string;
  duration: number | string;
  fontSize: string;
  soundEnabled: boolean;
  showKeyboard: boolean;
  showHeatmap: boolean;
}

// ── Particle Types ───────────────────────────────────────────────────────
export interface Particle {
  id: number | string;
  ok: boolean;
  x: number;
  y: number;
}

// ── Component Props ──────────────────────────────────────────────────────
export interface ThemeProp {
  t: ThemeColors;
}

export interface ViewProps extends ThemeProp {
  onClose: () => void;
}

export interface HistoryViewProps extends ViewProps {
  history: TestResult[];
  onFavorite: (txt: string) => void;
  favorites: string[];
  showReplay?: (id: number) => void;
}

export interface ProfileViewProps extends ViewProps {
  history: TestResult[];
}

export interface WeeklyMissionsViewProps extends ViewProps {
  missions: ActiveMission[];
  xp: number;
}

export interface DailyLoginViewProps extends ViewProps {
  daily: DailyState;
}

export interface ProgressDashboardProps extends ViewProps {
  history: TestResult[];
}

export interface CustomTextImportProps extends ViewProps {
  onImportText: (text: string) => void;
}

export interface AIExercisesProps extends ViewProps {
  onSelectText: (text: string) => void;
}

export interface MultiplayerRaceProps extends ViewProps {
  currentWpm: number;
  isPlaying: boolean;
}

export interface TypingReplayViewProps extends ViewProps {
  recordings: ReplayRecording[];
}

export interface SeasonalEventProps extends ViewProps {
  missions: ActiveMission[];
  updateProgress: (type: string, value: number) => void;
}

export interface SettingsModalProps {
  t: ThemeColors;
  theme: string;
  setTheme: (theme: string) => void;
  lang: string;
  setLang: (lang: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  showKeyboard: boolean;
  setShowKeyboard: (show: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  fingerGuide: boolean;
  setFingerGuide: (show: boolean) => void;
  onClose: () => void;
}

export interface KeyboardVisualizerProps extends ThemeProp {
  pressedKeys?: string[];
  showHeatmap?: boolean;
  layout?: string;
  fingerGuide?: boolean;
  nextKey?: string;
}

export interface AnimatedAvatarProps {
  name?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export interface GameProps extends ThemeProp {}

export interface CountryRankingProps extends ViewProps {}
