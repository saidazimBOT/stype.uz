"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import { TEXTS, LANG_LABELS, LANG_FLAGS } from "./data/texts";
import { getT } from "./data/i18n";
import { THEMES, FONT_SIZES, DURATIONS, THEME_LIST } from "./data/themes";
import { createAudioController } from "./utils/audio";
import { charsEqual } from "./utils/typingChars";
import { nextLiveWpm } from "./utils/wpm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSyncedSettings } from "./hooks/useUserSettings";
import { useDailyReward } from "./components/features/DailyLogin";
import { useProfile, fullName } from "./hooks/useProfile";
import SignUpModal from "./components/features/SignUpModal";
import LoginModal from "./components/features/LoginModal";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { getSupabaseUser } from "./lib/supabaseService";
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
// Convex removed — Supabase ishlatilmoqda
import FriendSystem from "./components/features/FriendSystem";
import Chat from "./components/features/Chat";
import SeasonalEvent from "./components/features/SeasonalEvent";
import AIExercises from "./components/features/AIExercises";
import MashqView from "./components/features/MashqView";
import CustomTextImport from "./components/features/CustomTextImport";
import TypingChallenge from "./components/features/TypingChallenge";
import TypingReplayView from "./components/features/TypingReplay";
import SettingsModal from "./components/layout/SettingsModal";
import TelegramPromo from "./components/features/TelegramPromo";
import LingohubPromo from "./components/features/LingohubPromo";
import LingohubLogo from "./components/features/LingohubLogo";
import AccountSyncBridge from "./components/features/AccountSyncBridge";
import SupabaseCoinSync from "./components/features/SupabaseCoinSync";
import TypingDNA from "./components/features/TypingDNA";
import OwnerView from "./components/features/OwnerView";
import CoinIcon from "./components/CoinIcon";
import { formatCoin } from "./utils/formatCoin";
import GiftIcon from "./components/GiftIcon";
import AdminPanel from "./components/admin/AdminPanel";
import { useVisitTracker, recordTyping } from "./hooks/useVisitTracker";
import { setSid as setGscSid } from "./lib/gscApi";
import { getTypingRecorder, getUserToken } from "./lib/convexBridge";
import { TypingRecorderBridge } from "./components/features/SiteOverlays";
import ResultsChart, { type WpmSample } from "./components/features/ResultsChart";

// SVG icons (stiker/emoji o'rniga)
import {
  FiActivity, FiAward, FiBookOpen, FiCpu, FiEdit3, FiGift, FiGrid, FiHeart, FiInfo, FiList,
  FiLogIn, FiMap, FiMessageCircle, FiSend, FiShoppingBag, FiStar, FiThumbsUp,
  FiType, FiUser, FiUsers, FiVideo, FiZap,
} from "react-icons/fi";
import { FaDna, FaInstagram, FaKeyboard, FaMedal, FaPalette, FaTelegram, FaTrophy } from "react-icons/fa6";
import type { IconType } from "react-icons";

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
  const [theme, setTheme] = useSyncedSettings("theme", "blue");
  const [lang, setLang] = useSyncedSettings("lang", "en");
  const [duration, setDuration] = useSyncedSettings<number | string>("duration", 15);
  const [fontSize, setFontSize] = useSyncedSettings("fontSize", "md");
  const [view, setView] = useLocalStorage("typeuz_view", "type");
  const [soundEnabled, setSoundEnabled] = useSyncedSettings("soundEnabled", true);
  const [showKeyboard, setShowKeyboard] = useSyncedSettings("showKeyboard", false);
  const [showHeatmap, setShowHeatmap] = useSyncedSettings("showHeatmap", false);
  const [fingerGuide, setFingerGuide] = useSyncedSettings("fingerGuide", true);
  const [bgImage, setBgImage] = useSyncedSettings("bgImage", "");
  const [bgDim, setBgDim] = useSyncedSettings("bgDim", 0.55);
  const [showSettings, setShowSettings] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoNotice, setPromoNotice] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showLingohub, setShowLingohub] = useState(false);
  const [themePanel, setThemePanel] = useState(false);
  const [coinNotifs, setCoinNotifs] = useState<CoinNotif[]>([]);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  // Birinchi kirishda majburiy ro'yxatdan o'tish oynasini o'tkazib yuborish
  // (skip) — sayt tugmalari bloklanib qolmasligi uchun. Keyingi safar qayta
  // ko'rsatilmaydi, navbar'dagi "Sign up" tugmasi orqali ochish mumkin.
  const [skipSignup, setSkipSignup] = useLocalStorage("typeuz_signup_skipped", false);
  // Hydration tugaguncha majburiy modal ko'rsatilmaydi — aks holda
  // localStorage'da profil bor bo'lsa ham har kirishda qisqa "ro'yxatdan o'tish"
  // oynasi ko'rinib qolardi.
  const [mounted, setMounted] = useState(false);
  // Supabase sessiyasidan profil tiklanayotgan payt modal yashiriladi.
  const [restoringCloudProfile, setRestoringCloudProfile] = useState(false);
  const cloudRestoreStartedRef = useRef(false);
  // ── Kirish ekrani (splash) ──
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  // Yozish effektlari: xatoda matn silkinadi, to'g'ri klavishada kursor atrofida nur
  const [errTick, setErrTick] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  // Supabase sozlangan bo'lsa — ro'yxatdan o'tish va kirish haqiqiy backend orqali ishlaydi
  const cloudEnabled = isSupabaseConfigured();

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
  const [history, setHistory] = useLocalStorage<TestResult[]>("typeuz_history", []); // History localStorage'da qoladi — typing_results jadvalida serverda ham saqlanadi
  const [cursor, setCursor] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  // Test tugagach natijalar ekranida ko'rsatiladigan aniq vaqt (soniyalarda)
  const [resultTime, setResultTime] = useState(0);
  // WPM namunalari — har soniyada WPM, xato va vaqt qiymatlarini saqlaydi
  const [wpmHistory, setWpmHistory] = useState<WpmSample[]>([]);
  // Xato kiritilganda qizil ko'rsatiladigan harf holati (faqat o'sha harf)
  const [wordErr, setWordErr] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [favorites, setFavorites] = useSyncedSettings<string[]>("favorites", []);
  const [usedLangs, setUsedLangs] = useSyncedSettings<string[]>("usedLangs", []);
  const cursorRef = useRef(0);
  // Faqat TO'G'RI yozilgan belgilar soni (xato harflar kirmaydi) — WPM shu qiymatga asoslanadi
  const correctCharsRef = useRef(0);

  // Foydalanuvchi profili (ism, familiya, rasm)
  const { profile, saveProfile, isSignedUp } = useProfile();

  // Hydration tugagach mounted bo'ladi — shundan keyingina modal haqida qaror qilamiz.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Supabase'da sessiya saqlangan, lekin lokal profil yo'qolgan bo'lsa (masalan
  // eski bug tufayli localStorage'ga "null" yozilib qolgan) — profilni qayta
  // tiklaymiz, foydalanuvchi qaytadan ro'yxatdan o'tishga majbur bo'lmaydi.
  useEffect(() => {
    if (!cloudEnabled || isSignedUp || cloudRestoreStartedRef.current) return;
    cloudRestoreStartedRef.current = true;
    setRestoringCloudProfile(true);
    (async () => {
      try {
        const user = await getSupabaseUser();
        if (!user) return;
        const md = (user.user_metadata || {}) as Record<string, string | undefined>;
        if (!md.firstName) return;
        saveProfile({
          firstName: md.firstName,
          lastName: md.lastName || "",
          photo: "",
          avatarId: md.avatarId || "avatar_default",
          signedUpAt: Date.now(),
        });
      } catch {
        // Oflayn yoki Supabase ishlamayapti — lokal rejimda qolamiz
      } finally {
        setRestoringCloudProfile(false);
      }
    })();
  }, [cloudEnabled, isSignedUp, saveProfile]);

  // Google OAuth callback — auth state change listener
  useEffect(() => {
    if (!cloudEnabled) return;
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          const md = (user.user_metadata || {}) as Record<string, string | undefined>;
          const fullName = md.full_name || md.name || "";
          const firstName = md.first_name || fullName.split(" ")[0] || user.email?.split("@")[0] || "User";
          const lastName = md.last_name || fullName.split(" ").slice(1).join( "") || "";
          const avatarUrl = md.avatar_url || md.picture || "";
          saveProfile({
            firstName,
            lastName,
            photo: avatarUrl,
            avatarId: "avatar_default",
            signedUpAt: Date.now(),
          });
          // last_login yangilash
          void supabase!.from("profiles").update({
            last_login: new Date().toISOString(),
            email: user.email,
          }).eq("id", user.id);
        }
        if (event === "SIGNED_OUT") {
          saveProfile({ firstName: "", lastName: "", photo: "", avatarId: "avatar_default", signedUpAt: 0 });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [cloudEnabled, saveProfile]);

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
  const caretRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const replayStartedRef = useRef(false);

  // Theme
  const t: ThemeColors = THEMES[theme] || THEMES.default;

  // UI tarjimalari — tanlangan tilga qarab (en/uz/ru)
  const T = getT(lang);

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

  // Splash ekrani: 1.4 soniyada yashira boshlaydi, 1.85 soniyada butunlay yo'qoladi
  useEffect(() => {
    const t1 = setTimeout(() => setSplashLeaving(true), 1400);
    const t2 = setTimeout(() => setSplash(false), 1850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
      setWordErr(false);
      setParticles([]);
      correctCharsRef.current = 0;
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
  // To'g'ri klavishada — kuchli burst: 5 zarracha turli yo'nalishda uchadi;
  // xatoda — 2 ta qizil ✕ zarracha. Har biri o'z yo'nalishi, o'lchami va
  // rangi bilan (CSS --dx/--dy/--rot orqali animatsiyalanadi).
  const spawnP = useCallback((ok: boolean, accent?: string) => {
    const count = ok ? 5 : 2;
    const now = Date.now();
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      let color: string | undefined;
      let char: string | undefined;
      if (ok) {
        // Rang aralashmasi: oq, oltin yoki tanlangan tema akzent rangi
        const r = Math.random();
        if (r > 0.6) color = "#ffffff";
        else if (r > 0.4) color = "#fbbf24";
        else color = accent;
        const cr = Math.random();
        char = cr > 0.75 ? "✧" : cr > 0.45 ? "·" : "✦";
      }
      parts.push({
        id: now + Math.random(),
        ok,
        x: 35 + Math.random() * 30,
        y: 40 + Math.random() * 15,
        // To'g'ri — keng yelpig'ich, xato — tor/yuqoriga
        dx: (Math.random() * 2 - 1) * (ok ? 75 : 35),
        dy: -(15 + Math.random() * (ok ? 65 : 25)),
        rot: (Math.random() * 2 - 1) * 240,
        size: ok ? 10 + Math.random() * 12 : 14 + Math.random() * 6,
        color,
        char: ok ? char : "✕",
      });
    }
    const ids = parts.map((p) => p.id);
    setParticles((p) => [...p.slice(-30), ...parts]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !ids.includes(x.id)));
    }, 800);
  }, []);

  // ── WPM SAMPLING — har soniyada WPM namunasini yig'amiz ──────────
  useEffect(() => {
    if (!started || finished || duration === "∞") return;
    const sampleInterval = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      setWpmHistory((prev) => [
        ...prev,
        { time: elapsedSec, wpm, errors },
      ]);
    }, 1000);
    return () => clearInterval(sampleInterval);
  }, [started, finished, duration, wpm, errors]);

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
    setWordErr(false);
    setErrors(0);
    setTotalKs(0);
    setWpm(0);
    setAccuracy(100);
    setParticles([]);
    setWpmHistory([]);
    correctCharsRef.current = 0;
    startTimeRef.current = d === "∞" ? null : Date.now();
  };

  // ── WPM UPDATE (standart formula — Monkeytype uslubi) ──────────────
  // Net WPM = (to'g'ri yozilgan belgilar / 5) / (o'tgan haqiqiy vaqt daqiqada)
  //   • numerator:  faqat TO'G'RI yozilgan belgilar (correctCharsRef) —
  //     xato harflar WPM hisobiga KIRMAYDI (aniqlik talabi).
  //   • denominator: HAQIQIY o'tgan soniyalar (startTimeRef dan hozirgi vaqtgacha)
  //     — taymer teskari sanashidan EMAS, shuning uchun 30s taymer orqaga
  //     sanasa ham WPM orqaga ketmaydi.
  //   • Ko'rsatkich FAQAT YUQORIGA boradi (nextLiveWpm): har bir to'g'ri
  //     klavishada va har 500ms da hisoblanadi, lekin avvalgi qiymatdan katta
  //     bo'lsagina yangilanadi. Pauza yoki sekin yozishda WPM pasayib ketmaydi.
  //   • Dastlabki 1 soniya vaqt sifatida qo'llaniladi (calcNetWpm ichida) —
  //     1 ta harf bilan (elapsed ≈ 0) absurd qiymat sakrab chiqmasligi uchun.
  useEffect(() => {
    if (!started || finished || !startTimeRef.current) return;
    const update = () => {
      const elapsedMs = Date.now() - startTimeRef.current!;
      setWpm((prev) => nextLiveWpm(prev, correctCharsRef.current, elapsedMs));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [started, finished]);

  // Har bir to'g'ri klavishada kursor atrofida tarqaladigan nur (ripple)
  useEffect(() => {
    if (!started || finished || !caretRef.current) return;
    const r = caretRef.current.getBoundingClientRect();
    setRipple({ x: r.left + r.width / 2, y: r.top + r.height / 2, id: Date.now() });
  }, [cursor, started, finished]);

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
      spawnP(ok, t.accent);
      recordEvent({ type: "keydown", key: k, correct: ok, time: Date.now() - (startTimeRef.current || Date.now()) });

      if (ok) {
        // To'g'ri harf — yoziladi va cursor keyingi harfga o'tadi
        correctCharsRef.current += 1;
        // Har bir to'g'ri klavishada WPM yangilanadi (haqiqiy o'tgan vaqtga qarab,
        // faqat yuqoriga) — taymer orqaga sanagani bilan WPM tushib ketmaydi
        if (startTimeRef.current) {
          setWpm((prev) => nextLiveWpm(prev, correctCharsRef.current, Date.now() - startTimeRef.current!));
        }
        setTyped((tt) => tt + k);
        setCombo((cc) => {
          const nc = cc + 1;
          setMaxCombo((m) => Math.max(m, nc));
          if (nc === 10) updateProgress("combo", 1);
          if (nc === 20) updateProgress("combo", 1);
          return nc;
        });
        // Xato o'tdi — qizil belgini tozalaymiz
        setWordErr(false);
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
      } else {
        // Xato harf — YOZILMAYDI va cursor to'xtaydi, o'sha harf qizil bo'lib turadi
        setErrors((er) => er + 1);
        setCombo(0);
        setWordErr(true);
        // Matn bloki xato belgisida silkinadi
        setErrTick((t) => t + 1);
      }

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
      const elapsedMs = Date.now() - startTimeRef.current!;
      const e = elapsedMs / 60000;
      // Standart formula (jonli hisoblagich bilan bir xil): faqat to'g'ri
      // belgilar / 5, o'tgan vaqt daqiqasiga bo'linadi. e > 0 bo'lmasa va
      // 300 WPM chegarasi qo'llaniladi (elapsed ≈ 0 da absurd qiymat chiqmasligi).
      const fw = e > 0 ? Math.min(300, Math.round((typed.length / 5) / e)) : 0;
      // HAQIQIY natija — faqat foydalanuvchi klaviaturada yozganlariga asoslanadi:
      // correct = to'g'ri yozilgan belgilar, total = jami bosilgan belgilar (xatolar bilan),
      // time = aniq o'tgan vaqt (soniyalarda), userId = tizimga kirgan foydalanuvchi ID si
      const result: TestResult = {
        wpm: fw,
        accuracy,
        errors,
        correct: typed.length,
        total: totalKs,
        time: Math.max(0, Math.round(elapsedMs / 1000)),
        userId: getUserToken() ?? undefined,
        lang,
        duration,
        date: new Date().toLocaleTimeString(),
        recordingId: Date.now(),
      };
      // Natijalar ekranida ANIQ yakuniy qiymatlar ko'rinishi uchun
      // (jonli hisoblagich oxirgi marta 500ms avval yangilangan bo'lishi mumkin)
      setWpm(fw);
      setResultTime(result.time);
      // Yakuniy WPM namunasini qo'shamiz
      setWpmHistory((prev) => [
        ...prev,
        { time: result.time, wpm: fw, errors },
      ]);
      setHistory((h) => [result, ...h.slice(0, 49)]);

      // Admin panel uchun: kim type qilganini qayd qilamiz (to'liq haqiqiy ko'rsatkichlar bilan)
      recordTyping({
        wpm: fw,
        accuracy,
        errors,
        correct: typed.length,
        total: totalKs,
        elapsed: result.time,
        lang,
      });

      // Convex serverga ham HAQIQIY natijani yozamiz — foydalanuvchi login qilgan
      // bo'lsa, server uning ID sini (tokenIdentifier) avtomatik saqlaydi.
      const recorder = getTypingRecorder();
      if (recorder) {
        void recorder({
          wpm: fw,
          accuracy,
          errors,
          correct: typed.length,
          total: totalKs,
          time: result.time,
          lang,
          duration: typeof duration === "number" ? duration : 0,
          username: fullName(profile) || undefined,
        }).catch(() => {});
      }

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
  // Faqat xato joyidagi BIRTA harf qizil ko'rinadi (butun so'z emas)
  const rendered = text.split("").map((ch, i) => {
    let cls = "relative text-gray-600";
    if (i < cursor) cls = "relative text-white";
    if (i < typed.length && !charsEqual(typed[i], text[i])) {
      cls = "relative text-red-400 bg-red-900/30 rounded err-char";
    } else if (wordErr && i === cursor) {
      cls = "relative text-red-400 bg-red-900/30 rounded err-char";
    }
    return (
      <span key={i} className={cls}>
        {i === cursor && <span ref={caretRef} className="caret-bar" style={{ background: t.accent }} />}
        {ch}
      </span>
    );
  });

  // ── NAVIGATION ──────────────────────────────────────────────────────
  const navItems: { id: string; icon: IconType; label: string }[] = [
    { id: "type", icon: FiType, label: T("nav.type") },
    { id: "leaderboard", icon: FaTrophy, label: T("nav.leaderboard") },
    { id: "countryrank", icon: FiMap, label: T("nav.countries") },
    { id: "profile", icon: FiUser, label: T("nav.profile") },
    { id: "history", icon: FiList, label: T("nav.history") },
    { id: "daily", icon: FiZap, label: T("nav.daily") },
    { id: "seasonal", icon: FaMedal, label: T("nav.seasonal") },
    { id: "dna", icon: FaDna, label: T("nav.dna") },
    { id: "challenge", icon: FiAward, label: "Challenge" },
    { id: "multiplyer", icon: FiSend, label: T("nav.battle") },
    { id: "friends", icon: FiUsers, label: T("nav.friends") },
    { id: "chat", icon: FiMessageCircle, label: T("nav.chat") },
    { id: "ai", icon: FiCpu, label: T("nav.ai") },
    { id: "custom", icon: FiBookOpen, label: T("nav.custom") },
    { id: "mashq", icon: FiEdit3, label: T("nav.mashq") },
    { id: "replay", icon: FiVideo, label: T("nav.replay") },
    { id: "games", icon: FiGrid, label: T("nav.games") },
    { id: "shop", icon: FiShoppingBag, label: T("nav.shop") },
    { id: "about", icon: FiInfo, label: T("nav.about") },
  ];

  // ── VIEW GUARD ────────────────────────────────────────────────────
  // O'chirilgan sahifalar (masalan "tutor") localStorage da qolgan bo'lsa — blank o'rniga "type" ochiladi.
  // "admin" navItems'da yo'q (maxsus view) — guard uni "type"ga qaytarib yubormasligi uchun qo'shilgan.
  useEffect(() => {
    const valid = new Set([...navItems.map((n) => n.id), "admin"]);
    if (!valid.has(view)) setView("type");
  }, [view]);

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <>
    <AccountSyncBridge />
    <SupabaseCoinSync />
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
        {/* Harakatlanuvchi yorug'lik sharlari */}
        <div className="bg-orbs">
          <div
            className="bg-orb"
            style={{
              width: 420,
              height: 420,
              top: "-8%",
              left: "-6%",
              background: "radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)",
            }}
          />
          <div
            className="bg-orb"
            style={{
              width: 380,
              height: 380,
              top: "52%",
              right: "-8%",
              background: "radial-gradient(circle, rgba(167,139,250,0.3), transparent 70%)",
              animationDelay: "-6s",
              animationDuration: "20s",
            }}
          />
          <div
            className="bg-orb"
            style={{
              width: 300,
              height: 300,
              bottom: "-10%",
              left: "28%",
              background: "radial-gradient(circle, rgba(34,197,94,0.22), transparent 70%)",
              animationDelay: "-11s",
              animationDuration: "24s",
            }}
          />
        </div>
        {/* Miltillovchi yulduzlar */}
        <div className="bg-stars" />
        <div className="bg-stars bg-stars-b" />
      </div>

      {/* Particles — to'g'ri klavishada burst, xatoda qizil ✕ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {particles.map((p) => (
          <div
            key={p.id}
            className="burst-particle"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size ?? 18}px`,
                color: p.ok ? (p.color ?? t.accent) : "#f87171",
                "--dx": `${p.dx ?? 0}px`,
                "--dy": `${p.dy ?? -60}px`,
                "--rot": `${p.rot ?? 0}deg`,
              } as CSSProperties
            }
          >
            {p.char ?? (p.ok ? "✦" : "✕")}
          </div>
        ))}
      </div>

      {/* Klavishada kursor atrofida tarqaladigan nur (ripple) */}
      {ripple && (
        <span
          key={ripple.id}
          className="key-ripple"
          style={{ left: ripple.x, top: ripple.y, "--ripple-color": t.accent } as CSSProperties}
        />
      )}

      {/* Navbar */}
      <nav className="animate-nav-in flex items-center justify-between flex-wrap gap-x-2 px-3 sm:px-4 md:px-8 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          <button
            onClick={() => setView("type")}
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl md:text-2xl font-bold tracking-tight transition-all hover:scale-105 whitespace-nowrap"
            style={{ color: t.accent }}
          >
            <FaKeyboard size={24} className="w-6 h-6 md:w-7 md:h-7" style={{ color: t.accent }} />
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
                  {d === "∞" ? T("type.free") : `${d}s`}
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
                <span className="hidden sm:inline">{l.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {view === "type" && (
            <>
              <button
                onClick={() => setShowKeyboard((s) => !s)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all hidden sm:block"
                title={T("type.keyboard")}
              >
                <FaKeyboard size={16} />
              </button>
              <button
                onClick={() => newText()}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                title={T("type.newText")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
          {/* 200 WPM → Telegram Premium aksiyasi (sovg'a qutisi belgisi bilan) — hozircha vaqtincha o'chirilgan */}
          <button
            onClick={() => {
              setShowPromo(false);
              setShowSettings(false);
              setShowOwner(false);
              setShowLingohub(false);
              // Aksiya hozircha ishlamayapti — faqat xabar chiqadi
              setPromoNotice(true);
              window.setTimeout(() => setPromoNotice(false), 2600);
            }}
            className="promo-badge px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
            title={T("navbar.promoTitle")}
          >
            <GiftIcon size={16} />
            <span className="hidden sm:inline">{T("navbar.promoBadge")}</span>
          </button>
          {/* Kirish (Supabase sozlangan bo'lsa) */}
          {cloudEnabled && !isSignedUp && (
            <button
              onClick={() => {
                setShowLogin(true);
                setShowPromo(false);
                setShowSettings(false);
                setShowOwner(false);
                setShowLingohub(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105"
              title={T("navbar.loginTitle")}
              style={{ background: "#ffffff0d", color: "#9ca3af", border: "1px solid #ffffff14" }}
            >
              <FiLogIn size={13} />
              <span className="hidden sm:inline">{T("navbar.login")}</span>
            </button>
          )}
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
            title={isSignedUp ? T("navbar.editProfileTitle") : T("navbar.signupTitle")}
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
                  {fullName(profile)?.split(" ")[0] || T("nav.profile")}
                </span>
              </>
            ) : (
              <>
                <FiUser size={13} />
                <span className="hidden sm:inline">{T("navbar.signup")}</span>
              </>
            )}
          </button>
          {/* Telegram kanal — t.me/khoja_akbar */}
          <a
            href="https://t.me/khoja_akbar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold items-center gap-1.5 transition-all hover:scale-105 hover:brightness-110"
            title={T("navbar.telegramTitle")}
            style={{ background: "#229ed926", color: "#5fb8e8", border: "1px solid #229ed955" }}
          >
            <FaTelegram size={13} />
            <span className="hidden sm:inline">Telegram</span>
          </a>
          {/* Instagram — @styping.uz1 */}
          <a
            href="https://instagram.com/styping.uz1"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold items-center gap-1.5 transition-all hover:scale-105 hover:brightness-110"
            title={T("navbar.instagramTitle")}
            style={{ background: "#229ed926", color: "#5fb8e8", border: "1px solid #229ed955" }}
          >
            <FaInstagram size={13} />
            <span className="hidden sm:inline">Instagram</span>
          </a>
          {/* Lingohub.uz reklamasi — Egasi tugmasi yonida */}
          <button
            onClick={() => {
              setShowLingohub((s) => !s);
              setShowPromo(false);
              setShowSettings(false);
              setShowOwner(false);
            }}
            className="hidden sm:flex ad-badge px-2.5 py-1.5 rounded-lg text-[11px] font-bold items-center gap-1.5 transition-all hover:scale-105"
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
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold items-center gap-1.5 transition-all hover:scale-105"
            title={T("navbar.ownerTitle")}
            style={{
              background: showOwner ? t.accent + "33" : "#ffffff0d",
              color: showOwner ? t.accent : "#9ca3af",
              border: `1px solid ${showOwner ? t.accent + "55" : "#ffffff14"}`,
            }}
          >
            <FiUser size={13} />
            <span className="hidden sm:inline">{T("navbar.owner")}</span>
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
          {navItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => {
                setShowOwner(false);
                setShowPromo(false);
                setShowLingohub(false);
                setView(view === item.id ? "type" : item.id);
              }}
              className={`nav-item-anim flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-left transition-all hover:bg-white/5 ${
                view === item.id ? "is-active" : ""
              }`}
              style={{
                color: view === item.id ? t.accent : "#6b7280",
                background: view === item.id ? t.accent + "11" : "transparent",
                animationDelay: `${i * 35}ms`,
                "--nav-glow": t.accent,
              } as CSSProperties}
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
            <TelegramPromo t={t} lang={lang} bestWpm={bestWpm} onClose={() => setShowPromo(false)} />
          ) : /* Sayt egasi */
          showOwner ? (
            <OwnerView t={t} lang={lang} onClose={() => setShowOwner(false)} />
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
          ) : (
            <div key={view} className="flex-1 min-h-0 overflow-hidden flex flex-col animate-view-in">
            {view === "leaderboard" ? (
            <LeaderboardView t={t} onClose={() => setView("type")} activeAvatar={coinsStore.activeAvatar} heroEquip={coinsStore.heroEquip} />
          ) : view === "countryrank" ? (
            <CountryRanking t={t} onClose={() => setView("type")} />
          ) : view === "profile" ? (
            <ProfileView
              t={t}
              lang={lang}
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
          ) : view === "mashq" ? (
            <MashqView t={t} lang={lang} onClose={() => setView("type")} onSelectText={(txt) => { newText(txt); setView("type"); }} />
          ) : view === "replay" ? (
            <TypingReplayView t={t} onClose={() => setView("type")} recordings={recordings} />
          ) : view === "games" ? (
            <GamesView t={t} onClose={() => setView("type")} onCoinEarned={(amt) => { coinsStore.addCoins(amt); showCoinNotif(amt, "game"); }} />
          ) : view === "shop" ? (
            <ShopView
              t={t}
              lang={lang}
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
              lang={lang}
              onClose={() => setView("type")}
              history={history}
              recordings={recordings}
              daily={daily}
              usedLangs={usedLangs}
            />
          ) : view === "challenge" ? (
            <TypingChallenge t={t} onClose={() => setView("type")} />
          ) : view === "admin" ? (
            <AdminPanel t={t} onClose={() => setView("type")} history={history} xp={xp} />
          ) : view === "type" ? (
            // ── MAIN TYPING VIEW ─────────────────────────────────────────
            <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 gap-6 overflow-y-auto">
              {/* Stats — faqat VAQT (yozish boshlanganda yoki tugaganda) */}
              <div className="flex items-center gap-4 sm:gap-6 md:gap-16">
                {duration !== "∞" && (started || finished) && (
                  <div className="text-center animate-stat-pop">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">{T("type.time")}</div>
                    <div
                      className="text-2xl sm:text-3xl md:text-5xl font-bold"
                      style={{ color: finished ? "#e5e7eb" : (timeLeft !== null && timeLeft <= 5 ? "#ef4444" : "#e5e7eb") }}
                    >
                      {finished ? resultTime : (timeLeft ?? duration)}
                    </div>
                  </div>
                )}
                {combo >= 5 && (
                  <div className="text-center animate-stat-pop" style={{ animationDelay: "240ms" }}>
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">{T("type.combo")}</div>
                    <div className="text-2xl sm:text-3xl md:text-5xl font-bold" style={{ color: "#f59e0b" }}>
                      ×{combo}
                    </div>
                  </div>
                )}
              </div>

              {/* Duration selector (mobile) — navbar'dagi tanlov kichik ekranlarda yashiringan */}
              <div className="flex sm:hidden items-center gap-1.5 flex-wrap justify-center">
                {DURATIONS.map((d) => (
                  <button
                    key={String(d)}
                    onClick={() => selectDuration(d)}
                    className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                    style={{
                      background: duration === d ? t.accent + "22" : "transparent",
                      color: duration === d ? t.accent : "#6b7280",
                    }}
                  >
                    {d === "∞" ? T("type.free") : `${d}s`}
                  </button>
                ))}
              </div>

              {/* Text display */}
              <div className="w-full max-w-2xl relative">
                <div
                  key={`typing-text-${errTick}`}
                  className={`leading-relaxed tracking-wide text-center select-none ${
                    FONT_SIZES[fontSize] || FONT_SIZES.md
                  } ${errTick > 0 ? "text-shake" : ""}`}
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
                  className="absolute -right-1 sm:-right-8 md:-right-10 top-0 p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: favorites.includes(text) ? t.accent : "#4b5563" }}
                >
                  {favorites.includes(text) ? <FiHeart size={18} fill="currentColor" /> : <FiHeart size={18} />}
                </button>
              </div>

              {/* Start typing hint */}
              {!started && !finished && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-gray-600 uppercase tracking-widest animate-pulse">
                    {T("type.startHint")}
                  </p>
                  {/* Yozishni bilmaganlar uchun — Mashq bo'limi */}
                  <button
                    onClick={() => setView("mashq")}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: t.accent + "22",
                      color: t.accent,
                      border: `1px solid ${t.accent + "55"}`,
                    }}
                  >
                    <FiEdit3 size={13} />
                    {T("nav.mashq")}
                  </button>
                </div>
              )}

              {/* Finished state — Monkeytype uslubidagi natijalar grafigi */}
              {finished && (
                <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                  {/* Baholash xabari */}
                  <div className="flex items-center gap-2 text-2xl font-bold animate-pop-in" style={{ color: t.accent }}>
                    {typed.length === 0 ? (
                      <>
                        <FiActivity size={26} />
                        {T("type.timeUp")}
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
                        {accuracy >= 95 ? T("type.excellent") : accuracy >= 80 ? T("type.goodJob") : T("type.keepPracticing")}
                      </>
                    )}
                  </div>

                  {/* Monkeytype uslubidagi natijalar grafigi */}
                  {typed.length > 0 ? (
                    <ResultsChart
                      t={t}
                      wpm={wpm}
                      accuracy={accuracy}
                      wpmHistory={wpmHistory}
                      correctChars={typed.length}
                      totalChars={totalKs}
                      errors={errors}
                      time={resultTime}
                      maxCombo={maxCombo}
                      lang={lang}
                      duration={duration}
                      xp={wpm + accuracy}
                      coins={Math.round(wpm * 1) + (accuracy >= 95 ? 5 : 0)}
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{T("type.timeUp")}</div>
                  )}

                  <button
                    onClick={() => newText()}
                    className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 animate-pop-in"
                    style={{ background: t.accent, color: "#000" }}
                  >
                    {T("type.tryAgain")}
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
          )}
        </div>
      </div>

      {/* Sign up modal — birinchi kirishda majburiy emas, o'tkazib yuborish mumkin
          (login oynasi ochiq bo'lsa yashirinadi). Profil bor bo'lsa yoki
          tiklanayotgan bo'lsa modal ko'rinmaydi. */}
      {!isSignedUp && !skipSignup && !showLogin && mounted && !restoringCloudProfile && (
        <SignUpModal
          t={t}
          lang={lang}
          required
          onSave={(p) => {
            saveProfile(p);
            setShowSignUp(false);
          }}
          onClose={() => setSkipSignup(true)}
          onLoginRequest={() => {
            setShowSignUp(false);
            setShowLogin(true);
          }}
        />
      )}
      {isSignedUp && showSignUp && (
        <SignUpModal
          t={t}
          lang={lang}
          initial={profile ?? undefined}
          required={false}
          onSave={(p) => {
            saveProfile(p);
            setShowSignUp(false);
          }}
          onClose={() => setShowSignUp(false)}
          onLoginRequest={() => {
            setShowSignUp(false);
            setShowLogin(true);
          }}
        />
      )}
      {/* Login modal — Supabase orqali (email + parol) */}
      {showLogin && (
        <LoginModal
          t={t}
          lang={lang}
          onSuccess={(p) => {
            saveProfile(p);
            setShowLogin(false);
          }}
          onSignUpRequest={() => {
            setShowLogin(false);
            setShowSignUp(true);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* Coin earning notifications */}
      <CoinNotification notifications={coinNotifs} onDismiss={dismissCoinNotif} />

      {/* Telegram Premium aksiyasi vaqtincha ishlamayapti — bildirishnoma */}
      {promoNotice && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-xl text-sm font-bold animate-fade-in"
          style={{ background: "#1c1205ee", border: "1px solid #f59e0b66", color: "#fde68a", boxShadow: "0 8px 30px #00000066" }}
        >
          <FiGift size={13} className="inline mr-1.5" style={{ color: "#f59e0b" }} />
          {T("promo.notWorking")}
        </div>
      )}

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
            title={`${av.name} · ${T("navbar.coinShop")}`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: av.color + "33" }}
            >
              <AvIcon size={12} />
            </div>
            <span className="flex items-center gap-1.5"><CoinIcon size={18} /> {formatCoin(coinsStore.coins)}</span>
          </div>
        );
      })()}

      {/* Bottom user badge */}
      <div
        className="fixed bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs z-30 backdrop-blur-md pointer-events-none"
        style={{ background: t.surface + "cc", border: `1px solid ${t.accent}33` }}
      >
        {/* Admin button (footer) — bosiladigan yagona qismi, sidebar bloklanmasligi uchun */}
        <button
          onClick={() => {
            setShowLingohub(false);
            setView(view === "admin" ? "type" : "admin");
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105 mr-1 pointer-events-auto"
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
          <span className="hidden sm:block">{T("navbar.admin")}</span>
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
                  {formatCoin(coinsStore.coins)} <CoinIcon size={13} /> · {xp.toLocaleString()} XP
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

      {/* ── Splash / kirish ekrani ────────────────────────────────────── */}
      {splash && (
        <div className={`splash-screen ${splashLeaving ? "splash-leave" : ""}`}>
          <div
            className="splash-logo w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: t.accent + "22",
              border: `1px solid ${t.accent}66`,
              boxShadow: `0 0 60px ${t.accent}44`,
              color: t.accent,
            }}
          >
            <FaKeyboard size={52} />
          </div>
          <div className="splash-title text-3xl font-black tracking-tight" style={{ color: t.accent }}>
            SType<span style={{ color: "#fff" }}>Uz</span>
          </div>
          <div
            className="splash-title text-[11px] text-gray-500 uppercase tracking-[0.3em]"
            style={{ animationDelay: "0.25s" }}
          >
            Tez yozish platformasi
          </div>
          <div className="splash-bar-track splash-title" style={{ animationDelay: "0.3s" }}>
            <div className="splash-bar-fill" style={{ background: t.accent }} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
