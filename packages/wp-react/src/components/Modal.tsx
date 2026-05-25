import {
  useEffect,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent
} from 'react';
import { cn } from '../utils/cn.js';
import { Button } from './Button.js';

export type ModalSize = 'small' | 'medium' | 'large';

// ─── Modal ────────────────────────────────────────────────────────────────
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  /** Footer content — usually action buttons. */
  footer?: ReactNode;
  /** Disable the click-outside-to-close behavior. */
  disableBackdropClose?: boolean;
  /** Disable the Escape-key-to-close behavior. */
  disableEscapeClose?: boolean;
  /** Hide the × close button in the header. */
  hideCloseButton?: boolean;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = 'medium',
  footer,
  disableBackdropClose,
  disableEscapeClose,
  hideCloseButton,
  children
}: ModalProps) {
  // Escape key listener
  useEffect(() => {
    if (!open || disableEscapeClose) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, disableEscapeClose, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (disableBackdropClose) return;
    if (e.target === e.currentTarget) onClose();
  };

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Stop Escape from propagating to other handlers when modal is open
    if (e.key === 'Escape') e.stopPropagation();
  };

  return (
    <div
      className="wp-admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onBackdrop}
    >
      <div
        className={cn('wp-admin-modal', `is-${size}`)}
        onKeyDown={onDialogKeyDown}
      >
        {(title || !hideCloseButton) && (
          <header className="wp-admin-modal__header">
            {title && <h2 className="wp-admin-modal__title">{title}</h2>}
            {!hideCloseButton && (
              <button
                type="button"
                className="wp-admin-modal__close"
                onClick={onClose}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="wp-admin-modal__body">{children}</div>
        {footer && <footer className="wp-admin-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────
export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** Destructive style (red confirm button + delete intent). */
  destructive?: boolean;
  /** Message body. Use children for richer content. */
  message?: ReactNode;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  message,
  children
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="small"
      footer={
        <>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button
            variant="primary"
            className={destructive ? 'is-destructive' : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? message}
    </Modal>
  );
}
