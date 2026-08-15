"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  FiArrowLeft, FiCheck, FiClock, FiTarget,
  FiAward, FiArrowRight, FiRotateCcw, FiInfo,
} from "react-icons/fi";
import { FaTrophy } from "react-icons/fa6";
import type { ThemeColors } from "../../types";
import { charsEqual } from "../../utils/typingChars";
import { createAudioController } from "../../utils/audio";

// ══════════════════════════════════════════════════════════════════════
// LESSON DATA — progressive touch-typing curriculum
// ══════════════════════════════════════════════════════════════════════

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  group: "home" | "top" | "bottom" | "numbers" | "words" | "sentences";
  /** Keys introduced in this lesson (lowercase) */
  keys: string[];
  /** Array of practice lines — each is a string the user types */
  lines: string[];
  /** Minimum WPM to pass */
  passWpm: number;
  /** Minimum accuracy % to pass */
  passAccuracy: number;
}

const LESSONS: Lesson[] = [
  // ── HOME ROW: LEFT HAND ──────────────────────────────────────────
  {
    id: "home-fj",
    title: "Home Row: F & J",
    subtitle: "Index fingers — the foundation of touch typing",
    icon: "Index",
    group: "home",
    keys: ["f", "j"],
    lines: [
      "jj jj jj jj jj jj jj jj",
      "ff ff ff ff ff ff ff ff",
      "fj fj fj fj fj fj fj fj",
      "jf jf jf jf jf jf jf jf",
      "jj ff jj ff jj ff jj ff",
      "fj jf fj jf fj jf fj jf",
      "j jj ff jj ff jj ff jj",
      "f ff jj ff jj ff jj ff",
    ],
    passWpm: 15,
    passAccuracy: 90,
  },
  {
    id: "home-dk",
    title: "Home Row: D & K",
    subtitle: "Middle fingers join the home row",
    icon: "Middle",
    group: "home",
    keys: ["d", "k"],
    lines: [
      "kk kk kk kk kk kk kk kk",
      "dd dd dd dd dd dd dd dd",
      "dk dk dk dk dk dk dk dk",
      "kd kd kd kd kd kd kd kd",
      "jk df jk df jk df jk df",
      "fd kd fd kd fd kd fd kd",
      "dd kk dd kk dd kk dd kk",
      "dk kd dk kd dk kd dk kd",
    ],
    passWpm: 15,
    passAccuracy: 90,
  },
  {
    id: "home-sl",
    title: "Home Row: S & L",
    subtitle: "Ring fingers practice",
    icon: "Ring",
    group: "home",
    keys: ["s", "l"],
    lines: [
      "ll ll ll ll ll ll ll ll",
      "ss ss ss ss ss ss ss ss",
      "sl sl sl sl sl sl sl sl",
      "ls ls ls ls ls ls ls ls",
      "ds kl ds kl ds kl ds kl",
      "sl kd sl kd sl kd sl kd",
      "ss ll ss ll ss ll ss ll",
      "sl ls sl ls sl ls sl ls",
    ],
    passWpm: 15,
    passAccuracy: 90,
  },
  {
    id: "home-a-semicolon",
    title: "Home Row: A & ;",
    subtitle: "Pinky fingers complete the home row",
    icon: "Pinky",
    group: "home",
    keys: ["a", ";"],
    lines: [
      ";; ;; ;; ;; ;; ;; ;; ;;",
      "aa aa aa aa aa aa aa aa",
      "a; a; a; a; a; a; a; a;",
      ";a ;a ;a ;a ;a ;a ;a ;a",
      "as kl as kl as kl as kl",
      "a; la a; la a; la a; la",
      "aa ;; aa ;; aa ;; aa ;;",
      "a; ;a a; ;a a; ;a a; ;a",
    ],
    passWpm: 15,
    passAccuracy: 90,
  },
  {
    id: "home-full",
    title: "Home Row: All Keys",
    subtitle: "All 8 home row keys together",
    icon: "Full",
    group: "home",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    lines: [
      "fj dk fj dk fj dk fj dk",
      "as kl as kl as kl as kl",
      "fd sk fd sk fd sk fd sk",
      "aj fl aj fl aj fl aj fl",
      "sad lad sad lad sad lad",
      "falks jdl; falks jdl;",
      "a s d f j k l ; a s d f",
      "asdf jkl; asdf jkl; asdf",
      "flask jald flask jald flask",
      "sad lad fad had gas had",
    ],
    passWpm: 20,
    passAccuracy: 90,
  },

  // ── TOP ROW ──────────────────────────────────────────────────────
  {
    id: "top-ru",
    title: "Top Row: R & U",
    subtitle: "Index fingers reach up",
    icon: "Index",
    group: "top",
    keys: ["r", "u"],
    lines: [
      "rr rr rr rr rr rr rr rr",
      "uu uu uu uu uu uu uu uu",
      "ru ru ru ru ru ru ru ru",
      "ur ur ur ur ur ur ur ur",
      "fr ju fr ju fr ju fr ju",
      "rd ku rd ku rd ku rd ku",
      "fur dur fur dur fur dur",
      "rd ku fr ju rd ku fr ju",
    ],
    passWpm: 18,
    passAccuracy: 90,
  },
  {
    id: "top-ey",
    title: "Top Row: E & Y",
    subtitle: "Middle fingers stretch up",
    icon: "Middle",
    group: "top",
    keys: ["e", "y"],
    lines: [
      "ee ee ee ee ee ee ee ee",
      "yy yy yy yy yy yy yy yy",
      "ey ey ey ey ey ey ey ey",
      "ye ye ye ye ye ye ye ye",
      "de ky de ky de ky de ky",
      "re ju re ju re ju re ju",
      "key dye key dye key dye",
      "de ky re ju de ky re ju",
    ],
    passWpm: 18,
    passAccuracy: 90,
  },
  {
    id: "top-wiop",
    title: "Top Row: W, I, O, P",
    subtitle: "Ring and pinky fingers reach up",
    icon: "Ring",
    group: "top",
    keys: ["w", "i", "o", "p"],
    lines: [
      "ii ii ii ii ii ii ii ii",
      "ww ww ww ww ww ww ww ww",
      "wi wi wi wi wi wi wi wi",
      "ow ow ow ow ow ow ow ow",
      "po po po po po po po po",
      "wi ow wi ow wi ow wi ow",
      "sw kl sw kl sw kl sw kl",
      "pow wik pow wik pow wik",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "top-qt",
    title: "Top Row: Q & T",
    subtitle: "Pinky and index complete the top row",
    icon: "Full",
    group: "top",
    keys: ["q", "t"],
    lines: [
      "qq qq qq qq qq qq qq qq",
      "tt tt tt tt tt tt tt tt",
      "qt qt qt qt qt qt qt qt",
      "tq tq tq tq tq tq tq tq",
      "at ft at ft at ft at ft",
      "fq jt fq jt fq jt fq jt",
      "quit flat quit flat quit",
      "at fq jt at fq jt at fq",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "top-full",
    title: "Top Row: All Keys",
    subtitle: "Combined home + top row practice",
    icon: "Full",
    group: "top",
    keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    lines: [
      "rewq rewq rewq rewq rewq",
      "tyui tyui tyui tyui tyui",
      "quite write quite write quite",
      "tower query tower query tower",
      "your write your write your write",
      "write quite write quite write quite",
      "we write your type we write your type",
      "quiet right quiet right quiet right",
    ],
    passWpm: 22,
    passAccuracy: 88,
  },

  // ── BOTTOM ROW ───────────────────────────────────────────────────
  {
    id: "bottom-vb",
    title: "Bottom Row: V & B",
    subtitle: "Left index fingers drop down",
    icon: "Index",
    group: "bottom",
    keys: ["v", "b"],
    lines: [
      "vv vv vv vv vv vv vv vv",
      "bb bb bb bb bb bb bb bb",
      "vb vb vb vb vb vb vb vb",
      "bv bv bv bv bv bv bv bv",
      "fv jb fv jb fv jb fv jb",
      "dv kb dv kb dv kb dv kb",
      "viable viable viable viable",
      "brave viable brave viable",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "bottom-nm",
    title: "Bottom Row: N & M",
    subtitle: "Right index fingers drop down",
    icon: "Index",
    group: "bottom",
    keys: ["n", "m"],
    lines: [
      "nn nn nn nn nn nn nn nn",
      "mm mm mm mm mm mm mm mm",
      "nm nm nm nm nm nm nm nm",
      "mn mn mn mn mn mn mn mn",
      "fn jm fn jm fn jm fn jm",
      "vn bm vn bm vn bm vn bm",
      "name name name name name",
      "find name find name find name",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "bottom-cx",
    title: "Bottom Row: C & X",
    subtitle: "Middle and ring fingers drop down",
    icon: "Middle",
    group: "bottom",
    keys: ["c", "x"],
    lines: [
      "cc cc cc cc cc cc cc cc",
      "xx xx xx xx xx xx xx xx",
      "cx cx cx cx cx cx cx cx",
      "xc xc xc xc xc xc xc xc",
      "dc kx dc kx dc kx dc kx",
      "sc kl sc kl sc kl sc kl",
      "mix next mix next mix next",
      "cool mix next cool mix",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "bottom-z",
    title: "Bottom Row: Z & ,",
    subtitle: "Pinky and middle fingers complete bottom row",
    icon: "Pinky",
    group: "bottom",
    keys: ["z", ","],
    lines: [
      "zz zz zz zz zz zz zz zz",
      ",, ,, ,, ,, ,, ,, ,,",
      "z, z, z, z, z, z, z, z",
      ",z ,z ,z ,z ,z ,z ,z ,z",
      "az lz az lz az lz az lz",
      "zone zone zone zone zone",
      "zone cool zone cool zone",
      "zoo zone zoo zone zoo zone",
    ],
    passWpm: 18,
    passAccuracy: 88,
  },
  {
    id: "bottom-full",
    title: "Bottom Row: All Keys",
    subtitle: "All 3 rows combined",
    icon: "Full",
    group: "bottom",
    keys: ["z", "x", "c", "v", "b", "n", "m", ","],
    lines: [
      "zxcv zxcv zxcv zxcv zxcv",
      "bnm, bnm, bnm, bnm, bnm,",
      "vex box vex box vex box",
      "come back come back come back",
      "mix next box mix next box",
      "zone brave zone brave zone",
      "vex box come back vex box",
      "cool mix zone cool mix zone",
    ],
    passWpm: 22,
    passAccuracy: 85,
  },

  // ── NUMBERS ──────────────────────────────────────────────────────
  {
    id: "numbers-left",
    title: "Numbers: 1-5",
    subtitle: "Left hand number row",
    icon: "Num",
    group: "numbers",
    keys: ["1", "2", "3", "4", "5"],
    lines: [
      "12 12 12 12 12 12 12 12",
      "34 34 34 34 34 34 34 34",
      "123 123 123 123 123 123",
      "345 345 345 345 345 345",
      "1234 1234 1234 1234 1234",
      "12345 12345 12345 12345",
      "1f 2d 3s 4a 5q 1f 2d 3s",
      "f1 d2 s3 a4 q5 f1 d2 s3",
    ],
    passWpm: 20,
    passAccuracy: 88,
  },
  {
    id: "numbers-right",
    title: "Numbers: 6-0",
    subtitle: "Right hand number row",
    icon: "Num",
    group: "numbers",
    keys: ["6", "7", "8", "9", "0"],
    lines: [
      "67 67 67 67 67 67 67 67",
      "89 89 89 89 89 89 89 89",
      "678 678 678 678 678 678",
      "890 890 890 890 890 890",
      "6789 6789 6789 6789 6789",
      "67890 67890 67890 67890",
      "j6 k7 l8 ;9 p0 j6 k7 l8",
      "6j 7k 8l 9; 0p 6j 7k 8l",
    ],
    passWpm: 20,
    passAccuracy: 88,
  },
  {
    id: "numbers-full",
    title: "Numbers: All",
    subtitle: "Full number row mastery",
    icon: "Num",
    group: "numbers",
    keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    lines: [
      "1234567890 1234567890",
      "0987654321 0987654321",
      "1f 2d 3s 4a 5q 6j 7k 8l",
      "phone 123-456-7890 phone",
      "room 102 door 405 room 102",
      "2024 year 2024 year 2024",
      "call 555-0199 call 555-0199",
      "item 12 costs $3.45 item 12",
    ],
    passWpm: 22,
    passAccuracy: 85,
  },

  // ── COMMON WORDS ─────────────────────────────────────────────────
  {
    id: "words-common-1",
    title: "Common Words: Easy",
    subtitle: "The most frequent English words",
    icon: "Word",
    group: "words",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    lines: [
      "the the the the the the",
      "and and and and and and",
      "for for for for for for",
      "are are are are are are",
      "but but but but but but",
      "not not not not not not",
      "you you you you you you",
      "all all all all all all",
      "can can can can can can",
      "had had had had had had",
      "the and for are but not",
      "you all can had the and",
    ],
    passWpm: 25,
    passAccuracy: 90,
  },
  {
    id: "words-common-2",
    title: "Common Words: Medium",
    subtitle: "Short everyday words",
    icon: "Word",
    group: "words",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    lines: [
      "this that with have from",
      "they been said each which",
      "their time will way about",
      "many then them would write",
      "like so these very when",
      "come could people other",
      "than first water where long",
      "find home page after just",
      "this that with have from",
      "they been said each which",
    ],
    passWpm: 28,
    passAccuracy: 88,
  },
  {
    id: "words-common-3",
    title: "Common Words: Hard",
    subtitle: "Typing speed boosters",
    icon: "Word",
    group: "words",
    keys: [],
    lines: [
      "because through another would",
      "should their about between",
      "people some think where those",
      "could other would which when",
      "number great before often",
      "small every found still",
      "learn plant cover food",
      "earth above giant early",
      "place where world high above",
      "right both strong large old",
    ],
    passWpm: 30,
    passAccuracy: 85,
  },

  // ── FULL SENTENCES ───────────────────────────────────────────────
  {
    id: "sentences-easy",
    title: "Sentences: Easy",
    subtitle: "Short sentences for rhythm",
    icon: "Sent",
    group: "sentences",
    keys: [],
    lines: [
      "the cat sat on the mat.",
      "a dog ran over the log.",
      "she can see the red sun.",
      "he had a big red hat on.",
      "we like to play all day.",
      "the fish swam in the pond.",
      "my mom made a hot meal.",
      "the sun is warm today.",
    ],
    passWpm: 25,
    passAccuracy: 90,
  },
  {
    id: "sentences-medium",
    title: "Sentences: Medium",
    subtitle: "Real-world typing practice",
    icon: "Sent",
    group: "sentences",
    keys: [],
    lines: [
      "the quick brown fox jumps over the lazy dog.",
      "practice makes perfect if you do it every day.",
      "she found an old book in the dusty corner.",
      "the children played in the garden after school.",
      "he walked quickly through the busy street.",
      "they enjoyed a quiet evening at home.",
      "the birds sang sweetly in the morning light.",
      "we should always be kind to one another.",
    ],
    passWpm: 30,
    passAccuracy: 88,
  },
  {
    id: "sentences-hard",
    title: "Sentences: Hard",
    subtitle: "Challenge your speed and accuracy",
    icon: "Sent",
    group: "sentences",
    keys: [],
    lines: [
      "extraordinary circumstances require exceptional measures.",
      "technology continues to reshape our daily lives in remarkable ways.",
      "the pharmaceutical industry has revolutionized modern medicine.",
      "simultaneously the phenomenon created unprecedented conditions.",
      "comprehensibility remains the cornerstone of effective communication.",
      "archaeological discoveries fundamentally transformed our understanding.",
      "unwavering determination is the key to overcoming any challenge.",
    ],
    passWpm: 35,
    passAccuracy: 85,
  },
];

const GROUPS = [
  { id: "home", label: "Home Row", icon: "🏠", color: "#22c55e", desc: "Foundation keys — F J D K S L A ;" },
  { id: "top", label: "Top Row", icon: "⬆️", color: "#38bdf8", desc: "Q W E R T Y U I O P" },
  { id: "bottom", label: "Bottom Row", icon: "⬇️", color: "#f59e0b", desc: "Z X C V B N M" },
  { id: "numbers", label: "Numbers", icon: "🔢", color: "#a78bfa", desc: "1 2 3 4 5 6 7 8 9 0" },
  { id: "words", label: "Words", icon: "📝", color: "#ec4899", desc: "Common English words" },
  { id: "sentences", label: "Sentences", icon: "💬", color: "#f87171", desc: "Full sentence practice" },
] as const;

// ══════════════════════════════════════════════════════════════════════
// PROGRESS STORAGE
// ══════════════════════════════════════════════════════════════════════

interface LessonProgress {
  bestWpm: number;
  bestAccuracy: number;
  passed: boolean;
  attempts: number;
  lastPlayed: number;
}

function loadProgress(): Record<string, LessonProgress> {
  try {
    return JSON.parse(localStorage.getItem("typeuz_challenge_progress") || "{}");
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, LessonProgress>) {
  localStorage.setItem("typeuz_challenge_progress", JSON.stringify(progress));
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

interface TypingChallengeProps {
  t: ThemeColors;
  onClose: () => void;
}

type Screen = "menu" | "group" | "practice" | "result";

export default function TypingChallenge({ t, onClose }: TypingChallengeProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>(loadProgress);

  const totalPassed = useMemo(() => Object.values(progress).filter((p) => p.passed).length, [progress]);
  const totalLessons = LESSONS.length;

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setScreen("practice");
  };

  const handleLessonComplete = (lessonId: string, wpm: number, accuracy: number) => {
    const passed = wpm >= (LESSONS.find((l) => l.id === lessonId)?.passWpm ?? 20)
      && accuracy >= (LESSONS.find((l) => l.id === lessonId)?.passAccuracy ?? 85);
    setProgress((prev) => {
      const existing = prev[lessonId];
      const next: LessonProgress = {
        bestWpm: Math.max(existing?.bestWpm ?? 0, wpm),
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
        passed: existing?.passed || passed,
        attempts: (existing?.attempts ?? 0) + 1,
        lastPlayed: Date.now(),
      };
      const updated = { ...prev, [lessonId]: next };
      saveProgress(updated);
      return updated;
    });
    setScreen("result");
  };

  const groupLessons = selectedGroup
    ? LESSONS.filter((l) => l.group === selectedGroup)
    : [];

  // ── MENU SCREEN ──────────────────────────────────────────────────
  if (screen === "menu") {
    return (
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <FiAward size={28} style={{ color: t.accent }} />
              Typing Challenge
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Master touch typing — lesson by lesson
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1.5"
          >
            <FiArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Overall progress */}
        <div
          className="rounded-2xl p-5 mb-8 border"
          style={{ background: t.surface, borderColor: t.accent + "22" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Overall Progress</span>
            <span className="text-sm font-bold" style={{ color: t.accent }}>
              {totalPassed}/{totalLessons} lessons
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "#ffffff0a" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(totalPassed / totalLessons) * 100}%`,
                background: `linear-gradient(90deg, ${t.accent}, ${t.accent}88)`,
              }}
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FaTrophy size={12} style={{ color: t.accent }} />
              {Object.values(progress).filter((p) => p.passed).length} mastered
            </span>
            <span className="flex items-center gap-1">
              <FiTarget size={12} />
              {Object.values(progress).reduce((a, p) => a + p.attempts, 0)} total attempts
            </span>
          </div>
        </div>

        {/* Lesson groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GROUPS.map((g) => {
            const lessons = LESSONS.filter((l) => l.group === g.id);
            const passed = lessons.filter((l) => progress[l.id]?.passed).length;
            const allDone = passed === lessons.length;
            return (
              <button
                key={g.id}
                onClick={() => { setSelectedGroup(g.id); setScreen("group"); }}
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] border"
                style={{
                  background: allDone ? g.color + "11" : t.surface,
                  borderColor: allDone ? g.color + "44" : "transparent",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <div className="text-base font-bold text-white">{g.label}</div>
                      <div className="text-xs text-gray-500">{g.desc}</div>
                    </div>
                  </div>
                  {allDone && (
                    <FiCheck size={20} style={{ color: g.color }} />
                  )}
                </div>
                {/* Mini progress */}
                <div className="flex gap-1 mt-2">
                  {lessons.map((l) => (
                    <div
                      key={l.id}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        background: progress[l.id]?.passed
                          ? g.color
                          : progress[l.id]
                            ? g.color + "44"
                            : "#ffffff0a",
                      }}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-gray-600 mt-2">
                  {passed}/{lessons.length} completed
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── GROUP SCREEN ─────────────────────────────────────────────────
  if (screen === "group" && selectedGroup) {
    const group = GROUPS.find((g) => g.id === selectedGroup)!;
    return (
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setScreen("menu"); setSelectedGroup(null); }}
            className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1.5"
          >
            <FiArrowLeft size={14} /> All Lessons
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{group.icon}</span> {group.label}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{group.desc}</p>
        </div>

        <div className="flex flex-col gap-2">
          {groupLessons.map((lesson, idx) => {
            const p = progress[lesson.id];
            const isPassed = p?.passed;
            return (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01] border"
                style={{
                  background: isPassed ? group.color + "11" : t.surface,
                  borderColor: isPassed ? group.color + "44" : "transparent",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: isPassed ? group.color + "22" : "#ffffff0a",
                    color: isPassed ? group.color : "#6b7280",
                  }}
                >
                  {isPassed ? <FiCheck size={18} /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{lesson.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{lesson.subtitle}</div>
                  {lesson.keys.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {lesson.keys.slice(0, 8).map((k) => (
                        <span
                          key={k}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{ background: group.color + "18", color: group.color }}
                        >
                          {k === ";" ? ";" : k}
                        </span>
                      ))}
                      {lesson.keys.length > 8 && (
                        <span className="text-[10px] text-gray-600">+{lesson.keys.length - 8}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {p ? (
                    <div className="text-xs text-gray-500">
                      <div className="font-bold" style={{ color: group.color }}>{p.bestWpm} WPM</div>
                      <div>{p.bestAccuracy}% acc</div>
                    </div>
                  ) : (
                    <FiArrowRight size={16} className="text-gray-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── PRACTICE SCREEN ──────────────────────────────────────────────
  if (screen === "practice" && selectedLesson) {
    return (
      <ChallengePractice
        t={t}
        lesson={selectedLesson}
        progress={progress[selectedLesson.id]}
        onComplete={(wpm, acc) => handleLessonComplete(selectedLesson.id, wpm, acc)}
        onBack={() => setScreen("group")}
      />
    );
  }

  // ── RESULT SCREEN ────────────────────────────────────────────────
  if (screen === "result" && selectedLesson) {
    const p = progress[selectedLesson.id];
    const passed = p?.passed && (p?.bestWpm ?? 0) >= selectedLesson.passWpm;
    const group = GROUPS.find((g) => g.id === selectedLesson.group)!;
    return (
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center gap-6">
        <div
          className="text-6xl animate-pop-in"
          style={{ animation: "popIn 0.4s ease-out" }}
        >
          {passed ? "🏆" : p?.bestWpm ? "💪" : "📝"}
        </div>
        <h3
          className="text-2xl font-bold text-center"
          style={{ color: t.accent }}
        >
          {passed ? "Lesson Mastered!" : p?.bestWpm ? "Good Progress!" : "Lesson Complete!"}
        </h3>

        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase mb-1">WPM</div>
            <div className="text-4xl font-bold" style={{ color: t.accent }}>
              {p?.bestWpm ?? 0}
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">target: {selectedLesson.passWpm}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase mb-1">Accuracy</div>
            <div className="text-4xl font-bold text-white">{p?.bestAccuracy ?? 0}%</div>
            <div className="text-[10px] text-gray-600 mt-0.5">target: {selectedLesson.passAccuracy}%</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSelectLesson(selectedLesson)}
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: t.accent, color: "#000" }}
          >
            <FiRotateCcw size={14} /> Retry
          </button>
          <button
            onClick={() => { setScreen("group"); }}
            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 border"
            style={{ borderColor: t.accent + "44", color: t.accent }}
          >
            Next Lesson <FiArrowRight size={14} />
          </button>
        </div>

        {/* Tip */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl text-xs text-gray-500 mt-4 border"
          style={{ background: t.surface, borderColor: "#ffffff08" }}
        >
          <FiInfo size={14} className="flex-shrink-0 mt-0.5" style={{ color: t.accent }} />
          <span>
            {passed
              ? "Excellent! You've mastered this lesson. Try the next one to keep improving!"
              : `You need at least ${selectedLesson.passWpm} WPM with ${selectedLesson.passAccuracy}% accuracy to pass. Keep practicing!`}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════
// PRACTICE SUB-COMPONENT
// ══════════════════════════════════════════════════════════════════════

function ChallengePractice({
  t,
  lesson,
  progress: existingProgress,
  onComplete,
  onBack,
}: {
  t: ThemeColors;
  lesson: Lesson;
  progress?: LessonProgress;
  onComplete: (wpm: number, accuracy: number) => void;
  onBack: () => void;
}) {
  const group = GROUPS.find((g) => g.id === lesson.group)!;

  // Combine all practice lines into a single text
  const fullText = useMemo(() => lesson.lines.join(" "), [lesson]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [typed, setTyped] = useState("");
  const [cursor, setCursor] = useState(0);
  const [errors, setErrors] = useState(0);
  const [totalKs, setTotalKs] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wordErr, setWordErr] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufRef = useRef<AudioBuffer | null>(null);
  const { playClick, playError, playWin } = useMemo(
    () => createAudioController(audioCtxRef, clickBufRef),
    []
  );

  const soundEnabled = true;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (!finished && inputRef.current) inputRef.current.focus();
  }, [started, finished]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished]);

  // WPM update
  useEffect(() => {
    if (!started || finished) return;
    const update = () => {
      if (!startTimeRef.current) return;
      const elapsedMs = Date.now() - startTimeRef.current;
      if (elapsedMs < 1000) return;
      const elapsedMin = elapsedMs / 60000;
      const rawWpm = Math.min(300, Math.round((correctCharsRef.current / 5) / elapsedMin));
      setWpm(Math.max(0, rawWpm));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [started, finished]);

  const processKey = useCallback(
    (rawKey: string) => {
      if (finished) return;
      const k = rawKey.toLowerCase();
      if (k === "tab") { resetPractice(); return; }
      if (k === "escape") { onBack(); return; }
      if (k.length !== 1) return;

      if (!started) {
        setStarted(true);
        startTimeRef.current = Date.now();
      }

      const ok = charsEqual(k, fullText[cursor]);
      setTotalKs((n) => n + 1);

      if (soundEnabled) {
        if (ok) playClick();
        else playError();
      }

      if (ok) {
        correctCharsRef.current += 1;
        setTyped((tt) => tt + k);
        setWordErr(false);
        setCursor((c) => {
          const newCursor = c + 1;
          if (newCursor === fullText.length) {
            setFinished(true);
            if (soundEnabled) playWin();
          }
          return newCursor;
        });
      } else {
        setErrors((er) => er + 1);
        setWordErr(true);
      }

      const nt = totalKs + 1;
      const ne = ok ? errors : errors + 1;
      setAccuracy(nt > 0 ? Math.round(((nt - ne) / nt) * 100) : 100);
    },
    [finished, fullText, cursor, started, soundEnabled, totalKs, errors, playClick, playError, playWin, onBack]
  );

  // Finish handler
  useEffect(() => {
    if (finished && started && typed.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalWpm = wpm || (typed.length / 5) / (elapsed / 60);
      const finalAcc = totalKs > 0 ? Math.round(((totalKs - errors) / totalKs) * 100) : 100;
      onComplete(Math.min(300, Math.round(finalWpm)), finalAcc);
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStarted(false);
    setFinished(false);
    setTyped("");
    setCursor(0);
    setErrors(0);
    setTotalKs(0);
    setWpm(0);
    setAccuracy(100);
    setElapsed(0);
    setWordErr(false);
    correctCharsRef.current = 0;
    startTimeRef.current = null;
    replayStartedRef.current = false;
  };

  const replayStartedRef = useRef(false);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") e.preventDefault();
      processKey(e.key);
    },
    [processKey]
  );

  // Text rendering
  const rendered = fullText.split("").map((ch, i) => {
    let cls = "relative text-gray-600";
    if (i < cursor) cls = "relative text-white";
    if (i < typed.length && !charsEqual(typed[i], fullText[i])) {
      cls = "relative text-red-400 bg-red-900/30 rounded";
    } else if (wordErr && i === cursor) {
      cls = "relative text-red-400 bg-red-900/30 rounded";
    }
    return (
      <span key={i} className={cls}>
        {i === cursor && (
          <span
            className="caret-bar"
            style={{ background: t.accent }}
          />
        )}
        {ch}
      </span>
    );
  });

  // Progress through the text
  const progressPct = fullText.length > 0 ? (cursor / fullText.length) * 100 : 0;

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1.5"
        >
          <FiArrowLeft size={14} /> {lesson.title}
        </button>
        <div className="flex items-center gap-3 text-sm">
          {started && !finished && (
            <>
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiClock size={13} />
                <span>{elapsed}s</span>
              </div>
              <div className="font-bold" style={{ color: t.accent }}>
                {wpm} <span className="text-xs font-normal text-gray-500">WPM</span>
              </div>
              <div className="font-bold text-white">
                {accuracy}%
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lesson title */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{lesson.title}</h3>
        <p className="text-xs text-gray-500">{lesson.subtitle}</p>
      </div>

      {/* Target info */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiTarget size={12} style={{ color: group.color }} />
          Target: {lesson.passWpm} WPM, {lesson.passAccuracy}% acc
        </span>
        {existingProgress && (
          <span className="flex items-center gap-1">
            <FaTrophy size={12} style={{ color: group.color }} />
            Best: {existingProgress.bestWpm} WPM
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-6" style={{ background: "#ffffff0a" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPct}%`,
            background: group.color,
          }}
        />
      </div>

      {/* Text display */}
      <div
        className="w-full relative rounded-2xl p-6 sm:p-8 border mb-6"
        style={{ background: t.surface, borderColor: "#ffffff08" }}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          className="leading-relaxed tracking-wide select-none"
          style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: "18px",
            lineHeight: "2",
          }}
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
      </div>

      {/* Hint */}
      {!started && !finished && (
        <p className="text-xs text-gray-600 text-center uppercase tracking-widest animate-pulse mb-4">
          Start typing to begin the lesson — Press TAB to reset, ESC to go back
        </p>
      )}

      {/* Quick stats during practice */}
      {started && !finished && (
        <div className="flex justify-center gap-6 text-center mb-4">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Errors</div>
            <div className="text-lg font-bold" style={{ color: errors > 0 ? "#f87171" : "#22c55e" }}>
              {errors}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Time</div>
            <div className="text-lg font-bold text-white">{elapsed}s</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Progress</div>
            <div className="text-lg font-bold" style={{ color: group.color }}>
              {Math.round(progressPct)}%
            </div>
          </div>
        </div>
      )}

      {/* Keyboard tip */}
      {started && !finished && (
        <div className="text-center text-[10px] text-gray-600 mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">Tab</kbd> to restart
          {" · "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">Esc</kbd> to go back
        </div>
      )}
    </div>
  );
}
