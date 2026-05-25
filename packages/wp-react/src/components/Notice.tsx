import { type HTMLAttributes, type ReactNode, type MouseEvent } from 'react';
import { cn } from '../utils/cn.js';

export type NoticeVariant = 'success' | 'error' | 'warning' | 'info';

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  variant?: NoticeVariant;
  dismissible?: boolean;
  inline?: boolean;
  onDismiss?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

export function Notice({
  variant = 'info',
  dismissible = false,
  inline = false,
  onDismiss,
  className,
  children,
  ...props
}: NoticeProps) {
  return (
    <div
      className={cn(
        'notice',
        `notice-${variant}`,
        dismissible && 'is-dismissible',
        inline && 'inline',
        className
      )}
      {...props}
    >
      {children}
      {dismissible && (
        <button type="button" className="notice-dismiss" onClick={onDismiss}>
          <span className="screen-reader-text">Dismiss</span>
        </button>
      )}
    </div>
  );
}
