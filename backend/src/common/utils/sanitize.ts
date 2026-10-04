import sanitizeHtml from 'sanitize-html';

export function sanitizeHtmlContent(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br',
      'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'style']
    },
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' })
    }
  });
  
}