import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

// ─── ListTable (.wp-list-table widefat) ──────────────────────────────────
export interface ListTableProps extends HTMLAttributes<HTMLTableElement> {
  /** Apply the alternating-row striped look. Default true. */
  striped?: boolean;
  /** Apply the fixed column-width layout. Default true. */
  fixed?: boolean;
  /** Render the table at full width. Default true. */
  widefat?: boolean;
  children: ReactNode;
}

export function ListTable({
  striped = true,
  fixed = true,
  widefat = true,
  className,
  children,
  ...props
}: ListTableProps) {
  return (
    <table
      className={cn(
        'wp-list-table',
        widefat && 'widefat',
        fixed && 'fixed',
        striped && 'striped',
        className
      )}
      {...props}
    >
      {children}
    </table>
  );
}

// ─── RowActions ──────────────────────────────────────────────────────────
export interface RowAction {
  key: string;
  label: ReactNode;
  href: string;
  variant?: 'default' | 'delete';
}

export interface RowActionsProps {
  actions: RowAction[];
}

export function RowActions({ actions }: RowActionsProps) {
  return (
    <div className="row-actions">
      {actions.map((a, i) => {
        const last = i === actions.length - 1;
        return (
          <span key={a.key} className={a.key}>
            <a href={a.href} className={cn(a.variant === 'delete' && 'submitdelete')}>
              {a.label}
            </a>
            {!last && ' | '}
          </span>
        );
      })}
    </div>
  );
}

// ─── BulkActions ─────────────────────────────────────────────────────────
export interface BulkAction {
  value: string;
  label: ReactNode;
}

export interface BulkActionsProps {
  actions: BulkAction[];
  /** Name of the select field — defaults to "action". */
  name?: string;
  /** Submit-button label — defaults to "Apply". */
  applyLabel?: ReactNode;
  position?: 'top' | 'bottom';
}

export function BulkActions({
  actions,
  name = 'action',
  applyLabel = 'Apply',
  position = 'top'
}: BulkActionsProps) {
  return (
    <div className={cn('tablenav', position)}>
      <div className="alignleft actions bulkactions">
        <label className="screen-reader-text" htmlFor={`bulk-${name}`}>
          Select bulk action
        </label>
        <select id={`bulk-${name}`} name={name}>
          <option value="-1">Bulk actions</option>
          {actions.map(a => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <button type="submit" className="button action">
          {applyLabel}
        </button>
      </div>
    </div>
  );
}

// ─── SearchBox ───────────────────────────────────────────────────────────
export interface SearchBoxProps {
  label?: ReactNode;
  buttonLabel?: ReactNode;
  placeholder?: string;
  defaultValue?: string;
  /** Query parameter name — defaults to WordPress's "s". */
  name?: string;
  id?: string;
}

export function SearchBox({
  label = 'Search:',
  buttonLabel = 'Search',
  placeholder,
  defaultValue,
  name = 's',
  id = 'post-search-input'
}: SearchBoxProps) {
  return (
    <p className="search-box">
      <label className="screen-reader-text" htmlFor={id}>
        {label}
      </label>
      <input
        type="search"
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      <button type="submit" className="button">
        {buttonLabel}
      </button>
    </p>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────
export interface PaginationProps {
  totalItems: number;
  page: number;
  totalPages: number;
  /** Builds the href for a given page. Default uses ?paged=N. */
  hrefFor?: (page: number) => string;
  itemLabel?: string;
}

export function Pagination({
  totalItems,
  page,
  totalPages,
  hrefFor = (p) => `?paged=${p}`,
  itemLabel = 'items'
}: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  return (
    <div className="tablenav-pages">
      <span className="displaying-num">
        {totalItems} {itemLabel}
      </span>
      <span className="pagination-links">
        <a
          className={cn('first-page', 'button', !hasPrev && 'disabled')}
          href={hrefFor(1)}
        >
          <span aria-hidden="true">«</span>
        </a>
        <a
          className={cn('prev-page', 'button', !hasPrev && 'disabled')}
          href={hrefFor(Math.max(1, page - 1))}
        >
          <span aria-hidden="true">‹</span>
        </a>
        <span className="paging-input">
          <span className="tablenav-paging-text">
            {page} of <span className="total-pages">{totalPages}</span>
          </span>
        </span>
        <a
          className={cn('next-page', 'button', !hasNext && 'disabled')}
          href={hrefFor(Math.min(totalPages, page + 1))}
        >
          <span aria-hidden="true">›</span>
        </a>
        <a
          className={cn('last-page', 'button', !hasNext && 'disabled')}
          href={hrefFor(totalPages)}
        >
          <span aria-hidden="true">»</span>
        </a>
      </span>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: ReactNode; href: string };
}

export function EmptyState({ icon = '∅', title, description, action }: EmptyStateProps) {
  return (
    <div className="wp-admin-empty">
      <div className="wp-admin-empty__icon">{icon}</div>
      <div className="wp-admin-empty__title">{title}</div>
      {description && (
        <div className="wp-admin-empty__description">{description}</div>
      )}
      {action && (
        <a href={action.href} className="button button-primary">
          {action.label}
        </a>
      )}
    </div>
  );
}
