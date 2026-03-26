/**
 * Deduplicate price locks by product_id, keeping only one lock per product.
 * If `created_at` is present, keeps the most recently created lock;
 * otherwise keeps the last occurrence (which is typically the newest from DB ordering).
 *
 * This prevents inflated totals when concurrent price-lock requests
 * create multiple active locks for the same product in the same session.
 */
export function deduplicateLocks<T extends { product_id: string }>(
  locks: T[]
): T[] {
  const latestByProduct = new Map<string, T>();

  for (const lock of locks) {
    const existing = latestByProduct.get(lock.product_id);
    if (!existing) {
      latestByProduct.set(lock.product_id, lock);
    } else if ('created_at' in lock && 'created_at' in existing) {
      const lockDate = new Date((lock as Record<string, unknown>).created_at as string);
      const existingDate = new Date((existing as Record<string, unknown>).created_at as string);
      if (lockDate > existingDate) {
        latestByProduct.set(lock.product_id, lock);
      }
    }
    // If no created_at, first occurrence wins (Map preserves insertion order)
  }

  return Array.from(latestByProduct.values());
}
