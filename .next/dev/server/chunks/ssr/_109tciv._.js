module.exports = [
"[project]/app/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout,
    "metadata",
    ()=>metadata,
    "viewport",
    ()=>viewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
;
// ── SUPPORTED LANGUAGES ──────────────────────────────────────────────────
const LANGUAGES = [
    "en",
    "ru",
    "uz",
    "de",
    "fr",
    "es",
    "it",
    "pt",
    "nl",
    "pl",
    "tr",
    "ar",
    "ja",
    "zh",
    "ko",
    "hi",
    "th",
    "vi",
    "id",
    "sv",
    "fi",
    "no",
    "da",
    "cs",
    "ro",
    "hu",
    "uk"
];
// ── SEO METADATA ───────────────────────────────────────────────────────────
const siteUrl = "https://stypeuz.com";
const siteName = "STypeUz";
const title = "STypeUz - Typing Speed Test in 20+ Languages | Improve Your Typing";
const description = "Test and improve your typing speed with STypeUz. 20+ languages including Uzbek, Russian, English, and more. 25+ beautiful themes, mini-games, global leaderboards, and progress tracking. Free online typing practice.";
const metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: title,
        template: `%s | ${siteName}`
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
        "typing games"
    ],
    authors: [
        {
            name: "STypeUz Team"
        }
    ],
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
            "max-snippet": -1
        }
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        alternateLocale: [
            "ru_RU",
            "uz_UZ",
            "de_DE",
            "fr_FR",
            "es_ES",
            "it_IT",
            "pt_PT",
            "nl_NL",
            "pl_PL",
            "tr_TR",
            "ar_SA",
            "ja_JP",
            "zh_CN",
            "ko_KR",
            "hi_IN"
        ],
        url: siteUrl,
        siteName,
        title,
        description,
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "STypeUz - Typing Speed Test"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        site: "@stypeuz",
        creator: "@stypeuz",
        title,
        description,
        images: [
            "/og-image.png"
        ]
    },
    icons: {
        icon: [
            {
                url: "/favicon.svg",
                type: "image/svg+xml"
            },
            {
                url: "/icon-192.svg",
                sizes: "192x192",
                type: "image/svg+xml"
            },
            {
                url: "/icon-512.svg",
                sizes: "512x512",
                type: "image/svg+xml"
            }
        ],
        apple: [
            {
                url: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png"
            }
        ]
    },
    manifest: "/manifest.json",
    alternates: {
        canonical: siteUrl
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
        "MobileOptimized": "320"
    }
};
const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        {
            media: "(prefers-color-scheme: dark)",
            color: "#0f0f13"
        },
        {
            media: "(prefers-color-scheme: light)",
            color: "#ffffff"
        }
    ],
    colorScheme: "dark light"
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
        availability: "https://schema.org/InStock"
    },
    author: {
        "@type": "Organization",
        name: "STypeUz",
        url: siteUrl
    },
    inLanguage: LANGUAGES,
    keywords: "typing speed test, typing practice, keyboard training, WPM test, touch typing, stypeuz",
    screenshot: `${siteUrl}/og-image.png`,
    softwareVersion: "3.0",
    featureList: [
        "20+ language support",
        "25+ themes",
        "Real-time WPM tracking",
        "Multiplayer racing",
        "Mini games",
        "Progress dashboard",
        "Daily rewards",
        "Weekly missions"
    ]
};
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        suppressHydrationWarning: true,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("head", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
                        type: "application/ld+json",
                        dangerouslySetInnerHTML: {
                            __html: JSON.stringify(jsonLd)
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "preconnect",
                        href: "https://fonts.googleapis.com"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "preconnect",
                        href: "https://fonts.gstatic.com",
                        crossOrigin: "anonymous"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap",
                        rel: "stylesheet"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "dns-prefetch",
                        href: "https://fonts.googleapis.com"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 199,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "dns-prefetch",
                        href: "https://fonts.gstatic.com"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "preconnect",
                        href: "https://www.googletagmanager.com"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "alternate",
                        href: siteUrl,
                        hrefLang: "x-default"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 204,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "apple-mobile-web-app-capable",
                        content: "yes"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "apple-mobile-web-app-status-bar-style",
                        content: "black-translucent"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "apple-mobile-web-app-title",
                        content: "STypeUz"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "msapplication-TileColor",
                        content: "#a78bfa"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "msapplication-config",
                        content: "/browserconfig.xml"
                    }, void 0, false, {
                        fileName: "[project]/app/layout.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/layout.tsx",
                lineNumber: 184,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
                className: "antialiased",
                children: children
            }, void 0, false, {
                fileName: "[project]/app/layout.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/layout.tsx",
        lineNumber: 183,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-rsc] (ecmascript)").vendored['react-rsc'].ReactJsxDevRuntime;
}),
];

//# sourceMappingURL=_109tciv._.js.map