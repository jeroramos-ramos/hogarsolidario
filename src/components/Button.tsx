import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type Variant = 'solid' | 'ghost';
type Size = 'md' | 'sm';

const base =
  'font-display font-semibold rounded inline-flex items-center justify-center gap-[7px] ' +
  'border cursor-pointer no-underline transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  solid: 'bg-ink text-white border-ink hover:bg-ink-2',
  ghost: 'bg-transparent text-ink border-ink hover:bg-paper',
};

const sizes: Record<Size, string> = {
  md: 'text-[13.5px] px-4 py-[10px]',
  sm: 'text-[12px] px-3 py-2',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  wide?: boolean;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' };

type AnchorProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' };

function classes(variant: Variant, size: Size, wide: boolean, extra?: string): string {
  return [base, variants[variant], sizes[size], wide ? 'w-full' : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', wide = false, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={classes(variant, size, wide, className)}
      {...rest}
    />
  );
});

export const LinkButton = forwardRef<HTMLAnchorElement, AnchorProps>(function LinkButton(
  { variant = 'solid', size = 'md', wide = false, className, ...rest },
  ref,
) {
  const { as: _as, ...anchorRest } = rest as AnchorProps & { as?: string };
  void _as;
  return (
    <a
      ref={ref}
      className={classes(variant, size, wide, className)}
      {...anchorRest}
    />
  );
});
