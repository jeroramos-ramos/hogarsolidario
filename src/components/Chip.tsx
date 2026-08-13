import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ChipProps = {
  on: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Chip({ on, children, className, ...rest }: ChipProps) {
  // font-semibold (600) porque Sans 500 fue removido del bundle.
  const base =
    'text-[12px] font-semibold px-[11px] py-[7px] border rounded-full cursor-pointer ' +
    'focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2';
  const state = on
    ? 'bg-ink text-white border-ink'
    : 'bg-surface text-ink-2 border-line hover:border-ink';
  return (
    <button type="button" className={`${base} ${state} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}
