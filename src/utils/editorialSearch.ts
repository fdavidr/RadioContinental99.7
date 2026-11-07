const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeEditorialText(value: string): string {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function editorialSearchTerms(value: string): string[] {
  return [...new Set(normalizeEditorialText(value).split(/\s+/).filter((term) => term.length > 0))]
    .slice(0, 100)
}

export function normalizeEditorialSlug(value: string): string {
  const normalized = value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slugPattern.test(normalized) ? normalized : ''
}
