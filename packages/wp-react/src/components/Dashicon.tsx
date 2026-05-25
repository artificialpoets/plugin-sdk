import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn.js';

export interface DashiconProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The icon name — with or without the `dashicons-` prefix.
   *
   * @example "admin-users"
   * @example "dashicons-edit"   // prefix is stripped automatically
   *
   * Browse the catalog: https://developer.wordpress.org/resource/dashicons/
   */
  icon: string;
  /** Render at a different size than the default 20px. */
  size?: 'small' | 'large';
}

export function Dashicon({ icon, size, className, ...props }: DashiconProps) {
  const name = icon.startsWith('dashicons-') ? icon : `dashicons-${icon}`;
  return (
    <span
      aria-hidden="true"
      className={cn('dashicons', name, size && `is-${size}`, className)}
      {...props}
    />
  );
}
