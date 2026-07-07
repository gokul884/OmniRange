/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost } from '../types';

/**
 * Strips HTML tags from content string and removes redundant whitespace
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Generates a clean text excerpt from HTML content
 */
export const getExcerpt = (contentHtml: string, limit = 150): string => {
  const plainText = stripHtml(contentHtml);
  if (plainText.length <= limit) return plainText;
  return plainText.substring(0, limit).trim() + '...';
};

/**
 * Formats Blogger's published ISO timestamp to standard uppercase layout, e.g., "JUL 05, 2026"
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'JUN 28, 2026';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch (e) {
    return 'JUN 28, 2026';
  }
};

/**
 * Calculates reading time in minutes based on 200 words per minute
 */
export const calculateReadTime = (contentHtml: string): string => {
  const plainText = stripHtml(contentHtml);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const minutes = Math.max(1, Math.ceil(words.length / 200));
  return `${minutes} MIN READ`;
};

/**
 * Extracts a high-resolution image URL from a Blogger post entry
 */
export const extractImage = (entry: any): string => {
  // 1. Try media$thumbnail first
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    let url = entry.media$thumbnail.url;
    // Replace lower resolution suffixes with compressed, high-quality s1200-rw (WebP format) modifier
    return url
      .replace(/\/s\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/')
      .replace(/\/w\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/');
  }

  // 2. Fallback to first img element inside content
  const content = entry.content?.$t || entry.summary?.$t || '';
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = content.match(imgRegex);
  if (match && match[1]) {
    let url = match[1];
    // Optimize the fallback content image url
    if (url.includes('googleusercontent.com') || url.includes('blogspot.com') || url.includes('bp.blogspot.com')) {
      return url
        .replace(/\/s\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/')
        .replace(/\/w\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/')
        .replace(/[=sS]\d+([-a-zA-Z0-9]+)?$/, '=s1200-rw');
    }
    return url;
  }

  // 3. Fallback to dynamic placeholder
  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';
};

/**
 * Maps a single Blogger entry JSON object to the BlogPost schema
 */
export const mapBloggerPost = (entry: any): BlogPost & { url: string } => {
  const id = entry.id?.$t || String(Math.random());
  const title = entry.title?.$t || entry.title?.text || '';
  const content = entry.content?.$t || entry.summary?.$t || '';
  
  const image = extractImage(entry);
  
  // Category: use the post's first label, fallback to General
  let category = 'General';
  if (entry.category && entry.category.length > 0) {
    category = entry.category[0].term || 'General';
  }

  const date = formatDate(entry.published?.$t || '');
  const readTime = calculateReadTime(content);
  const excerpt = getExcerpt(content, 150);

  // Author information
  const authorName = entry.author?.[0]?.name?.$t || entry.author?.[0]?.name || 'OmniRange Team';
  const authorAvatar = entry.author?.[0]?.gd$image?.src || '';

  // Retrieve alternate html URL from links array
  const alternateLink = entry.link?.find((l: any) => l.rel === 'alternate')?.href || '';

  return {
    id,
    title,
    description: excerpt,
    content,
    category,
    date,
    image,
    author: authorName,
    authorRole: 'Contributor',
    authorAvatar,
    readTime,
    metaKeywords: entry.category?.map((c: any) => c.term).join(', ') || '',
    url: alternateLink
  };
};

/**
 * Fetches the Blogger JSON feed. It first attempts to use the local Vite server proxy
 * (to circumvent CORS and sandbox script/JSONP restrictions). If that fails, it
 * falls back to a JSONP script-injection approach.
 */
export const fetchBloggerFeed = async (): Promise<(BlogPost & { url: string })[]> => {
  // 1. Try local dev server proxy first
  try {
    const response = await fetch('/api/blogger-feed');
    if (response.ok) {
      const data = await response.json();
      const entries = data.feed?.entry || [];
      return entries.map(mapBloggerPost);
    }
  } catch (err) {
    console.warn('Vite server proxy failed, trying JSONP fallback...', err);
  }

  // 2. Fallback to JSONP script injection
  return new Promise((resolve, reject) => {
    // Generate a unique callback name to prevent conflicts
    const callbackName = `blogger_jsonp_callback_${Math.round(Math.random() * 1000000)}`;
    const script = document.createElement('script');
    
    // Blogger supports JSON-in-script format with a specified callback parameter
    const url = `https://omnirangesolutions.blogspot.com/feeds/posts/default?alt=json-in-script&callback=${callbackName}&max-results=20`;

    // 10 second safety timeout for loading
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('OmniRange insights request timed out. Please check your network connection.'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };

    // Define the global callback function
    (window as any)[callbackName] = (data: any) => {
      cleanup();
      try {
        const entries = data.feed?.entry || [];
        const posts = entries.map(mapBloggerPost);
        resolve(posts);
      } catch (e) {
        reject(new Error('Failed to parse dynamic feed insights. Please try again.'));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Unable to connect to Blogger feed. This might be due to a strict network firewall or offline status.'));
    };

    script.src = url;
    script.async = true;
    document.head.appendChild(script);
  });
};
