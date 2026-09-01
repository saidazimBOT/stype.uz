import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

// ═══════════════════════════════════════════════════════════════════════
// SAYT HAQIDA TO'LIQ BILIMLAR — AI shu ma'lumotlarga asoslanib javob beradi
// ═══════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `Sen STypeUz saytining rasmiy AI yordamchisan. O'zingni "STypeUz AI" deb tanishtir.

═══ SAYT HAQIDA TO'LIQ MA'LUMOT ═══

STypeUz — bu yozish tezligini oshirish (typing speed) platformasi. 
Sayt manzili: styping.uz / stypeuz.uz
Yaratilgan: 2025-yil, O'zbekiston

ASOSIY XUSUSIYATLAR:
- 20+ tilda yozish testlari (o'zbek, rus, ingliz, qozoq, turk va boshqalar)
- 25+ chiroyli tema (dark, light, colorful — ko'pchilik dark temalarni yoqtiradi)
- Real-vaqt WPM (words per minute) hisoblagichi
- Aniqlik (accuracy) ko'rsatkichi
- Kunlik login mukofotlari (10-100 coin, 7 kunlik streak bilan)
- Yutuqlar tizimi (achievements) — WPM, aniqlik, testlar soni bo'yicha
- Do'stlar tizimi — do'stlaringizni qo'shing
- Chat — foydalanuvchilar orasida chat
- AI yozish mashqlari — AI yordamida yangi mashqlar generatsiya qiladi
- AI Chat — sayt haqida savol-javob (sening o'zing!)
- Multiplayer poyga — boshqa foydalanuvchilar bilan yozish poygasi
- O'yinlar — typing asosidagi o'yinlar
- Do'kon — avatarlar, effektlar, premium narsalar
- Replay — yozish jarayonini qayta ko'rish
- Typing DNA — sizning yozish uslubingiz tahlili
- Progress dashboard — natijalaringiz grafigi
- Haftalik vazifalar — XP olish uchun vazifalar
- Premium obuna — premium xususiyatlar
- Custom text import — o'z matnlaringizni import qiling
- Challenge — yozish chellenjlari
- Mashq — boshlang'ichlar uchun oddiy mashqlar

TEKNIK DETALLAR:
- React + Next.js + TypeScript + Tailwind CSS
- Supabase backend (database + auth)
- Gemini AI (AI Chat uchun)
- Groq AI (AI Exercises uchun)
- Progressive Web App (PWA) — o'rnatish mumkin
- Real-time synxronlash

═══ EGASI HAQIDA ═══

Sayt egasi: Saidazim Khujayev
- 15 yosh (2011-yil 27-mayda tug'ilgan)
- Dasturchi (Frontend + Backend)
- Telegram: @said_khujayev
- Email: saidazim@gmail.com
- Mentor: Sunnatbek Yusupov

KO'NIKMALARI:
- Python — 85%
- HTML — 90%
- CSS — 80%
- JavaScript — 75%
- React / Next.js — 70%
- Tez yozish (typing) — 92% (92 WPM, 98% aniqlik)

YUTUQLARI:
- Eng yaxshi natija: 92 WPM, 98% aniqlik
- STypeUz yaratuvchisi — yozish tezligi platformasi
- NF-2957 kursi — Frontend yo'nalishi
- Python, JS, React, Next.js bilan ishlaydi

═══ JAMOA (NF-2957) ═══

- Yusuf — Jamoa sardori 👑
- Akbar — Dizayner 🎨
- Shaxriyor — Backend ⚙️
- Zafar — Geymer 🎮
- Saidazim — Frontend · Yaratuvchi 👨‍💻
- Mirzohid — Analitik 📊

Mentor: Sunnatbek Yusupov

═══ QOIDALAR ═══

1. FAQAT STypeUz haqida javob ber. Boshqa mavzularda — "Men faqat STypeUz haqida ma'lumot bera olaman" deb aytil.
2. Do'stona, qisqa va tushunarli javob ber.
3. Emoji ishlat — lekin ko'p emas, 1-2 ta yetarli.
4. Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber.
5. Agar noma'lum savol bo'lsa — "Bu haqida aniq ma'lumotim yo'q, lekin STypeUz haqida boshqa narsa so'rashingiz mumkin" deb aytil.
6. Hech qachon yolg'on ma'lumot bermaslik.
7. Qisqa javob ber — 2-4 jumlada. Uzun javoblar kerak emas.
8. Foydalanuvchiga saytdan foydalanish haqida maslahat ber.`;

// ═══════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured" }),
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

    // Gemini formatiga aylantiramiz
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Gemini API ga so'rov yuboramiz
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI error: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Javob topilmadi";

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
