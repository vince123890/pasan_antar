// Animasi landing berbasis scroll: muncul saat terlihat, angka berjalan.
// Menghormati prefers-reduced-motion.
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { ref, inView };
}

/** Masuk: opacity + naik + skala, dengan jeda bertahap (stagger) lewat `delay` (ms). */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style }: {
  children: ReactNode; delay?: number; as?: ElementType; className?: string; style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ ...style, '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Angka berjalan saat terlihat (tabular-nums agar tidak bergoyang). */
export function CountUp({ to, prefix = '', suffix = '', duration = 1400, format = (n: number) => Math.round(n).toLocaleString('id-ID') }: {
  to: number; prefix?: string; suffix?: string; duration?: number; format?: (n: number) => string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.6 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setVal(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setVal(to * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref} className="tabular-nums">{prefix}{format(val)}{suffix}</span>;
}

/** Judul yang muncul kata per kata. */
export function WordRise({ text, className = '', startDelay = 0, step = 70 }: {
  text: string; className?: string; startDelay?: number; step?: number;
}) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="word-rise inline-block" style={{ animationDelay: `${startDelay + i * step}ms` }}>{w}</span>{' '}
        </span>
      ))}
    </span>
  );
}
