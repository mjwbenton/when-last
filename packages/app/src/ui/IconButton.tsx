import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../icons';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  name: IconName;
  label: string;
  size?: number;
};

export function IconButton({ name, label, size = 20, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={['icon-btn', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}
