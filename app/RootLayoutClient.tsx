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

    // Prevenir scroll accidental sobre inputs numéricos
    const preventScrollOnNumberInput = (e: WheelEvent) => {
      const target = e.target as Element | null;
      const numberInput = target?.closest('input[type="number"]');
      if (numberInput) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventScrollOnNumberInput, { passive: false, capture: true });

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
      document.removeEventListener('wheel', preventScrollOnNumberInput, { capture: true });
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
