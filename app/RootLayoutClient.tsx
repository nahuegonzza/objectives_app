'use client';

import { ThemeProvider } from '@lib/ThemeProvider';
import ServiceWorkerRegister from '@components/ServiceWorkerRegister';
import { useEffect } from 'react';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  // Prevenir zoom en móvil
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    const preventZoomOnDoubleTap = (e: MouseEvent) => {
      if (e.detail > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('dblclick', preventZoomOnDoubleTap, { passive: false });

    // Manejar scroll sobre inputs numéricos: evitar scroll de página, pero permitir ajustar el valor.
    const handleNumberInputWheel = (e: WheelEvent) => {
      const target = e.target as Element | null;
      const numberInput = target?.closest('input[type="number"]') as HTMLInputElement | null;
      if (!numberInput || numberInput.disabled || numberInput.readOnly) return;

      const stepAttr = numberInput.getAttribute('step');
      const step = stepAttr && stepAttr !== 'any' ? parseFloat(stepAttr) : 1;
      const minAttr = numberInput.getAttribute('min');
      const maxAttr = numberInput.getAttribute('max');
      const min = minAttr !== null && minAttr !== '' ? Number(minAttr) : undefined;
      const max = maxAttr !== null && maxAttr !== '' ? Number(maxAttr) : undefined;

      const rawValue = numberInput.value.trim();
      const currentValue = rawValue === '' ? NaN : Number(rawValue);
      const direction = e.deltaY < 0 ? 1 : -1;
      let nextValue: number;

      if (Number.isFinite(currentValue)) {
        nextValue = currentValue + direction * (Number.isFinite(step) && step > 0 ? step : 1);
      } else if (direction > 0) {
        nextValue = min ?? 0;
      } else {
        nextValue = min ?? 0;
      }

      if (min !== undefined && Number.isFinite(min)) nextValue = Math.max(nextValue, min);
      if (max !== undefined && Number.isFinite(max)) nextValue = Math.min(nextValue, max);

      if (!Number.isFinite(nextValue)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      numberInput.value = String(nextValue);
      numberInput.dispatchEvent(new Event('input', { bubbles: true }));
      numberInput.dispatchEvent(new Event('change', { bubbles: true }));
    };
    document.addEventListener('wheel', handleNumberInputWheel, { passive: false, capture: true });

    // Prevenir zoom con teclado
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('dblclick', preventZoomOnDoubleTap);
      document.removeEventListener('wheel', handleNumberInputWheel, { capture: true });
      document.removeEventListener('keydown', preventKeyboardZoom);
    };
  }, []);

  return (
    <ThemeProvider>
      <ServiceWorkerRegister />
      <div className="min-h-screen pb-24 pt-20 sm:pb-0 sm:pt-0">
        {children}
      </div>
    </ThemeProvider>
  );
}
