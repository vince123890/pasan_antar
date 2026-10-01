// Komponen motion dasar: latar, grade, grain, vignette, entrance, exit, ikon.
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from './theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Latar mesh hangat yang bergerak pelan — tidak pernah polos. */
export function BgMesh() {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 40;
  const d2 = Math.cos(frame / 70) * 36;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div style={{
        position: 'absolute', width: 900, height: 900, borderRadius: '50%', top: -420, left: -260 + d1,
        filter: 'blur(40px)', background: `radial-gradient(circle, ${theme.colors.primary}2e, transparent 62%)`,
      }} />
      <div style={{
        position: 'absolute', width: 760, height: 760, borderRadius: '50%', bottom: -380, right: -240 - d2,
        filter: 'blur(60px)', background: `radial-gradient(circle, ${theme.colors.accent}24, transparent 65%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: `radial-gradient(${theme.colors.line} 1.2px, transparent 1.2px)`,
        backgroundSize: '26px 26px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }} />
    </AbsoluteFill>
  );
}

export function Grade() {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: 'soft-light', opacity: 0.1 }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.04), transparent 25%, transparent 75%, rgba(0,0,0,0.08))' }} />
    </AbsoluteFill>
  );
}

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export function Grain() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', backgroundImage: NOISE, backgroundSize: '220px',
      backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.06, mixBlendMode: 'multiply',
    }} />
  );
}

export function Vignette() {
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 58%, rgba(28,25,23,0.10) 100%)',
    }} />
  );
}

/** Masuk: opacity + naik + skala (spring). */
export function Entrance({ delay = 0, children, from = 28, style, config = theme.spring.smooth }: {
  delay?: number; children: ReactNode; from?: number; style?: CSSProperties;
  config?: (typeof theme.spring)[keyof typeof theme.spring];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config });
  return (
    <div style={{
      opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [from, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Pembungkus adegan: masuk geser dari kanan, keluar lebih cepat ke kiri. */
export function SceneWrap({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: theme.spring.smooth });
  const exitLen = Math.round(fps * 0.33);
  const exit = interpolate(frame, [duration - exitLen, duration - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill style={{
      opacity: Math.min(enter, 1 - exit),
      transform: `translateX(${interpolate(enter, [0, 1], [60, 0]) - exit * 70}px) scale(${interpolate(enter, [0, 1], [0.97, 1])})`,
    }}>
      {children}
    </AbsoluteFill>
  );
}

/** Riak sentuhan jari pada frame tertentu. */
export function Tap({ at, x, y, size = 56 }: { at: number; x: number; y: number; size?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(fps * 0.5);
  const t = interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: theme.ease.out });
  if (frame < at || frame > at + len) return null;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
      background: `${theme.colors.ink}26`, border: `2px solid ${theme.colors.ink}40`,
      transform: `scale(${0.4 + t * 0.9})`, opacity: 1 - t, pointerEvents: 'none',
    }} />
  );
}

/** Tekanan tombol: skala turun sesaat di sekitar frame `at`. */
export function pressScale(frame: number, at: number, fps: number) {
  const len = Math.round(fps * 0.2);
  return interpolate(frame, [at - 2, at + 2, at + len], [1, 0.92, 1], { ...clamp, easing: theme.ease.out });
}

const PATHS: Record<string, string> = {
  bell: 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0',
  pin: 'M12 22s-7-6.2-7-12a7 7 0 1114 0c0 5.8-7 12-7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  scooter: 'M5.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 16.5h7l2-6h-4M15 5h2l1.5 5.5M3 13l2-3h5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-3.5-3.5',
  bag: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0',
  store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 12v8h14v-8M10 20v-5h4v5',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
};

export function Icon({ name, size = 20, color = 'currentColor', stroke = 2 }: {
  name: keyof typeof PATHS | string; size?: number; color?: string; stroke?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export const rp = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;
