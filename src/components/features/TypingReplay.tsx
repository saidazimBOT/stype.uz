import { useState, useRef, useCallback, useEffect } from "react";
import { FiPlay, FiVideo } from "react-icons/fi";
import type { ReplayRecording, ReplayEvent, ThemeColors } from "../../types";
import { isSupabaseConfigured } from "../../lib/supabase";
import { getMyReplays, saveReplay } from "../../lib/db";

interface ReplayReturn {
  recordings: ReplayRecording[];
  startRecording: (text: string) => void;
  recordEvent: (event: ReplayEvent) => void;
  stopRecording: (wpm: number, accuracy: number) => ReplayRecording | null;
  setRecordings: React.Dispatch<React.SetStateAction<ReplayRecording[]>>;
}

export function useReplay(): ReplayReturn {
  const [recordings, setRecordings] = useState<ReplayRecording[]>([]);
  const loadedRef = useRef(false);
  const currentReplay = useRef<ReplayRecording | null>(null);

  // Supabase'dan yuklash
  useEffect(() => {
    if (!isSupabaseConfigured() || loadedRef.current) return;
    (async () => {
      try {
        const data = await getMyReplays(20);
        const mapped: ReplayRecording[] = data.map((r) => ({
          id: r.id,
          text: r.text,
          events: r.events as ReplayEvent[],
          startTime: r.created_at,
          wpm: r.wpm,
          accuracy: r.accuracy,
          date: new Date(r.created_at).toISOString(),
        }));
        setRecordings(mapped);
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  const startRecording = useCallback((text: string) => {
    currentReplay.current = {
      text,
      events: [],
      startTime: Date.now(),
      wpm: 0,
      accuracy: 100,
      date: new Date().toISOString(),
    };
  }, []);

  const recordEvent = useCallback((event: ReplayEvent) => {
    if (!currentReplay.current) return;
    currentReplay.current.events.push({
      ...event,
      time: Date.now() - currentReplay.current.startTime,
    });
  }, []);

  const stopRecording = useCallback(
    (wpm: number, accuracy: number): ReplayRecording | null => {
      if (!currentReplay.current) return null;
      const replay: ReplayRecording = {
        ...currentReplay.current,
        wpm,
        accuracy,
        id: Date.now(),
      };
      setRecordings((prev) => [replay, ...prev.slice(0, 19)]);
      // Supabase'ga saqlash
      saveReplay({
        text: replay.text,
        events: replay.events as unknown[],
        wpm: replay.wpm,
        accuracy: replay.accuracy,
      }).catch(() => {});
      currentReplay.current = null;
      return replay;
    },
    []
  );

  return { recordings, startRecording, recordEvent, stopRecording, setRecordings };
}

interface TypingReplayViewProps {
  recordings: ReplayRecording[];
  t: ThemeColors;
  onClose: () => void;
}

export default function TypingReplayView({ recordings, t, onClose }: TypingReplayViewProps) {
  const [playing, setPlaying] = useState<ReplayRecording | null>(null);
  const [playState, setPlayState] = useState({ current: 0, eventIdx: 0, display: "" });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const playReplay = useCallback(
    (recording: ReplayRecording) => {
      setPlaying(recording);
      setPlayState({ current: 0, eventIdx: 0, display: "" });
      startRef.current = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startRef.current;
        const events = recording.events.filter((e) => e.time <= elapsed);
        const typedText = events.filter((e) => e.type === "keydown").map((e) => e.key).join("");
        setPlayState({ current: typedText.length, eventIdx: events.length, display: typedText });
        if (events.length < recording.events.length) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const stopReplay = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(null);
  };

  if (playing) {
    const accuracy = Math.round(
      (playing.text.split("").slice(0, playState.display?.length || 0).filter((ch, i) => ch === (playState.display || "")[i]).length / Math.max(1, playState.display?.length || 1)) * 100
    );
    return (
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FiVideo /> Replay</h2>
          <button onClick={stopReplay} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">← Stop</button>
        </div>
        <div className="flex gap-4 mb-6">
          <div className="text-center p-3 rounded-xl flex-1" style={{ background: t.surface }}>
            <div className="text-xs text-gray-500">WPM</div>
            <div className="text-xl font-bold" style={{ color: t.accent }}>{playing.wpm}</div>
          </div>
          <div className="text-center p-3 rounded-xl flex-1" style={{ background: t.surface }}>
            <div className="text-xs text-gray-500">Accuracy</div>
            <div className="text-xl font-bold text-white">{accuracy}%</div>
          </div>
        </div>
        <div className="p-5 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <div className="leading-relaxed tracking-wide text-center select-none">
            {playing.text.split("").map((ch, i) => {
              const typed = (playState.display || "")[i];
              let cls = "text-gray-600";
              if (typed) cls = typed === ch ? "text-white" : "text-red-400 bg-red-900/30 rounded";
              if (i === (playState.display?.length || 0)) {
                return <span key={i} className={cls} style={{ color: t.accent, textDecoration: "underline" }}>{ch}</span>;
              }
              return <span key={i} className={cls}>{ch}</span>;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FiVideo /> Typing Replay</h2>
          <p className="text-sm text-gray-500 mt-0.5">{recordings.length} recordings saved</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">← Back</button>
      </div>
      {recordings.length === 0 ? (
        <div className="text-center text-gray-600 py-16">
          <FiVideo size={48} className="mx-auto mb-3" />
          <div>No recordings yet. Complete a test to save a replay!</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recordings.map((r, i) => (
            <div key={r.id || i} className="p-4 rounded-xl flex items-center justify-between" style={{ background: t.surface, border: `1px solid ${t.accent}11` }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{r.wpm} WPM</span>
                  <span className="text-xs text-gray-500">{r.accuracy}%</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">{r.events.length} events</span>
                </div>
                <div className="text-xs text-gray-600">{new Date(r.date).toLocaleDateString()} · {r.text.slice(0, 40)}...</div>
              </div>
              <button onClick={() => playReplay(r)} className="px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 flex items-center gap-1.5" style={{ background: t.accent + "22", color: t.accent }}>
                <FiPlay size={14} /> Play
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
