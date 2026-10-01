// Video panduan pemakaian (penjual & pembeli) — dirender di landing via @remotion/player.
import type { FC, ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MapScreen, Phone, PickScreen, SCREEN, SellerScreen } from './HeroStory';
import { BgMesh, Entrance, Grade, Grain, Icon, pressScale, rp, SceneWrap, Tap, Vignette } from './primitives';
import { theme } from './theme';

const C = theme.colors;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export type Guide = 'seller' | 'buyer';

interface Step {
  title: string;
  tip: string;
  tipIcon: string;
  seconds: number;
  Screen: FC;
}

// ---------------------------------------------------------------------------
// Helper

/** Efek mengetik: potongan teks + kursor. */
function useTyped(text: string, startSec: number, cps = 14) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round(startSec * fps);
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * cps)));
  const typing = frame >= start && n < text.length;
  const caretOn = typing || (frame >= start && Math.floor(frame / (fps / 2)) % 2 === 0 && n < text.length + 1 && frame < start + fps * 0.6 + (text.length / cps) * fps);
  return { value: text.slice(0, n), caret: caretOn, started: frame >= start };
}

function Field({ label, text, start, placeholder, cps }: { label: string; text: string; start: number; placeholder?: string; cps?: number }) {
  const t = useTyped(text, start, cps);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>{label}</div>
      <div style={{
        height: 42, borderRadius: 12, border: `1.5px solid ${t.caret ? C.primary : C.line}`, background: C.surface,
        display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15, fontWeight: 600,
        color: t.value ? C.ink : C.inkDim,
      }}>
        {t.value || placeholder}
        {t.caret && <span style={{ width: 2, height: 20, background: C.primary, marginLeft: 1 }} />}
      </div>
    </div>
  );
}

function Button({ children, at, dark = false, style }: { children: ReactNode; at: number; dark?: boolean; style?: React.CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{
      height: 50, borderRadius: 14, background: dark ? C.ink : C.primary, color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 15, transform: `scale(${pressScale(frame, Math.round(at * fps), fps)})`,
      ...style,
    }}>{children}</div>
  );
}

function Toast({ text, at }: { text: string; at: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - Math.round(at * fps), fps, config: theme.spring.bouncy });
  return (
    <div style={{
      position: 'absolute', top: 52, left: 40, right: 40, padding: '10px 14px', borderRadius: 14, background: C.accent, color: '#fff',
      fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
      opacity: p, transform: `translateY(${interpolate(p, [0, 1], [-30, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
      boxShadow: '0 14px 30px -12px rgba(15,118,110,0.6)',
    }}>
      <Icon name="check" size={16} color="#fff" stroke={3} /> {text}
    </div>
  );
}

const sec = (s: number, fps: number) => Math.round(s * fps);

// ---------------------------------------------------------------------------
// Layar panduan penjual

function LoginScreen() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#FAFAF9', padding: '90px 22px 0' }}>
      <Entrance delay={2}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: C.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="store" size={30} color={C.primary} />
        </div>
      </Entrance>
      <Entrance delay={6}>
        <div style={{ marginTop: 18, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Masuk sebagai Penjual</div>
        <div style={{ marginTop: 6, fontSize: 14, color: C.inkDim }}>Gratis, tanpa komisi.</div>
      </Entrance>
      <Entrance delay={10} style={{ marginTop: 26 }}>
        <div style={{ height: 50, borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700, fontSize: 15 }}>
          <span style={{ fontWeight: 900, color: '#4285F4' }}>G</span> Lanjut dengan Google
        </div>
      </Entrance>
      <Entrance delay={14} style={{ margin: '22px 0 14px', textAlign: 'center', fontSize: 12, color: C.inkDim }}>atau</Entrance>
      <Entrance delay={16}>
        <Field label="Email" text="bu.sri@gmail.com" start={0.8} placeholder="nama@email.com" />
        <Button at={2.6}>Kirim link masuk</Button>
      </Entrance>
      <Tap at={sec(2.6, fps)} x={SCREEN.w / 2} y={452} />
      <Toast text="Cek email untuk link masuk" at={2.9} />
    </AbsoluteFill>
  );
}

function CreateStoreScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pin = spring({ frame: frame - sec(2.4, fps), fps, config: theme.spring.bouncy });
  return (
    <AbsoluteFill style={{ background: '#FAFAF9', padding: '60px 18px 0' }}>
      <Entrance delay={2}><div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Buat toko Anda</div></Entrance>
      <Entrance delay={6}>
        <Field label="Nama toko" text="Warung Bu Sri" start={0.5} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>Jenis usaha</div>
          <div style={{ height: 42, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 15, fontWeight: 600 }}>
            Warung / Toko Kelontong <span style={{ color: C.inkDim }}>▾</span>
          </div>
        </div>
        <Field label="Nomor WhatsApp" text="0812 3456 7890" start={1.5} />
      </Entrance>
      <Entrance delay={12}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>Lokasi toko</div>
        <div style={{ position: 'relative', height: 150, borderRadius: 14, overflow: 'hidden', background: C.map }}>
          <svg width="100%" height="150" style={{ position: 'absolute', inset: 0 }}>
            <line x1="0" y1="70" x2="400" y2="70" stroke={C.road} strokeWidth="12" />
            <line x1="110" y1="0" x2="110" y2="150" stroke={C.road} strokeWidth="9" />
            <line x1="230" y1="0" x2="230" y2="150" stroke={C.road} strokeWidth="9" />
            <rect x="130" y="88" width="80" height="50" rx="8" fill={C.park} />
          </svg>
          <div style={{ position: 'absolute', left: 150, top: 18 + interpolate(pin, [0, 1], [-60, 0]), opacity: Math.min(1, pin * 2) }}>
            <svg width="32" height="40" viewBox="0 0 36 44"><path d="M18 43s-15-13.5-15-25a15 15 0 1130 0c0 11.5-15 25-15 25z" fill={C.ink} stroke="#fff" strokeWidth="3" /><circle cx="18" cy="18" r="6" fill="#fff" /></svg>
          </div>
        </div>
      </Entrance>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 26 }}>
        <Button at={3.3}>Buat toko</Button>
      </div>
      <Tap at={sec(2.4, fps)} x={166} y={395} />
      <Tap at={sec(3.3, fps)} x={SCREEN.w / 2} y={SCREEN.h - 51} />
    </AbsoluteFill>
  );
}

function AddProductScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sheet = spring({ frame: frame - 4, fps, config: theme.spring.smooth });
  const price = useTyped('3500', 1.6, 8);
  return (
    <AbsoluteFill style={{ background: '#FAFAF9' }}>
      <div style={{ padding: '56px 18px 0', opacity: 0.35 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Produk</div>
        {[0, 1, 2].map(i => <div key={i} style={{ height: 54, marginTop: 10, borderRadius: 12, background: C.bgAlt }} />)}
      </div>
      <AbsoluteFill style={{ background: 'rgba(28,25,23,0.35)', opacity: sheet }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: '26px 26px 0 0', background: C.surface, padding: '20px 18px 26px',
        transform: `translateY(${interpolate(sheet, [0, 1], [520, 0])}px)`,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Tambah produk</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: 76, height: 76, borderRadius: 16, border: `2px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDE68A' }}>
            <Icon name="bag" size={30} color={C.inkSoft} />
          </div>
          <div style={{ fontSize: 12, color: C.inkDim }}>Foto opsional,<br />otomatis diperkecil.</div>
        </div>
        <Field label="Nama produk" text="Indomie Goreng" start={0.6} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>Harga (Rp)</div>
          <div style={{ height: 42, borderRadius: 12, border: `1.5px solid ${price.caret ? C.primary : C.line}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 15, fontWeight: 600 }}>
            {price.value}{price.caret && <span style={{ width: 2, height: 20, background: C.primary, marginLeft: 1 }} />}
          </div>
          <div style={{ fontSize: 12, color: C.inkDim, marginTop: 4 }}>{price.value ? rp(Number(price.value)) : ' '}</div>
        </div>
        <Button at={2.6}>Simpan</Button>
      </div>
      <Tap at={sec(2.6, fps)} x={SCREEN.w / 2} y={SCREEN.h - 51} />
      <Toast text="Produk disimpan" at={2.9} />
    </AbsoluteFill>
  );
}

function OngkirScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const addAt = sec(1.7, fps);
  const added = spring({ frame: frame - addAt - 3, fps, config: theme.spring.smooth });
  const rows: [string, string][] = [['0 – 3 km', 'Gratis'], ['3 – 5 km', 'Rp2.000 / order']];
  const Row = ({ r, n }: { r: [string, string]; n: number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, marginBottom: 10, fontSize: 15 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: ['#34D399', '#FBBF24', C.primary][n] }} />{r[0]}
      </span>
      <b>{r[1]}</b>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#FAFAF9', padding: '60px 18px 0' }}>
      <Entrance delay={2}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Area & ongkir</div>
        <div style={{ fontSize: 13, color: C.inkDim, marginTop: 4, marginBottom: 16 }}>Tarif berdasarkan jarak dari toko</div>
      </Entrance>
      {rows.map((r, i) => <Entrance key={r[0]} delay={8 + i * 5}><Row r={r} n={i} /></Entrance>)}
      <div style={{ opacity: added, transform: `translateY(${interpolate(added, [0, 1], [16, 0])}px) scale(${interpolate(added, [0, 1], [0.96, 1])})` }}>
        <Row r={['5 – 10 km', 'Rp2.000 / km']} n={2} />
      </div>
      <Entrance delay={16}>
        <div style={{ height: 44, borderRadius: 12, border: `1.5px dashed ${C.inkDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: C.inkSoft, transform: `scale(${pressScale(frame, addAt, fps)})` }}>
          + Tambah tingkat
        </div>
      </Entrance>
      <Entrance delay={20} style={{ marginTop: 18 }}>
        <div style={{ borderRadius: 14, background: C.accentSoft, color: C.accent, padding: 12, fontSize: 13, fontWeight: 700 }}>
          Di atas 10 km, pesanan antar otomatis ditolak.
        </div>
      </Entrance>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 26 }}>
        <Button at={3.0}>Simpan pengaturan</Button>
      </div>
      <Tap at={addAt} x={SCREEN.w / 2} y={60 + 64 + 2 * 58 + 58 + 22} />
      <Tap at={sec(3.0, fps)} x={SCREEN.w / 2} y={SCREEN.h - 51} />
    </AbsoluteFill>
  );
}

/** Pola QR dekoratif (deterministik). */
function FakeQr({ size }: { size: number }) {
  const n = 21;
  const cell = size / n;
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const finderOn = (x: number, y: number) => {
    const fx = x >= n - 7 ? x - (n - 7) : x;
    const fy = y >= n - 7 ? y - (n - 7) : y;
    return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
  };
  const cells: ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = finder(x, y) ? finderOn(x, y) : ((x * 7 + y * 13 + x * y) % 5) < 2;
    if (on) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={C.ink} />);
  }
  return <svg width={size} height={size}>{cells}</svg>;
}

function ShareScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qr = spring({ frame: frame - 10, fps, config: theme.spring.bouncy });
  return (
    <AbsoluteFill style={{ background: '#FAFAF9', padding: '60px 18px 0' }}>
      <Entrance delay={2}>
        <div style={{ borderRadius: 16, background: C.surface, border: `1px solid ${C.line}`, padding: 14 }}>
          <div style={{ fontSize: 12, color: C.inkDim }}>Link toko Anda</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginTop: 4 }}>pesanantar.app/t/warung-bu-sri</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, height: 40, borderRadius: 12, border: `1.5px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>Salin link</div>
            <div style={{ flex: 1, height: 40, borderRadius: 12, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, transform: `scale(${pressScale(frame, sec(2.4, fps), fps)})` }}>Kirim ke WA</div>
          </div>
        </div>
      </Entrance>
      <div style={{
        marginTop: 16, borderRadius: 20, background: C.surface, border: `1px solid ${C.line}`, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: qr, transform: `scale(${interpolate(qr, [0, 1], [0.85, 1])})`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Warung Bu Sri</div>
        <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 12 }}>Scan untuk pesan antar</div>
        <FakeQr size={180} />
      </div>
      <Tap at={sec(2.4, fps)} x={SCREEN.w * 0.72} y={60 + 84} />
      <Toast text="Link terkirim ke grup WA" at={2.7} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// Layar panduan pembeli

function WaLinkScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msg = spring({ frame: frame - 10, fps, config: theme.spring.smooth });
  const tapAt = sec(2.4, fps);
  return (
    <AbsoluteFill style={{ background: '#EFEAE2' }}>
      <div style={{ height: 96, background: '#075E54', color: '#fff', display: 'flex', alignItems: 'flex-end', padding: '0 16px 12px', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#ffffff33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>RT</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Warga RT 05</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Bu Sri, Dimas, Rina, +42</div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <Entrance delay={4}>
          <div style={{ maxWidth: '70%', borderRadius: 12, background: '#fff', padding: '8px 10px', fontSize: 13, marginBottom: 10 }}>Bu, besok buka pagi?</div>
        </Entrance>
        <div style={{ opacity: msg, transform: `translateY(${interpolate(msg, [0, 1], [24, 0])}px)` }}>
          <div style={{ width: '86%', borderRadius: 14, background: '#fff', padding: 8, fontSize: 13, boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#C2410C', padding: '0 4px 6px' }}>Warung Bu Sri</div>
            <div style={{
              borderRadius: 10, background: '#F5F5F4', overflow: 'hidden', transform: `scale(${pressScale(frame, tapAt, fps)})`,
            }}>
              <div style={{ height: 86, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="pin" size={40} color="#fff" />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontWeight: 800 }}>Warung Bu Sri — Pesan Antar</div>
                <div style={{ fontSize: 11, color: C.inkDim }}>pesanantar.app</div>
              </div>
            </div>
            <div style={{ padding: '8px 4px 2px' }}>Sekarang bisa pesan antar dari HP ya 🛵 Klik link di atas.</div>
          </div>
        </div>
      </div>
      <Tap at={tapAt} x={SCREEN.w * 0.43} y={96 + 14 + 44 + 80} />
    </AbsoluteFill>
  );
}

function TrackScreen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = ['Menunggu konfirmasi', 'Diterima', 'Sedang disiapkan', 'Sedang diantar'];
  const times = [0, 0.9, 1.7, 2.5].map(s => sec(s, fps));
  const idx = times.filter(t => frame >= t).length - 1;
  const pop = spring({ frame: frame - times[idx], fps, config: theme.spring.bouncy });
  const headline = ['Menunggu penjual…', 'Pesanan diterima 👍', 'Sedang disiapkan', 'Pesanan dalam perjalanan'][idx];
  return (
    <AbsoluteFill style={{ background: '#FAFAF9', padding: '60px 18px 0' }}>
      <Entrance delay={2}>
        <div style={{ borderRadius: 18, background: C.surface, border: `1px solid ${C.line}`, padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.inkDim }}>Warung Bu Sri • PA-7F3K2Q</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})` }}>{headline}</div>
        </div>
      </Entrance>
      <Entrance delay={6} style={{ marginTop: 14 }}>
        <div style={{ borderRadius: 18, background: C.surface, border: `1px solid ${C.line}`, padding: 18 }}>
          {steps.map((s, i) => {
            const done = i <= idx;
            const p = spring({ frame: frame - times[i], fps, config: theme.spring.bouncy });
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? C.ink : C.bgAlt, color: '#fff', transform: `scale(${done ? interpolate(p, [0, 1], [0.6, 1]) : 1})`,
                  boxShadow: i === idx ? `0 0 0 5px ${C.line}` : 'none',
                }}>
                  {done ? <Icon name="check" size={16} color="#fff" stroke={3} /> : <span style={{ fontSize: 12, color: C.inkDim, fontWeight: 800 }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 15, fontWeight: i === idx ? 800 : 600, color: done ? C.ink : C.inkDim }}>{s}</span>
              </div>
            );
          })}
        </div>
      </Entrance>
      <Entrance delay={10} style={{ marginTop: 14 }}>
        <div style={{ borderRadius: 16, background: C.surface, border: `1px solid ${C.line}`, padding: 14, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.inkDim }}>Ongkir</span><b style={{ color: C.accent }}>Gratis</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span style={{ color: C.inkDim }}>Total</span><b>{rp(13500)}</b></div>
        </div>
      </Entrance>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------

export const GUIDES: Record<Guide, { label: string; steps: Step[] }> = {
  seller: {
    label: 'Panduan penjual',
    steps: [
      { title: 'Masuk dengan Google atau email', tip: 'Gratis, tanpa komisi', tipIcon: 'check', seconds: 3.8, Screen: LoginScreen },
      { title: 'Isi data & tandai lokasi toko', tip: 'Ongkir dihitung dari titik ini', tipIcon: 'pin', seconds: 4.4, Screen: CreateStoreScreen },
      { title: 'Tambah produk', tip: 'Foto boleh menyusul', tipIcon: 'sparkle', seconds: 3.8, Screen: AddProductScreen },
      { title: 'Atur tarif ongkir', tip: 'Gratis, per order, atau per km', tipIcon: 'scooter', seconds: 4.0, Screen: OngkirScreen },
      { title: 'Bagikan link & QR toko', tip: 'Kirim ke grup WA', tipIcon: 'store', seconds: 3.8, Screen: ShareScreen },
      { title: 'Terima pesanan & antar', tip: 'HP berbunyi saat ada pesanan', tipIcon: 'bell', seconds: 4.2, Screen: SellerScreen },
    ],
  },
  buyer: {
    label: 'Panduan pembeli',
    steps: [
      { title: 'Buka link dari toko', tip: 'Tanpa daftar akun', tipIcon: 'check', seconds: 3.4, Screen: WaLinkScreen },
      { title: 'Pilih barang', tip: 'Total langsung terlihat', tipIcon: 'bag', seconds: 3.6, Screen: PickScreen },
      { title: 'Tandai rumah di peta', tip: 'Ongkir otomatis dari jarak', tipIcon: 'pin', seconds: 3.6, Screen: MapScreen },
      { title: 'Pantau sampai tiba', tip: 'Status berubah otomatis', tipIcon: 'scooter', seconds: 3.6, Screen: TrackScreen },
    ],
  },
};

export function guideTimeline(guide: Guide, fps: number) {
  let t = 0;
  const steps = GUIDES[guide].steps.map(s => {
    const from = t;
    const dur = Math.round(s.seconds * fps);
    t += dur;
    return { ...s, from, dur };
  });
  return { steps, total: t };
}

export function Tutorial({ guide }: { guide: Guide }) {
  const { fps } = useVideoConfig();
  const { steps, total } = guideTimeline(guide, fps);
  return (
    <AbsoluteFill style={{ fontFamily: theme.fonts.display, color: C.ink }}>
      <BgMesh />
      {steps.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
          <StepHeader guide={guide} n={i + 1} count={steps.length} title={s.title} tip={s.tip} tipIcon={s.tipIcon} duration={s.dur} />
        </Sequence>
      ))}
      <Phone>
        {steps.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur}>
            <SceneWrap duration={s.dur}><s.Screen /></SceneWrap>
          </Sequence>
        ))}
      </Phone>
      <Progress steps={steps} total={total} />
      <Grade />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
}

function StepHeader({ guide, n, count, title, tip, tipIcon, duration }: {
  guide: Guide; n: number; count: number; title: string; tip: string; tipIcon: string; duration: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [duration - Math.round(fps * 0.3), duration - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const k = spring({ frame, fps, config: theme.spring.snappy });
  const words = title.split(' ');
  const tipP = spring({ frame: frame - 6 - words.length * 3, fps, config: theme.spring.smooth });
  return (
    <div style={{ position: 'absolute', top: 18, left: 30, right: 30, textAlign: 'center', opacity: 1 - exit, transform: `translateY(${-exit * 20}px)` }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: C.surface,
        border: `1px solid ${C.line}`, fontSize: 15, fontWeight: 800, color: C.inkSoft,
        opacity: k, transform: `translateY(${interpolate(k, [0, 1], [12, 0])}px)`,
      }}>
        {GUIDES[guide].label} <span style={{ color: C.inkDim }}>•</span> Langkah {n}/{count}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 9, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {words.map((w, i) => {
          const p = spring({ frame: frame - 4 - i * 3, fps, config: theme.spring.snappy });
          return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)` }}>{w}</span>;
        })}
      </div>
      <div style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: C.accent,
        opacity: tipP, transform: `translateY(${interpolate(tipP, [0, 1], [10, 0])}px)`,
      }}>
        <Icon name={tipIcon} size={18} color={C.accent} stroke={2.4} /> {tip}
      </div>
    </div>
  );
}

function Progress({ steps, total }: { steps: { from: number; dur: number }[]; total: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, bottom: 14, display: 'flex', gap: 6 }}>
      {steps.map((s, i) => {
        const p = interpolate(frame, [s.from, s.from + s.dur], [0, 1], clamp);
        return (
          <div key={i} style={{ flex: s.dur / total, height: 5, borderRadius: 3, background: `${C.ink}1f`, overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: C.ink }} />
          </div>
        );
      })}
    </div>
  );
}
