"use client";

import { useState } from "react";
import { FiEdit3, FiPlay } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ThemeColors } from "../../types";
import { getT } from "../../data/i18n";

// ── MASHQ (PRACTICE) DATA ──────────────────────────────────────────────
// Yozishni endi o'rganayotganlar uchun oddiy harf mashqlari.
// Har bir karta — bitta mashq: bosilganda asosiy yozish rejimida shu matn
// ochiladi va foydalanuvchi katta-katta harflar bilan yozishni mashq qiladi.

interface MashqLevel {
  id: string;
  icon: IconType;
  titleKey: string;
  descKey: string;
  color: string;
  texts: string[];
}

const LEVELS: MashqLevel[] = [
  {
    id: "letters",
    icon: FiEdit3,
    titleKey: "mashq.level1",
    descKey: "mashq.level1Desc",
    color: "#22c55e",
    texts: [
      "aaa sss ddd fff jjj kkk lll",
      "qqq www eee rrr ttt yyy",
      "zzz xxx ccc vvv bbb nnn mmm",
      "fff jjj ddd kkk sss lll",
    ],
  },
  {
    id: "pairs",
    icon: FiEdit3,
    titleKey: "mashq.level2",
    descKey: "mashq.level2Desc",
    color: "#38bdf8",
    texts: [
      "jjjfff gggttt aaabbb",
      "aaasss dddfff gggjjj kkklll",
      "qqqwww eeeerrr ttttyyyy",
      "fffgghh jjjkkk lllmmm",
    ],
  },
  {
    id: "chains",
    icon: FiEdit3,
    titleKey: "mashq.level3",
    descKey: "mashq.level3Desc",
    color: "#a78bfa",
    texts: [
      "aaa sss ddd fff ggg hhh jjj kkk lll",
      "qqq www eee rrr ttt yyy uuu iii ooo ppp",
      "zzz xxx ccc vvv bbb nnn mmm zzz",
      "abcabc abcabc abcabc abcabc",
    ],
  },
  {
    id: "words",
    icon: FiEdit3,
    titleKey: "mashq.level4",
    descKey: "mashq.level4Desc",
    color: "#f59e0b",
    texts: [
      "salom dunyo men sen u",
      "ota ona aka uka opa",
      "kitob daftar qalam ruchka",
      "yaxshi kun bugun quyosh",
    ],
  },
];

interface MashqViewProps {
  t: ThemeColors;
  lang: string;
  onClose: () => void;
  onSelectText: (text: string) => void;
}

export default function MashqView({ t, lang, onClose, onSelectText }: MashqViewProps) {
  const T = getT(lang);

  const startPractice = (text: string) => {
    onSelectText(text);
    onClose();
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiEdit3 style={{ color: t.accent }} />
            {T("mashq.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{T("mashq.subtitle")}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400"
        >
          {T("mashq.back")}
        </button>
      </div>

      {/* Levels */}
      <div className="flex flex-col gap-4">
        {LEVELS.map((level) => (
          <div key={level.id}>
            <div className="flex items-center gap-2 mb-2">
              <level.icon size={16} style={{ color: level.color }} />
              <div>
                <div className="text-sm font-semibold text-white">{T(level.titleKey)}</div>
                <div className="text-xs text-gray-500">{T(level.descKey)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {level.texts.map((txt) => (
                <button
                  key={txt}
                  onClick={() => startPractice(txt)}
                  className="p-3.5 rounded-xl text-left transition-all hover:scale-[1.01] flex items-center justify-between gap-3"
                  style={{
                    background: t.surface,
                    border: `1px solid ${level.color}22`,
                  }}
                >
                  <span
                    className="font-mono text-sm sm:text-base tracking-wide"
                    style={{ color: "#e5e7eb" }}
                  >
                    {txt}
                  </span>
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
                    style={{ background: level.color + "22", color: level.color }}
                  >
                    <FiPlay size={11} />
                    {T("mashq.start")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 text-center mt-6">{T("mashq.hint")}</p>
    </div>
  );
}
