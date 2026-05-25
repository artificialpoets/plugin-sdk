import { type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Tooltip — CSS-only hover/focus tooltip. Wraps any child element and shows
 * `content` above it on hover or keyboard focus. For an inline question-mark
 * variant tied to form labels, use `<HelpTip>` instead.
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('wp-admin-tooltip', className)} tabIndex={0}>
      {children}
      <span className="wp-admin-tooltip__content" role="tooltip">
        {content}
      </span>
    </span>
  );
}
