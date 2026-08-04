"use client";

import {
  FiBookOpen, FiCpu, FiGlobe, FiHeart, FiInfo, FiList, FiMoon, FiSend,
  FiSmartphone, FiStar, FiTarget, FiTrendingUp, FiUsers, FiVideo, FiVolume2, FiZap,
} from "react-icons/fi";
import { FaGamepad, FaKeyboard, FaPalette, FaTrophy } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ThemeColors, TestResult } from "../../types";
import AppLogo from "../AppLogo";
import CreatorProfile from "../features/CreatorProfile";

interface AboutViewProps {
  t: ThemeColors;
  onClose: () => void;
  history?: TestResult[];
}

export default function AboutView({ t, onClose, history }: AboutViewProps) {
  const features: [IconType, string][] = [
    [FiZap, "Real-time WPM & accuracy"],
    [FiGlobe, "20+ languages: UZ / RU / EN / DE / FR..."],
    [FaPalette, "25+ premium themes + VS Code themes"],
    [FiVolume2, "Keyboard sounds with audio feedback"],
    [FaTrophy, "Global & Country leaderboards"],
    [FaGamepad, "3 mini games (Snake, Tetris, Flappy)"],
    [FiList, "Test history & progress tracking"],
    [FiZap, "Combo streak & XP system"],
    [FiSend, "Multiplayer typing race mode"],
    [FiUsers, "Friend system & chat"],
    [FiTarget, "Weekly missions & challenges"],
    [FiZap, "Daily login rewards"],
    [FiTrendingUp, "Progress dashboard with charts"],
    [FiSmartphone, "PWA - install like a native app"],
    [FiMoon, "Auto Dark/Light Mode"],
    [FiVideo, "Typing replay system"],
    [FiCpu, "AI-generated exercises"],
    [FiBookOpen, "Custom text import"],
    [FaKeyboard, "Keyboard visualizer"],
  ];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiInfo />
          About STypeUz
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Creator studio scene */}
      <div className="mb-6">
        <CreatorProfile t={t} history={history} />
      </div>

      {/* Brand card */}
      <div
        className="flex items-center gap-4 p-5 rounded-2xl mb-6"
        style={{
          background: t.surface,
          border: `1px solid ${t.accent}33`,
        }}
      >
        <AppLogo size={56} animate="spin" />
        <div>
          <div className="text-xl font-bold text-white">STypeUz</div>
          <div className="text-sm text-gray-400 flex items-center gap-1.5">
            v3.0 · Made with <FiHeart size={13} className="text-red-400" /> for Uzbekistan
          </div>
          <div className="text-xs mt-1" style={{ color: t.accent }}>
            Fast. Beautiful. Yours.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: "20+", label: "Languages", icon: FiGlobe },
          { value: "25+", label: "Themes", icon: FaPalette },
          { value: "18", label: "Features", icon: FiStar },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl text-center"
            style={{ background: t.surface }}
          >
            <s.icon size={20} className="mx-auto mb-1" style={{ color: t.accent }} />
            <div className="text-xl font-bold" style={{ color: t.accent }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          All Features
        </div>
        <div className="grid grid-cols-2 gap-2">
          {features.map(([Icon, text]) => (
            <div
              key={text}
              className="flex items-center gap-2 p-2.5 rounded-lg text-sm text-gray-300"
              style={{ background: "#ffffff05" }}
            >
              <Icon size={15} className="flex-shrink-0" style={{ color: t.accent }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          Keyboard Shortcuts
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            ["Tab", "New random text"],
            ["Tab + Enter", "Restart current text"],
            ["Esc", "Close current view"],
            ["Ctrl + K", "Toggle keyboard visualizer"],
            ["Ctrl + M", "Toggle sound"],
          ].map(([key, desc]) => (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: t.surface }}
            >
              <span className="text-gray-400 text-sm">{desc}</span>
              <kbd
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: t.accent + "22", color: t.accent }}
              >
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Social / Footer */}
      <div className="mt-8 text-center text-xs text-gray-600">
        Built with Next.js + TypeScript + Tailwind CSS<br />
        © 2025 STypeUz. All rights reserved.
      </div>
    </div>
  );
}
