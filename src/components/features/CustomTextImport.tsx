"use client";

import { useState, useRef } from "react";
import type { ThemeColors } from "../../types";

interface SavedText {
  id: number;
  title: string;
  content: string;
  date: string;
}

interface CustomTextImportProps {
  t: ThemeColors;
  onClose: () => void;
  onImportText: (text: string) => void;
}

export default function CustomTextImport({ t, onClose, onImportText }: CustomTextImportProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [savedTexts, setSavedTexts] = useState<SavedText[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("typeuz_custom_texts") || "[]");
    } catch {
      return [];
    }
  });
  const [importMethod, setImportMethod] = useState<"type" | "file">("type");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveText = () => {
    if (!text.trim()) return;
    const newText: SavedText = {
      id: Date.now(),
      title: title.trim() || `Text #${savedTexts.length + 1}`,
      content: text.trim(),
      date: new Date().toISOString(),
    };
    const updated = [...savedTexts, newText];
    setSavedTexts(updated);
    localStorage.setItem("typeuz_custom_texts", JSON.stringify(updated));
    setText("");
    setTitle("");
  };

  const useText = (content: string) => {
    onImportText(content);
    onClose();
  };

  const deleteText = (id: number) => {
    const updated = savedTexts.filter((t) => t.id !== id);
    setSavedTexts(updated);
    localStorage.setItem("typeuz_custom_texts", JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setText(content.slice(0, 500));
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">📚 Custom Text</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {savedTexts.length} saved texts
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Import method tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "type" as const, label: "✏️ Type" },
          { id: "file" as const, label: "📁 File" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setImportMethod(m.id)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: importMethod === m.id ? t.accent + "22" : "transparent",
              color: importMethod === m.id ? t.accent : "#6b7280",
              border: `1px solid ${importMethod === m.id ? t.accent + "44" : "transparent"}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      {importMethod === "type" ? (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Text title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3"
            style={{
              background: t.surface,
              border: `1px solid transparent`,
              color: "#fff",
            }}
          />
          <textarea
            ref={textareaRef}
            placeholder="Paste or type your custom text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: t.surface,
              border: `1px solid ${text ? t.accent + "44" : "transparent"}`,
              color: "#fff",
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">{text.length} characters</span>
            <button
              onClick={saveText}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
              style={{ background: t.accent, color: "#000" }}
            >
              💾 Save Text
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-xl text-center transition-all hover:bg-white/5"
            style={{
              background: t.surface,
              border: `2px dashed ${t.accent}44`,
            }}
          >
            <div className="text-4xl mb-2">📁</div>
            <div className="text-sm text-gray-400">Click to upload a text file</div>
            <div className="text-xs text-gray-600 mt-1">Supports .txt, .md, .csv</div>
          </button>
          {text && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-2">Preview:</div>
              <div
                className="p-3 rounded-xl text-sm text-gray-300"
                style={{ background: t.surface }}
              >
                {text.slice(0, 200)}
                {text.length > 200 && "..."}
              </div>
              <button
                onClick={saveText}
                className="mt-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: t.accent, color: "#000" }}
              >
                💾 Save
              </button>
            </div>
          )}
        </div>
      )}

      {/* Saved texts */}
      {savedTexts.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Saved Texts</div>
          <div className="flex flex-col gap-2">
            {savedTexts.map((st) => (
              <div
                key={st.id}
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: t.surface, border: `1px solid ${t.accent}11` }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-white">{st.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{st.content.slice(0, 60)}...</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {st.content.length} chars · {new Date(st.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => useText(st.content)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105"
                    style={{ background: t.accent + "22", color: t.accent }}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => deleteText(st.id)}
                    className="px-3 py-1.5 rounded-lg text-xs hover:bg-white/5 text-gray-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
