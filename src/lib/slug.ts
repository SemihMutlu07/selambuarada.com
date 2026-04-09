// Turkish-aware slug generator. Used to derive a URL slug from a post title.
// Mirrors Sveltia's `{{slug}}` behavior so existing posts keep their canonical paths.

const TURKISH_MAP: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ü: 'u',
  Ü: 'u',
};

export function slugify(input: string): string {
  if (!input) return '';
  let s = input;
  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    s = s.split(from).join(to);
  }
  s = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}
