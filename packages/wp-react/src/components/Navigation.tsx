import { type HTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

// ─── NavTabs ──────────────────────────────────────────────────────────────
export interface NavTabsProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function NavTabs({ className, children, ...props }: NavTabsProps) {
  return (
    <nav className={cn('nav-tab-wrapper', className)} {...props}>
      {children}
    </nav>
  );
}

export interface NavTabProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

export function NavTab({ active, className, ...props }: NavTabProps) {
  return (
    <a
      className={cn('nav-tab', active && 'nav-tab-active', className)}
      {...props}
    />
  );
}

// ─── Subsubsub (status filter) ────────────────────────────────────────────
export interface SubsubsubItem {
  key: string;
  label: ReactNode;
  href: string;
  count?: number;
  active?: boolean;
}

export interface SubsubsubProps {
  items: SubsubsubItem[];
}

export function Subsubsub({ items }: SubsubsubProps) {
  return (
    <ul className="subsubsub">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={item.key} className={item.key}>
            <a href={item.href} className={cn(item.active && 'current')}>
              {item.label}
              {item.count !== undefined && (
                <>
                  {' '}
                  <span className="count">({item.count})</span>
                </>
              )}
            </a>
            {!isLast && ' |'}
          </li>
        );
      })}
    </ul>
  );
}
