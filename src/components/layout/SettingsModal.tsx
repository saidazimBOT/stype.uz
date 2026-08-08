"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FiGlobe, FiImage, FiMonitor, FiSettings, FiUpload, FiVolume2, FiX, FiZap } from "react-icons/fi";
import { FaHandPointer, FaKeyboard, FaPalette } from "react-icons/fa6";
import { THEME_LIST, THEME_GROUPS } from "../../data/themes";
import { LANG_LABELS, LANG_FLAGS, LANG_GROUPS } from "../../data/texts";
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
  fingerGuide: boolean;
  setFingerGuide: (show: boolean) => void;
  bgImage: string;
  setBgImage: (img: string) => void;
  bgDim: number;
  setBgDim: (dim: number) => void;
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
  fingerGuide,
  setFingerGuide,
  bgImage,
  setBgImage,
  bgDim,
  setBgDim,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("themes");
  const [bgUploading, setBgUploading] = useState(false);

  const handleBgUpload = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBgUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setBgImage(dataUrl);
    } catch {
      // Yuklash xatosi — hech narsa qilmaymiz
    } finally {
      setBgUploading(false);
    }
  };

  const tabs: { id: string; label: ReactNode }[] = [
    { id: "themes", label: (<><FaPalette className="inline-block mr-1" /> Themes</>) },
    { id: "background", label: (<><FiImage className="inline-block mr-1" /> Background</>) },
    { id: "language", label: (<><FiGlobe className="inline-block mr-1" /> Language</>) },
    { id: "display", label: (<><FiMonitor className="inline-block mr-1" /> Display</>) },
  ];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiSettings />
          Settings
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
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
                    <span className="mr-1.5 inline-block">{LANG_FLAGS[code] || "🏳️"}</span>
                    {LANG_LABELS[code] || code}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Background Tab */}
      {activeTab === "background" && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            Background Image
          </div>

          {/* Preview */}
          <div
            className="w-full h-40 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center border"
            style={{
              background: bgImage
                ? `linear-gradient(rgba(8, 10, 15, ${bgDim}), rgba(8, 10, 15, ${bgDim})), url("${bgImage}") center / cover no-repeat`
                : t.surface,
              borderColor: bgImage ? "transparent" : "#ffffff14",
            }}
          >
            {!bgImage && (
              <span className="text-xs text-gray-500">
                No custom background — theme colors are used
              </span>
            )}
          </div>

          {/* Upload */}
          <label
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: t.accent, color: "#000" }}
          >
            {bgUploading ? (
              "Processing…"
            ) : (
              <>
                <FiUpload size={15} />
                Upload background image
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={bgUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBgUpload(f);
                e.target.value = "";
              }}
            />
          </label>

          {bgImage && (
            <button
              onClick={() => setBgImage("")}
              className="mt-2 w-full py-2 rounded-xl text-sm transition-all hover:bg-white/5 text-red-400"
            >
              <FiX size={14} className="inline-block mr-1" />
              Remove background
            </button>
          )}

          {/* Dim control */}
          <div
            className={`mt-6 p-4 rounded-xl transition-opacity ${bgImage ? "" : "opacity-50"}`}
            style={{ background: t.surface }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-white flex items-center gap-1.5">
                <FiImage size={14} className="text-gray-400" />
                Darken
              </div>
              <span className="text-xs text-gray-500">{Math.round(bgDim * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={bgDim}
              onChange={(e) => setBgDim(parseFloat(e.target.value))}
              disabled={!bgImage}
              className="w-full"
              style={{ accentColor: t.accent, cursor: bgImage ? "pointer" : "not-allowed" }}
            />
            <p className="text-xs text-gray-600 mt-2">
              Darken the background so text stays readable.
            </p>
          </div>
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
                <div className="text-sm text-white flex items-center gap-1.5">
                  <FiVolume2 size={14} className="text-gray-400" />
                  Keyboard Sounds
                </div>
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
                <div className="text-sm text-white flex items-center gap-1.5">
                  <FaKeyboard size={14} className="text-gray-400" />
                  Keyboard Visualizer
                </div>
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
                <div className="text-sm text-white flex items-center gap-1.5">
                  <FiZap size={14} className="text-gray-400" />
                  Key Heatmap
                </div>
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

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: t.surface }}>
              <div>
                <div className="text-sm text-white flex items-center gap-1.5">
                  <FaHandPointer size={14} className="text-gray-400" />
                  Finger Guide
                </div>
                <div className="text-xs text-gray-500">Color-code keys by finger + highlight the next key</div>
              </div>
              <button
                onClick={() => setFingerGuide(!fingerGuide)}
                className={`w-12 h-6 rounded-full transition-all relative`}
                style={{ background: fingerGuide ? t.accent : "#4b5563" }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    fingerGuide ? "left-[26px]" : "left-[2px]"
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

// Rasmni localStorage'ga sig'dirish uchun kichraytirib siqib olamiz
function compressImage(file: File, maxWidth = 1600, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
