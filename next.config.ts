import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // convex/_generated fayllari STUB bo'lgani uchun (npx convex codegen ishga
  // tushmaguncha any tip qaytaradi) build paytida TS tekshiruvini o'tkazib yuboramiz.
  // Haqiqiy xatolar uchun lokal: npx tsc --noEmit -p tsconfig.validate.json
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
