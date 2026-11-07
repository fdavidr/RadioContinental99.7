import DOMPurify from 'dompurify'

const allowedTags = [
  'a', 'blockquote', 'br', 'em', 'h2', 'h3', 'h4', 'hr', 'img',
  'li', 'ol', 'p', 'strong', 'u', 'ul',
]
const allowedAttributes = ['alt', 'href', 'src', 'title']

export function sanitizeEditorialHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['iframe', 'object', 'script', 'style', 'svg', 'math', 'form'],
    FORBID_ATTR: ['style'],
  })
  const document = new DOMParser().parseFromString(sanitized, 'text/html')

  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href')?.trim() ?? ''
    if (!/^(https?:|mailto:)/i.test(href)) link.removeAttribute('href')
  }
  for (const image of document.querySelectorAll('img[src]')) {
    const src = image.getAttribute('src')?.trim() ?? ''
    if (!/^https:/i.test(src)) image.remove()
  }

  return document.body.innerHTML
}
