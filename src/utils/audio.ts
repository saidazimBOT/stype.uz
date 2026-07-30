import type { MutableRefObject } from "react";

// Audio utilities for keyboard sounds
export function mkClick(ctx: AudioContext): AudioBuffer {
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++)
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  return b;
}

export function mkErr(ctx: AudioContext): void {
  try {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 200;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start();
    o.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio errors
  }
}

export function mkWin(ctx: AudioContext): void {
  [523, 659, 784].forEach((f, i) => {
    try {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.3);
    } catch {
      // Ignore audio errors
    }
  });
}

export interface AudioController {
  playClick: () => void;
  playError: () => void;
  playWin: () => void;
  getACtx: () => AudioContext;
}

export function createAudioController(
  audioCtxRef: MutableRefObject<AudioContext | null>,
  clickBufRef: MutableRefObject<AudioBuffer | null>
): AudioController {
  const getACtx = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      clickBufRef.current = mkClick(audioCtxRef.current);
    }
    return audioCtxRef.current;
  };

  const playClick = (): void => {
    try {
      const ctx = getACtx();
      const s = ctx.createBufferSource();
      s.buffer = clickBufRef.current;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      s.connect(g);
      g.connect(ctx.destination);
      s.start();
    } catch {
      // Ignore audio errors
    }
  };

  const playError = (): void => {
    try {
      mkErr(getACtx());
    } catch {
      // Ignore audio errors
    }
  };

  const playWin = (): void => {
    try {
      mkWin(getACtx());
    } catch {
      // Ignore audio errors
    }
  };

  return { playClick, playError, playWin, getACtx };
}
