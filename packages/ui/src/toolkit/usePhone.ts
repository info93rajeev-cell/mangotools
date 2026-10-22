import { useEffect, useState } from 'preact/hooks';

const PHONE = '(max-width: 700px)';

/** True on phone widths (the CBM workbench's single-column layout); follows resizes. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return phone;
}
