import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export type StatusVariant = 'active' | 'error' | 'warning' | 'info' | 'neutral';

// ─── StatusBadge ──────────────────────────────────────────────────────────
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: ReactNode;
}

export function StatusBadge({
  variant = 'neutral',
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'wp-admin-status',
        variant !== 'neutral' && `is-${variant}`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

export function Spinner({ active = true, className, ...props }: SpinnerProps) {
  return (
    <span
      className={cn('spinner', active && 'is-active', className)}
      {...props}
    />
  );
}

// ─── Pointer (callout) ───────────────────────────────────────────────────
export interface PointerProps {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

export function Pointer({ title, children, actions }: PointerProps) {
  return (
    <div className="wp-admin-pointer">
      <div className="wp-admin-pointer__title">{title}</div>
      <div className="wp-admin-pointer__body">{children}</div>
      {actions && <div className="wp-admin-pointer__actions">{actions}</div>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'title' | 'text' | 'short';
}

export function Skeleton({ variant = 'text', className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('wp-admin-skeleton', `is-${variant}`, className)}
      {...props}
    />
  );
}
