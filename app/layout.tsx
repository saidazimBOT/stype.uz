import type { Metadata, Viewport } from "next";
import "../src/index.css";

// ── SUPPORTED LANGUAGES ──────────────────────────────────────────────────
const LANGUAGES = [
  "en", "ru", "uz", "de", "fr", "es", "it", "pt", "nl", "pl",
  "tr", "ar", "ja", "zh", "ko", "hi", "th", "vi", "id",
  "sv", "fi", "no", "da", "cs", "ro", "hu", "uk",
];

// ── SEO METADATA ───────────────────────────────────────────────────────────
const siteUrl = "https://styping.uz";
const siteName = "STypeUz";
const title = "STypeUz - Typing Speed Test in 20+ Languages | Improve Your Typing";
const description =
  "Test and improve your typing speed with STypeUz. 20+ languages including Uzbek, Russian, English, and more. 25+ beautiful themes, mini-games, global leaderboards, and progress tracking. Free online typing practice.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: [
    // Core typing keywords
    "typing speed test",
    "typing practice",
    "free typing test",
    "online typing tutor",
    "WPM test",
    "typing speed",
    "keyboard typing",
    "touch typing",
    // Language-specific
    "uzbekcha yozish",
    "uzbek keyboard",
    "clava uz",
    "tez yozish",
    "klaviaturada tez yozish",
    "печать на русском",
    "клавиатурный тренажер",
    "скорость печати",
    "быстрая печать",
    // Regional
    "uzbekistan typing",
    "stypeuz",
    "typing competition",
    "multiplayer typing",
    // Educational
    "learn to type",
    "typing skills",
    "keyboard skills",
    "typing master",
    "typing games",
  ],
  authors: [{ name: "STypeUz Team" }],
  creator: "STypeUz",
  publisher: "STypeUz",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: [
      "ru_RU", "uz_UZ", "de_DE", "fr_FR", "es_ES", "it_IT",
      "pt_PT", "nl_NL", "pl_PL", "tr_TR", "ar_SA", "ja_JP",
      "zh_CN", "ko_KR", "hi_IN",
    ],
    url: siteUrl,
    siteName,
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        secureUrl: `${siteUrl}/og-image.png`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "STypeUz - Typing Speed Test in 20+ Languages | Free Online Typing Practice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@stypeuz",
    creator: "@stypeuz",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        alt: "STypeUz - Typing Speed Test in 20+ Languages | Free Online Typing Practice",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  other: {
    // GEO targeted meta tags for Uzbekistan and CIS region
    "geo.region": "UZ",
    "geo.placename": "Uzbekistan",
    "geo.position": "41.377491;64.585262",
    "ICBM": "41.377491, 64.585262",
    // Mobile optimization
    "format-detection": "telephone=no",
    "HandheldFriendly": "True",
    "MobileOptimized": "320",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090f15" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
};

// ── JSON-LD STRUCTURED DATA ───────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  author: {
    "@type": "Organization",
    name: "STypeUz",
    url: siteUrl,
  },
  inLanguage: LANGUAGES,
  keywords: "typing speed test, typing practice, keyboard training, WPM test, touch typing, stypeuz",
  screenshot: `${siteUrl}/og-image.png`,
  softwareVersion: "3.0",
  image: [
    {
      "@type": "ImageObject",
      url: `${siteUrl}/og-image.png`,
      contentUrl: `${siteUrl}/og-image.png`,
      width: 1200,
      height: 630,
      caption: "STypeUz — Typing Speed Test in 20+ Languages",
      representativeOfPage: true,
    },
    {
      "@type": "ImageObject",
      url: `${siteUrl}/saidazim-stypeuz-developer.webp`,
      contentUrl: `${siteUrl}/saidazim-stypeuz-developer.webp`,
      width: 600,
      height: 901,
      caption: "Saidazim — STypeUz platformasini yaratgan dasturchi",
    },
    {
      "@type": "ImageObject",
      url: `${siteUrl}/stypeuz-team-nf2957.webp`,
      contentUrl: `${siteUrl}/stypeuz-team-nf2957.webp`,
      width: 800,
      height: 1067,
      caption: "NF-2957 — dasturlash guruhining jamoa surati",
    },
    {
      "@type": "ImageObject",
      url: `${siteUrl}/mentor-sunnatbek-yusupov.webp`,
      contentUrl: `${siteUrl}/mentor-sunnatbek-yusupov.webp`,
      width: 480,
      height: 640,
      caption: "Sunnatbek Yusupov — mening ustozim",
    },
  ],
  featureList: [
    "20+ language support",
    "25+ themes",
    "Real-time WPM tracking",
    "Multiplayer racing",
    "Mini games",
    "Progress dashboard",
    "Daily rewards",
    "Weekly missions",
  ],
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect to font providers */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Preconnect for analytics if needed */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/* Hreflang - SPA serves all languages from root */}
        <link rel="alternate" href={siteUrl} hrefLang="x-default" />
        {/* Apple web app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="STypeUz" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#a78bfa" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Google Search Console verification */}
        <meta name="google-site-verification" content="Ry5FFibofm-2BLNxqvFV5Tq9THHJudeYjy9sqqRtJuM" />
        {/* Yandex Webmaster verification */}
        {/* <meta name="yandex-verification" content="YOUR_YANDEX_CODE" /> */}
      </head>
      <body className="antialiased" style={{ backgroundColor: "#090f15" }}>
        {children}
      </body>
    </html>
  );
}
