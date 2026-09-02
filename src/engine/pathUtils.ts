/**
 * Normalizes a file path for use as a lookup key across the engine.
 * The same file can arrive with backslashes (path.join on Windows) or
 * forward slashes (a URI-derived path, or a caller typing a path by hand) -
 * chunks are always keyed on the forward-slash form so lookups are
 * consistent regardless of how the path was produced.
 */
export function normalizeSourcePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
