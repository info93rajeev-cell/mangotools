import { useEffect, useRef } from 'preact/hooks';

/** The reference layout is drawn for ~1585px laptops. On wider screens scale the working area up
 *  in proportion (max 1.3x) so text, icons and cards keep the reference look instead of leaving
 *  empty space. Narrower screens keep the normal responsive layout. The page may scroll. */
const REFERENCE_WIDTH = 1585;

export function useReferenceScale() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const apply = () => {
      const scale = Math.min(window.innerWidth / REFERENCE_WIDTH, 1.3);
      ref.current?.style.setProperty('--ds-scale', scale > 1.02 ? scale.toFixed(3) : '1');
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return ref;
}
