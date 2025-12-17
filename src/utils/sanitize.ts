/**
 * Sanitizes player name input
 * - Trims whitespace
 * - Limits length to 64 characters (matches DB schema)
 * - Removes special characters (only allows alphanumeric, spaces, hyphens, underscores)
 * - Returns null if invalid
 */
export function sanitizePlayerName(input: string | undefined | null): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Check if empty after trim
  if (sanitized.length === 0) {
    return null;
  }

  // Remove special characters (keep only alphanumeric, spaces, hyphens, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, "");

  // Limit length to 64 characters (DB constraint)
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
  }

  // Trim again in case we cut off at a space
  sanitized = sanitized.trim();

  // Final check - must have at least 1 character
  if (sanitized.length === 0) {
    return null;
  }

  return sanitized;
}

