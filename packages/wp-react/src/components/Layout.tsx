import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

// ─── Wrap (.wrap wrapper) ─────────────────────────────────────────────────
export interface WrapProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Wrap({ className, children, ...props }: WrapProps) {
  return (
    <div className={cn('wrap', className)} {...props}>
      {children}
    </div>
  );
}

// ─── PageHeader (h1 + optional add-new action) ───────────────────────────
export interface PageHeaderProps {
  title: ReactNode;
  action?: { label: ReactNode; href: string };
  /** Whether to render the wp-header-end hr (default true). */
  endMarker?: boolean;
}

export function PageHeader({ title, action, endMarker = true }: PageHeaderProps) {
  return (
    <>
      <h1 className="wp-heading-inline">{title}</h1>
      {action && (
        <a href={action.href} className="page-title-action">
          {action.label}
        </a>
      )}
      {endMarker && <hr className="wp-header-end" />}
    </>
  );
}

// ─── Two-column layout ───────────────────────────────────────────────────
export interface TwoColumnProps {
  main: ReactNode;
  sidebar: ReactNode;
}

export function TwoColumn({ main, sidebar }: TwoColumnProps) {
  return (
    <div id="poststuff">
      <div id="post-body" className="metabox-holder columns-2">
        <div id="post-body-content">{main}</div>
        <div id="postbox-container-1" className="postbox-container">
          {sidebar}
        </div>
      </div>
    </div>
  );
}

// ─── Screen Options panel ────────────────────────────────────────────────
export interface ScreenOptionsProps {
  /** Whether the panel is currently visible (.hidden class removed) */
  open?: boolean;
  children: ReactNode;
}

export function ScreenOptions({ open = false, children }: ScreenOptionsProps) {
  return (
    <div id="screen-meta">
      <div
        id="screen-options-wrap"
        className={cn(!open && 'hidden')}
      >
        <h5>Screen Options</h5>
        {children}
      </div>
    </div>
  );
}

// ─── Help Tabs panel ─────────────────────────────────────────────────────
export interface HelpTab {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

export interface HelpTabsProps {
  tabs: HelpTab[];
  /** Currently active tab id (defaults to first tab). */
  activeId?: string;
}

export function HelpTabs({ tabs, activeId }: HelpTabsProps) {
  const active = activeId ?? tabs[0]?.id;
  return (
    <div id="contextual-help-wrap">
      <div className="contextual-help-tabs">
        <ul>
          {tabs.map(t => (
            <li key={t.id} className={cn(t.id === active && 'active')}>
              <a href={`#${t.id}`}>{t.label}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="contextual-help-tabs-wrap">
        {tabs.map(t => (
          <div
            key={t.id}
            id={t.id}
            className={cn('help-tab-content', t.id === active && 'active')}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
