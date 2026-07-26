import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'danger' | 'ghost';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: Variant;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    variant === 'ghost'
      ? 'btn-ghost'
      : variant === 'primary'
        ? 'btn-primary'
        : `btn-primary ${variant}`;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[base, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}
