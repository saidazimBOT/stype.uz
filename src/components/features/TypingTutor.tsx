"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThemeColors } from "../../types";
import { getT } from "../../data/i18n";
import { createAudioController } from "../../utils/audio";
import KeyboardVisualizer, { FINGERS, getFinger, type FingerId } from "./KeyboardVisualizer";
import { FaGraduationCap } from "react-icons/fa6";
import { FiArrowRight, FiCheck, FiRefreshCw } from "react-icons/fi";

// ── LESSONS (progressive touch typing) ─────────────────────────────────
// Har bir dars faqat o'sha darsda o'rganiladigan tugmalardan iborat matn
// yaratadi. 1-dars "ffjjjff" kabi eng birinchi harflardan boshlanadi.
const LESSONS: string[][] = [
  // 1 — eng birinchi harflar: f va j (ko'rsatkich barmoqlar)
  ["f", "j"],
  // 2 — o'rta barmoqlar qo'shiladi
  ["f", "j", "d", "k"],
  // 3 — nomsiz barmoqlar
  ["f", "j", "d", "k", "s", "l"],
  // 4 — jimjiloq barmoqlar (to'liq tayanch qator)
  ["a", "s", "d", "f", "j", "k", "l", ";"],
  // 5 — yuqori qator: e, i
  ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i"],
  // 6 — yuqori qator: r, u, t, y
  ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y"],
  // 7 — yuqori qator to'liq: q, w, o, p
  ["a", "s", "d", "f", "j", "k", "l", ";", "e", "i", "r", "u", "t", "y", "q", "w", "o", "p"],
  // 8 — pastki qator: v, m
  ["a", "s", "d", "f", "j", "k", "l", ";", "v", "m"],
  // 9 — pastki qator: b, n
  ["a", "s", "d", "f", "j", "k", "l", ";", "v", "m", "b", "n"],
  // 10 — pastki qator: z, x, c, , .
  ["a", "s", "d", "f", "j", "k", "l", ";", "z", "x", "c", ",", "."],
  // 11 — barcha harflar
  ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
  // 12 — raqamlar
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
];

const TARGET_LEN = 160;

// Matn yaratish: dars tugmalaridan 2-4 harfli "so'zlar" tuzamiz.
// 1-darsda bunday chiqadi: "ffj jff fjj jjf ffjj ..." — xuddi ffjjjff kabi.
function genText(keys: string[]): string {
  let out = "";
  while (out.replace(/ /g, "").length < TARGET_LEN) {
    const wlen = 2 + Math.floor(Math.random() * 3); // 2-4
    let w = "";
    for (let i = 0; i < wlen; i++) {
      w += keys[Math.floor(Math.random() * keys.length)];
    }
    out += w + " ";
  }
  return out.trim();
}

interface TypingTutorProps {
  t: ThemeColors;
  lang: string;
  soundEnabled?: boolean;
  onClose: () => void;
}

// ── HANDS DIAGRAM ───────────────────────────────────────────────────────
// Ikkita qo'l — qaysi barmoq bilan bosishni ko'rsatadi (faol barmoq yonadi).
function HandsGuide({ active, t }: { active: FingerId | undefined; t: ThemeColors }) {
  const leftOrder: FingerId[] = ["l_pinky", "l_ring", "l_middle", "l_index", "thumb"];
  const rightOrder: FingerId[] = ["thumb", "r_index", "r_middle", "r_ring", "r_pinky"];
  const HEIGHTS: Record<FingerId, number> = {
    l_pinky: 42, l_ring: 60, l_middle: 66, l_index: 56, thumb: 38,
    r_pinky: 42, r_ring: 60, r_middle: 66, r_index: 56,
  };

  const renderFinger = (fid: FingerId, thumbRotate: number) => {
    const f = FINGERS[fid];
    const on = active === fid;
    return (
      <div
        key={fid}
        className="flex-1 flex justify-center"
        title={f.name}
      >
        <div
          className="w-[26px] rounded-t-xl rounded-b-sm transition-all duration-150"
          style={{
            height: HEIGHTS[fid],
            background: on ? f.color : "#ffffff0a",
            border: `1px solid ${on ? f.color : "#ffffff1a"}`,
            boxShadow: on ? `0 0 18px ${f.color}aa` : "none",
            transform: fid === "thumb" ? `rotate(${thumbRotate}deg)` : "none",
            transformOrigin: "bottom center",
          }}
        />
      </div>
    );
  };

  const renderHand = (order: FingerId[], rotate: number) => (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-[3px] w-[150px]">
        {order.map((fid) => renderFinger(fid, rotate))}
      </div>
      {/* Kaft */}
      <div
        className="w-[150px] h-12 rounded-b-2xl"
        style={{
          background: "linear-gradient(180deg, #ffffff0f, #ffffff05)",
          border: "1px solid #ffffff14",
          borderTop: "none",
        }}
      />
    </div>
  );

  return (
    <div className="flex items-end justify-center gap-6 sm:gap-12">
      {renderHand(leftOrder, 22)}
      {renderHand(rightOrder, -22)}
    </div>
  );
}

// ── TUTOR VIEW ──────────────────────────────────────────────────────────
export default function TypingTutor({ t, lang, soundEnabled = true, onClose }: TypingTutorProps) {
  const T = getT(lang);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [text, setText] = useState<string>(() => genText(LESSONS[0]));
  const [pos, setPos] = useState(0);
  const [errors, setErrors] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState(false);
  const [wpm, setWpm] = useState(0);
  const startRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufRef = useRef<AudioBuffer | null>(null);

  // Ovoz effektlari — asosiy sayt bilan bir xil kontroller
  const { playClick, playError, playWin } = useMemo(
    () => createAudioController(audioCtxRef, clickBufRef),
    []
  );

  const reset = useCallback((idx: number) => {
    setLessonIdx(idx);
    setText(genText(LESSONS[idx]));
    setPos(0);
    setErrors(0);
    setStarted(false);
    setFinished(false);
    setFlash(false);
    setWpm(0);
    startRef.current = null;
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [lessonIdx, text, finished]);

  const processKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (finished) return;
      const k = e.key.toLowerCase();
      if (k === "tab") {
        e.preventDefault();
        reset(lessonIdx);
        return;
      }
      if (k === "escape") {
        onClose();
        return;
      }
      if (k.length !== 1) return;
      if (!started) {
        setStarted(true);
        startRef.current = Date.now();
      }
      const elapsedMin = startRef.current ? (Date.now() - startRef.current) / 60000 : 0;
      if (k === text[pos]) {
        if (soundEnabled) playClick();
        setFlash(false);
        const np = pos + 1;
        setPos(np);
        if (elapsedMin > 0) setWpm(Math.min(300, Math.round((np / 5) / elapsedMin)));
        if (np === text.length) {
          setFinished(true);
          if (soundEnabled) playWin();
        }
      } else {
        if (soundEnabled) playError();
        setErrors((er) => er + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 250);
      }
    },
    [finished, text, pos, started, lessonIdx, reset, onClose, soundEnabled, playClick, playError, playWin]
  );

  const total = pos + errors;
  const accuracy = total === 0 ? 100 : Math.round((pos / total) * 100);
  const progress = Math.round((pos / text.length) * 100);
  const curKey = finished ? undefined : text[pos];
  const finger = curKey !== undefined ? getFinger(curKey) : undefined;

  // rendered text
  const rendered = text.split("").map((ch, i) => {
    let cls = "text-gray-600";
    if (i < pos) cls = "text-white";
    if (i === pos) {
      cls = flash
        ? "text-red-400 bg-red-900/40 rounded"
        : "rounded";
    }
    return (
      <span key={i} className={cls}>
        {i === pos && (
          <span
            className="caret-bar"
            style={{ background: flash ? "#ef4444" : t.accent }}
          />
        )}
        {ch}
      </span>
    );
  });

  const nextLesson = () => {
    if (lessonIdx < LESSONS.length - 1) reset(lessonIdx + 1);
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaGraduationCap style={{ color: t.accent }} />
            {T("tutor.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{T("tutor.subtitle")}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400"
        >
          {T("tutor.back")}
        </button>
      </div>

      {/* Lesson selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5">
        {LESSONS.map((_, i) => (
          <button
            key={i}
            onClick={() => reset(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              lessonIdx === i ? "" : "opacity-50 hover:opacity-100"
            }`}
            style={{
              background: lessonIdx === i ? t.accent + "26" : "transparent",
              color: lessonIdx === i ? t.accent : "#9ca3af",
              border: `1px solid ${lessonIdx === i ? t.accent + "55" : "#ffffff0d"}`,
            }}
          >
            {T("tutor.lesson")} {i + 1}
            {i === 0 && <span className="ml-1">⭐</span>}
          </button>
        ))}
      </div>

      {/* Text + stats */}
      <div
        className={`leading-relaxed tracking-wide text-center select-none text-2xl md:text-3xl ${
          finished ? "animate-fade-in" : ""
        }`}
        style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
        onClick={() => inputRef.current?.focus()}
      >
        {rendered}
      </div>

      {/* Progress bar */}
      <div className="mt-5 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{ width: `${progress}%`, background: t.accent }}
        />
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center justify-center gap-4 sm:gap-8 text-sm">
        <span className="text-gray-400">
          {T("type.wpm")}:{" "}
          <strong className="font-mono" style={{ color: t.accent }}>
            {wpm}
          </strong>
        </span>
        <span className="text-gray-400">
          {T("type.accuracy")}:{" "}
          <strong className="font-mono text-white">{accuracy}%</strong>
        </span>
        <span className="text-gray-400">
          {T("type.errors")}{" "}
          <strong className="font-mono text-red-400">{errors}</strong>
        </span>
        <span className="text-gray-400">
          {T("tutor.progress")}:{" "}
          <strong className="font-mono text-white">{progress}%</strong>
        </span>
      </div>

      {/* Finger hint */}
      {!finished && finger && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500">{T("tutor.pressWith")}</span>
          <span
            className="px-2.5 py-1 rounded-lg font-bold uppercase animate-pulse"
            style={{
              background: FINGERS[finger].color + "22",
              color: FINGERS[finger].color,
              border: `1px solid ${FINGERS[finger].color}66`,
            }}
          >
            {T(`tutor.finger.${finger}`)}
          </span>
          <FiArrowRight className="text-gray-600" />
          <span
            className="px-2.5 py-1 rounded-lg font-bold"
            style={{
              background: t.accent,
              color: "#000",
            }}
          >
            {curKey === " " ? "space" : curKey}
          </span>
        </div>
      )}

      {/* Hands + keyboard */}
      <div className="mt-6 flex flex-col items-center gap-6">
        <HandsGuide active={finger} t={t} />
        <div className="w-full max-w-2xl">
          <KeyboardVisualizer
            t={t}
            fingerGuide
            nextKey={curKey}
          />
        </div>
      </div>

      {/* Hidden typing input */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        onKeyDown={processKey}
        autoFocus
      />

      {/* Start hint / Finished */}
      {!started && !finished && (
        <p className="mt-5 text-center text-xs text-gray-600 uppercase tracking-widest animate-pulse">
          {T("tutor.startHint")}
        </p>
      )}

      {finished && (
        <div className="mt-6 flex flex-col items-center gap-4 animate-pop-in">
          <div
            className="flex items-center gap-2 text-xl font-bold"
            style={{ color: t.accent }}
          >
            <FiCheck size={22} />
            {T("tutor.done")}
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => reset(lessonIdx)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
              style={{
                background: "#ffffff0d",
                color: "#d1d5db",
                border: "1px solid #ffffff14",
              }}
            >
              <FiRefreshCw size={14} />
              {T("tutor.repeat")}
            </button>
            {lessonIdx < LESSONS.length - 1 && (
              <button
                onClick={nextLesson}
                className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all hover:scale-105"
                style={{ background: t.accent, color: "#000" }}
              >
                {T("tutor.next")}
                <FiArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
