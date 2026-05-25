import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

// ─── Postbox (the classic WP card) ────────────────────────────────────────
export interface PostboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  children: ReactNode;
}

export function Postbox({ title, className, children, ...props }: PostboxProps) {
  return (
    <div className={cn('postbox', className)} {...props}>
      {title && (
        <div className="postbox-header">
          <h2 className="hndle">{title}</h2>
        </div>
      )}
      <div className="inside">{children}</div>
    </div>
  );
}

// ─── WelcomePanel ─────────────────────────────────────────────────────────
export interface WelcomePanelProps {
  title: ReactNode;
  description?: ReactNode;
  cta?: { label: ReactNode; href: string };
  children?: ReactNode;
}

export function WelcomePanel({ title, description, cta, children }: WelcomePanelProps) {
  return (
    <div className="welcome-panel">
      <div className="welcome-panel-content">
        <h2>{title}</h2>
        {description && <p className="about-description">{description}</p>}
        {cta && (
          <a href={cta.href} className="button button-primary button-hero">
            {cta.label}
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────
export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
}

export function StatCard({ label, value, delta, trend }: StatCardProps) {
  return (
    <div className="wp-admin-statcard">
      <div className="wp-admin-statcard__label">{label}</div>
      <div className="wp-admin-statcard__value">{value}</div>
      {delta && (
        <div className={cn('wp-admin-statcard__delta', trend === 'up' && 'is-up', trend === 'down' && 'is-down')}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── ActivityFeed + ActivityItem ──────────────────────────────────────────
export interface ActivityItemProps {
  avatar?: ReactNode;
  /** Initials shown when no avatar is supplied. */
  initials?: string;
  children: ReactNode;
  time: ReactNode;
}

export function ActivityItem({ avatar, initials, children, time }: ActivityItemProps) {
  return (
    <div className="wp-admin-activity">
      <div className="wp-admin-activity__avatar">{avatar ?? initials}</div>
      <div className="wp-admin-activity__body">
        <div className="wp-admin-activity__text">{children}</div>
        <div className="wp-admin-activity__time">{time}</div>
      </div>
    </div>
  );
}
