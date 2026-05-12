'use client';

import { useEffect, useState } from 'react';

interface NumberInputProps {
  value?: number | null;
  onCommit: (value: number) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function NumberInput({
  value,
  onCommit,
  placeholder,
  step = 1,
  min,
  disabled,
  className,
  ariaLabel,
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState<string>(
    value != null ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInternalValue(value != null ? String(value) : '');
    }
  }, [value, isFocused]);

  const commitValue = (raw: string) => {
    const normalized = raw.trim().replace(',', '.');
    const parsed = Number(normalized);

    if (normalized === '') {
      setInternalValue(value != null ? String(value) : '');
      return;
    }

    if (!Number.isNaN(parsed)) {
      onCommit(parsed);
      setInternalValue(String(parsed));
      return;
    }

    setInternalValue(value != null ? String(value) : '');
  };

  const handleChange = (raw: string) => {
    setInternalValue(raw);
    const normalized = raw.trim().replace(',', '.');
    const parsed = Number(normalized);
    const isValidNumber = normalized !== '' && !Number.isNaN(parsed) && !normalized.endsWith('.') && !normalized.endsWith(',');
    if (isValidNumber) {
      onCommit(parsed);
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      value={internalValue}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        setIsFocused(false);
        commitValue(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commitValue(internalValue);
          (event.target as HTMLInputElement).blur();
        }
      }}
      onWheel={(event) => {
        event.preventDefault();
        const normalized = internalValue.trim().replace(',', '.');
        const current = Number(normalized) || 0;
        const direction = event.deltaY < 0 ? 1 : -1;
        const wheelStep = Math.abs(step) < 1 ? 1 : step;
        const baseValue = Number.isInteger(current) ? current : Math.round(current);
        const next = baseValue + direction * wheelStep;
        const value = Number.isNaN(next) ? 0 : next;
        setInternalValue(String(value));
        onCommit(value);
      }}
      step={step}
      min={min}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className={
        className ||
        'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-emerald-500'
      }
    />
  );
}
