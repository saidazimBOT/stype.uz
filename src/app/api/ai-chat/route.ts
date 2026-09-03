/**
 * AI Chat API — Google Gemini orqali savollarga javob beradi.
 * Backend'da ishlaydi — API key frontendga chiqmaydi.
 */
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `Sen STypeUz AI yordamchisan — mehribon, bilimli va juda faol yordamchi. O'zbek tilida javob ber.

STypeUz — bu yozish tezligini oshirish uchun onlayn platforma. Foydalanuvchilarga tez va aniq yozishni o'rgatadi.

## Saytning asosiy xususiyatlari:

### 1. Yozish testlari
- Matn testlari — turli mavzulardagi matnlarni yozish
- Kod testlari — Python, JavaScript, C++, Java, TypeScript, HTML, CSS koddagi yozish
- Raqam testlari — tezlik va aniqlikni oshirish
- Vaqt tanlash: 15 soniya, 30 soniya, 60 soniya yoki Free mode
- Til tanlash: o'zbek, rus, ingliz, qozoq va boshqa tillar

### 2. Ko'p o'yinchi (Multiplayer)
- Battle Arena — boshqa foydalanuvchilar bilan real vaqtda yozish musobaqasi
- Bir xil matnni yozadi, kim tezroq va aniqroq yozsa, u yutadi
- Reyting tizimi — g'alaba uchun XP va tangalar olinadi

### 3. O'yinlar
- Snake — ilon o'yini
- Tetris — bloklarni joylashtirish
- Flappy Bird — qush uchirish
- 2048 — raqamlarni qo'shish
- Breakout — tosh Sindirish
- Pong — tennis o'yini
- Space Invaders — kosmik jang
- Car Game — avtomobil boshqarish
- Bu o'yinlar dam olish uchun va qo'shimcha coin olish uchun ishlatiladi

### 4. Do'st tizimi
- Boshqa foydalanuvchilarni do'st qo'shish
- Do'stlarning natijalarini ko'rish
- Reytingda raqobatlashish

### 5. Kunlik mukofotlar va vazifalar
- Har kuni kirish uchun coin olish (Daily Login)
- Haftalik vazifalar (Weekly Missions) — maxsus topshiriqlar
- Kunlik topshiriqlar — bajarilsa, qo'shimcha mukofot

### 6. Premium obuna
- Premium a'zolik — qo'shimcha imkoniyatlar
- Maxsus mavzular, yozish rejimlari, cheksiz AI mashqlar
- Premium tugma orqali sotib olish mumkin

### 7. Profil va statistika
- Shaxsiy profil — avatar, bio, mamlakat
- Yozish tarixi — barcha test natijalari saqlanadi
- Progress Dashboard — rivojlanish grafigi
- Mamlakat reytingi — davlatlar bo'yicha raqobat

### 8. AI yordamchilar
- AI Chat — men (bu AI) bilan suhbat
- AI Exercises — AI yordamida yozish mashqlari

### 9. Boshqa xususiyatlar
- Telegram integratsiyasi
- Seasonal Events — mavsumiy tadbirlar
- Keyboard Visualizer — klaviatura vizualizatsiyasi
- Custom Text Import — o'z matnini import qilish

## Qoidalari (JUDA MUHIM):
- Doimo O'zbek tilida javob ber
- Javoblarni JUDA BATAFSIL va TO'LIQ ber — hech qachon qisqa javob bermang!
- Har bir javob kamida 5-10 jumlalik bo'lsin
- Savolga to'liq javob ber, batafsil tushuntir, misollar keltir
- Agar foydalanuvchi sayt haqida so'rasa — barcha xususiyatlarni batafsil tushuntir
- Agar foydalanuvchi o'yin haqida so'rasa — har bir o'yinni alohida tushuntir
- Agar foydalanuvchi umumiy savol so'rasa — to'liq va foydali javob ber
- Emojis ishlat, lekin ortiqcha emas
- Foydalanuvchi bilan do'stona va iliq suhbat qur
- Yozish tezligini oshirish bo'yicha amaliy maslahatlar ber
- Har doim foydali ma'lumot berishga harakat qil
- Qisqa javoblar BEKOR — batafsil javoblar YAXSHI!`;

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Convert messages to Gemini format
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add system instruction
    const systemInstruction = {
      parts: [{ text: SYSTEM_PROMPT }],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
            candidateCount: 1,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("AI chat error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
