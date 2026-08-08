# 🤖 STypeUz Telegram Bot

Sayt uchun **xabar yuboruvchi Telegram bot** — yangiliklar, e'lonlar va
musobaqalarni Telegram orqali obunachilarga yetkazadi.

---

## 📱 1-QADAM: Bot'ni @BotFather orqali yaratish

1. Telefoningizda yoki desktop'da **Telegram**'ni oching.
2. Qidiruvga **@BotFather** yozib, botga kiring.
3. `/newbot` buyrug'ini yuboring.
4. Bot uchun **nom** bering (masalan: `STypeUz Bot`).
5. Bot uchun **username** bering — **`bot` bilan tugashi shart!**
   Masalan: `stypeuz_bot` yoki `khoja_akbar_bot`.

   > ⚠️ Username band bo'lsa, boshqasini sinab ko'ring.

6. BotFather sizga **token** beradi, shunday ko'rinishda:
   ```
   7123456789:AAF1x2y3z4A5B6C7D8E9F0G1H2I3J4K5L6M7N
   ```
   **Bu tokenni saqlab qo'ying!** (maxfiy)

7. Bot username'ingizni yodda tuting — saytga tugma qo'yishda kerak:
   `https://t.me/<username>`

> 🎨 Ixtiyoriy: BotFather → `/setdescription`, `/setabouttext`,
> `/setuserpic` orqali botni chiroyli qilishingiz mumkin.

---

## ☁️ 2-QADAM: Cloudflare'da Worker yaratish

1. [dash.cloudflare.com](https://dash.cloudflare.com) ga kiring.
2. **Workers & Pages → Create → Worker** → nom bering: `stypeuz-telegram-bot`.
3. `worker.js` faylidagi kodni worker'ga joylang (yoki quyidagi usul bilan).

### Lokal deploy (agar kompyuterda wrangler bo'lsa)

```bash
cd telegram-bot
npm i -g wrangler            # bir marta
npx wrangler login           # bir marta
npx wrangler kv namespace create TG_KV   # ID chiqadi → wrangler.toml ga yozing
npx wrangler deploy
```

Deploy'dan so'ng worker URL'ingiz bo'ladi:
```
https://stypeuz-telegram-bot.<sizning-subdomain>.workers.dev
```

---

## 🔑 3-QADAM: Secret'lar va KV'ni sozlash

**KV namespace** (obunachilar saqlanadi):
```bash
npx wrangler kv namespace create TG_KV
# chiqqan id'ni wrangler.toml dagi "id = ..." ga yozing
```

**Secrets** (Worker → Settings → Variables and Secrets):
```bash
npx wrangler secret put BOT_TOKEN       # @BotFather dan olingan token
npx wrangler secret put NOTIFY_SECRET   # o'zingiz ixtiro qilgan uzun kalit
npx wrangler secret put OWNER_ID        # sizning Telegram ID (ixtiyoriy)
npx wrangler secret put BOT_USERNAME    # masalan: stypeuz_bot
```

**Sizning Telegram ID'ingizni bilish:** @userinfobot ga yozing — u ID'ni aytadi.

---

## 🔗 4-QADAM: Webhook'ni yoqish (eng muhim!)

Worker URL'ingizni bilgach, Telegram'ga aytish kerak — update'larni
shu yerga yuborsin:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://stypeuz-telegram-bot.<subdomain>.workers.dev/webhook"
```

Muvaffaqiyatli bo'lsa:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

**Tekshirish:** Telegram'da botga kirib `/start` yozing — salom xabari
kelishi kerak. ✅

---

## 📣 5-QADAM: Xabar tarqatish (broadcast)

### Usul A — Bot'ning o'zidan (eng oson)
Owner (siz) botga yozasiz:
```
/broadcast E'lon! Ertaga 20:00 da musobaqa bo'ladi! 🏆
```
Barcha obunachilarga yetkaziladi. Obunachilar soni: `/stats`

### Usul B — Sayt/admin panel orqali (API)
```bash
curl -X POST https://stypeuz-telegram-bot.<subdomain>.workers.dev/notify \
  -H "Authorization: Bearer <NOTIFY_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Yangi e’lon! STypeUz yangilandi 🚀"}'
```

### Obunachilar soni:
```bash
curl "https://stypeuz-telegram-bot.<subdomain>.workers.dev/stats?secret=<NOTIFY_SECRET>"
```

---

## 🧹 Bot'ni o'chirish / o'zgartirish

- Bot'ni o'chirish: BotFather → `/deletebot`
- Nomi/rasmini o'zgartirish: BotFather → `/setname`, `/setuserpic`
- Webhook'ni o'chirish: `curl ".../deleteWebhook"`

---

## ❓ Savol-javob

**Q: Obunachi qanday qo'shiladi?**
A: Har kim botga `/start` yozsa avtomatik obuna bo'ladi. `/sub` ham ishlaydi.

**Q: Xabarlar HTML formatda bo'lishi mumkinmi?**
A: Ha — `<b>qalin</b>`, `<i>kursiv</i>`, `<a href="...">havola</a>` ishlaydi.

**Q: NOTIFY_SECRET nima uchun kerak?**
A: `/notify` endpoint'ini boshqalar ishlatmasligi uchun. Uzoq va tasodifiy
bo'lsin (masalan: `k3j9f2n8QzLp7XyW4vB1tR6m`).
