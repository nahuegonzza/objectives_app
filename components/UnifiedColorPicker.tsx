'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLOR_OPTIONS, getColorOption, isCustomColor, rgbToHex } from '@lib/goalIconsColors';

interface UnifiedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  labelClassName?: string;
}

const parseRgbToHex = (value: string) => {
  if (value.startsWith('#')) return value;
  const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#ffffff';
  return rgbToHex(Number(match[1]), Number(match[2]), Number(match[3]));
};

export default function UnifiedColorPicker({
  value,
  onChange,
  label,
  className,
  labelClassName,
}: UnifiedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState('#ffffff');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<Record<string, number>>({});
  const selected = useMemo(() => getColorOption(value), [value]);

  useEffect(() => {
    if (isCustomColor(value)) {
      setCustomHex(parseRgbToHex(value));
    } else if (value) {
      const option = getColorOption(value);
      setCustomHex(option.bgColor);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (
        rootRef.current.contains(event.target as Node) ||
        overlayRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const popupWidth = 288;
      const popupHeight = 216;
      const margin = 8;
      let top = rect.bottom + margin;
      if (top + popupHeight > window.innerHeight - margin) {
        top = rect.top - popupHeight - margin;
        if (top < margin) top = margin;
      }
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }
      if (left < margin) left = margin;
      setOverlayStyle({ top, left, width: popupWidth });
    };

    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 288;
      const popupHeight = 216;
      const margin = 8;
      let top = rect.bottom + margin;
      if (top + popupHeight > window.innerHeight - margin) {
        top = rect.top - popupHeight - margin;
        if (top < margin) top = margin;
      }
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }
      if (left < margin) left = margin;
      setOverlayStyle({ top, left, width: popupWidth });
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  const openColorPicker = () => {
    if (!colorInputRef.current) return;
    const input = colorInputRef.current as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={rootRef}>
      {label && (
        <label className={`${labelClassName ?? 'mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'}`}>
          {label}
        </label>
      )}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-900 shadow-sm transition hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        aria-label="Seleccionar color"
      >
        <span
          className="h-8 w-8 rounded-full border-2 border-slate-300 dark:border-slate-500"
          style={{ backgroundColor: selected.bgColor, borderColor: selected.borderColor }}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="fixed z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950"
          style={{
            top: overlayStyle.top,
            left: overlayStyle.left,
            width: overlayStyle.width,
          }}
        >
          <div className="grid grid-cols-6 gap-3">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleSelect(option.key)}
                className={`h-11 w-11 rounded-full border-2 transition-all ${
                  value === option.key ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent hover:scale-110 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                style={{ backgroundColor: option.bgColor, borderColor: option.borderColor }}
                aria-label={option.label}
              />
            ))}
            <button
              type="button"
              onClick={openColorPicker}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              aria-label="Color RGB personalizado"
            >
              RGB
            </button>
          </div>
          <input
            ref={colorInputRef}
            type="color"
            value={customHex}
            onChange={(event) => {
              const hex = event.target.value;
              setCustomHex(hex);
              handleSelect(hex);
            }}
            className="sr-only"
            aria-hidden="true"
          />
        </div>,
        document.body
      )}
    </div>
  );
}
