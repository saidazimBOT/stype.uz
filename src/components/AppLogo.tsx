import type { CSSProperties } from "react";

interface AppLogoProps {
  size?: number;
  className?: string;
  /** Animation: "glow" (pulsing light) or "spin" (slow rotation) */
  animate?: "glow" | "spin";
  /** Color used for the glow animation (defaults to sky blue) */
  glowColor?: string;
}

/** STuZ glossy circular logo. Reuses /favicon.svg so branding stays in sync. */
export default function AppLogo({
  size = 28,
  className,
  animate,
  glowColor,
}: AppLogoProps) {
  const animClass =
    animate === "glow" ? "logo-glow" : animate === "spin" ? "logo-spin" : "";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static branding asset, no optimization needed
    <img
      src="/favicon.svg"
      alt="STypeUz"
      width={size}
      height={size}
      className={[className, animClass].filter(Boolean).join(" ")}
      style={
        {
          borderRadius: "50%",
          flexShrink: 0,
          display: "block",
          ...(glowColor ? { "--logo-glow": glowColor } : {}),
        } as CSSProperties
      }
      draggable={false}
    />
  );
}
