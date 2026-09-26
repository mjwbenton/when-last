import type { Category } from './types';

export type CategoryColorOption = { name: string; value: string };

// Twelve mid-tone colours chosen so white text keeps at least ~4.5:1 contrast,
// matching the existing green (#2f7d6b, 4.9:1).
export const CATEGORY_COLORS: CategoryColorOption[] = [
  { name: 'Teal', value: '#2f7d6b' },
  { name: 'Ocean', value: '#2f6f9e' },
  { name: 'Indigo', value: '#4b53a8' },
  { name: 'Violet', value: '#7a45a8' },
  { name: 'Plum', value: '#9c3f7a' },
  { name: 'Rose', value: '#a8404f' },
  { name: 'Brick', value: '#a8503a' },
  { name: 'Amber', value: '#8a6218' },
  { name: 'Olive', value: '#5f7a2a' },
  { name: 'Forest', value: '#3f7a45' },
  { name: 'Cyan', value: '#1f7488' },
  { name: 'Slate', value: '#4a6274' },
];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0]!.value;

/** First palette colour not already used, falling back to a cycling choice. */
export function nextCategoryColor(existing: string[]): string {
  const unused = CATEGORY_COLORS.find((c) => !existing.includes(c.value));
  if (unused) return unused.value;
  return CATEGORY_COLORS[existing.length % CATEGORY_COLORS.length]!.value;
}

/** Colour for an action's category, or null when uncategorized/unknown. */
export function colorForCategory(
  categories: Category[],
  categoryId: string | null | undefined,
): string | null {
  if (!categoryId) return null;
  return categories.find((c) => c.id === categoryId)?.color ?? null;
}
