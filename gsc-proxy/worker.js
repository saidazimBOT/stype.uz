// ─────────────────────────────────────────────────────────────────────────
//  Google Search Console PROXY  —  Cloudflare Worker
// ─────────────────────────────────────────────────────────────────────────
//  Bu worker Google OAuth + Search Console API ishlarini bajaradi,
//  chunki statik sayt (GitHub Pages) client-secret va refresh token'ni
//  xavfsiz saqlay olmaydi. Worker secret, token va PKCE verifier'ni
//  Workers KV'da saqlaydi — brauzerga hech qachon tushmaydi.
//
//  OQIM:
//    Sayt ──auth-url──▶ Worker ──▶ Google consent sahifasi
//    Google ──code──▶ Worker /callback ──▶ token almashish
//    Worker ──redirect──▶ https://styping.uz/?gsc_connected=1&sid=...
//    Sayt ──POST /analytics (sid)──▶ Worker ──▶ Search Console API ──▶ JSON
//
//  O'RNATISH (bir marta):
//    1. Google Cloud Console → yangi loyiha → "Search Console API" ni yoqish.
//    2. Credentials → OAuth client (Web application) yaratish.
//       Authorized redirect URI: https://<worker>.workers.dev/callback
//       (OAuth consent screen: External, Testing — tokenlar 7 kunda o'ladi;
//        doimiy ishlatish uchun "In production" ga o'tkazing).
//    3. Cloudflare → Workers → Create Worker → bu kodni joylang.
//    4. Workers KV namespace yarating va binding nomini "GSC_KV" qiling.
//    5. Worker Settings → Variables and Secrets:
//         CLIENT_ID      = OAuth client ID
//         CLIENT_SECRET  = OAuth client secret
//         SITE_URL       = https://styping.uz/
//         GSC_PROPERTY   = https://styping.uz/   (yoki sc-domain:styping.uz)
//    6. Deploy: npx wrangler deploy
// ─────────────────────────────────────────────────────────────────────────

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_BASE = "https://www.googleapis.com/webmasters/v3/sites";

function siteRoot(env) {
  return (env.SITE_URL || "https://styping.uz/").replace(/\/+$/, "") + "/";
}

function gscProperty(env) {
  return env.GSC_PROPERTY || "https://styping.uz/";
}

function callbackUrl(env, url) {
  // Worker o'zining /callback manzilini biladi (OAuth redirect URI shu bo'ladi)
  return new URL("/callback", url.origin).toString();
}

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomVerifier() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256Challenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(digest);
}

function json(data, status = 200, origin) {
  const headers = { "Content-Type": "application/json" };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(data), { status, headers });
}

// Faqat SAYT'ning o'z originiga ruxsat — boshqa saytlar sid'ni o'g'irlab
// foydalana olmasin (CORS cheklovi). Origin bo'lmasa (curl va h.k.) — ruxsat.
function allowedOrigin(req, env) {
  const origin = req.headers.get("Origin");
  if (!origin) return null;
  const site = new URL(siteRoot(env)).origin;
  return origin === site ? origin : undefined; // undefined = taqiqlangan
}

function cors(req, origin) {
  if (req.method === "OPTIONS") {
    const headers = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (origin) headers["Access-Control-Allow-Origin"] = origin;
    return new Response(null, { headers });
  }
  return null;
}

async function exchangeCode(env, code, verifier, redirectUri) {
  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const r = await fetch(TOKEN_URL, { method: "POST", body });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) {
    throw new Error(j.error_description || j.error || "Token almashishda xato");
  }
  return j; // { access_token, refresh_token, expires_in, ... }
}

async function refreshAccessToken(env, refreshToken) {
  const body = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch(TOKEN_URL, { method: "POST", body });
  const j = await r.json();
  if (!r.ok || !j.access_token) {
    throw new Error(j.error_description || j.error || "Token yangilashda xato");
  }
  return j;
}

async function getAccessToken(env, sid) {
  const key = `access:${sid}`;
  const cached = await env.GSC_KV.get(key, "json");
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const refresh = await env.GSC_KV.get(`token:${sid}`);
  if (!refresh) throw new Error("Sessiya topilmadi. Qayta ulaning.");
  let j;
  try {
    j = await refreshAccessToken(env, refresh);
  } catch (e) {
    // Refresh token o'lik bo'lsa (7 kunlik Testing muddati) sessiyani tozalaymiz
    if (/invalid_grant|unauthorized_client/i.test(String(e.message || e))) {
      await env.GSC_KV.delete(`token:${sid}`);
      await env.GSC_KV.delete(key);
    }
    throw e;
  }
  const expiresAt = Date.now() + (j.expires_in || 3600) * 1000;
  await env.GSC_KV.put(key, JSON.stringify({ token: j.access_token, expiresAt }), {
    expirationTtl: (j.expires_in || 3600) + 300,
  });
  return j.access_token;
}

async function querySearchConsole(env, sid, payload) {
  const token = await getAccessToken(env, sid);
  const site = encodeURIComponent(gscProperty(env));
  const r = await fetch(`${GSC_BASE}/${site}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: payload.startDate,
      endDate: payload.endDate,
      dimensions: payload.dimensions || [],
      rowLimit: Math.min(payload.rowLimit || 1000, 25000),
      searchType: payload.searchType || "web",
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = j.error?.message || `Search Console API xatosi (${r.status})`;
    if (r.status === 401 || r.status === 403) {
      // refresh token ham o'lik bo'lishi mumkin → sessiyani tozalash
      throw Object.assign(new Error(String(err)), { code: 401 });
    }
    throw new Error(String(err));
  }
  return j.rows || [];
}

async function handleAuthUrl(req, env, origin) {
  const u = new URL(req.url);
  const state = u.searchParams.get("state") || Math.random().toString(36).slice(2);
  const verifier = randomVerifier();
  const challenge = await sha256Challenge(verifier);

  // Verifier'ni KV'da 10 daqiqa saqlaymiz (callback paytida kerak bo'ladi)
  await env.GSC_KV.put(`verifier:${state}`, verifier, { expirationTtl: 600 });

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    redirect_uri: callbackUrl(env, req.url),
    response_type: "code",
    scope: GSC_SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return json({ url: `${AUTH_URL}?${params.toString()}` }, 200, origin);
}

async function handleCallback(req, env) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const error = u.searchParams.get("error");

  if (error || !code) {
    return Response.redirect(`${siteRoot(env)}?gsc_connected=0&error=${encodeURIComponent(error || "cancel")}`);
  }
  const verifier = await env.GSC_KV.get(`verifier:${state || ""}`);
  if (!verifier) {
    return Response.redirect(`${siteRoot(env)}?gsc_connected=0&error=state`);
  }
  try {
    const tok = await exchangeCode(env, code, verifier, callbackUrl(env, req.url));
    const sid = base64url(crypto.getRandomValues(new Uint8Array(18)));
    await env.GSC_KV.put(`token:${sid}`, tok.refresh_token, { expirationTtl: 60 * 24 * 3600 });
    await env.GSC_KV.delete(`verifier:${state}`);
    return Response.redirect(`${siteRoot(env)}?gsc_connected=1&gsc_sid=${sid}`);
  } catch (e) {
    return Response.redirect(`${siteRoot(env)}?gsc_connected=0&error=${encodeURIComponent(String(e.message || e))}`);
  }
}

async function handleAnalytics(req, env, origin) {
  const payload = await req.json().catch(() => ({}));
  if (!payload.sid || !payload.startDate || !payload.endDate) {
    return json({ error: "sid va sana diapazoni kerak" }, 400, origin);
  }
  try {
    const rows = await querySearchConsole(env, payload.sid, payload);
    return json({ rows }, 200, origin);
  } catch (e) {
    const status = e.code === 401 ? 401 : 502;
    return json({ error: String(e.message || e) }, status, origin);
  }
}

export default {
  async fetch(req, env) {
    const origin = allowedOrigin(req, env);
    if (origin === undefined) {
      return json({ error: "Forbidden origin" }, 403, req.headers.get("Origin"));
    }
    const pre = cors(req, origin);
    if (pre) return pre;

    const u = new URL(req.url);
    if (u.pathname === "/auth-url" && req.method === "GET") return handleAuthUrl(req, env, origin);
    if (u.pathname === "/callback" && req.method === "GET") return handleCallback(req, env);
    if (u.pathname === "/analytics" && req.method === "POST") return handleAnalytics(req, env, origin);
    if (u.pathname === "/health") return json({ ok: true, property: gscProperty(env) }, 200, origin);

    return json({ error: "Not found" }, 404, origin);
  },
};
