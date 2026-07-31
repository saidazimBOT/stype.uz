"use client";

import { useState } from "react";
import { THEME_LIST, THEME_GROUPS } from "../../data/themes";
import { LANG_LABELS, LANG_GROUPS } from "../../data/texts";
import type { ThemeColors } from "../../types";

interface SettingsModalProps {
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
  onClose: () => void;
}

export default function SettingsModal({
  t,
  theme,
  setTheme,
  lang,
  setLang,
  fontSize,
  setFontSize,
  soundEnabled,
  setSoundEnabled,
  showKeyboard,
  setShowKeyboard,
  showHeatmap,
  setShowHeatmap,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("themes");

  const tabs = [
    { id: "themes", label: "🎨 Themes" },
    { id: "language", label: "🌐 Language" },
    { id: "display", label: "🖥️ Display" },
  ];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">⚙️ Settings</h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: activeTab === tab.id ? t.accent + "22" : "transparent",
              color: activeTab === tab.id ? t.accent : "#6b7280",
              border: `1px solid ${activeTab === tab.id ? t.accent + "44" : "transparent"}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Themes Tab */}
      {activeTab === "themes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-white">
                {THEME_LIST.find((th) => th.id === theme)?.name || "Select Theme"}
              </div>
              <div className="text-xs text-gray-500">{THEME_LIST.length} themes available</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("default")}
                className="px-3 py-1 rounded-lg text-xs hover:bg-white/5 text-gray-500"
              >
                Reset
              </button>
            </div>
          </div>

          {THEME_GROUPS.map((group) => (
            <div key={group.name} className="mb-5">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                {group.name}
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {group.themes.map((themeId) => {
                  const themeData = THEME_LIST.find((t) => t.id === themeId);
                  if (!themeData) return null;
                  const isActive = theme === themeId;
                  return (
                    <button
                      key={themeId}
                      onClick={() => setTheme(themeId)}
                      className="p-2 rounded-lg text-center transition-all hover:scale-105 relative"
                      style={{
                        background: themeData.bg,
                        border: `2px solid ${isActive ? themeData.accent : "transparent"}`,
                      }}
                    >
                      <div
                        className="w-full h-6 rounded-md mb-1"
                        style={{
                          background: `linear-gradient(135deg, ${themeData.accent}, ${themeData.surface})`,
                        }}
                      />
                      <div
                        className="text-[10px] truncate"
                        style={{ color: themeData.color || "#9ca3af" }}
                      >
                        {themeData.name}
                      </div>
                      {isActive && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                          style={{ background: themeData.accent }}
                        >
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Language Tab */}
      {activeTab === "language" && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            Typing Language
          </div>

          {LANG_GROUPS.map((group) => (
            <div key={group.name} className="mb-4">
              <div className="text-xs text-gray-600 mb-2">{group.name}</div>
              <div className="flex flex-wrap gap-2">
                {group.langs.map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      background: lang === code ? t.accent + "22" : t.surface,
                      color: lang === code ? t.accent : "#9ca3af",
                      border: `1px solid ${lang === code ? t.accent + "44" : "transparent"}`,
                    }}
                  >
                    {LANG_LABELS[code] || code}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display Tab */}
      {activeTab === "display" && (
        <div>
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Font Size</div>
            <div className="flex gap-2">
              {[
                { id: "sm", label: "Small" },
                { id: "md", label: "Medium" },
                { id: "lg", label: "Large" },
                { id: "xl", label: "XL" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  className="flex-1 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: fontSize === f.id ? t.accent + "22" : "transparent",
                    color: fontSize === f.id ? t.accent : "#6b7280",
                    border: `1px solid ${fontSize === f.id ? t.accent + "44" : "transparent"}`,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.surface }}>
              <div>
                <div className="text-sm text-white">🔊 Keyboard Sounds</div>
                <div className="text-xs text-gray-500">Play click sounds when typing</div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative`}
                style={{ background: soundEnabled ? t.accent : "#4b5563" }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    soundEnabled ? "left-[26px]" : "left-[2px]"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.surface }}>
              <div>
                <div className="text-sm text-white">⌨️ Keyboard Visualizer</div>
                <div className="text-xs text-gray-500">Show virtual keyboard</div>
              </div>
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className={`w-12 h-6 rounded-full transition-all relative`}
                style={{ background: showKeyboard ? t.accent : "#4b5563" }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    showKeyboard ? "left-[26px]" : "left-[2px]"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.surface }}>
              <div>
                <div className="text-sm text-white">🔥 Key Heatmap</div>
                <div className="text-xs text-gray-500">Show most used keys in color</div>
              </div>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`w-12 h-6 rounded-full transition-all relative`}
                style={{ background: showHeatmap ? t.accent : "#4b5563" }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    showHeatmap ? "left-[26px]" : "left-[2px]"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
