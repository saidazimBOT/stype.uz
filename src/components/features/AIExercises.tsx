"use client";

import { useState } from "react";
import { FiCode, FiCpu, FiEdit3, FiHash, FiRefreshCw, FiZap } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ThemeColors } from "../../types";

const CATEGORIES: { id: string; icon: IconType; label: string; desc: string }[] = [
  { id: "punctuation", icon: FiEdit3, label: "Punctuation", desc: "Commas, quotes, and more" },
  { id: "numbers", icon: FiHash, label: "Numbers", desc: "Numbers and symbols" },
  { id: "code", icon: FiCode, label: "Code", desc: "Coding syntax" },
  { id: "hard", icon: FiZap, label: "Hard Words", desc: "Long complex words" },
  { id: "reverse", icon: FiRefreshCw, label: "Reverse", desc: "Text backwards" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "#22c55e" },
  { id: "medium", label: "Medium", color: "#f59e0b" },
  { id: "hard", label: "Hard", color: "#ef4444" },
];

// Fallback templates — API ishlamasa
const FALLBACK: Record<string, string[]> = {
  punctuation: [
    "hello, world! how are you today? i'm doing great, thanks!",
    "she said, 'come here,' but he didn't move. what happened next?",
    "the store has: apples, bananas, oranges, and grapes. yum!",
  ],
  numbers: [
    "my zip code is 10001 and my phone is 555-0123.",
    "the 3rd place winner scored 95.5 out of 100 points.",
    "in 2024, the population reached 8,123,456,789 people.",
  ],
  code: [
    "function hello() { console.log('hello, world!'); return true; }",
    "const users = [{id: 1, name: 'john'}, {id: 2, name: 'jane'}];",
    "for (let i = 0; i < 10; i++) { if (i % 2 === 0) console.log(i); }",
  ],
  hard: [
    "extraordinary circumstances require exceptional measures and unwavering determination to succeed against all odds.",
    "the pharmaceutical industry's groundbreaking research has revolutionized modern medicine and saved millions of lives worldwide.",
  ],
  reverse: [
    ".stay gnidaer rof yrros ma i ,olleh",
    "!namuh saw ti esuaceb epoh tsum ew",
  ],
};

interface AIExercisesProps {
  t: ThemeColors;
  onClose: () => void;
  onSelectText: (text: string) => void;
  lang?: string;
}

export default function AIExercises({ t, onClose, onSelectText, lang }: AIExercisesProps) {
  const [category, setCategory] = useState("punctuation");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState("");

  const generateExercise = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty, lang: lang || "english" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setLastGenerated(data.text);
          onSelectText(data.text);
          return;
        }
      }
    } catch {
      // API ishlamayapti — fallback ishlatamiz
    }
    // Fallback
    const pool = FALLBACK[category] || FALLBACK.punctuation;
    const text = pool[Math.floor(Math.random() * pool.length)];
    setLastGenerated(text);
    onSelectText(text);
    setGenerating(false);
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiCpu />
            AI Exercises
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {generating ? "Generating with AI..." : "AI-powered typing practice"}
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Difficulty */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Difficulty</div>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d.id} onClick={() => setDifficulty(d.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: difficulty === d.id ? d.color + "22" : "transparent", color: difficulty === d.id ? d.color : "#6b7280", border: `1px solid ${difficulty === d.id ? d.color + "44" : "#ffffff0a"}` }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Focus Area</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{ background: category === c.id ? t.accent + "22" : t.surface, border: `1px solid ${category === c.id ? t.accent + "44" : "transparent"}` }}>
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={18} style={{ color: t.accent }} />
                <span className="text-sm font-medium text-white">{c.label}</span>
              </div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button onClick={() => void generateExercise()} disabled={generating}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: t.accent, color: "#000" }}>
        {generating ? (
          <><span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Generating...</>
        ) : (
          <><FiCpu size={16} /> Generate Exercise</>
        )}
      </button>

      {lastGenerated && (
        <div className="mt-4 p-3 rounded-xl text-xs text-gray-400" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <span className="text-gray-600">Generated:</span> {lastGenerated.slice(0, 80)}...
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-3">
        Click generate to create a custom exercise with AI!
      </p>
    </div>
  );
}
