"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { ThemeColors } from "../../../types";
import { charsEqual } from "../../../utils/typingChars";
import { nextLiveWpm } from "../../../utils/wpm";

interface TypingArenaProps {
  t: ThemeColors;
  text: string;
  code: string;
  running: boolean;
}

/**
 * Jang uchun umumiy yozish maydoni. Har bir tugma bosilganda progress
 * throttled (300ms) holda serverga yuboriladi — raqib ham real vaqtda ko'radi.
 */
export default function TypingArena({ t, text, code, running }: TypingArenaProps) {
  const updateProgress = useMutation(api.rooms.updateProgress);

  const [typed, setTyped] = useState("");
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [finished, setFinished] = useState(false);

  const typedRef = useRef("");
  const startTimeRef = useRef<number | null>(null);
  const wpmRef = useRef(0);
  const lastReportRef = useRef(0);
  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const report = useCallback(
    (
      correct: number,
      typedCount: number,
      wpmV: number,
      accV: number,
      fin: boolean,
      preview: string
    ) => {
      const now = Date.now();
      if (!fin && now - lastReportRef.current < 300) return;
      lastReportRef.current = now;
      updateProgress({
        code,
        correct,
        typed: typedCount,
        wpm: wpmV,
        accuracy: accV,
        finished: fin,
        typedPreview: preview,
      }).catch(() => {});
    },
    [code, updateProgress]
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!running || finishedRef.current) return;
      const k = e.key;
      if (k === "Tab" || k === "Escape") {
        e.preventDefault();
        return;
      }
      if (k.length !== 1) return;
      e.preventDefault();

      if (!startTimeRef.current) startTimeRef.current = Date.now();

      const nextTyped = typedRef.current + k.toLowerCase();
      typedRef.current = nextTyped;
      setTyped(nextTyped);

      let correct = 0;
      for (let i = 0; i < nextTyped.length; i++) {
        if (charsEqual(nextTyped[i], text[i])) correct++;
        else break;
      }

      // Standart formula: Net WPM = (to'g'ri belgilar / 5) / (o'tgan vaqt daqiqada).
      // Faqat TO'G'RI belgilar (correct) hisobga olinadi — xato harflar kirmaydi.
      // Ko'rsatkich FAQAT YUQORIGA boradi (teskari sanamaydi): pauza yoki sekin
      // yozishda WPM pasayib ketmaydi. Dastlabki 1 soniya vaqt sifatida olinadi
      // (calcNetWpm ichida) — absurd qiymat sakrab chiqmasligi uchun.
      const wpmV = nextLiveWpm(wpmRef.current, correct, Date.now() - startTimeRef.current!);
      wpmRef.current = wpmV;
      setWpm(wpmV);
      setAccuracy(Math.round((correct / nextTyped.length) * 100));

      const fin = nextTyped.length >= text.length;
      if (fin) {
        finishedRef.current = true;
        setFinished(true);
      }
      report(correct, nextTyped.length, wpmV, Math.round((correct / nextTyped.length) * 100), fin, nextTyped.slice(-80));
    },
    [running, text, report]
  );

  useEffect(() => {
    if (running) inputRef.current?.focus();
  }, [running, text]);

  // Yangi matn boshlanganda tozalash
  useEffect(() => {
    typedRef.current = "";
    setTyped("");
    startTimeRef.current = null;
    wpmRef.current = 0;
    finishedRef.current = false;
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
  }, [text]);

  // Rendered text: xato harflar qizil, cursor joyida
  const curStart = text.lastIndexOf(" ", typed.length) + 1;
  const nextSpace = text.indexOf(" ", typed.length);
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
    if (i < typed.length && !charsEqual(typed[i], text[i])) {
      cls = "relative text-red-400 bg-red-900/30 rounded err-char";
    } else if (i < typed.length) {
      cls = "relative text-white";
    } else if (wordHasError && i >= typed.length && i < curEnd) {
      cls = "relative text-red-400/70";
    }
    return (
      <span key={i} className={cls}>
        {i === typed.length && <span className="caret-bar" style={{ background: t.accent }} />}
        {ch}
      </span>
    );
  });

  return (
    <div className="w-full">
      {/* Local stats */}
      <div className="flex items-center justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">WPM</div>
          <div className="text-2xl font-bold" style={{ color: t.accent }}>
            {wpm}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">Accuracy</div>
          <div className="text-2xl font-bold text-white">{accuracy}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500">Progress</div>
          <div className="text-2xl font-bold text-white">
            {text.length ? Math.round((typed.length / text.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Text */}
      <div
        className="p-4 rounded-xl text-center select-none leading-relaxed tracking-wide text-lg md:text-xl"
        style={{
          background: t.surface,
          border: `1px solid ${t.accent}22`,
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {rendered}
        {finished && (
          <div className="mt-3 text-sm font-bold animate-bounce-in" style={{ color: t.accent }}>
            ✅ Finished!
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        className="absolute opacity-0 -z-10 w-px h-px"
        onKeyDown={handleKey}
        autoFocus
        readOnly={finished}
      />
    </div>
  );
}
