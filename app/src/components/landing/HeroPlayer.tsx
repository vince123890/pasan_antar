// Animasi hero (komposisi Remotion) diputar langsung di browser.
// Dimuat lazy agar tidak membebani halaman lain; berhenti saat tidak terlihat.
import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef } from 'react';
import { HeroStory } from '../../remotion/HeroStory';
import { sceneFrames, theme } from '../../remotion/theme';
import { prefersReducedMotion } from './motion';

const { fps, width, height } = theme.comp;
const frames = sceneFrames(fps);

export default function HeroPlayer() {
  const ref = useRef<PlayerRef>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el || reduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) ref.current?.play();
      else ref.current?.pause();
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={wrap} className="w-full" style={{ aspectRatio: `${width} / ${height}` }}>
      <Player
        ref={ref}
        component={HeroStory}
        durationInFrames={frames.total}
        fps={fps}
        compositionWidth={width}
        compositionHeight={height}
        style={{ width: '100%', height: '100%' }}
        loop
        autoPlay={!reduced}
        initialFrame={reduced ? frames.pick + frames.map + Math.round(fps * 2.2) : 0}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        acknowledgeRemotionLicense
      />
    </div>
  );
}
