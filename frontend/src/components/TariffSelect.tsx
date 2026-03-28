'use client';

import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';

export interface TariffOption {
  value: string;
  label: string;
}

interface TariffSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TariffOption[];
  placeholder: string;
  label: string;
  id?: string;
}

export function TariffSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  id,
}: TariffSelectProps) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? '';

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label
        htmlFor={id}
        className="block font-mono text-sm text-[var(--text-secondary)] mb-2"
      >
        {label}
      </label>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={clsx(
          'form-input tariff-select-trigger',
          'flex items-stretch !py-0 !px-0 min-h-[44px] w-full text-left overflow-hidden'
        )}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <span className="flex-1 min-w-0 px-4 py-3 flex items-center">
          <span className={clsx('truncate font-mono text-sm', !value && 'text-[var(--text-muted)]')}>
            {value ? displayLabel : placeholder}
          </span>
        </span>
        <span
          className={clsx(
            'flex shrink-0 items-center justify-center self-stretch px-3',
            'border-l border-[var(--border-color)]'
          )}
          aria-hidden
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={clsx(
              'text-[var(--text-secondary)] transition-transform duration-200',
              open && 'rotate-180'
            )}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={clsx(
            'absolute z-50 left-0 right-0 mt-1 py-1 rounded-lg overflow-hidden',
            'bg-[var(--bg-card)] border border-[var(--border-color)]',
            'shadow-lg shadow-black/20',
            'max-h-[280px] overflow-y-auto'
          )}
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 font-mono text-sm transition-colors',
                    'text-[var(--text-primary)]',
                    'hover:bg-[var(--bg-tertiary)]',
                    isActive && 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]'
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
