import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ButtonHTMLAttributes
} from 'react';
import { cn } from '../utils/cn.js';

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  /** If provided, the item renders as a link. */
  href?: string;
  /** Click handler — fired after the menu closes. */
  onClick?: () => void;
  /** Use destructive (red) styling. */
  destructive?: boolean;
  disabled?: boolean;
  /** Render as a separator instead of a clickable item. `key` is the only other field used. */
  separator?: boolean;
}

export interface DropdownMenuProps {
  /** The trigger element. Must be a single React element that can accept onClick + ref. */
  trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  items: DropdownMenuItem[];
  /** Align the menu to the right edge of the trigger. */
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'left', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: globalThis.MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleItemClick = (item: DropdownMenuItem) => (e: MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    setOpen(false);
    item.onClick?.();
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e: MouseEvent<HTMLButtonElement>) => {
          trigger.props.onClick?.(e);
          setOpen(o => !o);
        },
        'aria-haspopup': 'menu' as const,
        'aria-expanded': open
      })
    : trigger;

  return (
    <div ref={wrapperRef} className={cn('wp-admin-dropdown', className)}>
      {triggerEl}
      <ul
        className={cn('wp-admin-dropdown__menu', align === 'right' && 'is-right')}
        role="menu"
        hidden={!open}
      >
        {items.map(item => {
          if (item.separator) {
            return <li key={item.key} className="wp-admin-dropdown__separator" role="separator" />;
          }
          const itemClass = cn(
            'wp-admin-dropdown__item',
            item.destructive && 'is-destructive'
          );
          const content = item.label;
          return (
            <li key={item.key} role="none">
              {item.href ? (
                <a
                  className={itemClass}
                  href={item.href}
                  role="menuitem"
                  onClick={handleItemClick(item)}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  className={itemClass}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={handleItemClick(item)}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
