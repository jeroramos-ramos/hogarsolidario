import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'key' | 'ok' | 'warn';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-ink-2 border-line-soft',
  key: 'bg-signal-soft text-signal-ink border-signal-line',
  ok: 'bg-verify-soft text-verify-ink border-verify-line',
  warn: 'bg-alert-soft text-alert border-alert-line',
};

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`text-[10.5px] font-semibold px-2 py-1 border rounded-[2px] ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
