// Animasi hero landing page: pembeli pesan → ongkir otomatis → penjual terima & antar.
// Dipakai lewat @remotion/player (landing) dan bisa dirender ke video/still via CLI.
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BgMesh, Entrance, Grade, Grain, Icon, pressScale, rp, SceneWrap, Tap, Vignette } from './primitives';
import { sceneFrames, theme } from './theme';

const C = theme.colors;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Geometri HP di kanvas 720×900
export const PHONE = { w: 360, h: 720, x: 180, y: 150, bezel: 11 };
export const SCREEN = { w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2 };

export function HeroStory() {
  const { fps } = useVideoConfig();
  const s = sceneFrames(fps);
  return (
    <AbsoluteFill style={{ fontFamily: theme.fonts.display, color: C.ink }}>
      <BgMesh />
      <Sequence durationInFrames={s.pick} layout="none"><Caption n={1} text="Pembeli pilih barang" duration={s.pick} /></Sequence>
      <Sequence from={s.pick} durationInFrames={s.map} layout="none"><Caption n={2} text="Tandai lokasi, ongkir otomatis" duration={s.map} /></Sequence>
      <Sequence from={s.pick + s.map} durationInFrames={s.seller} layout="none"><Caption n={3} text="Penjual terima & antar" duration={s.seller} /></Sequence>

      <Phone>
        <Sequence durationInFrames={s.pick}><SceneWrap duration={s.pick}><PickScreen /></SceneWrap></Sequence>
        <Sequence from={s.pick} durationInFrames={s.map}><SceneWrap duration={s.map}><MapScreen /></SceneWrap></Sequence>
        <Sequence from={s.pick + s.map} durationInFrames={s.seller}><SceneWrap duration={s.seller}><SellerScreen /></SceneWrap></Sequence>
      </Phone>

      <Sequence durationInFrames={s.pick} layout="none">
        <Chip duration={s.pick} delay={Math.round(fps * 0.5)} x={520} y={292} icon="check">Tanpa daftar</Chip>
      </Sequence>
      <Sequence from={s.pick} durationInFrames={s.map} layout="none">
        <Chip duration={s.map} delay={Math.round(fps * 1.6)} x={24} y={470} icon="sparkle">Dihitung otomatis</Chip>
      </Sequence>
      <Sequence from={s.pick + s.map} durationInFrames={s.seller} layout="none">
        <Chip duration={s.seller} delay={Math.round(fps * 0.9)} x={536} y={420} icon="store">0% komisi</Chip>
      </Sequence>

      <Grade />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
export function Phone({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: theme.spring.smooth });
  const float = Math.sin(frame / 30) * 4;
  const tilt = Math.sin(frame / 45) * 0.5;
  return (
    <div style={{
      position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h,
      borderRadius: 56, background: C.ink, padding: PHONE.bezel,
      boxShadow: '0 50px 90px -30px rgba(28,25,23,0.45), 0 18px 36px -18px rgba(28,25,23,0.35)',
      transform: `translateY(${float + (1 - intro) * 0}px) rotate(${tilt}deg)`,
    }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 46, overflow: 'hidden', background: '#FAFAF9' }}>
        {children}
        <div style={{ position: 'absolute', top: 10, left: '50%', width: 104, height: 28, marginLeft: -52, borderRadius: 20, background: C.ink }} />
      </div>
    </div>
  );
}

function Caption({ n, text, duration }: { n: number; text: string; duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exitLen = Math.round(fps * 0.3);
  const exit = interpolate(frame, [duration - exitLen, duration - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const badge = spring({ frame, fps, config: theme.spring.bouncy });
  return (
    <div style={{
      position: 'absolute', top: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
      opacity: 1 - exit, transform: `translateY(${-exit * 24}px)`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 22, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, fontWeight: 800, transform: `scale(${badge})`,
      }}>{n}</div>
      <div style={{ display: 'flex', gap: 9, fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em' }}>
        {text.split(' ').map((w, i) => {
          const p = spring({ frame: frame - 3 - i * 3, fps, config: theme.spring.snappy });
          return (
            <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)` }}>{w}</span>
          );
        })}
      </div>
    </div>
  );
}

export function Chip({ children, icon, x, y, delay, duration }: {
  children: ReactNode; icon: string; x: number; y: number; delay: number; duration: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  const exitLen = Math.round(fps * 0.3);
  const exit = interpolate(frame, [duration - exitLen, duration - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const float = Math.sin((frame + x) / 24) * 5;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px 12px 12px', borderRadius: 18, background: C.surface, fontSize: 19, fontWeight: 700,
      boxShadow: '0 18px 40px -16px rgba(28,25,23,0.35)', border: `1px solid ${C.line}`,
      opacity: p * (1 - exit), transform: `translateY(${interpolate(p, [0, 1], [24, 0]) + float - exit * 16}px) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
    }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={C.accent} stroke={2.4} />
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adegan 1: katalog toko, pembeli menambah barang
const PRODUCTS = [
  { name: 'Indomie Goreng', price: 3500, tint: '#FDE68A' },
  { name: 'Telur Ayam', price: 2500, tint: '#FED7AA' },
  { name: 'Es Teh Manis', price: 4000, tint: '#BBF7D0' },
  { name: 'Gas Elpiji 3 kg', price: 22000, tint: '#BFDBFE' },
];
const ROW = { top: 186, h: 70 };
const BTN = { w: 78, h: 34, right: 16 };

export function PickScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const taps = [
    { row: 0, at: Math.round(fps * 0.9) },
    { row: 0, at: Math.round(fps * 1.3) },
    { row: 1, at: Math.round(fps * 1.75) },
    { row: 2, at: Math.round(fps * 2.2) },
  ];
  const done = taps.filter(t => t.at <= frame);
  const qty = (row: number) => done.filter(t => t.row === row).length;
  const totalAfter = (k: number) => taps.slice(0, k).reduce((s, t) => s + PRODUCTS[t.row].price, 0);
  const last = done.length;
  const pTotal = last ? spring({ frame: frame - taps[last - 1].at, fps, config: theme.spring.counter }) : 0;
  const shownTotal = last ? totalAfter(last - 1) + (totalAfter(last) - totalAfter(last - 1)) * pTotal : 0;
  const count = done.length;
  const bar = taps.length ? spring({ frame: frame - taps[0].at - 2, fps, config: theme.spring.smooth }) : 0;
  const btnX = SCREEN.w - BTN.right - BTN.w / 2;

  return (
    <AbsoluteFill style={{ background: '#FAFAF9' }}>
      <div style={{ position: 'absolute', top: 50, left: 16, right: 16 }}>
        <Entrance delay={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="store" size={24} color={C.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Warung Bu Sri</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>● Buka • antar s/d 15 km</div>
            </div>
          </div>
        </Entrance>
        <Entrance delay={6}>
          <div style={{ marginTop: 14, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: C.inkDim, fontSize: 13 }}>
            <Icon name="search" size={16} color={C.inkDim} /> Cari di Warung Bu Sri…
          </div>
        </Entrance>
      </div>

      {PRODUCTS.map((p, i) => {
        const q = qty(i);
        const lastTapForRow = [...done].reverse().find(t => t.row === i);
        const pop = lastTapForRow ? spring({ frame: frame - lastTapForRow.at, fps, config: theme.spring.bouncy }) : 1;
        const tapAt = taps.find(t => t.row === i && Math.abs(frame - t.at) < fps * 0.25)?.at;
        return (
          <div key={p.name} style={{ position: 'absolute', top: ROW.top + i * ROW.h, left: 16, right: 16, height: ROW.h - 8 }}>
            <Entrance delay={10 + i * 4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: ROW.h - 8, borderBottom: `1px solid ${C.line}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: p.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="bag" size={20} color={C.inkSoft} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.inkSoft }}>{rp(p.price)}</div>
                </div>
                <div style={{ width: BTN.w, height: BTN.h, transform: `scale(${tapAt ? pressScale(frame, tapAt, fps) : 1})` }}>
                  {q === 0 ? (
                    <div style={{ height: '100%', borderRadius: 10, border: `1.5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>Tambah</div>
                  ) : (
                    <div style={{ height: '100%', borderRadius: 10, border: `1.5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 9px', fontSize: 16, fontWeight: 800 }}>
                      <span>−</span>
                      <span style={{ display: 'inline-block', transform: `scale(${interpolate(pop, [0, 1], [1.5, 1])})` }}>{q}</span>
                      <span>+</span>
                    </div>
                  )}
                </div>
              </div>
            </Entrance>
          </div>
        );
      })}

      {taps.map((t, k) => (
        <Tap key={k} at={t.at} x={btnX + (qtyBefore(taps, k, t.row) > 0 ? 26 : 0)} y={ROW.top + t.row * ROW.h + (ROW.h - 8) / 2} />
      ))}

      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 22, height: 58, borderRadius: 18, background: C.primary, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontWeight: 800, fontSize: 16,
        boxShadow: `0 16px 30px -12px ${C.glow}`,
        opacity: bar, transform: `translateY(${interpolate(bar, [0, 1], [90, 0])}px)`,
      }}>
        <span>{count} item</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>Lanjut • {rp(Math.round(shownTotal / 100) * 100)}</span>
      </div>
    </AbsoluteFill>
  );
}

const qtyBefore = (taps: { row: number }[], k: number, row: number) => taps.slice(0, k).filter(t => t.row === row).length;

// ---------------------------------------------------------------------------
// Adegan 2: peta, pin, rute, jarak & ongkir
const MAP = { top: 92, h: 380 };
const STORE_PT = { x: 84, y: 290 };
const BUYER_PT = { x: 252, y: 132 };
const ROUTE = `M${STORE_PT.x} ${STORE_PT.y} L${STORE_PT.x} 200 L${BUYER_PT.x} 200 L${BUYER_PT.x} ${BUYER_PT.y}`;
const ROUTE_LEN = (STORE_PT.y - 200) + (BUYER_PT.x - STORE_PT.x) + (200 - BUYER_PT.y);

function Pin({ x, y, color, delay, label }: { x: number; y: number; color: string; delay: number; label: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  const drop = interpolate(p, [0, 1], [-70, 0]);
  return (
    <>
      <div style={{
        position: 'absolute', left: x - 12, top: y - 4, width: 24, height: 8, borderRadius: '50%', background: 'rgba(28,25,23,0.25)',
        transform: `scale(${p})`, opacity: p,
      }} />
      <div style={{ position: 'absolute', left: x - 18, top: y - 44 + drop, opacity: Math.min(1, p * 2) }}>
        <svg width="36" height="44" viewBox="0 0 36 44">
          <path d="M18 43s-15-13.5-15-25a15 15 0 1130 0c0 11.5-15 25-15 25z" fill={color} stroke="#fff" strokeWidth="3" />
          <circle cx="18" cy="18" r="6" fill="#fff" />
        </svg>
        <div style={{
          position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: '3px 8px',
          borderRadius: 8, background: C.surface, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
        }}>{label}</div>
      </div>
    </>
  );
}

export function MapScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const route = interpolate(frame, [fps * 1.0, fps * 1.8], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const km = interpolate(frame, [fps * 1.0, fps * 1.9], [0, 3.9], { ...clamp, easing: theme.ease.out });
  const free = spring({ frame: frame - Math.round(fps * 2.0), fps, config: theme.spring.bouncy });
  const sheet = spring({ frame: frame - 6, fps, config: theme.spring.smooth });
  const pressAt = Math.round(fps * 2.9);
  const breathe = 1 + Math.sin(frame / 14) * 0.04;

  return (
    <AbsoluteFill style={{ background: '#FAFAF9' }}>
      <div style={{ position: 'absolute', top: 52, left: 18, right: 18, fontSize: 18, fontWeight: 800 }}>
        <Entrance delay={2}>Lokasi pengantaran</Entrance>
      </div>

      <div style={{ position: 'absolute', top: MAP.top, left: 0, right: 0, height: MAP.h, background: C.map, overflow: 'hidden' }}>
        <svg width={SCREEN.w} height={MAP.h} style={{ position: 'absolute', inset: 0 }}>
          {[[14, 14, 54, 160], [120, 14, 110, 160], [270, 14, 60, 90], [14, 214, 54, 140], [120, 214, 110, 60], [270, 214, 60, 150]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx={8} fill={C.mapBlock} />
          ))}
          <rect x={120} y={290} width={110} height={76} rx={10} fill={C.park} />
          {[[0, 200, SCREEN.w, 200], [84, 0, 84, MAP.h], [252, 0, 252, MAP.h], [0, 106, SCREEN.w, 106]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.road} strokeWidth={i === 0 ? 14 : 10} strokeLinecap="round" />
          ))}
          <circle cx={STORE_PT.x} cy={STORE_PT.y} r={150 * breathe} fill={`${C.accent}12`} stroke={C.accent} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="5 6" />
          <path d={ROUTE} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN * (1 - route)} />
        </svg>
        <Pin x={STORE_PT.x} y={STORE_PT.y} color={C.ink} delay={8} label="Toko" />
        <Pin x={BUYER_PT.x} y={BUYER_PT.y} color={C.primary} delay={Math.round(fps * 0.6)} label="Rumah Dimas" />
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: MAP.top + MAP.h - 16, borderRadius: '22px 22px 0 0',
        background: C.surface, padding: '18px 18px 0', boxShadow: '0 -10px 30px -18px rgba(0,0,0,0.3)',
        transform: `translateY(${interpolate(sheet, [0, 1], [120, 0])}px)`,
      }}>
        <Row label="Jarak" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>±{km.toFixed(1).replace('.', ',')} km</span>} />
        <Row label="Ongkir" value={
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: C.accentSoft, color: C.accent, fontWeight: 800,
            opacity: free, transform: `scale(${interpolate(free, [0, 1], [0.6, 1])})`,
          }}>GRATIS</span>
        } />
        <Row label="Total" value={<b>{rp(13500)}</b>} />
        <div style={{
          marginTop: 12, height: 50, borderRadius: 14, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, fontSize: 16, transform: `scale(${pressScale(frame, pressAt, fps)})`,
        }}>Pesan • {rp(13500)}</div>
      </div>
      <Tap at={pressAt} x={SCREEN.w / 2} y={SCREEN.h - 84} size={64} />
    </AbsoluteFill>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34, fontSize: 15 }}>
      <span style={{ color: C.inkDim, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adegan 3: HP penjual — notifikasi, terima, diantar
export function SellerScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const notifIn = spring({ frame: frame - Math.round(fps * 0.25), fps, config: theme.spring.bouncy });
  const notifOut = interpolate(frame, [fps * 1.45, fps * 1.75], [0, 1], { ...clamp, easing: theme.ease.in });
  const ringT = frame - Math.round(fps * 0.35);
  const ring = ringT > 0 ? Math.sin(ringT * 1.6) * 18 * Math.exp(-ringT / 12) : 0;
  const acceptAt = Math.round(fps * 1.9);
  const deliverAt = Math.round(fps * 2.6);
  const status = frame < acceptAt + 2 ? 'baru' : frame < deliverAt ? 'diterima' : 'diantar';
  const statusPop = spring({ frame: frame - (status === 'diantar' ? deliverAt : status === 'diterima' ? acceptAt + 2 : 0), fps, config: theme.spring.bouncy });
  const track = interpolate(frame, [deliverAt, fps * 3.8], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const swap = spring({ frame: frame - deliverAt, fps, config: theme.spring.smooth });

  const badge = {
    baru: { text: 'Baru', bg: C.amberSoft, fg: C.amberInk },
    diterima: { text: 'Diterima', bg: C.skySoft, fg: C.skyInk },
    diantar: { text: 'Diantar', bg: C.indigoSoft, fg: C.indigoInk },
  }[status];

  return (
    <AbsoluteFill style={{ background: '#FAFAF9' }}>
      <div style={{ position: 'absolute', top: 50, left: 16, right: 16 }}>
        <Entrance delay={2}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Warung Bu Sri</div>
              <div style={{ fontSize: 12, color: C.inkDim, fontWeight: 600 }}>Mode penjual</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.accent }}>
              Buka
              <div style={{ width: 42, height: 24, borderRadius: 12, background: C.accent, position: 'relative' }}>
                <div style={{ position: 'absolute', right: 2, top: 2, width: 20, height: 20, borderRadius: 10, background: '#fff' }} />
              </div>
            </div>
          </div>
        </Entrance>
        <Entrance delay={6}>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {(status === 'baru' ? ['Baru 1', 'Diproses', 'Riwayat'] : ['Baru', 'Diproses 1', 'Riwayat']).map((t, i) => {
              const active = status === 'baru' ? i === 0 : i === 1;
              return (
              <div key={t} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: active ? C.ink : C.surface, color: active ? '#fff' : C.inkSoft, border: `1px solid ${active ? C.ink : C.line}`,
              }}>{t}</div>
              );
            })}
          </div>
        </Entrance>
      </div>

      {/* Kartu pesanan */}
      <div style={{ position: 'absolute', top: 164, left: 14, right: 14 }}>
        <Entrance delay={Math.round(fps * 0.5)}>
          <div style={{ borderRadius: 18, background: C.surface, padding: 14, border: `1.5px solid ${status === 'baru' ? '#FCD34D' : C.line}`, boxShadow: '0 12px 26px -18px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Dimas</div>
                <div style={{ fontSize: 11, color: C.inkDim }}>PA-7F3K2Q • baru saja</div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: badge.bg, color: badge.fg,
                transform: `scale(${interpolate(statusPop, [0, 1], [0.7, 1])})`, display: 'inline-block',
              }}>{badge.text}</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.inkSoft }}>2× Indomie Goreng, 1× Telur Ayam, 1× Es Teh Manis</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.inkDim, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} color={C.inkDim} /> ±3,9 km • Gratis ongkir</span>
              <b>{rp(13500)}</b>
            </div>

            <div style={{ position: 'relative', marginTop: 12, height: 42 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 8, opacity: 1 - swap, transform: `translateY(${-swap * 10}px)` }}>
                <div style={{
                  flex: 2, borderRadius: 12, background: status === 'baru' ? C.primary : C.skySoft, color: status === 'baru' ? '#fff' : C.skyInk,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14,
                  transform: `scale(${pressScale(frame, acceptAt, fps)})`,
                }}>{status === 'baru' ? 'Terima' : 'Diterima ✓'}</div>
                <div style={{ flex: 1, borderRadius: 12, border: '1.5px solid #FECACA', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>Tolak</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: swap, transform: `translateY(${(1 - swap) * 10}px)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.indigoInk, marginBottom: 8 }}>Sedang diantar ke Dimas</div>
                <div style={{ position: 'relative', height: 6, borderRadius: 3, background: C.indigoSoft }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${track * 100}%`, borderRadius: 3, background: C.indigoInk }} />
                  <div style={{ position: 'absolute', top: -13, left: `calc(${track * 100}% - 14px)` }}>
                    <Icon name="scooter" size={28} color={C.indigoInk} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Entrance>
      </div>
      <Tap at={acceptAt} x={SCREEN.w * 0.36} y={164 + 152} />

      <div style={{ position: 'absolute', top: 400, left: 14, right: 14, opacity: 0.6 }}>
        <Entrance delay={Math.round(fps * 0.8)}>
          <div style={{ borderRadius: 18, background: C.surface, padding: 14, border: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Rina</div>
              <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: C.accentSoft, color: C.accent }}>Selesai</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: C.inkSoft }}>1× Gas Elpiji 3 kg, 1× Galon</div>
          </div>
        </Entrance>
      </div>

      <SellerNav />

      {/* Notifikasi pesanan baru */}
      <div style={{
        position: 'absolute', top: 46, left: 12, right: 12, borderRadius: 18, background: C.surface, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 40px -14px rgba(28,25,23,0.45)',
        opacity: notifIn * (1 - notifOut), transform: `translateY(${interpolate(notifIn, [0, 1], [-110, 0]) - notifOut * 60}px)`,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${ring}deg)` }}>
          <Icon name="bell" size={22} color={C.primary} stroke={2.4} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Pesanan baru!</div>
          <div style={{ fontSize: 13, color: C.inkDim }}>Dimas • {rp(13500)}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const NAV = [['bag', 'Pesanan'], ['store', 'Produk'], ['pin', 'Ongkir'], ['sparkle', 'Bagikan']] as const;

function SellerNav() {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: C.surface, borderTop: `1px solid ${C.line}`,
      display: 'flex', paddingTop: 10,
    }}>
      {NAV.map(([icon, label], i) => (
        <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: i === 0 ? C.ink : C.inkDim }}>
          <Icon name={icon} size={22} color={i === 0 ? C.ink : C.inkDim} />
          {label}
        </div>
      ))}
    </div>
  );
}
