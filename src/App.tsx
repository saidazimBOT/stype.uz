"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TEXTS, LANG_LABELS, LANG_FLAGS } from "./data/texts";
import { THEMES, FONT_SIZES, DURATIONS, THEME_LIST } from "./data/themes";
import { createAudioController } from "./utils/audio";
import { charsEqual } from "./utils/typingChars";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useDailyReward } from "./components/features/DailyLogin";
import { useProfile, fullName } from "./hooks/useProfile";
import SignUpModal from "./components/features/SignUpModal";
import ProfileAvatar from "./components/features/ProfileAvatar";
import { useMissions } from "./components/features/WeeklyMissions";
import { useReplay } from "./components/features/TypingReplay";
import { useCoins } from "./hooks/useCoins";
import CoinNotification, { type CoinNotif } from "./components/features/CoinNotification";
import { getAvatarInfo } from "./data/shop";
import type { ThemeColors, TestResult, Particle } from "./types";

// Views
import LeaderboardView from "./components/views/LeaderboardView";
import ProfileView from "./components/views/ProfileView";
import HistoryView from "./components/views/HistoryView";
import AboutView from "./components/views/AboutView";
import GamesView from "./components/views/GamesView";
import ShopView from "./components/views/ShopView";

// Features
import DailyLoginView from "./components/features/DailyLoginView";
import WeeklyMissionsView from "./components/features/WeeklyMissions";
import ProgressDashboard from "./components/features/ProgressDashboard";
import CountryRanking from "./components/features/CountryRanking";
import KeyboardVisualizer from "./components/features/KeyboardVisualizer";
import BattleHub from "./components/features/Battle/BattleHub";
import { ConvexClientProvider } from "./lib/battle";
import FriendSystem from "./components/features/FriendSystem";
import Chat from "./components/features/Chat";
import SeasonalEvent from "./components/features/SeasonalEvent";
import AIExercises from "./components/features/AIExercises";
import CustomTextImport from "./components/features/CustomTextImport";
import TypingReplayView from "./components/features/TypingReplay";
import SettingsModal from "./components/layout/SettingsModal";
import TelegramPromo from "./components/features/TelegramPromo";
import LingohubPromo from "./components/features/LingohubPromo";
import LingohubLogo from "./components/features/LingohubLogo";
import AccountSyncBridge from "./components/features/AccountSyncBridge";
import TypingDNA from "./components/features/TypingDNA";
import OwnerView from "./components/features/OwnerView";
import AppLogo from "./components/AppLogo";
import CoinIcon from "./components/CoinIcon";
import AdminPanel from "./components/admin/AdminPanel";
import { useVisitTracker, recordTyping } from "./hooks/useVisitTracker";
import { setSid as setGscSid } from "./lib/gscApi";

// SVG icons (stiker/emoji o'rniga)
import {
  FiActivity, FiAward, FiBookOpen, FiCpu, FiGrid, FiHeart, FiInfo, FiList,
  FiMap, FiMessageCircle, FiSend, FiShoppingBag, FiStar, FiTarget, FiThumbsUp, FiTrendingUp,
  FiType, FiUser, FiUsers, FiVideo, FiZap,
} from "react-icons/fi";
import { FaDna, FaKeyboard, FaMedal, FaPalette, FaRobot, FaTelegram, FaTrophy } from "react-icons/fa6";
import type { IconType } from "react-icons";

// ── TELEGRAM BOT ────────────────────────────────────────────────────────
// Bot yaratilgach shu linkni t.me/<username> ga o'zgartiring!
// (BotFather → /newbot → username — masalan: t.me/stypeuz_bot)
const TELEGRAM_BOT_URL = "https://t.me/stypeuz_bot";

// ── MODULE-LEVEL: Eski light temani localStorage dan tozalaymiz ────────
// Bu React mount bo'lishidan OLDIN ishlaydi, shuning uchun useLocalStorage
// hook'i "light" ni o'qib ololmaydi.
try {
  const stored = localStorage.getItem("typeuz_theme");
  if (stored) {
    const lightThemes = ["light", "warm", "sakura", "mint", "sky", "peachy", "vscode_light"];
    if (lightThemes.includes(JSON.parse(stored))) {
      // localStorage dan o'chirib tashlaymiz — useLocalStorage default ga tushadi
      localStorage.setItem("typeuz_theme", JSON.stringify("blue"));
    }
  }
} catch {}

// ── APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // Core state
  const [theme, setTheme] = useLocalStorage("typeuz_theme", "blue");
  const [lang, setLang] = useLocalStorage("typeuz_lang", "en");
  const [duration, setDuration] = useLocalStorage<number | string>("typeuz_duration", 15);
  const [fontSize, setFontSize] = useLocalStorage("typeuz_fontsize", "md");
  const [view, setView] = useLocalStorage("typeuz_view", "type");
  const [soundEnabled, setSoundEnabled] = useLocalStorage("typeuz_sound", true);
  const [showKeyboard, setShowKeyboard] = useLocalStorage("typeuz_showkb", false);
  const [showHeatmap, setShowHeatmap] = useLocalStorage("typeuz_heatmap", false);
  const [fingerGuide, setFingerGuide] = useLocalStorage("typeuz_finger", true);
  const [bgImage, setBgImage] = useLocalStorage("typeuz_bgimage", "");
  const [bgDim, setBgDim] = useLocalStorage("typeuz_bgdim", 0.55);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showLingohub, setShowLingohub] = useState(false);
  const [themePanel, setThemePanel] = useState(false);
  const [coinNotifs, setCoinNotifs] = useState<CoinNotif[]>([]);
  const [showSignUp, setShowSignUp] = useState(false);

  // Coin notification helper
  const showCoinNotif = useCallback((amount: number, source: CoinNotif["source"]) => {
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40;
    setCoinNotifs((prev) => [...prev.slice(-4), { id, amount, x, y: 50, source }]);
  }, []);

  const dismissCoinNotif = useCallback((id: number) => {
    setCoinNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Typing state
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(15);
  const [restartKey, setRestartKey] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [totalKs, setTotalKs] = useState(0);
  const [history, setHistory] = useLocalStorage<TestResult[]>("typeuz_history", []);
  const [cursor, setCursor] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [favorites, setFavorites] = useLocalStorage<string[]>("typeuz_favorites", []);
  const [usedLangs, setUsedLangs] = useLocalStorage<string[]>("typeuz_usedlangs", []);
  const cursorRef = useRef(0);

  // Foydalanuvchi profili (ism, familiya, rasm)
  const { profile, saveProfile, isSignedUp } = useProfile();

  // Feature hooks
  const daily = useDailyReward();
  const { missions, xp, updateProgress, addXp } = useMissions();
  const { recordings, startRecording, recordEvent, stopRecording } = useReplay();
  const coinsStore = useCoins();

  // Show coin notification for daily login reward on mount
  useEffect(() => {
    if (daily.claimedToday && daily.streak > 0) {
      // Already claimed today — show how much they got
      const dayKey = `day${Math.min(daily.streak, 7)}`;
      const rewards: Record<string, number> = {
        day1: 10, day2: 15, day3: 25, day4: 30, day5: 40, day6: 45, day7: 100,
      };
      const coins = rewards[dayKey] || 10;
      // Only show if they just logged in (within last 5 min)
      const lastLogin = localStorage.getItem("typeuz_daily_notif_shown");
      const now = new Date().toDateString();
      if (lastLogin !== now) {
        setTimeout(() => showCoinNotif(coins, "daily"), 1500);
        localStorage.setItem("typeuz_daily_notif_shown", now);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const replayStartedRef = useRef(false);

  // Theme
  const t: ThemeColors = THEMES[theme] || THEMES.default;

  // Telegram Premium aksiyasi uchun eng yaxshi WPM
  const bestWpm = history.length ? Math.max(...history.map((h) => h.wpm)) : 0;

  // Admin: saytga tashrifni kuzatish
  useVisitTracker(lang, theme);

  // Google Search Console OAuth qaytishi: ?gsc_connected=1&gsc_sid=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gsc_connected") === "1" && p.get("gsc_sid")) {
      setGscSid(p.get("gsc_sid") || "");
    }
    if (p.has("gsc_connected") || p.has("gsc_sid") || p.has("error")) {
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
  }, []);

  // Auto Dark/Light Mode
  const [autoTheme, setAutoTheme] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const lightThemes = ["light", "warm", "sakura", "mint", "sky", "peachy", "vscode_light"];
    const handler = (e: MediaQueryListEvent) => {
      if (autoTheme) {
        const isDark = e.matches;
        const isCurrentLight = lightThemes.includes(theme);
        if (isDark && isCurrentLight) {
          const darkMap: Record<string, string> = { light: "default", warm: "gold", sakura: "pink", mint: "green", sky: "blue", peachy: "sunset", vscode_light: "vscode_dark" };
          setTheme(darkMap[theme] || "default");
        } else if (!isDark && !isCurrentLight) {
          const lightMap: Record<string, string> = { default: "light", gold: "warm", pink: "sakura", green: "mint", blue: "sky", sunset: "peachy", vscode_dark: "vscode_light" };
          const lightTheme = lightMap[theme];
          if (lightTheme && THEMES[lightTheme]) setTheme(lightTheme);
        }
      }
    };
    handler(mq as unknown as MediaQueryListEvent);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [autoTheme, theme, setTheme]);

  // Audio (bir marta yaratiladi — timer har renderda qayta ishga tushmasligi uchun)
  const { playClick, playError, playWin } = useMemo(
    () => createAudioController(audioCtxRef, clickBufRef),
    []
  );

  // ── TEXT MANAGEMENT ──────────────────────────────────────────────────
  const newText = useCallback(
    (customText?: string) => {
      // Barcha matnlar KICHIK harflarda bo'lsin — boshida/o'rtasida katta harf yo'q
      const pool = TEXTS[lang] || TEXTS.en;
      const raw = customText ?? pool[Math.floor(Math.random() * pool.length)];
      setText(raw.toLowerCase());
      setTyped("");
      setCursor(0);
      setStarted(false);
      setFinished(false);
      setWpm(0);
      setAccuracy(100);
      setErrors(0);
      setTotalKs(0);
      setTimeLeft(duration === "∞" ? null : (duration as number));
      setCombo(0);
      setMaxCombo(0);
      setParticles([]);
      replayStartedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [lang, duration]
  );

  useEffect(() => {
    if (text === "") newText();
  }, [lang, duration, text === "", newText]);

  // Til o'zgarganda matnni ham yangilaymiz (faqat haqiqiy o'zgarishda)
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      newText();
    }
  }, [lang, newText]);

  useEffect(() => {
    if (inputRef.current && view === "type" && !finished) inputRef.current.focus();
  }, [text, finished, view, showKeyboard]);

  // ── PARTICLE EFFECTS ────────────────────────────────────────────────
  const spawnP = useCallback((ok: boolean) => {
    const id = Date.now() + Math.random();
    setParticles((p) => [...p.slice(-20), { id, ok, x: 35 + Math.random() * 30, y: 40 + Math.random() * 15 }]);
    setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), 700);
  }, []);

  // ── TIMER ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || finished || duration === "∞") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((tt) => {
        if (tt === null || tt <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFinished(true);
          if (soundEnabled) playWin();
          return 0;
        }
        return tt - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, finished, duration, soundEnabled, playWin, restartKey]);

  // ── DURATION TANLASH (15/30/60/Free) ────────────────────────────────
  // Tugma bosilganda taymer darhol yangi qiymatga tushadi va sanay boshlaydi
  // (shu jumladan faol tugma qayta bosilganda ham test qaytadan boshlanadi)
  const selectDuration = (d: number | string) => {
    setRestartKey((k) => k + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    replayStartedRef.current = false;
    setDuration(d);
    setTimeLeft(d === "∞" ? null : (d as number));
    setStarted(d !== "∞");
    setFinished(false);
    setTyped("");
    setCursor(0);
    cursorRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setErrors(0);
    setTotalKs(0);
    setWpm(0);
    setAccuracy(100);
    setParticles([]);
    startTimeRef.current = d === "∞" ? null : Date.now();
  };

  // ── WPM UPDATE (smooth, real typing feel) ───────────────────────────
  useEffect(() => {
    if (!started || !startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;

    // Dastlabki 2 soniya WPM ko'rsatilmaydi (barqarorlashishi uchun)
    if (elapsed < 2000) {
      setWpm(0);
      return;
    }

    const elapsedMin = elapsed / 60000;
    if (elapsedMin > 0) {
      const rawWpm = Math.round((typed.length / 5) / elapsedMin);
      // Lerp smoothing: oldingi qiymatdan 40% ga yangilanadi
      // Bu real tayping hissasini beradi (Monkeytype uslubi)
      setWpm(prev => {
        if (prev === 0) return rawWpm;
        const diff = rawWpm - prev;
        return Math.round(prev + diff * 0.4);
      });
    }
  }, [typed, started]);

  // ── KEYBOARD HANDLING ───────────────────────────────────────────────
  // Yozish logikasi — fizik klaviatura va ekran klaviaturasi (visualizer)
  // uchun umumiy: bitta belgi (yoki tab/escape) qabul qiladi.
  const processKey = useCallback(
    (rawKey: string) => {
      if (view !== "type" || finished) return;

      // Kiritilgan tugmani ham kichik harfga aylantiramiz — matn bilan mos tushishi uchun
      const k = rawKey.toLowerCase();
      if (k === "tab") {
        newText();
        return;
      }
      if (k === "escape") {
        setShowSettings(false);
        return;
      }
      if (k.length !== 1) return;

      if (!started) {
        setStarted(true);
        startTimeRef.current = Date.now();
      }
      if (!replayStartedRef.current) {
        replayStartedRef.current = true;
        startRecording(text);
      }

      const ok = charsEqual(k, text[cursor]);
      setTotalKs((n) => n + 1);

      if (soundEnabled) {
        if (ok) playClick();
        else playError();
      }
      spawnP(ok);
      recordEvent({ type: "keydown", key: k, correct: ok, time: Date.now() - (startTimeRef.current || Date.now()) });

      // Xato belgi ham yoziladi — test to'xtamaydi, xato harf qizil ko'rinadi
      setTyped((tt) => tt + k);
      if (ok) {
        setCombo((cc) => {
          const nc = cc + 1;
          setMaxCombo((m) => Math.max(m, nc));
          if (nc === 10) updateProgress("combo", 1);
          if (nc === 20) updateProgress("combo", 1);
          return nc;
        });
      } else {
        setErrors((er) => er + 1);
        setCombo(0);
      }
      setCursor((c) => {
        const newCursor = c + 1;
        cursorRef.current = newCursor;
        if (newCursor === text.length) {
          setFinished(true);
          if (soundEnabled) playWin();
          if (lang && !usedLangs.includes(lang)) {
            setUsedLangs((prev) => [...prev, lang]);
            if (usedLangs.length + 1 >= 3) updateProgress("langs", 3);
          }
        }
        return newCursor;
      });

      const nt = totalKs + 1;
      const ne = ok ? errors : errors + 1;
      setAccuracy(Math.round(((nt - ne) / nt) * 100));
    },
    [view, finished, text, cursor, started, soundEnabled, totalKs, errors, lang, usedLangs, newText, playClick, playError, playWin, spawnP, startRecording, recordEvent, updateProgress, setUsedLangs]
  );

  // Fizik klaviatura: yozish inputi uchun event handler
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (view !== "type" || finished) {
        if (e.key === "Escape") {
          setView("type");
          setShowOwner(false);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Tab") e.preventDefault();
      processKey(e.key);
    },
    [view, finished, processKey]
  );

  // ── TEST COMPLETION ─────────────────────────────────────────────────
  useEffect(() => {
    if (finished && started && typed.length > 0) {
      const e = (Date.now() - startTimeRef.current!) / 60000;
      const fw = Math.round((typed.length / 5) / e);
      const result: TestResult = {
        wpm: fw,
        accuracy,
        errors,
        lang,
        duration,
        date: new Date().toLocaleTimeString(),
        recordingId: Date.now(),
      };
      setHistory((h) => [result, ...h.slice(0, 49)]);

      // Admin panel uchun: kim type qilganini qayd qilamiz
      recordTyping({ wpm: fw, accuracy, errors, lang });

      updateProgress("wpm", fw);
      updateProgress("accuracy", accuracy);
      updateProgress("tests", 1);
      addXp(fw + accuracy);

      // Award coins for typing tests
      const coinReward = Math.round(fw * 1) + (accuracy >= 95 ? 5 : 0);
      coinsStore.addCoins(coinReward);
      if (coinReward > 0) showCoinNotif(coinReward, "typing");

      const lastStreakReported = parseInt(localStorage.getItem("typeuz_laststreak") || "0");
      if (daily.streak >= 7 && lastStreakReported < 7) {
        updateProgress("streak", 7);
        localStorage.setItem("typeuz_laststreak", "7");
      } else if (daily.streak >= 3 && lastStreakReported < 3) {
        updateProgress("streak", 3);
        localStorage.setItem("typeuz_laststreak", "3");
      }

      stopRecording(fw, accuracy);
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── COMPUTED ────────────────────────────────────────────────────────
  // Joriy so'zda xato bo'lsa — so'zning yozilmagan harflari ham qizil ko'rinadi (Monkeytype uslubi)
  const curStart = text.lastIndexOf(" ", cursor) + 1;
  const nextSpace = text.indexOf(" ", cursor);
  const curEnd = nextSpace === -1 ? text.length : nextSpace;
  let wordHasError = false;
  for (let w = curStart; w < Math.min(curEnd, typed.length); w++) {
    if (!charsEqual(typed[w], text[w])) {
      wordHasError = true;
      break;
    }
  }

  const rendered = text.split("").map((ch, i) => {
    let cls = "relative text-gray-600";
    if (i < cursor) cls = "relative text-white";
    if (i < typed.length && !charsEqual(typed[i], text[i])) {
      cls = "relative text-red-400 bg-red-900/30 rounded err-char";
    } else if (wordHasError && i >= cursor && i < curEnd) {
      cls = "relative text-red-400/70";
    }
    return (
      <span key={i} className={cls}>
        {i === cursor && <span className="caret-bar" style={{ background: t.accent }} />}
        {ch}
      </span>
    );
  });

  // ── NAVIGATION ──────────────────────────────────────────────────────
  const navItems: { id: string; icon: IconType; label: string }[] = [
    { id: "type", icon: FiType, label: "Type" },
    { id: "leaderboard", icon: FaTrophy, label: "Leaderboard" },
    { id: "countryrank", icon: FiMap, label: "Countries" },
    { id: "profile", icon: FiUser, label: "Profile" },
    { id: "history", icon: FiList, label: "History" },
    { id: "dashboard", icon: FiTrendingUp, label: "Progress" },
    { id: "missions", icon: FiTarget, label: "Missions" },
    { id: "daily", icon: FiZap, label: "Daily" },
    { id: "seasonal", icon: FaMedal, label: "Events" },
    { id: "dna", icon: FaDna, label: "DNA" },
    { id: "multiplyer", icon: FiSend, label: "Battle" },
    { id: "friends", icon: FiUsers, label: "Friends" },
    { id: "chat", icon: FiMessageCircle, label: "Chat" },
    { id: "ai", icon: FiCpu, label: "AI" },
    { id: "custom", icon: FiBookOpen, label: "Texts" },
    { id: "replay", icon: FiVideo, label: "Replay" },
    { id: "games", icon: FiGrid, label: "Games" },
    { id: "shop", icon: FiShoppingBag, label: "Shop" },
    { id: "about", icon: FiInfo, label: "About" },
  ];

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <ConvexClientProvider>
    <AccountSyncBridge />
    <div
      suppressHydrationWarning
      className="min-h-screen h-dvh flex flex-col isolate"
      style={{
        background: t.bg,
        color: t.color || "#e5e7eb",
        fontFamily: "'Inter', sans-serif",
        ...(bgImage
          ? {
              backgroundImage: `linear-gradient(rgba(8, 10, 15, ${bgDim}), rgba(8, 10, 15, ${bgDim})), url("${bgImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {}),
      }}
    >
      {/* Ambient animated background */}
      <div className="aurora-layer" aria-hidden>
        <div className="aurora" />
      </div>

      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: "18px",
              animation: "floatUp .7s ease-out forwards",
            }}
          >
            {p.ok ? (
              <span style={{ color: t.accent }}>✦</span>
            ) : (
              <span className="text-red-400">✕</span>
            )}
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setView("type")}
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl md:text-2xl font-bold tracking-tight transition-all hover:scale-105 whitespace-nowrap"
            style={{ color: t.accent }}
          >
            <AppLogo size={32} animate="glow" glowColor={t.accent} className="w-7 h-7 md:w-8 md:h-8" />
            <span>STypeUz</span>
          </button>
          {view === "type" && (
            <div className="hidden sm:flex gap-1 text-sm">
              {DURATIONS.map((d) => (
                <button
                  key={String(d)}
                  onClick={() => selectDuration(d)}
                  className="px-3 py-1 rounded-md transition-all"
                  style={{
                    background: duration === d ? t.accent + "22" : "transparent",
                    color: duration === d ? t.accent : "#6b7280",
                  }}
                >
                  {d === "∞" ? "Free" : `${d}s`}
                </button>
              ))}
            </div>
          )}
          {/* Language quick switch */}
          <div className="flex gap-0.5 sm:gap-1">
            {["en", "ru", "uz"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                style={{
                  background: lang === l ? t.accent + "33" : "transparent",
                  color: lang === l ? t.accent : "#6b7280",
                }}
                title={LANG_LABELS[l]}
              >
                <span className="mr-0.5">{LANG_FLAGS[l]}</span>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === "type" && (
            <>
              <button
                onClick={() => setShowKeyboard((s) => !s)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all hidden sm:block"
                title="Keyboard Visualizer"
              >
                <FaKeyboard size={16} />
              </button>
              <button
                onClick={() => newText()}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                title="New text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
          {/* 300 WPM → Telegram Premium aksiyasi */}
          <button
            onClick={() => {
              setShowPromo((s) => !s);
              setShowSettings(false);
              setShowOwner(false);
              setShowLingohub(false);
            }}
            className="promo-badge px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title="300 WPM → 1 oylik Telegram Premium!"
          >
            🏆 <span className="hidden sm:inline">300 WPM</span>
            <span className="hidden lg:inline">→ Premium</span>
          </button>
          {/* Sign up / Profil */}
          <button
            onClick={() => {
              setShowSignUp(true);
              setShowPromo(false);
              setShowSettings(false);
              setShowOwner(false);
              setShowLingohub(false);
            }}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title={isSignedUp ? "Profilni tahrirlash" : "Sign up — profil yaratish"}
            style={{
              background: isSignedUp ? "#ffffff0d" : t.accent + "22",
              color: isSignedUp ? "#9ca3af" : t.accent,
              border: `1px solid ${isSignedUp ? "#ffffff14" : t.accent + "55"}`,
            }}
          >
            {isSignedUp ? (
              <>
                <ProfileAvatar profile={profile} size={18} heroEquip={coinsStore.heroEquip} />
                <span className="hidden sm:inline max-w-[70px] truncate">
                  {fullName(profile)?.split(" ")[0] || "Profil"}
                </span>
              </>
            ) : (
              <>
                <FiUser size={13} />
                <span className="hidden sm:inline">Sign up</span>
              </>
            )}
          </button>
          {/* Telegram kanal — t.me/khoja_akbar */}
          <a
            href="https://t.me/khoja_akbar"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105 hover:brightness-110"
            title="Telegram kanalimizga qo'shiling"
            style={{ background: "#229ed926", color: "#5fb8e8", border: "1px solid #229ed955" }}
          >
            <FaTelegram size={13} />
            <span className="hidden sm:inline">Telegram</span>
          </a>
          {/* Telegram bot — yangiliklarga obuna bo'lish */}
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105 hover:brightness-110"
            title="Telegram botimiz — yangiliklarga obuna bo'ling"
            style={{ background: "#229ed926", color: "#5fb8e8", border: "1px solid #229ed955" }}
          >
            <FaRobot size={13} />
            <span className="hidden sm:inline">Bot</span>
          </a>
          {/* Lingohub.uz reklamasi — Egasi tugmasi yonida */}
          <button
            onClick={() => {
              setShowLingohub((s) => !s);
              setShowPromo(false);
              setShowSettings(false);
              setShowOwner(false);
            }}
            className="ad-badge px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title="Lingohub.uz — 27 tilda bepul til o'rganish"
          >
            <LingohubLogo size={20} />
            <span className="hidden sm:inline">Lingohub</span>
          </button>
          {/* Sayt egasi */}
          <button
            onClick={() => {
              setShowOwner((s) => !s);
              setShowPromo(false);
              setShowSettings(false);
              setShowLingohub(false);
            }}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title="Sayt egasi haqida"
            style={{
              background: showOwner ? t.accent + "33" : "#ffffff0d",
              color: showOwner ? t.accent : "#9ca3af",
              border: `1px solid ${showOwner ? t.accent + "55" : "#ffffff14"}`,
            }}
          >
            <FiUser size={13} />
            <span className="hidden sm:inline">Egasi</span>
          </button>
          <button
            onClick={() => {
              setShowSettings((s) => !s);
              setShowPromo(false);
              setShowOwner(false);
              setShowLingohub(false);
            }}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-14 md:w-44 px-1 md:px-3 pt-3 pb-16 border-r border-white/5 flex flex-col gap-0.5 text-xs md:text-sm flex-shrink-0 overflow-y-auto min-h-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setShowOwner(false);
                setShowPromo(false);
                setShowLingohub(false);
                setView(view === item.id ? "type" : item.id);
              }}
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-left transition-all hover:bg-white/5"
              style={{
                color: view === item.id ? t.accent : "#6b7280",
                background: view === item.id ? t.accent + "11" : "transparent",
              }}
              title={item.label}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Lingohub.uz reklama paneli */}
          {showLingohub ? (
            <LingohubPromo t={t} onClose={() => setShowLingohub(false)} />
          ) : /* Telegram Premium promo */
          showPromo ? (
            <TelegramPromo t={t} bestWpm={bestWpm} onClose={() => setShowPromo(false)} />
          ) : /* Sayt egasi */
          showOwner ? (
            <OwnerView t={t} onClose={() => setShowOwner(false)} />
          ) : /* Settings Modal */
          showSettings ? (
            <SettingsModal
              t={t}
              theme={theme}
              setTheme={setTheme}
              lang={lang}
              setLang={setLang}
              fontSize={fontSize}
              setFontSize={setFontSize}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              showKeyboard={showKeyboard}
              setShowKeyboard={setShowKeyboard}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              fingerGuide={fingerGuide}
              setFingerGuide={setFingerGuide}
              bgImage={bgImage}
              setBgImage={setBgImage}
              bgDim={bgDim}
              setBgDim={setBgDim}
              onClose={() => setShowSettings(false)}
            />
          ) : view === "leaderboard" ? (
            <LeaderboardView t={t} onClose={() => setView("type")} activeAvatar={coinsStore.activeAvatar} heroEquip={coinsStore.heroEquip} />
          ) : view === "countryrank" ? (
            <CountryRanking t={t} onClose={() => setView("type")} />
          ) : view === "profile" ? (
            <ProfileView
              t={t}
              onClose={() => setView("type")}
              history={history}
              activeAvatar={coinsStore.activeAvatar}
              profile={profile}
              heroEquip={coinsStore.heroEquip}
              onEditProfile={() => setShowSignUp(true)}
            />
          ) : view === "history" ? (
            <HistoryView
              t={t}
              onClose={() => setView("type")}
              history={history}
              onFavorite={(txt: string) =>
                setFavorites((f) => (f.includes(txt) ? f.filter((x) => x !== txt) : [...f, txt]))
              }
              favorites={favorites}
            />
          ) : view === "dashboard" ? (
            <ProgressDashboard t={t} onClose={() => setView("type")} history={history} />
          ) : view === "missions" ? (
            <WeeklyMissionsView t={t} onClose={() => setView("type")} missions={missions} xp={xp} />
          ) : view === "daily" ? (
            <DailyLoginView t={t} onClose={() => setView("type")} daily={daily} />
          ) : view === "seasonal" ? (
            <SeasonalEvent t={t} onClose={() => setView("type")} missions={missions} updateProgress={updateProgress} />
          ) : view === "multiplyer" ? (
            <BattleHub t={t} onClose={() => setView("type")} coinsStore={coinsStore} heroEquip={coinsStore.heroEquip} addXp={addXp} />
          ) : view === "friends" ? (
            <FriendSystem t={t} onClose={() => setView("type")} activeAvatar={coinsStore.activeAvatar} heroEquip={coinsStore.heroEquip} />
          ) : view === "chat" ? (
            <Chat t={t} onClose={() => setView("type")} activeAvatar={coinsStore.activeAvatar} heroEquip={coinsStore.heroEquip} />
          ) : view === "ai" ? (
            <AIExercises t={t} onClose={() => setView("type")} onSelectText={(txt) => { setText(txt.toLowerCase()); setView("type"); }} />
          ) : view === "custom" ? (
            <CustomTextImport t={t} onClose={() => setView("type")} onImportText={(txt) => { setText(txt.toLowerCase()); setView("type"); }} />
          ) : view === "replay" ? (
            <TypingReplayView t={t} onClose={() => setView("type")} recordings={recordings} />
          ) : view === "games" ? (
            <GamesView t={t} onClose={() => setView("type")} onCoinEarned={(amt) => { coinsStore.addCoins(amt); showCoinNotif(amt, "game"); }} />
          ) : view === "shop" ? (
            <ShopView
              t={t}
              coins={coinsStore.coins}
              purchased={coinsStore.purchased}
              activeEffects={coinsStore.activeEffects}
              activeAvatar={coinsStore.activeAvatar}
              heroEquip={coinsStore.heroEquip}
              onClose={() => setView("type")}
              onPurchase={coinsStore.purchase}
              onSetTheme={setTheme}
              onEquipAvatar={coinsStore.equipAvatar}
              onEquipHero={coinsStore.equipHero}
              onToggleEffect={coinsStore.toggleEffect}
              currentTheme={theme}
            />
          ) : view === "about" ? (
            <AboutView t={t} onClose={() => setView("type")} />
          ) : view === "dna" ? (
            <TypingDNA
              t={t}
              onClose={() => setView("type")}
              history={history}
              recordings={recordings}
              daily={daily}
              usedLangs={usedLangs}
            />
          ) : view === "admin" ? (
            <AdminPanel t={t} onClose={() => setView("type")} history={history} xp={xp} />
          ) : view === "type" ? (
            // ── MAIN TYPING VIEW ─────────────────────────────────────────
            <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 gap-6 overflow-y-auto">
              {/* Stats */}
              <div className="flex items-center gap-4 sm:gap-6 md:gap-16">
                <div className="text-center">
                  <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">WPM</div>
                  <div className="text-2xl sm:text-3xl md:text-5xl font-bold" style={{ color: t.accent }}>
                    {wpm}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">Accuracy</div>
                  <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-white">{accuracy}%</div>
                </div>
                {duration !== "∞" && (
                  <div className="text-center">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">Time</div>
                    <div
                      className="text-2xl sm:text-3xl md:text-5xl font-bold"
                      style={{ color: timeLeft !== null && timeLeft <= 5 ? "#ef4444" : "#e5e7eb" }}
                    >
                      {timeLeft ?? duration}
                    </div>
                  </div>
                )}
                {combo >= 5 && (
                  <div className="text-center">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">Combo</div>
                    <div className="text-2xl sm:text-3xl md:text-5xl font-bold" style={{ color: "#f59e0b" }}>
                      ×{combo}
                    </div>
                  </div>
                )}
              </div>

              {/* Text display */}
              <div className="w-full max-w-2xl relative">
                <div
                  className={`leading-relaxed tracking-wide text-center select-none ${
                    FONT_SIZES[fontSize] || FONT_SIZES.md
                  }`}
                  style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
                  onClick={() => inputRef.current?.focus()}
                >
                  {rendered}
                </div>
                <input
                  ref={inputRef}
                  className="absolute inset-0 opacity-0 cursor-default"
                  onKeyDown={handleKey}
                  readOnly={finished}
                  autoFocus
                />
                <button
                  onClick={() =>
                    setFavorites((f) => (f.includes(text) ? f.filter((x) => x !== text) : [...f, text]))
                  }
                  className="absolute -right-8 md:-right-10 top-0 p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: favorites.includes(text) ? t.accent : "#4b5563" }}
                >
                  {favorites.includes(text) ? <FiHeart size={18} fill="currentColor" /> : <FiHeart size={18} />}
                </button>
              </div>

              {/* Start typing hint */}
              {!started && !finished && (
                <p className="text-xs text-gray-600 uppercase tracking-widest animate-pulse">
                  Start typing · Tab for new text
                </p>
              )}

              {/* Finished state */}
              {finished && (
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-2xl font-bold" style={{ color: t.accent }}>
                    {typed.length === 0 ? (
                      <>
                        <FiActivity size={26} />
                        Vaqt tugadi!
                      </>
                    ) : (
                      <>
                        {accuracy >= 95 ? (
                          <FiStar size={26} fill="currentColor" />
                        ) : accuracy >= 80 ? (
                          <FiThumbsUp size={26} />
                        ) : (
                          <FiActivity size={26} />
                        )}
                        {accuracy >= 95 ? "Excellent!" : accuracy >= 80 ? "Good job!" : "Keep practicing!"}
                      </>
                    )}
                  </div>
                  <div className="flex gap-4 sm:gap-6 text-sm text-gray-400 flex-wrap justify-center">
                    <span>
                      Combo:{" "}
                      <strong style={{ color: t.accent }}>×{maxCombo}</strong>
                    </span>
                    <span>
                      Errors: <strong className="text-red-400">{errors}</strong>
                    </span>
                    {typed.length > 0 && (
                      <>
                        <span>
                          XP: <strong style={{ color: "#f59e0b" }}>+{wpm + accuracy}</strong>
                        </span>
                        <span>
                          <CoinIcon size={14} /> +{Math.round(wpm * 1) + (accuracy >= 95 ? 5 : 0)}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => newText()}
                    className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                    style={{ background: t.accent, color: "#000" }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Keyboard Visualizer (when enabled) */}
              {showKeyboard && (
                <div className="w-full max-w-3xl mt-4 animate-fade-in">
                  <KeyboardVisualizer
                    t={t}
                    showHeatmap={showHeatmap}
                    fingerGuide={fingerGuide}
                    nextKey={finished ? undefined : text[cursor]}
                    onKeyPress={processKey}
                  />
                </div>
              )}

            </main>
          ) : null}
        </div>
      </div>

      {/* Sign up modal — birinchi kirishda majburiy */}
      {!isSignedUp && (
        <SignUpModal
          t={t}
          required
          onSave={(p) => {
            saveProfile(p);
            setShowSignUp(false);
          }}
        />
      )}
      {isSignedUp && showSignUp && (
        <SignUpModal
          t={t}
          initial={profile ?? undefined}
          required={false}
          onSave={(p) => {
            saveProfile(p);
            setShowSignUp(false);
          }}
          onClose={() => setShowSignUp(false)}
        />
      )}

      {/* Coin earning notifications */}
      <CoinNotification notifications={coinNotifs} onDismiss={dismissCoinNotif} />

      {/* Avatar + Coin balance badge (bottom-right — yuqorida Egasi tugmasini berkitib qo'ymasligi uchun) */}
      {(() => {
        const av = getAvatarInfo(coinsStore.activeAvatar);
        const AvIcon = av.icon;
        return (
          <div
            className="fixed bottom-16 right-3 z-40 flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer hover:scale-105 transition-all"
            style={{ background: av.color + "18", border: `1px solid ${av.color}44`, color: av.color }}
            onClick={() => {
              setView("shop");
              setShowSettings(false);
              setShowPromo(false);
              setShowOwner(false);
              setShowLingohub(false);
            }}
            title={`${av.name} · Open Coin Shop`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: av.color + "33" }}
            >
              <AvIcon size={12} />
            </div>
            <span className="flex items-center gap-1.5"><CoinIcon size={18} /> {coinsStore.coins.toLocaleString()}</span>
          </div>
        );
      })()}

      {/* Bottom user badge */}
      <div
        className="fixed bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs z-30 backdrop-blur-md"
        style={{ background: t.surface + "cc", border: `1px solid ${t.accent}33` }}
      >
        {/* Admin button (footer) */}
        <button
          onClick={() => {
            setShowLingohub(false);
            setView(view === "admin" ? "type" : "admin");
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105 mr-1"
          style={{
            background: view === "admin" ? t.accent + "33" : "#ffffff0d",
            color: view === "admin" ? t.accent : "#9ca3af",
            border: `1px solid ${view === "admin" ? t.accent + "55" : "#ffffff14"}`,
          }}
          title="Admin Panel"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="hidden sm:block">Admin</span>
        </button>
        {(() => {
          const av = getAvatarInfo(coinsStore.activeAvatar);
          return (
            <>
              {isSignedUp ? (
                <ProfileAvatar profile={profile} size={28} heroEquip={coinsStore.heroEquip} />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: `linear-gradient(135deg, ${av.color}, ${av.color}88)`, boxShadow: `0 0 10px ${av.color}44` }}
                  title={av.name}
                >
                  <av.icon size={14} className="text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-semibold" style={{ color: t.accent }}>
                  {isSignedUp ? fullName(profile) : `${av.name} · ${LANG_FLAGS[lang] || "🏳️"} ${LANG_LABELS[lang]}`}
                </div>
                <div className="text-gray-500">
                  {coinsStore.coins.toLocaleString()} <CoinIcon size={13} /> · {xp.toLocaleString()} XP
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Quick theme picker */}
      <div
        className="fixed bottom-3 right-3 flex gap-1 z-30"
        onClick={() => setThemePanel((p) => !p)}
      >
        {themePanel && (
          <div className="flex gap-1 animate-fade-in mr-2">
            {THEME_LIST.slice(0, 6).map((th) => (
              <button
                key={th.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(th.id);
                  setThemePanel(false);
                }}
                className="w-7 h-7 rounded-full transition-all hover:scale-125"
                style={{
                  background: th.accent,
                  border: theme === th.id ? `2px solid white` : "2px solid transparent",
                }}
                title={th.name}
              />
            ))}
          </div>
        )}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: t.accent + "33", color: t.accent }}
        >
          <FaPalette size={15} />
        </button>
      </div>
    </div>
    </ConvexClientProvider>
  );
}
