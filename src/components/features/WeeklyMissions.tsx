import { useState, useEffect, useCallback, useRef } from "react";
import { FiCheckCircle, FiTarget } from "react-icons/fi";
import { MISSIONS } from "../../data/missions";
import type { ActiveMission, ThemeColors } from "../../types";
import { isSupabaseConfigured } from "../../lib/supabase";
import { getMyMissions, saveMyMissions } from "../../lib/db";

interface MissionsReturn {
  missions: ActiveMission[];
  xp: number;
  updateProgress: (type: string, value: number) => void;
  addXp: (amount: number) => void;
  setMissions: React.Dispatch<React.SetStateAction<ActiveMission[]>>;
}

export function useMissions(): MissionsReturn {
  const [missions, setMissions] = useState<ActiveMission[]>(
    MISSIONS.map((m) => ({ ...m, progress: 0, completed: false }))
  );
  const [xp, setXp] = useState<number>(0);
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Supabase'dan yuklash
  useEffect(() => {
    if (!isSupabaseConfigured() || loadedRef.current) return;
    (async () => {
      try {
        const data = await getMyMissions();
        if (data.missions.length > 0) {
          setMissions(data.missions as ActiveMission[]);
        }
        setXp(data.xp);
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  // Supabase'ga saqlash — debounce
  useEffect(() => {
    if (!loadedRef.current || !isSupabaseConfigured()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMyMissions(missions as unknown[], xp).catch(() => {});
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [missions, xp]);

  const updateProgress = useCallback((type: string, value: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.completed || m.type !== type) return m;
        const newProgress = Math.min(m.goal, m.progress + value);
        if (newProgress >= m.goal) {
          setXp((x) => x + m.reward.xp);
          return { ...m, progress: m.goal, completed: true };
        }
        return { ...m, progress: newProgress };
      })
    );
  }, []);

  const addXp = useCallback((amount: number) => setXp((x) => x + amount), []);

  return { missions, xp, updateProgress, addXp, setMissions };
}

interface WeeklyMissionsViewProps {
  missions: ActiveMission[];
  xp: number;
  t: ThemeColors;
  onClose: () => void;
}

export default function WeeklyMissionsView({ missions, xp, t, onClose }: WeeklyMissionsViewProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filtered = missions.filter((m) => {
    if (filter === "completed") return m.completed;
    if (filter === "active") return !m.completed;
    return true;
  });

  const completed = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiTarget />
            Missions
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Complete challenges to earn badges and XP</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">← Back</button>
      </div>

      <div className="p-5 rounded-2xl mb-6" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Total XP</div>
            <div className="text-2xl font-bold" style={{ color: t.accent }}>{xp.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-widest">Progress</div>
            <div className="text-2xl font-bold text-white">{completed}/{total}</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: t.accent }} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[{ id: "all" as const, label: "All" }, { id: "active" as const, label: "Active" }, { id: "completed" as const, label: "Completed" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{ background: filter === f.id ? t.accent + "22" : "transparent", color: filter === f.id ? t.accent : "#6b7280", border: `1px solid ${filter === f.id ? t.accent + "44" : "transparent"}` }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((m) => (
          <div key={m.id} className="p-4 rounded-xl flex items-center gap-4 transition-all"
            style={{ background: m.completed ? t.surface : "#ffffff05", border: `1px solid ${m.completed ? t.accent + "33" : "#ffffff0a"}` }}>
            <div className="w-10 text-center flex justify-center flex-shrink-0"><m.icon size={22} /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{m.title}</span>
                {m.completed && <span className="text-xs flex items-center gap-1" style={{ color: t.accent }}><FiCheckCircle size={12} /> Done</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (m.progress / m.goal) * 100)}%`, background: m.completed ? t.accent : "#6b7280" }} />
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">{m.progress}/{m.goal} · +{m.reward.xp} XP</div>
            </div>
            {m.reward.badge && <m.reward.badge size={20} className="opacity-60 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
