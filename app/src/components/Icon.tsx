// Ikon garis (SVG) agar warna mengikuti tema — pengganti emoji di landing page.
const PATHS = {
  bell: 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0',
  pin: 'M12 22s-7-6.2-7-12a7 7 0 1114 0c0 5.8-7 12-7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  link: 'M10 14a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5M14 10a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  wallet: 'M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14.5h.01',
  scooter: 'M5.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 16.5h7l2-6h-4M15 5h2l1.5 5.5M3 13l2-3h5',
  cash: 'M3 6h18v12H3zM12 15a3 3 0 100-6 3 3 0 000 6zM6 9v.01M18 15v.01',
  store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 12v8h14v-8M10 20v-5h4v5',
  cart: 'M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.6L20.5 8H6.2M10 21h.01M17 21h.01',
  coffee: 'M4 8h13v5a6 6 0 01-6 6H10a6 6 0 01-6-6V8zM17 9h1.5a2.5 2.5 0 010 5H17M8 2v3M12 2v3',
  bowl: 'M3 11h18a9 9 0 01-18 0zM7 7c0-1 1-1 1-2s-1-1-1-2M12 7c0-1 1-1 1-2s-1-1-1-2M17 7c0-1 1-1 1-2s-1-1-1-2',
  cake: 'M4 21V12a2 2 0 012-2h12a2 2 0 012 2v9M3 21h18M4 15c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M12 10V7M12 4v.01',
  leaf: 'M5 20c7 0 14-5 14-15C9 5 4 10 4 16c0 1.5.4 2.8 1 4zM5 20c3-5 6-8 10-10',
  brick: 'M3 5h18v14H3zM3 12h18M9 5v7M15 12v7',
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  phone: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
