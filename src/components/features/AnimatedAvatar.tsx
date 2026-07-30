"use client";

import { useState, useEffect } from "react";

const EYE_STYLES = ["circle", "diamond", "star"] as const;
const MOUTH_STYLES = ["smile", "open", "neutral"] as const;

type EyeStyle = typeof EYE_STYLES[number];
type MouthStyle = typeof MOUTH_STYLES[number];
type Expression = "happy" | "excited" | "neutral" | "thinking";

function randomColor(base: string): string {
  const colors = [base, "#22c55e", "#38bdf8", "#f59e0b", "#ec4899", "#a78bfa"];
  return colors[Math.floor(Math.random() * colors.length)];
}

interface AnimatedAvatarProps {
  name?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export default function AnimatedAvatar({
  name = "User",
  color = "#a78bfa",
  size = "md",
  animate = true,
  interactive = false,
  onClick,
}: AnimatedAvatarProps) {
  const [expression, setExpression] = useState<Expression>("neutral");
  const [eyeStyle, setEyeStyle] = useState<EyeStyle>("circle");
  const [mouthStyle, setMouthStyle] = useState<MouthStyle>("smile");
  const [blink, setBlink] = useState(false);
  const [bounce, setBounce] = useState(false);

  const sizes: Record<string, { container: string; text: string; icon: string }> = {
    sm: { container: "w-10 h-10", text: "text-xs", icon: "text-lg" },
    md: { container: "w-16 h-16", text: "text-sm", icon: "text-2xl" },
    lg: { container: "w-24 h-24", text: "text-base", icon: "text-3xl" },
    xl: { container: "w-32 h-32", text: "text-lg", icon: "text-4xl" },
  };

  const s = sizes[size] || sizes.md;

  // Blink animation
  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [animate]);

  // Random expression changes
  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      const expressions: Expression[] = ["happy", "excited", "neutral", "thinking"];
      setExpression(expressions[Math.floor(Math.random() * expressions.length)]);
      setEyeStyle(EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)]);
      setMouthStyle(MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, [animate]);

  const handleClick = () => {
    setBounce(true);
    setExpression("excited");
    setTimeout(() => {
      setBounce(false);
      setExpression("neutral");
    }, 500);
    onClick?.();
  };

  const renderEyes = () => {
    if (blink) {
      return (
        <div className="flex justify-center gap-2">
          <div className="w-1.5 h-0.5 rounded-full" style={{ background: "#fff" }} />
          <div className="w-1.5 h-0.5 rounded-full" style={{ background: "#fff" }} />
        </div>
      );
    }

    switch (eyeStyle) {
      case "diamond":
        return (
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rotate-45" style={{ background: "#fff" }} />
            <div className="w-2 h-2 rotate-45" style={{ background: "#fff" }} />
          </div>
        );
      case "star":
        return (
          <div className="flex justify-center gap-2 text-xs" style={{ color: "#fff" }}>
            <span>✦</span>
            <span>✦</span>
          </div>
        );
      default:
        return (
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />
          </div>
        );
    }
  };

  const renderMouth = () => {
    switch (mouthStyle) {
      case "open":
        return (
          <div
            className="w-3 h-2.5 rounded-full mx-auto mt-0.5"
            style={{ background: "#fff" }}
          />
        );
      case "neutral":
        return (
          <div className="w-3 h-0.5 rounded-full mx-auto mt-1" style={{ background: "#fff" }} />
        );
      default:
        return (
          <div
            className="w-3 h-1.5 rounded-b-full mx-auto mt-0.5"
            style={{
              background: "#fff",
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 60%)",
            }}
          />
        );
    }
  };

  const expressionStyles: Record<Expression, { scale: number; brightness: number }> = {
    happy: { scale: 1.05, brightness: 1.2 },
    excited: { scale: 1.1, brightness: 1.4 },
    thinking: { scale: 0.95, brightness: 0.9 },
    neutral: { scale: 1, brightness: 1 },
  };

  const currentStyle = expressionStyles[expression] || expressionStyles.neutral;

  return (
    <div
      className={`${s.container} rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 cursor-pointer relative`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        transform: `scale(${currentStyle.scale}) ${bounce ? "translateY(-5px)" : ""}`,
        filter: `brightness(${currentStyle.brightness})`,
        boxShadow: animate ? `0 0 20px ${color}44` : "none",
      }}
      onClick={handleClick}
      title={name}
    >
      {/* Glow ring */}
      {animate && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: color }}
        />
      )}

      {/* Face */}
      <div className="flex flex-col items-center">
        {renderEyes()}
        {renderMouth()}
      </div>

      {/* Name tooltip */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {name}
      </div>
    </div>
  );
}

// Exported face component for use elsewhere
export function AvatarFace({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill={color + "33"} />
      <circle cx="7" cy="8" r="1.5" fill={color} />
      <circle cx="13" cy="8" r="1.5" fill={color} />
      <path d="M6 13 Q10 16 14 13" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
