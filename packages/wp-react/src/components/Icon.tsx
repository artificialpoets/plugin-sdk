import {
  type ReactNode,
  type SVGAttributes,
  cloneElement,
  isValidElement
} from 'react';
import { cn } from '../utils/cn.js';

/**
 * Names from our small built-in icon set. For the full Gutenberg icon
 * catalog, install `@wordpress/icons` and pass the icon element as children:
 *
 *   import { plus } from '@wordpress/icons';
 *   <Icon>{plus}</Icon>
 */
export type IconName =
  | 'plus' | 'minus' | 'close' | 'check'
  | 'chevron-up' | 'chevron-down' | 'chevron-left' | 'chevron-right'
  | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'
  | 'edit' | 'trash' | 'search' | 'more-horizontal' | 'more-vertical'
  | 'info' | 'warning' | 'external-link';

/** SVG path data for each built-in icon (24×24 viewBox). */
const PATHS: Record<IconName, string> = {
  'plus':            'M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z',
  'minus':           'M19 11H5v2h14v-2z',
  'close':           'M18.36 7.05l-1.41-1.41L12 10.59 7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12z',
  'check':           'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  'chevron-up':      'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  'chevron-down':    'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
  'chevron-left':    'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  'chevron-right':   'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
  'arrow-up':        'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z',
  'arrow-down':      'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z',
  'arrow-left':      'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  'arrow-right':     'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
  'edit':            'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  'trash':           'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  'search':          'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  'more-horizontal': 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  'more-vertical':   'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  'info':            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z',
  'warning':         'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  'external-link':   'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z'
};

interface CommonProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  size?: number;
  /** Accessible label. If omitted, the icon is marked aria-hidden. */
  label?: string;
}

interface NamedIconProps extends CommonProps {
  /** Name from the built-in icon set. */
  name: IconName;
  children?: never;
}

interface CustomIconProps extends CommonProps {
  /** Custom SVG content — either raw <path>/<g> children, or a complete
   *  <svg> element (e.g. an icon from `@wordpress/icons`). */
  children: ReactNode;
  name?: never;
}

export type IconProps = NamedIconProps | CustomIconProps;

export function Icon({ name, children, size = 24, label, className, ...rest }: IconProps) {
  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  // If children is an SVG element (from @wordpress/icons etc.), clone it
  // and apply our size/className/a11y. Detected by checking for <svg>.
  if (isValidElement<SVGAttributes<SVGSVGElement>>(children) && children.type === 'svg') {
    return cloneElement(children, {
      width: size,
      height: size,
      className: cn('wp-admin-icon', className, children.props.className),
      ...a11y,
      ...rest
    });
  }

  // Build our own <svg> wrapper for named icons or raw children.
  const inner: ReactNode = name
    ? <path d={PATHS[name]} fill="currentColor" />
    : children;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('wp-admin-icon', className)}
      {...a11y}
      {...rest}
    >
      {inner}
    </svg>
  );
}
