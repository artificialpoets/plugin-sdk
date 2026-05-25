import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import { cn } from '../utils/cn.js';

type ButtonVariant = 'primary' | 'secondary' | 'link' | 'link-delete';
type ButtonSize = 'small' | 'large' | 'hero';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export type ButtonProps =
  & CommonProps
  & ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonLinkProps =
  & CommonProps
  & AnchorHTMLAttributes<HTMLAnchorElement>
  & { href: string };

function classes(variant: ButtonVariant | undefined, size: ButtonSize | undefined): string {
  const base = variant === 'link' || variant === 'link-delete'
    ? cn('button-link', variant === 'link-delete' && 'button-link-delete')
    : cn('button', variant && `button-${variant}`);
  return cn(base, size && `button-${size}`);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(classes(variant, size), className)}
      {...props}
    />
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, size, className, ...props },
  ref
) {
  return (
    <a
      ref={ref}
      className={cn(classes(variant, size), className)}
      {...props}
    />
  );
});
