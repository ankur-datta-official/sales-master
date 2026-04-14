/** Internal path safe for redirects (open-redirect safe). */
export function isSafeRelativePath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes(":") &&
    !path.includes("\\")
  );
}
