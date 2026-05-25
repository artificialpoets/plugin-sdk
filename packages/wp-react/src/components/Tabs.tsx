import { useState, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Currently active tab id (controlled). */
  activeId?: string;
  /** Initial active tab id (uncontrolled). Defaults to the first tab. */
  defaultActiveId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

/**
 * Full tabs primitive — strip + content swap. Unlike NavTabs (which is just
 * the visual strip), this manages the active panel.
 *
 * Controlled mode: pass `activeId` + `onTabChange`.
 * Uncontrolled mode: pass `defaultActiveId` (or none — defaults to the first tab).
 */
export function Tabs({
  tabs,
  activeId,
  defaultActiveId,
  onTabChange,
  className
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(
    defaultActiveId ?? tabs[0]?.id ?? ''
  );
  const active = activeId ?? internalActive;

  const handleClick = (id: string) => {
    if (activeId === undefined) setInternalActive(id);
    onTabChange?.(id);
  };

  return (
    <div className={cn('wp-admin-tabs', className)}>
      <nav className="nav-tab-wrapper" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            className={cn('nav-tab', tab.id === active && 'nav-tab-active')}
            onClick={() => !tab.disabled && handleClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className={cn('wp-admin-tab-panel', tab.id === active && 'is-active')}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
