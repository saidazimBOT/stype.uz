import { NextRequest } from "next/server";

// ═══════════════════════════════════════════════════════════════════════
// ODDIY BOT — API KEY KERAK EMAS, TEZ VA BEPUL ISHLAYDI
// Sayt haqida to'liq bilim bilan savol-javob
// ═══════════════════════════════════════════════════════════════════════

interface QA {
  patterns: string[];
  answers: string[];
}

const QA_DATABASE: QA[] = [
  // ── SALOMLASHISH ──
  {
    patterns: ["salom", "hello", "hi", "assalomu", "privet", "salomlar", "hey", "hey bot"],
    answers: [
      "Salom! 👋 Men STypeUz AI botiman. Sayt haqida qanday savolingiz bor?",
      "Salom! 😊 STypeUz haqida nima bilmoqchisiz?",
      "Salom! Men STypeUz yordamchisiman. Yozish tezligi, sayt xususiyatlari yoki boshqa narsa haqida so'rashingiz mumkin! 🚀",
    ],
  },
  {
    patterns: ["qalaysan", "qanaqasan", "yaxshimisan", "qilyapsan", "how are you", "kak dela"],
    answers: [
      "Yaxshiman, rahmat! 😊 Siz qalaysiz? STypeUz haqida nima so'ramoqchisiz?",
      "Zo'r! 💪 STypeUz sayti doim ishlayapti. Sizga qanday yordam bera olaman?",
    ],
  },
  // ── SAYT HAQIDA ──
  {
    patterns: ["stypeuz nima", "stypeuz nima", "bu nima", "sayt nima", "sayt haqida", "about", "nima bu sayt", "stypeuz haqida", "styping"],
    answers: [
      "STypeUz — bu yozish tezligini oshirish platformasi ⌨️\n\n🔹 20+ tilda yozish testlari\n🔹 Real-vaqt WPM hisoblagichi\n🔹 25+ chiroyli tema\n🔹 Multiplayer poyga\n🔹 Yutuqlar tizimi\n🔹 Kunlik mukofotlar\n🔹 AI yozish mashqlari\n\nBepul ro'yxatdan o'tib, yozishni boshlashingiz mumkin! 🚀",
    ],
  },
  {
    patterns: ["qanday ishlaydi", "qo'llanma", "qo'llash", "boshlash", "kira olaman", "how to use", "nima qilish kerak"],
    answers: [
      "STypeUz dan foydalanish juda oson! 🎯\n\n1️⃣ Saytga kiring\n2️⃣ Tilni tanlang (o'zbek, rus, ingliz...)\n3️⃣ Vaqtni tanlang (15s, 30s, 60s yoki Free)\n4️⃣ Matnni yozishni boshlang!\n\nTab — yangi matn\nEscape — sozlamalar\n\nQancha tez yozsangiz, shuncha ko'p XP va coin olasiz! 💰",
    ],
  },
  {
    patterns: ["bepulmi", "pul kerak", "qancha turadi", "narx", "free", "free?"],
    answers: [
      "Ha, STypeUz to'liq BEPUL! 🎉\n\n🔹 Barcha testlar bepul\n🔹 20+ til bepul\n🔹 25+ tema bepul\n🔹 Yutuqlar tizimi bepul\n🔹 Kunlik mukofotlar bepul\n\nFaqat Premium xususiyatlar alohida (Telegram orqali to'lov). Lekin asosiy funksiyalar hammasi bepul! 💯",
    ],
  },
  // ── WPM / YOZISH TEZLIGI ──
  {
    patterns: ["wpm nima", "wpm", "words per minute", "yozish tezligi", "tezlik nima"],
    answers: [
      "WPM — Words Per Minute, ya'ni daqiqada yozilgan so'zlar soni 📊\n\nStandartlar:\n🔹 20-30 WPM — boshlang'ich\n🔹 30-50 WPM — o'rtacha\n🔹 50-70 WPM — yaxshi\n🔹 70-90 WPM — zo'r 🌟\n🔹 90+ WPM — professional\n\nSTypeUz da eng yaxshi natija: 92 WPM! 💪",
    ],
  },
  {
    patterns: ["yaxshi wpm", "qancha wpm", "wpmim", "wpmim qancha", "eng yaxshi wpm", "best wpm", "rekord"],
    answers: [
      "STypeUz da eng yaxshi WPM — 92 WPM, 98% aniqlik bilan! 🏆\n\nSiz ham o'z natijangizni oshirishingiz mumkin:\n🔹 Kunlik mashq qiling\n🔹 Har kuni test topshiring\n🔹 Combo ni oshiring\n🔹 Do'stlaringiz bilan poyga qiling",
    ],
  },
  // ── EGASI HAQIDA ──
  {
    patterns: ["egasi kim", "sayt egasi", "yaratuvchi", "creator", "owner", "kim yaratdi", "dasturchi", "saidazim"],
    answers: [
      "STypeUz ni Saidazim Khujayev yaratdi! 👨‍💻\n\n🔹 15 yosh (2011-yil 27-may)\n🔹 Dasturchi (Frontend + Backend)\n🔹 Eng yaxshi WPM: 92 🏆\n🔹 Mentor: Sunnatbek Yusupov\n🔹 Telegram: @said_khujayev\n\nPython, JavaScript, React, Next.js bilan ishlaydi. Kichik yoshidan kod yozishga qiziqadi! 🔥",
    ],
  },
  {
    patterns: ["saidazim", "khujayev", "said khujayev", "said_khujayev"],
    answers: [
      "Saidazim Khujayev — STypeUz yaratuvchisi! 👨‍💻\n\n🔹 15 yosh\n🔹 2011-yil 27-mayda tug'ilgan\n🔹 Frontend + Backend dasturchi\n🔹 Python: 85%, HTML: 90%, CSS: 80%, JS: 75%, React: 70%\n🔹 Tez yozish: 92% (92 WPM)\n🔹 Telegram: @said_khujayev\n\nNF-2957 kursi bitiruvchisi, mentor: Sunnatbek Yusupov 🎓",
    ],
  },
  {
    patterns: ["mentor", "ustoz", "sunnatbek", "yusupov"],
    answers: [
      "STypeUz mentor — Sunnatbek Yusupov 🎓\n\nU NF-2957 dasturlash kursining mentor. Saidazim va uning jamoasiga dasturlashni o'rgatgan. Jamoa a'zolari:\n\n🔹 Yusuf — Jamoa sardori 👑\n🔹 Akbar — Dizayner 🎨\n🔹 Shaxriyor — Backend ⚙️\n🔹 Zafar — Geymer 🎮\n🔹 Saidazim — Frontend 👨‍💻\n🔹 Mirzohid — Analitik 📊",
    ],
  },
  {
    patterns: ["jamoa", "team", "guruh", "nf-2957", "nf2957"],
    answers: [
      "NF-2957 — STypeUz jamoasi! 🤝\n\n🔹 Yusuf — Jamoa sardori 👑\n🔹 Akbar — Dizayner 🎨\n🔹 Shaxriyor — Backend ⚃\n🔹 Zafar — Geymer 🎮\n🔹 Saidazim — Frontend · Yaratuvchi 👨‍💻\n🔹 Mirzohid — Analitik 📊\n\nMentor: Sunnatbek Yusupov 🎓",
    ],
  },
  // ── XUSUSIYATLAR ──
  {
    patterns: ["til", "language", "qaysi til", "o'zbek", "rus", "ingliz", "languages"],
    answers: [
      "STypeUz 20+ tilda ishlaydi! 🌍\n\n🔹 O'zbek 🇺🇿\n🔹 Rus 🇷🇺\n🔹 Ingliz 🇬🇧\n🔹 Qozoq 🇰🇿\n🔹 Turk 🇹🇷\n🔹 Ukraina 🇺🇦\n🔹 Hind 🇮🇳\n🔹 Nemis 🇩🇪\n🔹 Frantsuz 🇫🇷\n🔹 Yapon 🇯🇵\n\nVa yana ko'plab tillar! Tilni sayt yuqorisidagi tugmadan tanlashingiz mumkin.",
    ],
  },
  {
    patterns: ["tema", "theme", "rang", "dark", "light", "sozlamalar", "settings"],
    answers: [
      "STypeUz da 25+ chiroyli tema mavjud! 🎨\n\nDark temalar: Default, Blue, Gold, Pink, Green, Sunset, VS Code Dark\nLight temalar: Light, Warm, Sakura, Mint, Sky, Peachy, VS Code Light\n\nTemani o'zgartirish uchun:\n🔹 Pastki chapdagi 🎨 tugmani bosing\n🔹 Yoki Sozlamalar → Tema bo'limiga boring",
    ],
  },
  {
    patterns: ["coin", "tanga", "pul", "mukofot", "reward", "coin nima"],
    answers: [
      "Coin — STypeUz valyutasi! 🪙\n\nQanday olish mumkin:\n🔹 Test yozish — WPM x 1 coin\n🔹 95%+ aniqlik — +5 coin bonus\n🔹 Kunlik login — 10-100 coin (streak ga qarab)\n🔹 Yutuqlar — har biri coin beradi\n\nCoinlar bilan nima qilish mumkin:\n🔹 Do'kondan avatar sotib olish\n🔹 Effektlar sotib olish\n🔹 Premium narsalar",
    ],
  },
  {
    patterns: ["xp", "tajriba", "experience", "level", "daraja"],
    answers: [
      "XP — Tajriba ballari! ⭐\n\nQanday olish mumkin:\n🔹 Test yozish — WPM + Accuracy = XP\n🔹 Combo bonus — 10+ harfdan keyin bonus\n🔹 Kunlik login — streak bo'yicha XP\n🔹 Yutuqlar — XP mukofotlari\n\nXP qancha ko'p bo'lsa, reytingda shuncha yuqori turasiz! 🏆",
    ],
  },
  {
    patterns: ["streak", "kunlik", "daily", "login", "kirish"],
    answers: [
      "Kunlik login mukofotlari! 🎁\n\nHar kuni kiring va coin oling:\n🔹 1-kun: 10 coin\n🔹 2-kun: 15 coin\n🔹 3-kun: 25 coin\n🔹 4-kun: 30 coin\n🔹 5-kun: 40 coin\n🔹 6-kun: 45 coin\n🔹 7-kun: 100 coin 🎉\n\n7 kunlik streak — 265 coin! Quvvat! 💪",
    ],
  },
  {
    patterns: ["multiplayer", "poyga", "race", "real", "live"],
    answers: [
      "Multiplayer poyga — boshqa foydalanuvchilar bilan yozish poygasi! 🏎️\n\n🔹 Real-vaqtda raqobatchilar bilan yozing\n🔹 Kim birinchi bo'lib tugatsa, g'alaba qozonadi\n🔹 Do'stlaringizni taklif qiling\n🔹 Coin va XP oling\n\nBoshqa foydalanuvchilar bilan poyga qilish — eng qiziqarli bo'lim! 🚀",
    ],
  },
  {
    patterns: ["yutuq", "achievement", "badge", "ochish", "unlock"],
    answers: [
      "Yutuqlar tizimi — qo'shimcha mukofotlar! 🏅\n\nTurli yutuqlar mavjud:\n🔹 WPM yutuqlari — tez yozish uchun\n🔹 Aniqlik yutuqlari — aniq yozish uchun\n🔹 Test yutuqlari — ko'p test topshirish uchun\n🔹 Combo yutuqlari — uzun combo uchun\n🔹 Streak yutuqlari — kunlik kirish uchun\n\nHar bir yutuq coin va XP beradi! 💰",
    ],
  },
  {
    patterns: ["dna", "typing dna", "yozish dna", "profil", "tahlil"],
    answers: [
      "Typing DNA — sizning yozish uslubingiz tahlili! 🧬\n\n🔹 WPM statistikasi\n🔹 Aniqlik grafigi\n🔹 Xato xaritasi\n🔹 Yozish ritmi\n🔹 Eng faol vaqt\n🔹 Afzal til va rejim\n\nBir nechta test topshiring, shunda sizning noyob DNA chizig'ingiz paydo bo'ladi! 🔬",
    ],
  },
  {
    patterns: ["chat", "xabar", "message", "yozish", "chat qilish"],
    answers: [
      "Chat — foydalanuvchilar orasida xabarlashish! 💬\n\n🔹 Boshqa foydalanuvchilar bilan chat qiling\n🔹 Do'stlaringizni toping\n🔹 Xabar yuboring\n\nChat bo'limiga sidebar dan kirishingiz mumkin. 📨",
    ],
  },
  {
    patterns: ["do'st", "friend", "qo'shish", "add friend"],
    answers: [
      "Do'stlar tizimi — do'stlaringizni qo'shing! 👥\n\n🔹 Foydalanuvchini qidiring\n🔹 Do'stlik so'rovini yuboring\n🔹 Qabul qiling\n🔹 Do'stlaringiz bilan poyga qiling\n\nDo'stlar bilan o'ynash yanada qiziq! 🎮",
    ],
  },
  {
    patterns: ["o'yin", "game", "games"],
    answers: [
      "O'yinlar — typing asosidagi qiziqarli o'yinlar! 🎮\n\n🔹 Typing Speed o'yini\n🔹 Word Match — so'zlarni toping\n🔹 va boshqalar\n\nO'yinlar orqali ham coin va XP olish mumkin! 🪙",
    ],
  },
  {
    patterns: ["do'kon", "shop", "sotib olish", "buy", "avatar"],
    answers: [
      "Do'kon — avatarlar va effektlar! 🛒\n\n🔹 Avatarlar — profil rasmini o'zgartirish\n🔹 Effektlar — yozish paytida effektlar\n🔹 Hero — kiyim va aksessuarlar\n🔹 Premium narsalar\n\nCoinlaringizni sarflang va o'zingizni bezating! ✨",
    ],
  },
  {
    patterns: ["replay", "takrorlash", "qayta", "yozish jarayoni"],
    answers: [
      "Replay — yozish jarayonini qayta ko'rish! 🎬\n\n🔹 Har bir test avtomatik saqlanadi\n🔹 Yozish jarayonini sekinlashtirib ko'ring\n🔹 Xatolaringizni tahlil qiling\n🔹 Yaxshilanishni kuzating\n\nReplay bo'limiga sidebar dan kirishingiz mumkin. 📹",
    ],
  },
  {
    patterns: ["challenge", "chellenj", "musobaqa", "turnir"],
    answers: [
      "Challenge — yozish chellenjlari! ⚔️\n\n🔹 Turli qiyinlikdagi topshiriqlar\n🔹 Vaqt cheklangan\n🔹 Yuqori ball oling\n🔹 Yutuqlarni oching\n\nChellenjlar orqali o'zingizni sinab ko'ring! 💪",
    ],
  },
  {
    patterns: ["mashq", "practice", "boshlang'ich", "beginner", "oddiy"],
    answers: [
      "Mashq — boshlang'ichlar uchun oddiy mashqlar! 📝\n\n🔹 Oddiy harflar — bitta harfni takrorlang\n🔹 Harflar juftligi — ikki harf birga\n🔹 Harflar zanjiri — uzun zanjirlar\n🔹 Qisqa so'zlar — oddiy so'zlar\n\nYozishni endigina boshlayotganlar uchun juda mos! 🌱",
    ],
  },
  {
    patterns: ["premium", "obuna", "subscribe", "pullik"],
    answers: [
      "Premium — qo'shimcha xususiyatlar! 👑\n\nPremium orqali:\n🔹 Maxsus avatarlar\n🔹 Maxsus effektlar\n🔹 Prioritet qo'llab-quvvatlash\n\nPremiumni Telegram orqali sotib olish mumkin. Asosiy funksiyalar esa HAMMASI BEPUL! 💯",
    ],
  },
  {
    patterns: ["custom text", "matn import", "o'z matnim", "import text", "custom"],
    answers: [
      "Custom Text Import — o'z matnlaringizni import qiling! 📄\n\n🔹 O'z matnlaringizni kiriting\n🔹 Boshqa saytlardan matn nusxalab oling\n🔹 Har qanday tilda bo'lishi mumkin\n🔹 Mashq uchun ishlating\n\nBu xususiyat barcha foydalanuvchilar uchun bepul! 📝",
    ],
  },
  // ── TEXNIK ──
  {
    patterns: ["texnologiya", "technology", "stack", "next.js", "react", "supabase", "typescript", "texniki"],
    answers: [
      "STypeUz texnologiyalari! ⚙️\n\n🔹 Frontend: React + Next.js + TypeScript\n🔹 Styling: Tailwind CSS\n🔹 Backend: Supabase (database + auth)\n🔹 AI: Gemini AI (AI Chat) + Groq AI (AI Exercises)\n🔹 PWA: Progressive Web App\n🔹 Hosting: Vercel\n\nZamonaviy va tez texnologiyalar! 🚀",
    ],
  },
  {
    patterns: ["pwa", "o'rnatish", "install", "telefonda", "mobil"],
    answers: [
      "STypeUz PWA — telefoniga o'rnatish mumkin! 📱\n\n🔹 Chrome/Safari da oching\n🔹 \"O'rnatish\" tugmasini bosing\n🔹 Tezkor kirish yaratiladi\n🔹 Offline ham ishlaydi\n\nTelefonda ham kompyuterdek ishlaydi! 💪",
    ],
  },
  // ── YORDAM ──
  {
    patterns: ["yordam", "help", "qanday", "how", "nima", "muammo", "problem", "xato", "error"],
    answers: [
      "Sizga qanday yordam bera olaman? 🤔\n\nMenga quyidagilarni so'rashingiz mumkin:\n🔹 STypeUz nima?\n🔹 WPM nima?\n🔹 Sayt egasi kim?\n🔹 Qanday foydalanish mumkin?\n🔹 Til, tema, coin, XP haqida\n🔹 Multiplayer, chat, o'yinlar haqida\n🔹 Texnik ma'lumotlar\n\nQaysi mavzuda so'rashni xohlaysiz? 😊",
    ],
  },
  {
    patterns: ["rahmat", "thanks", "minnatdor", "thank"],
    answers: [
      "Arzimaydi! 😊 Agar boshqa savol bo'lsa, bemalol so'rang!",
      "Yo'q, rahmat sizga! 💚 Boshqa savol bo'lsa, yozing!",
    ],
  },
  {
    patterns: ["xitoy", "japan", "korea", "arab"],
    answers: [
      "Hozircha bu tillar hali qo'shilmagan, lekin biz 20+ tilda ishlaymiz! 🌍\n\nMavjud tillar: o'zbek, rus, ingliz, qozoq, turk, ukraina, hind, nemis, frantsuz, yapon va boshqalar.\n\nQaysi tilda yozmoqchisiz?",
    ],
  },
];

// ── JAVOB GENERATSIYA QILISH ────────────────────────────────────────

function findAnswer(input: string): string {
  const lower = input.toLowerCase().trim();

  // Har bir savol-nazirat uchun patternlarni tekshiramiz
  for (const qa of QA_DATABASE) {
    for (const pattern of qa.patterns) {
      if (lower.includes(pattern)) {
        // Tasodifiy javob tanlash
        return qa.answers[Math.floor(Math.random() * qa.answers.length)];
      }
    }
  }

  // Agar hech qanday pattern mos kelmasa — umumiy javob
  const fallback = [
    "Qiziq savol! 🤔 Lekin men faqat STypeUz haqida ma'lumot bera olaman.\n\nMening bilimlarim:\n🔹 Sayt xususiyatlari\n🔹 WPM va yozish haqida\n🔹 Sayt egasi haqida\n🔹 Texnik ma'lumotlar\n\nSTypeUz haqida nima so'rashni xohlaysiz?",
    "Bu haqida aniq ma'lumotim yo'q 😅\n\nLekin STypeUz haqida quyidagilarni bilaman:\n🔹 Sayt xususiyatlari\n🔹 Yaratuvchi haqida\n🔹 WPM va yozish\n🔹 Texnologiyalar\n\nBoshqa narsa so'rashingiz mumkin!",
    "Men STypeUz AI botiman 🤖\n\nFaqat sayt haqida javob bera olaman. Masalan:\n🔹 \"STypeUz nima?\"\n🔹 \"WPM nima?\"\n🔹 \"Sayt egasi kim?\"\n🔹 \"Qanday boshlash kerak?\"\n\nSTypeUz haqida nimani bilmoqchisiz? 😊",
  ];

  return fallback[Math.floor(Math.random() * fallback.length)];
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Oxirgi foydalanuvchi xabarini olamiz
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ text: "Savolingizni yozing! 😊" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const answer = findAnswer(lastUserMessage.content);

    // Biroz kechikish — real AI ga o'xshatish uchun
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

    return new Response(JSON.stringify({ text: answer }), {
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
