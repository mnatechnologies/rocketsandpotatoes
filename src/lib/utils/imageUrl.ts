const SUPABASE_STORAGE_URL = 'https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images';

export function getProductImageUrl(imagePath: string | null | undefined, fallback = '/anblogo.png'): string {
  const trimmed = imagePath?.trim();
  if (!trimmed) return fallback;
  return `${SUPABASE_STORAGE_URL}/${trimmed}`;
}
