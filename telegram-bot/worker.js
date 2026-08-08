// ─────────────────────────────────────────────────────────────────────────
//  STypeUz TELEGRAM BOT  —  Cloudflare Worker
// ─────────────────────────────────────────────────────────────────────────
//  Bu worker sayt uchun Telegram-botni boshqaradi (xabar yuboruvchi bot):
//    • /start  → salomlashish + saytga havola + obuna tugmalari
//    • /sub    → yangiliklarga obuna bo'lish
//    • /unsub  → obunani bekor qilish
//    • /stats  → (faqat owner) obunachilar soni
//    • /broadcast <matn> → (faqat owner) barcha obunachilarga xabar
//    • POST /notify      → sayt/admin tomonidan broadcast (secret bilan)
//
//  O'RNATISH (bir marta):
//    1. Telegram'da @BotFather → /newbot → bot nomi + username bering.
//       Sizga BOT TOKEN beriladi (masalan: 123456:ABC-DEF...).
//    2. Cloudflare → Workers → Create Worker → bu kodni joylang.
//    3. Workers KV namespace yarating va binding nomini "TG_KV" qiling.
//    4. Worker Settings → Variables and Secrets:
//         BOT_TOKEN    = @BotFather dan olingan token
//         NOTIFY_SECRET= o'zingiz ixtiro qilgan maxfiy kalit (uzun!)
//         OWNER_ID     = sizning Telegram chat ID'ingiz (ixtiyoriy)
//         SITE_URL     = https://styping.uz/
//         CHANNEL_URL  = https://t.me/khoja_akbar
//    5. Deploy: npx wrangler deploy
//    6. Webhook'ni yoqish (worker URL'ni bilgach):
//         curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.workers.dev/webhook"
//    7. Bot'ni tekshirish: Telegram'da botga /start yozing.
// ─────────────────────────────────────────────────────────────────────────

const TG_API = "https://api.telegram.org";

// ── Yordamchi: HTML maxsus belgilardan himoya (xabarda < > & bo'lsa) ────
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Yordamchi: Telegram API chaqiruv ────────────────────────────────────
async function tg(method, env, body) {
  const r = await fetch(`${TG_API}/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── KV yordamchilari: obunachilar ───────────────────────────────────────
// Har bir obunachi alohida kalitda saqlanadi: sub:<chat_id> → {name, at}
const subKey = (chatId) => `sub:${chatId}`;

async function getSub(env, chatId) {
  const raw = await env.TG_KV.get(subKey(chatId), "json");
  return raw || null;
}

async function setSub(env, chatId, name) {
  await env.TG_KV.put(
    subKey(chatId),
    JSON.stringify({ name: name || "", at: Date.now() })
  );
}

async function delSub(env, chatId) {
  await env.TG_KV.delete(subKey(chatId));
}

async function listSubs(env) {
  const list = await env.TG_KV.list({ prefix: "sub:" });
  const subs = [];
  for (const key of list.keys) {
    const raw = await env.TG_KV.get(key.name, "json");
    if (raw) subs.push({ chatId: Number(key.name.slice(4)), name: raw.name || "" });
  }
  return subs;
}

// ── Inline keyboard (start xabaridagi tugmalar) ─────────────────────────
function startKeyboard(env) {
  return {
    inline_keyboard: [
      [
        { text: "🌐 Saytga kirish", url: env.SITE_URL || "https://styping.uz/" },
        { text: "📢 Kanal", url: env.CHANNEL_URL || "https://t.me/khoja_akbar" },
      ],
      [{ text: "🔕 Obunani bekor qilish", callback_data: "unsub" }],
    ],
  };
}

// ── /start xabari ───────────────────────────────────────────────────────
async function sendStart(env, chatId, firstName) {
  // /start bilan kelgan har bir kishi avtomatik obuna bo'ladi
  await setSub(env, chatId, firstName);
  await tg("sendMessage", env, {
    chat_id: chatId,
    parse_mode: "HTML",
    text:
      `Assalomu alaykum, <b>${esc(firstName || "do'st")}</b>! 👋\n\n` +
      `Bu <b>STypeUz</b> rasmiy boti. 🚀\n\n` +
      `✅ Siz <b>yangiliklarga obuna bo'ldingiz</b> — saytdagi e'lonlar, ` +
      `musobaqalar va yangiliklar haqida shu yerga xabar keladi.\n\n` +
      `💻 Tez yozishni mashq qilish uchun saytga tashrif buyuring!`,
    reply_markup: startKeyboard(env),
  });
}

// ── /broadcast — faqat owner ────────────────────────────────────────────
async function broadcast(env, text) {
  const subs = await listSubs(env);
  let ok = 0;
  let blocked = 0;
  for (const s of subs) {
    const res = await tg("sendMessage", env, {
      chat_id: s.chatId,
      parse_mode: "HTML",
      text,
      disable_web_page_preview: true,
    });
    // 403 = bot bloklangan → obunachini o'chiramiz
    if (res?.ok) ok++;
    else if (res?.error_code === 403) {
      await delSub(env, s.chatId);
      blocked++;
    }
  }
  return { total: subs.length, ok, blocked };
}

// ── Webhook: Telegram'dan kelgan update'lar ─────────────────────────────
async function handleWebhook(req, env) {
  const update = await req.json().catch(() => ({}));
  const msg = update.message || update.channel_post || null;
  const cb = update.callback_query || null;

  // Callback tugma bosildi (unsub)
  if (cb) {
    const chatId = cb.message?.chat?.id;
    if (cb.data === "unsub" && chatId) {
      await delSub(env, chatId);
      await tg("answerCallbackQuery", env, {
        callback_query_id: cb.id,
        text: "Obuna bekor qilindi",
      });
      await tg("sendMessage", env, {
        chat_id: chatId,
        text: "🔕 Siz yangiliklardan obunani bekor qildingiz.\nQayta obuna bo'lish uchun /sub yozing.",
      });
    } else {
      await tg("answerCallbackQuery", env, {
        callback_query_id: cb.id,
        text: "Noma'lum tugma",
      });
    }
    return json({ ok: true });
  }

  if (!msg || !msg.chat) return json({ ok: true });
  const chatId = msg.chat.id;
  const firstName = msg.chat.first_name || msg.from?.first_name || "";
  const text = (msg.text || "").trim();
  // Komandani normallashtiramiz: "/start@botname" → "/start"
  const cmd = (text.split(/\s+/)[0] || "").split("@")[0];

  // /start yoki bot komandasi
  if (cmd === "/start") {
    await sendStart(env, chatId, firstName);
    return json({ ok: true });
  }

  if (cmd === "/sub") {
    await setSub(env, chatId, firstName);
    await tg("sendMessage", env, {
      chat_id: chatId,
      text: "✅ Obuna bo'ldingiz! Endi yangiliklar shu yerga keladi.",
    });
    return json({ ok: true });
  }

  if (cmd === "/unsub") {
    await delSub(env, chatId);
    await tg("sendMessage", env, {
      chat_id: chatId,
      text: "🔕 Obunani bekor qildingiz. Qayta: /sub",
    });
    return json({ ok: true });
  }

  if (cmd === "/help") {
    await tg("sendMessage", env, {
      chat_id: chatId,
      parse_mode: "HTML",
      text:
        `🤖 <b>STypeUz bot</b>\n\n` +
        `/start — salomlashish va obuna\n` +
        `/sub — yangiliklarga obuna bo'lish\n` +
        `/unsub — obunani bekor qilish`,
    });
    return json({ ok: true });
  }

  if (cmd === "/stats" || cmd === "/broadcast") {
    // Faqat owner — OWNER_ID o'rnatilmagan bo'lsa ham ruxsat BERILMAYDI
    const owner = String(env.OWNER_ID || "");
    if (!owner || String(chatId) !== owner) {
      await tg("sendMessage", env, {
        chat_id: chatId,
        text: "Bu buyruq faqat bot egasi uchun. 🙅",
      });
      return json({ ok: true });
    }
    if (cmd === "/stats") {
      const subs = await listSubs(env);
      const lines = subs.slice(0, 30).map((s, i) => `${i + 1}. ${esc(s.name) || "?"} (id: ${s.chatId})`);
      await tg("sendMessage", env, {
        chat_id: chatId,
        parse_mode: "HTML",
        text:
          `📊 <b>Obunachilar: ${subs.length}</b>\n\n` +
          (lines.length ? lines.join("\n") : "Hozircha obunachi yo'q."),
      });
      return json({ ok: true });
    }
    // /broadcast <matn>
    const rest = text.slice(cmd.length).trim();
    if (!rest) {
      await tg("sendMessage", env, {
        chat_id: chatId,
        text: "Matn kiriting: /broadcast Salom hammaga!",
      });
      return json({ ok: true });
    }
    const res = await broadcast(env, rest);
    await tg("sendMessage", env, {
      chat_id: chatId,
      text: `📣 Tarqatildi: ${res.ok}/${res.total} ta obunachiga yetkazildi${res.blocked ? `, ${res.blocked} ta bloklagan o'chirildi` : ""}.`,
    });
    return json({ ok: true });
  }

  // Boshqa oddiy matn → qisqa yo'naltiruvchi
  await tg("sendMessage", env, {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `Salom! Bot buyruqlari: /start · /sub · /unsub · /help`,
    reply_markup: startKeyboard(env),
  });
  return json({ ok: true });
}

// ── POST /notify — sayt/admin tomonidan broadcast ───────────────────────
async function handleNotify(req, env) {
  const auth = req.headers.get("Authorization") || "";
  const secret = env.NOTIFY_SECRET || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return json({ error: "Noto'g'ri secret" }, 401);
  }
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  if (!text) return json({ error: "text kerak" }, 400);

  const res = await broadcast(env, text);
  return json({ ok: true, ...res });
}

// ── GET /stats — obunachilar soni (secret bilan) ────────────────────────
async function handleStats(req, env) {
  const secret = env.NOTIFY_SECRET || "";
  const u = new URL(req.url);
  if (!secret || u.searchParams.get("secret") !== secret) {
    return json({ error: "Noto'g'ri secret" }, 401);
  }
  const subs = await listSubs(env);
  return json({ subscribers: subs.length, subs: subs.slice(0, 50) });
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);

    // Root → oddiy status sahifa (token ko'rsatilmaydi!)
    if (u.pathname === "/" && req.method === "GET") {
      return json({
        ok: true,
        bot: "STypeUz Telegram Bot",
        endpoints: ["POST /webhook", "POST /notify", "GET /stats?secret=..."],
        hint: "Webhook: curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<worker>/webhook",
      });
    }

    if (u.pathname === "/webhook" && req.method === "POST") {
      return handleWebhook(req, env);
    }
    if (u.pathname === "/notify" && req.method === "POST") {
      return handleNotify(req, env);
    }
    if (u.pathname === "/stats" && req.method === "GET") {
      return handleStats(req, env);
    }

    return json({ error: "Not found" }, 404);
  },
};
