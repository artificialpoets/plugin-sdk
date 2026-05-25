import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type LabelHTMLAttributes,
  type HTMLAttributes,
  type ReactNode
} from 'react';
import { cn } from '../utils/cn.js';

type InputWidth = 'regular' | 'large' | 'small';

interface WidthProp { width?: InputWidth; }

function widthClass(w?: InputWidth): string {
  if (!w) return 'regular-text';
  return `${w}-text`;
}

// ─── Input ────────────────────────────────────────────────────────────────
export type InputProps =
  & WidthProp
  & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { width, className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(widthClass(width), className)}
      {...props}
    />
  );
});

// ─── Textarea ─────────────────────────────────────────────────────────────
export type TextareaProps =
  & WidthProp
  & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { width = 'large', className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(widthClass(width), className)}
      {...props}
    />
  );
});

// ─── Select ───────────────────────────────────────────────────────────────
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={className} {...props}>
      {children}
    </select>
  );
});

// ─── FormTable ────────────────────────────────────────────────────────────
export interface FormTableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function FormTable({ className, children, ...props }: FormTableProps) {
  return (
    <table className={cn('form-table', className)} {...props}>
      <tbody>{children}</tbody>
    </table>
  );
}

// ─── FormRow ──────────────────────────────────────────────────────────────
export interface FormRowProps {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  description?: ReactNode;
}

export function FormRow({ label, htmlFor, children, description }: FormRowProps) {
  return (
    <tr>
      <th scope="row">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
      </th>
      <td>
        {children}
        {description && <p className="description">{description}</p>}
      </td>
    </tr>
  );
}

// ─── Description ──────────────────────────────────────────────────────────
export interface DescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function Description({ className, children, ...props }: DescriptionProps) {
  return (
    <p className={cn('description', className)} {...props}>
      {children}
    </p>
  );
}

// ─── HelpTip (? icon with tooltip) ────────────────────────────────────────
export interface HelpTipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tip: string;
}

export function HelpTip({ tip, className, ...props }: HelpTipProps) {
  return (
    <span
      className={cn('wp-admin-helptip', className)}
      data-tip={tip}
      role="tooltip"
      aria-label={tip}
      {...props}
    />
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────
export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  label?: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, labelProps, className, ...props },
  ref
) {
  return (
    <label {...labelProps} className={cn('wp-admin-toggle', labelProps?.className)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn('wp-admin-toggle__input', className)}
        {...props}
      />
      <span className="wp-admin-toggle__track" />
      {label && <span className="wp-admin-toggle__label">{label}</span>}
    </label>
  );
});

// ─── Submit row (button + spinner) ───────────────────────────────────────
export interface SubmitProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function Submit({ className, children, ...props }: SubmitProps) {
  return (
    <p className={cn('submit', className)} {...props}>
      {children}
    </p>
  );
}

// ─── ColorPicker ──────────────────────────────────────────────────────────
export type ColorPickerProps =
  & WidthProp
  & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

/**
 * Renders the standard markup that WP's Iris color picker (wp-color-picker)
 * upgrades. Without the wp-color-picker script enqueued, it falls back to a
 * regular text input — which still validates as a color string.
 *
 * In WP context, register Iris with:
 *
 *     wp_enqueue_style('wp-color-picker');
 *     wp_enqueue_script('wp-color-picker');
 *     // then init in JS: jQuery('.wp-color-picker').wpColorPicker();
 */
export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  function ColorPicker({ width, className, defaultValue = '#2271b1', ...props }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        defaultValue={defaultValue}
        className={cn('wp-color-picker', widthClass(width), className)}
        {...props}
      />
    );
  }
);

// ─── DatePicker ───────────────────────────────────────────────────────────
export type DatePickerProps =
  & WidthProp
  & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

/**
 * Native HTML5 date input styled to fit WordPress admin. Works without JS.
 * For the jQuery UI datepicker (WP's older convention), set
 * `type="text"` via props and call jQuery.datepicker on it.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ width = 'regular', className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(widthClass(width), className)}
        {...props}
      />
    );
  }
);
