import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks
 * Uses DOMPurify to remove dangerous HTML/JS while preserving safe formatting
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'code', 'pre',
      'blockquote'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  });
};

/**
 * Sanitize text content - strips all HTML tags
 * Use this for plain text fields that should never contain HTML
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize recipe instructions - allows formatting but no scripts
 * Optimized for recipe content with lists and basic formatting
 */
export const sanitizeRecipeContent = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ol', 'ul', 'li', 'h3', 'h4'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize AI-generated content
 * More permissive to allow markdown-style formatting from AI
 */
export const sanitizeAIContent = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'code', 'pre',
      'blockquote',
      'hr'
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize user input before storing - very strict
 * Use this for form inputs before sending to backend
 */
export const sanitizeInput = (dirty: string): string => {
  // First sanitize HTML
  const cleaned = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });

  // Then trim and normalize whitespace
  return cleaned.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export const sanitizeUrl = (url: string): string => {
  const cleaned = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });

  // Only allow http/https URLs
  if (cleaned.match(/^https?:\/\//i)) {
    return cleaned;
  }

  // Block dangerous protocols
  if (cleaned.match(/^(javascript|data|vbscript|file):/i)) {
    return '';
  }

  return cleaned;
};

/**
 * Component wrapper to safely render HTML content
 * Usage: <div dangerouslySetInnerHTML={createSafeHtml(content)} />
 */
export const createSafeHtml = (dirty: string) => {
  return { __html: sanitizeHtml(dirty) };
};
