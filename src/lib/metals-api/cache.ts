interface CachedMetalData {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CachedMetalData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}