// Satu sumber warna, easing, dan spring untuk animasi hero (Remotion).
// Jangan menulis hex/easing langsung di komponen.
import { Easing } from 'remotion';

export const theme = {
  colors: {
    bg: '#FBF6F0',
    bgAlt: '#F3EAE0',
    surface: '#FFFFFF',
    ink: '#1C1917',
    inkSoft: '#44403C',
    inkDim: '#78716C',
    line: '#E7E0D8',
    primary: '#E8590C', // warna utama — maksimal satu elemen menonjol per frame
    primarySoft: '#FFE5D3',
    accent: '#0F766E',
    accentSoft: '#CCFBF1',
    amberSoft: '#FEF3C7',
    amberInk: '#92400E',
    skySoft: '#E0F2FE',
    skyInk: '#075985',
    indigoSoft: '#E0E7FF',
    indigoInk: '#3730A3',
    map: '#EEE7DD',
    mapBlock: '#E4DBCF',
    park: '#D9EBD3',
    road: '#FFFFFF',
    glow: 'rgba(232, 89, 12, 0.35)',
  },
  fonts: {
    display: '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    counter: { damping: 30, stiffness: 120, mass: 0.8 }, // angka uang: tanpa overshoot
  },
  comp: { width: 720, height: 900, fps: 30 },
} as const;

/** Durasi adegan dalam detik → dikonversi ke frame lewat fps. */
export const SCENE_SECONDS = { pick: 3.6, map: 3.6, seller: 4.2 } as const;

export const sceneFrames = (fps: number) => {
  const pick = Math.round(SCENE_SECONDS.pick * fps);
  const map = Math.round(SCENE_SECONDS.map * fps);
  const seller = Math.round(SCENE_SECONDS.seller * fps);
  return { pick, map, seller, total: pick + map + seller };
};
