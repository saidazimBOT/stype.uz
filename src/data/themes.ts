import type { ThemeColors, ThemeGroup } from "../types";

// 25+ Premium Themes + VS Code Theme
export const THEMES: Record<string, ThemeColors> = {
  // Default
  default: { name: "Default Purple", accent: "#a78bfa", bg: "#0f0f13", surface: "#1a1a24", color: "#e5e7eb" },
  gold: { name: "Royal Gold", accent: "#f59e0b", bg: "#0f0e09", surface: "#1c1a10", color: "#e5e7eb" },
  pink: { name: "Neon Pink", accent: "#ec4899", bg: "#130a10", surface: "#1f1020", color: "#e5e7eb" },
  blue: { name: "Ocean Blue", accent: "#38bdf8", bg: "#090f15", surface: "#0d1825", color: "#e5e7eb" },
  green: { name: "Forest Green", accent: "#22c55e", bg: "#090f0c", surface: "#0e1a12", color: "#e5e7eb" },

  // Premium Dark Themes
  midnight: { name: "Midnight", accent: "#6366f1", bg: "#080810", surface: "#12121e", color: "#e5e7eb" },
  cyberpunk: { name: "Cyberpunk", accent: "#ff0080", bg: "#0a0015", surface: "#1a0028", color: "#e5e7eb" },
  matrix: { name: "Matrix", accent: "#00ff41", bg: "#000a00", surface: "#001a00", color: "#e5e7eb" },
  sunset: { name: "Sunset", accent: "#ff6b35", bg: "#120804", surface: "#1f1008", color: "#e5e7eb" },
  nord: { name: "Nord", accent: "#88c0d0", bg: "#0d1117", surface: "#161b22", color: "#e5e7eb" },
  dracula: { name: "Dracula", accent: "#bd93f9", bg: "#0b0a10", surface: "#1c1b22", color: "#e5e7eb" },
  tokyo: { name: "Tokyo Night", accent: "#7aa2f7", bg: "#0f111a", surface: "#1a1b26", color: "#e5e7eb" },
  synthwave: { name: "Synthwave", accent: "#ff7edb", bg: "#0e001a", surface: "#1e0030", color: "#e5e7eb" },
  darkruby: { name: "Dark Ruby", accent: "#ff2040", bg: "#0d0505", surface: "#1a0a0a", color: "#e5e7eb" },
  emerald: { name: "Emerald", accent: "#10b981", bg: "#050c08", surface: "#0d1a12", color: "#e5e7eb" },
  amethyst: { name: "Amethyst", accent: "#c084fc", bg: "#0e0a15", surface: "#1c1428", color: "#e5e7eb" },

  // Premium Light Themes
  light: { name: "Pure Light", accent: "#7c3aed", bg: "#ffffff", surface: "#f3f4f6", color: "#1f2937" },
  warm: { name: "Warm Paper", accent: "#d97706", bg: "#fef9ef", surface: "#fdf3e0", color: "#1f2937" },
  sakura: { name: "Sakura", accent: "#e04098", bg: "#fef5f9", surface: "#fce8f1", color: "#1f2937" },
  mint: { name: "Fresh Mint", accent: "#059669", bg: "#f0fdf4", surface: "#ecfdf5", color: "#1f2937" },
  sky: { name: "Clear Sky", accent: "#2563eb", bg: "#f4f8ff", surface: "#ebf4ff", color: "#1f2937" },
  peachy: { name: "Peachy", accent: "#f97316", bg: "#fef6f1", surface: "#ffede3", color: "#1f2937" },

  // VS Code Inspired
  vscode_dark: { name: "VS Code Dark", accent: "#007acc", bg: "#1e1e1e", surface: "#252526", color: "#cccccc" },
  vscode_light: { name: "VS Code Light", accent: "#0066b8", bg: "#ffffff", surface: "#f3f3f3", color: "#333333" },
  one_dark: { name: "One Dark Pro", accent: "#61afef", bg: "#282c34", surface: "#2c313a", color: "#abb2bf" },
  monokai: { name: "Monokai", accent: "#a6e22e", bg: "#272822", surface: "#2d2e27", color: "#f8f8f2" },
  github: { name: "GitHub Dark", accent: "#58a6ff", bg: "#0d1117", surface: "#161b22", color: "#c9d1d9" },
  cobalt: { name: "Cobalt", accent: "#ff9d00", bg: "#002240", surface: "#002d54", color: "#e5e7eb" },
  material: { name: "Material", accent: "#80cbc4", bg: "#263238", surface: "#2d3a41", color: "#eeffff" },
};

export const THEME_LIST: (ThemeColors & { id: string })[] = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }));

export const THEME_GROUPS: ThemeGroup[] = [
  {
    name: "Classic",
    themes: ["default", "gold", "pink", "blue", "green"],
  },
  {
    name: "Dark Premium",
    themes: ["midnight", "cyberpunk", "matrix", "sunset", "nord", "dracula", "tokyo", "synthwave", "darkruby", "emerald", "amethyst"],
  },
  {
    name: "Light",
    themes: ["light", "warm", "sakura", "mint", "sky", "peachy"],
  },
  {
    name: "VS Code Inspired",
    themes: ["vscode_dark", "vscode_light", "one_dark", "monokai", "github", "cobalt", "material"],
  },
];

export const FONT_SIZES: Record<string, string> = { sm: "text-base", md: "text-lg", lg: "text-xl", xl: "text-2xl" };
export const DURATIONS: (number | string)[] = [15, 30, 60, "∞"];
