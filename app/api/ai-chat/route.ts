import { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// ── Supabase client yaratish ───────────────────────────────────────────
function getAnonClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Token bilan autentifikatsiyalangan client (shaxsiy ma'lumot uchun)
function getAuthClient(token: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !token) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// UMUMIY (anon) TOOLS — hamma foydalanishi mumkin
// ═══════════════════════════════════════════════════════════════════════

async function toolCountUsers() {
  const sb = getAnonClient();
  if (!sb) return { error: "Supabase not configured" };
  const { count, error } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) return { error: error.message };
  return { total_users: count ?? 0 };
}

async function toolGetTopUsers(limit: number = 10) {
  const sb = getAnonClient();
  if (!sb) return { error: "Supabase not configured" };
  const n = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await sb
    .from("profiles")
    .select("username, first_name, last_name, coins, xp, best_wpm, wins, losses, draws, races")
    .order("xp", { ascending: false })
    .limit(n);
  if (error) return { error: error.message };
  return { users: data ?? [] };
}

async function toolGetTopTypers(limit: number = 10) {
  const sb = getAnonClient();
  if (!sb) return { error: "Supabase not configured" };
  const n = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await sb
    .from("profiles")
    .select("username, first_name, last_name, best_wpm, races, wins")
    .not("best_wpm", "is", null)
    .order("best_wpm", { ascending: false })
    .limit(n);
  if (error) return { error: error.message };
  return { top_typers: data ?? [] };
}

async function toolGetAnnouncements() {
  const sb = getAnonClient();
  if (!sb) return { error: "Supabase not configured" };
  const { data, error } = await sb
    .from("announcements")
    .select("title, body, enabled, created_at")
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return { error: error.message };
  return { announcements: data ?? [] };
}

async function toolGetSiteStats() {
  const sb = getAnonClient();
  if (!sb) return { error: "Supabase not configured" };

  const [usersRes, resultsRes, textsRes, settingsRes] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("typing_results").select("*", { count: "exact", head: true }),
    sb.from("typing_texts").select("*", { count: "exact", head: true }),
    sb.from("site_settings").select("site_name, maintenance_mode, registration_open, announcements_enabled").limit(1).maybeSingle(),
  ]);

  return {
    total_users: usersRes.count ?? 0,
    total_typing_results: resultsRes.count ?? 0,
    total_typing_texts: textsRes.count ?? 0,
    site_settings: settingsRes.data ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// SHAXSIY TOOLS — faqat tizimga kirgan foydalanuvchi uchun
// ═══════════════════════════════════════════════════════════════════════

async function toolGetMyProfile(sb: SupabaseClient) {
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { error: "Tizimga kirilmagan" };
  const { data, error } = await sb
    .from("profiles")
    .select("username, first_name, last_name, email, coins, xp, wins, losses, draws, races, best_wpm, role, status, created_at, last_login")
    .eq("id", userRes.user.id)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Profil topilmadi" };
  return { profile: data };
}

async function toolGetMyResults(sb: SupabaseClient, limit: number = 10) {
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { error: "Tizimga kirilmagan" };
  const n = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await sb
    .from("typing_results")
    .select("wpm, accuracy, errors, correct, total, lang, duration, created_at")
    .eq("user_id", userRes.user.id)
    .order("created_at", { ascending: false })
    .limit(n);
  if (error) return { error: error.message };
  return { results: data ?? [] };
}

async function toolGetMyAchievements(sb: SupabaseClient) {
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { error: "Tizimga kirilmagan" };

  const [achRes, userAchRes] = await Promise.all([
    sb.from("achievements").select("key, title, description, icon, color, req_type, req_goal, xp_reward, coin_reward"),
    sb.from("user_achievements").select("achievement_key, unlocked_at").eq("user_id", userRes.user.id),
  ]);

  if (achRes.error) return { error: achRes.error.message };
  if (userAchRes.error) return { error: userAchRes.error.message };

  const unlocked = new Set(userAchRes.data?.map((a) => a.achievement_key) ?? []);

  return {
    unlocked_count: userAchRes.data?.length ?? 0,
    achievements: (achRes.data ?? []).map((a) => ({
      ...a,
      unlocked: unlocked.has(a.key),
    })),
  };
}

async function toolGetMyRank(sb: SupabaseClient) {
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { error: "Tizimga kirilmagan" };

  const { data: me } = await sb
    .from("profiles")
    .select("xp, best_wpm, username")
    .eq("id", userRes.user.id)
    .maybeSingle();

  if (!me) return { error: "Profil topilmadi" };

  // XP bo'yicha rank
  const { count: xpRank } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("xp", me.xp);

  // WPM bo'yicha rank
  let wpmRank = null;
  if (me.best_wpm) {
    const { count } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gt("best_wpm", me.best_wpm);
    wpmRank = (count ?? 0) + 1;
  }

  // Jami foydalanuvchilar soni
  const { count: total } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return {
    username: me.username,
    xp: me.xp,
    best_wpm: me.best_wpm,
    xp_rank: (xpRank ?? 0) + 1,
    wpm_rank: wpmRank,
    total_users: total ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// GEMINI FUNCTION CALLING DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

const TOOLS = [
  {
    functionDeclarations: [
      // ── Umumiy tools ──
      {
        name: "count_users",
        description: "Saytdagi jami ro'yxatdan o'tgan foydalanuvchilar sonini qaytaradi.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_top_users",
        description: "Eng ko'p XP (tajriba) to'plagan foydalanuvchilar ro'yxatini qaytaradi.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Nechta foydalanuvchi ko'rish kerak (default 10)" },
          },
        },
      },
      {
        name: "get_top_typers",
        description: "Eng tez yozuvchi foydalanuvchilar (eng yuqori WPM) ro'yxatini qaytaradi.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Nechta foydalanuvchi ko'rish kerak (default 10)" },
          },
        },
      },
      {
        name: "get_announcements",
        description: "Saytdagi so'nggi e'lonlarni qaytaradi.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_site_stats",
        description: "Saytning umumiy statistikasini qaytaradi: foydalanuvchilar soni, testlar soni, matnlar soni, sayt sozlamalari.",
        parameters: { type: "OBJECT", properties: {} },
      },
      // ── Shaxsiy tools ──
      {
        name: "get_my_profile",
        description: "Joriy foydalanuvchining shaxsiy profilini qaytaradi (ism, coin, XP, WPM, yutuqlar va boshqalar). Faqat tizimga kirgan foydalanuvchi uchun.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_my_results",
        description: "Joriy foydalanuvchining oxirgi yozish testi natijalarini qaytaradi (WPM, aniqlik, va h.k.). Faqat tizimga kirgan foydalanuvchi uchun.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "INTEGER", description: "Nechta natija ko'rish kerak (default 10)" },
          },
        },
      },
      {
        name: "get_my_achievements",
        description: "Joriy foydalanuvchining yutuqlarini (achievements) qaytaradi — qaysilari ochilgan, qaysilari hali yo'q.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_my_rank",
        description: "Joriy foydalanuvchining umumiy reytingdagi o'rnini qaytaradi (XP va WPM bo'yicha rank).",
        parameters: { type: "OBJECT", properties: {} },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  authClient: SupabaseClient | null,
) {
  // Shaxsiy tools — faqat auth client bilan
  const personalTools = ["get_my_profile", "get_my_results", "get_my_achievements", "get_my_rank"];
  if (personalTools.includes(name)) {
    if (!authClient) return { error: "Tizimga kirilmagan — shaxsiy ma'lumot uchun login qiling" };
    switch (name) {
      case "get_my_profile": return await toolGetMyProfile(authClient);
      case "get_my_results": return await toolGetMyResults(authClient, Number(args.limit) || 10);
      case "get_my_achievements": return await toolGetMyAchievements(authClient);
      case "get_my_rank": return await toolGetMyRank(authClient);
    }
  }

  // Umumiy tools
  switch (name) {
    case "count_users": return await toolCountUsers();
    case "get_top_users": return await toolGetTopUsers(Number(args.limit) || 10);
    case "get_top_typers": return await toolGetTopTypers(Number(args.limit) || 10);
    case "get_announcements": return await toolGetAnnouncements();
    case "get_site_stats": return await toolGetSiteStats();
    default: return { error: `Unknown tool: ${name}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization header'dan token olish
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const authClient = getAuthClient(token);

    // Foydalanuvchi tizimga kirganini aniqlash
    let isLoggedIn = false;
    let username = "";
    if (authClient) {
      try {
        const { data } = await authClient.auth.getUser();
        if (data?.user) {
          isLoggedIn = true;
          // Username olish
          const { data: profile } = await authClient
            .from("profiles")
            .select("username, first_name")
            .eq("id", data.user.id)
            .maybeSingle();
          username = profile?.username || profile?.first_name || "";
        }
      } catch {}
    }

    // Build Gemini contents from messages
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // System prompt — foydalanuvchi holatiga moslashtirilgan
    const loggedInHint = isLoggedIn
      ? `\n\nFoydalanuvchi TIZIMGA KIRGAN. uning ismi: ${username || "noma'lum"}.
Shaxsiy tools'lardan foydalanishing mumkin:
- get_my_profile: foydalanuvchining profilini ko'rish (coin, XP, WPM, yutuqlar)
- get_my_results: foydalanuvchining oxirgi test natijalarini ko'rish
- get_my_achievements: foydalanuvchining yutuqlarini ko'rish
- get_my_rank: foydalanuvchining reytingdagi o'rnini ko'rish

Agar foydalanuvchi "mening profilim", "mening natijalarim", "qancha tangam bor", "reyttingda qatarda turaman" va shunga o'xshash shaxsiy savol bersa, albatta mos shaxsiy tool'ni chaqir.`
      : `\n\nFoydalanuvchi TIZIMGA KIRMAGAN. Shaxsiy tools'lardan foydalanib bo'lmaydi.
Agar foydalanuvchi shaxsiy ma'lumot so'rasa, tizimga kirishni taklif qil.`;

    const systemText = `Sen STypeUz saytining AI yordamchisan. Foydalanuvchilarga do'stona, foydali va qisqa javoblar ber.

Umumiy tools'lar (hamma uchun):
- count_users: ro'yxatdan o'tgan foydalanuvchilar sonini olish
- get_top_users: eng ko'p XP to'plagan foydalanuvchilar
- get_top_typers: eng tez yozuvchilar (eng yuqori WPM)
- get_announcements: so'nggi e'lonlar
- get_site_stats: sayt umumiy statistikasi
${loggedInHint}

Har qanday tilda javob ber — foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber.
STypeUz — bu yozish tezligini oshirish platformasi (typing test).
Javoblarni qisqa va tushunarli qil. Emoji ishlat mumkin.`;

    const firstRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          tools: TOOLS,
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!firstRes.ok) {
      const errText = await firstRes.text();
      console.error("Gemini API error:", firstRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${firstRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const firstData = await firstRes.json();
    const candidate = firstData?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // ── Agar function call bo'lsa, bajarib qayta so'raymiz ──────────
    const functionCalls = parts.filter((p: Record<string, unknown>) => p.functionCall);

    if (functionCalls.length > 0) {
      // Tool natijalarini yig'amiz
      const toolResponses = await Promise.all(
        functionCalls.map(async (fc: Record<string, unknown>) => {
          const fn = fc.functionCall as { name: string; args: Record<string, unknown> };
          const result = await executeTool(fn.name, fn.args || {}, authClient);
          return {
            functionResponse: {
              name: fn.name,
              response: result,
            },
          };
        })
      );

      // Tool natijalarini qayta yuboramiz — Gemini final javob bersin
      const contentsWithTools = [
        ...contents,
        { role: "model", parts: functionCalls },
        { role: "user", parts: toolResponses },
      ];

      const secondRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contentsWithTools,
            tools: TOOLS,
            systemInstruction: {
              parts: [{ text: systemText }],
            },
            generationConfig: {
              temperature: 0.8,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!secondRes.ok) {
        const errText = await secondRes.text();
        console.error("Gemini API error (2nd call):", secondRes.status, errText);
        return new Response(
          JSON.stringify({ error: `Gemini API error: ${secondRes.status}` }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const secondData = await secondRes.json();
      const text = secondData?.candidates?.[0]?.content?.parts?.[0]?.text || "Javob topilmadi";
      return new Response(JSON.stringify({ text }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Oddiy javob (tool call yo'q) ─────────────────────────────────
    const text = parts[0]?.text || "Javob topilmadi";
    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
