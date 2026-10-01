// Video panduan pemakaian (Remotion) dengan pilihan penjual/pembeli dan lompat per langkah.
import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '../../remotion/theme';
import { guideTimeline, Tutorial, type Guide } from '../../remotion/Tutorial';
import { prefersReducedMotion } from './motion';

const { fps, width, height } = theme.comp;

export default function TutorialPlayer() {
  const [guide, setGuide] = useState<Guide>('seller');
  const [frame, setFrame] = useState(0);
  const ref = useRef<PlayerRef>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const timeline = useMemo(() => guideTimeline(guide, fps), [guide]);
  const inputProps = useMemo(() => ({ guide }), [guide]);
  const current = timeline.steps.findIndex(s => frame >= s.from && frame < s.from + s.dur);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', onFrame);
    return () => p.removeEventListener('frameupdate', onFrame);
  }, [guide]);

  // Putar otomatis saat terlihat, jeda saat keluar layar
  useEffect(() => {
    const el = wrap.current;
    if (!el || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) ref.current?.play();
      else ref.current?.pause();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [guide]);

  const switchGuide = (g: Guide) => {
    setGuide(g);
    setFrame(0);
  };

  const jump = (i: number) => {
    const s = timeline.steps[i];
    ref.current?.seekTo(s.from);
    ref.current?.play();
  };

  return (
    <div className="grid items-start gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
      <div className="md:sticky md:top-24">
        <div className="inline-flex rounded-full bg-stone-100 p-1">
          {([['seller', 'Untuk penjual'], ['buyer', 'Untuk pembeli']] as const).map(([g, label]) => (
            <button key={g} onClick={() => switchGuide(g)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${guide === g ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}>
              {label}
            </button>
          ))}
        </div>
        <ol className="mt-6 space-y-2">
          {timeline.steps.map((s, i) => {
            const active = i === current;
            const done = current > i;
            const progress = active ? Math.min(1, (frame - s.from) / s.dur) : done ? 1 : 0;
            return (
              <li key={s.title}>
                <button onClick={() => jump(i)}
                  className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${active ? 'border-stone-900 bg-white shadow-md' : 'border-stone-200 bg-white/60 hover:bg-white'}`}>
                  <span className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${active || done ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}>{i + 1}</span>
                    <span>
                      <span className={`block font-bold ${active ? 'text-stone-900' : 'text-stone-700'}`}>{s.title}</span>
                      <span className="block text-sm text-stone-500">{s.tip}</span>
                    </span>
                  </span>
                  <span className="absolute bottom-0 left-0 h-0.5 bg-brand-600" style={{ width: `${progress * 100}%` }} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div ref={wrap} className="mx-auto w-full max-w-[460px]">
        <div className="overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(28,25,23,0.35)] ring-1 ring-stone-200/70" style={{ aspectRatio: `${width} / ${height}` }}>
          <Player
            key={guide}
            ref={ref}
            component={Tutorial}
            inputProps={inputProps}
            durationInFrames={timeline.total}
            fps={fps}
            compositionWidth={width}
            compositionHeight={height}
            style={{ width: '100%', height: '100%' }}
            controls
            loop
            autoPlay={!prefersReducedMotion()}
            initialFrame={Math.round(fps * 1.6)}
            clickToPlay
            doubleClickToFullscreen={false}
            allowFullscreen={false}
            acknowledgeRemotionLicense
          />
        </div>
      </div>
    </div>
  );
}
