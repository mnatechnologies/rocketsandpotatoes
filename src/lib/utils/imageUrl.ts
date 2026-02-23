const SUPABASE_STORAGE_URL = 'https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images';

export function getProductImageUrl(imagePath: string | null | undefined, fallback = '/anblogo.png'): string {
  const trimmed = imagePath?.trim();
  if (!trimmed) return fallback;
  // Encode each path segment to handle spaces/special chars, but keep slashes
  const encoded = trimmed.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${SUPABASE_STORAGE_URL}/${encoded}`;
}

export function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
}
