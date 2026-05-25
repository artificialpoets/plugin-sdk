import { type ReactNode } from 'react';

// ─── NonceField ───────────────────────────────────────────────────────────
export interface NonceFieldProps {
  /**
   * The nonce value, generated on the server by wp_create_nonce($action).
   * Typically passed to the React app via wp_localize_script() or a REST
   * endpoint response — never hard-code it.
   */
  value: string;
  /** Hidden input name. Default '_wpnonce'. */
  name?: string;
  /**
   * Optional referer URL to also include (matches wp_nonce_field() behavior
   * which adds a _wp_http_referer hidden input).
   */
  referer?: string;
}

/**
 * Renders the standard pair of hidden inputs that WordPress's
 * wp_nonce_field() emits — the nonce token plus the optional referer URL.
 *
 * Include this inside every <form> that mutates server state so the PHP
 * handler can validate with wp_verify_nonce() / check_admin_referer().
 */
export function NonceField({ value, name = '_wpnonce', referer }: NonceFieldProps) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      {referer && <input type="hidden" name="_wp_http_referer" value={referer} />}
    </>
  );
}

// ─── CapabilityGate ───────────────────────────────────────────────────────
export interface CapabilityGateProps {
  /**
   * The capability being checked — used purely for the data attribute / docs.
   * The actual check happens server-side; pass the result via `has`.
   */
  capability: string;
  /**
   * Whether the current user has the capability. Compute this server-side
   * (in PHP: current_user_can('manage_options')) and pass the boolean to
   * the React app via wp_localize_script() or a /users/me REST request.
   */
  has: boolean;
  /** What to render if the user lacks the capability. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally render children based on a server-computed capability check.
 *
 * IMPORTANT: Client-side capability gating is a UX/visibility tool only.
 * Always re-check the capability on the server before performing the action
 * — never trust the React boolean for authorization.
 */
export function CapabilityGate({ has, fallback = null, children }: CapabilityGateProps) {
  return <>{has ? children : fallback}</>;
}
