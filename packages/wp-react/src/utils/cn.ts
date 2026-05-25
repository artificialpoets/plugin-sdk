/**
 * Minimal className utility — joins truthy class names with a space.
 * Conditionals are expressed as `cond && 'class-name'` at the call site.
 */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}
