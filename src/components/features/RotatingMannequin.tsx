"use client";

import { useState, useEffect, useRef } from "react";
import HeroAvatar from "./HeroAvatar";
import { type HeroEquip, type HeroSlot, getHeroItem, HERO_SLOT_LABELS, RARITY_COLORS, RARITY_LABELS } from "../../data/shop";
import type { ThemeColors } from "../../types";

interface RotatingMannequinProps {
  equip: HeroEquip;
  color: string;
  t: ThemeColors;
  purchased: string[];
  coins: number;
  onEquipHero: (slot: HeroSlot, itemId: string) => void;
  onPurchase: (itemId: string, price: number) => boolean;
  children?: React.ReactNode;
}

export default function RotatingMannequin({
  equip,
  color,
  t,
  purchased,
  coins,
  onEquipHero,
  onPurchase,
  children,
}: RotatingMannequinProps) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const dragStartX = useRef(0);
  const lastRotation = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;
    const id = setInterval(() => {
      setRotation((r) => r + 0.8);
    }, 16);
    return () => clearInterval(id);
  }, [isAutoRotating, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    dragStartX.current = e.clientX;
    lastRotation.current = rotation;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    setRotation(lastRotation.current + dx * 0.5);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating((v) => !v);
    if (!isAutoRotating) {
      // When resuming auto-rotate, snap to nearest 360
      setRotation((r) => r % 360);
    }
  };

  // Calculate depth info based on rotation
  const normalizedRot = ((rotation % 360) + 360) % 360;
  const isFront = normalizedRot < 90 || normalizedRot > 270;
  const isBack = normalizedRot >= 90 && normalizedRot <= 270;
  const sideFactor = Math.cos((normalizedRot * Math.PI) / 180); // -1 to 1
  const absSide = Math.abs(sideFactor);

  return (
    <div className="relative flex flex-col items-center">
      {/* 3D Stage */}
      <div
        ref={containerRef}
        className="relative w-48 h-56 sm:w-64 sm:h-72 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ perspective: 600 }}
      >
        {/* Platform / shadow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 120 + absSide * 30,
            height: 12,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${color}44, transparent 70%)`,
            filter: "blur(8px)",
            transform: `scaleX(${0.6 + absSide * 0.4})`,
          }}
        />

        {/* Mannequin container — rotates in 3D */}
        <div
          className="absolute inset-0 flex items-end justify-center transition-none"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* The avatar — flips when showing back */}
          <div
            className="transition-transform duration-0"
            style={{
              transform: `scaleX(${sideFactor >= 0 ? 1 : -1})`,
              transformOrigin: "center",
              filter: isBack
                ? `brightness(0.6) saturate(0.4)`
                : `brightness(${0.85 + absSide * 0.15}) saturate(${0.7 + absSide * 0.3})`,
            }}
          >
            <HeroAvatar equip={equip} color={color} size={180} />
          </div>
        </div>

        {/* Rotation indicator ring */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${color}66, ${color}22, ${color}66, ${color}22, ${color}66)`,
            filter: "blur(2px)",
            transform: `rotateX(70deg)`,
          }}
        />
      </div>

      {/* Rotation angle display */}
      <div className="text-xs text-gray-500 font-mono mt-2">
        {Math.round(((normalizedRot + 360) % 360))}°
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={toggleAutoRotate}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{
            background: isAutoRotating ? color + "22" : t.surface,
            color: isAutoRotating ? color : "#6b7280",
            border: `1px solid ${isAutoRotating ? color + "44" : "transparent"}`,
          }}
        >
          {isAutoRotating ? "⏸ Pause" : "▶ Rotate"}
        </button>
        <button
          onClick={() => setRotation(0)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
          style={{ background: t.surface, color: "#6b7280" }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Current outfit badges */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        {(["hat", "glasses", "outfit", "watch"] as HeroSlot[]).map((slot) => {
          const itemId = equip[slot];
          const item = getHeroItem(itemId);
          return (
            <span
              key={slot}
              className="px-2 py-1 rounded-full"
              style={{
                background: (item?.color || color) + "22",
                color: item?.color || color,
              }}
            >
              {HERO_SLOT_LABELS[slot]}: {item?.name || "—"}
            </span>
          );
        })}
      </div>

      {children}
    </div>
  );
}
