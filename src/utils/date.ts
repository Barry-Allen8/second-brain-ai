/**
 * Date utility functions.
 */

/**
 * Returns current timestamp in ISO 8601 format.
 */
export function now(): string {
  return new Date().toISOString();
}
