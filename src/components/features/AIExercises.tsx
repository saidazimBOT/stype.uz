"use client";

import { useState } from "react";
import { FiCode, FiCpu, FiEdit3, FiHash, FiRefreshCw, FiZap } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ThemeColors } from "../../types";

const CATEGORIES: { id: string; icon: IconType; label: string; desc: string }[] = [
  { id: "punctuation", icon: FiEdit3, label: "Punctuation", desc: "Practice commas, quotes, and more" },
  { id: "numbers", icon: FiHash, label: "Numbers", desc: "Type numbers and symbols" },
  { id: "code", icon: FiCode, label: "Code", desc: "Practice coding syntax" },
  { id: "hard", icon: FiZap, label: "Hard Words", desc: "Long and complex words" },
  { id: "reverse", icon: FiRefreshCw, label: "Reverse Text", desc: "Type text backwards" },
];

const EXERCISE_TEMPLATES: Record<string, string[]> = {
  punctuation: [
    "Hello, world! How are you today? I'm doing great, thanks!",
    "She said, 'Come here,' but he didn't move. What happened next?",
    "The store has: apples, bananas, oranges, and grapes. Yum!",
    "Dear Sir, I am writing to inform you that... Sincerely, John.",
    "Wait! Don't go! I need to tell you something important!",
  ],
  numbers: [
    "My zip code is 10001 and my phone is 555-0123.",
    "The 3rd place winner scored 95.5 out of 100 points.",
    "In 2024, the population reached 8,123,456,789 people.",
    "I bought 2 apples for $1.50 each, totaling $3.00.",
    "Room 404 on the 12th floor has a great view of 5th Avenue.",
  ],
  code: [
    "function hello() { console.log('Hello, World!'); return true; }",
    'const users = [{id: 1, name: "John"}, {id: 2, name: "Jane"}];',
    "for (let i = 0; i < 10; i++) { if (i % 2 === 0) console.log(i); }",
    "import React, { useState, useEffect } from 'react';",
    "const doubleAll = arr => arr.map(n => n * 2).filter(n => n > 10);",
  ],
  hard: [
    "Extraordinary circumstances require exceptional measures and unwavering determination to succeed against all odds.",
    "The pharmaceutical industry's groundbreaking research has revolutionized modern medicine and saved millions of lives worldwide.",
    "Incomprehensible as it may seem, the archaeological discovery fundamentally transformed our understanding of ancient civilizations.",
    "Simultaneously, the meteorological phenomenon created unprecedented atmospheric conditions across the entire hemisphere.",
  ],
  reverse: [
    ".stay gnidaer rof yrros ma I ,olleh",
    "!namuh saw ti esuaceb epoh tsum ew",
    ".dnik siht fo lufplep yllautca si tahw",
    "!deificeps era skraep sih taht osla nac uoy",
  ],
};

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "#22c55e" },
  { id: "medium", label: "Medium", color: "#f59e0b" },
  { id: "hard", label: "Hard", color: "#ef4444" },
];

interface AIExercisesProps {
  t: ThemeColors;
  onClose: () => void;
  onSelectText: (text: string) => void;
}

export default function AIExercises({ t, onClose, onSelectText }: AIExercisesProps) {
  const [category, setCategory] = useState("punctuation");
  const [difficulty, setDifficulty] = useState("medium");

  const generateExercise = () => {
    const pool = EXERCISE_TEMPLATES[category] || EXERCISE_TEMPLATES.punctuation;
    const texts = difficulty === "easy" ? pool.slice(0, 2) :
      difficulty === "hard" ? pool.slice(-2) : pool;
    const text = texts[Math.floor(Math.random() * texts.length)];
    onSelectText(text);
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiCpu />
            AI Exercises
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Practice specific skills</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Difficulty selector */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Difficulty</div>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: difficulty === d.id ? d.color + "22" : "transparent",
                color: difficulty === d.id ? d.color : "#6b7280",
                border: `1px solid ${difficulty === d.id ? d.color + "44" : "#ffffff0a"}`,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category selector */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Focus Area</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: category === c.id ? t.accent + "22" : t.surface,
                border: `1px solid ${category === c.id ? t.accent + "44" : "transparent"}`,
              }}
            >
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
      <button
        onClick={generateExercise}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        style={{ background: t.accent, color: "#000" }}
      >
        <FiCpu size={16} />
        Generate Exercise
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        Click generate to create a custom exercise and start typing!
      </p>
    </div>
  );
}
