/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates high-performance WebP image URLs and responsive srcSet arrays 
 * from Google User Content or Unsplash source URLs.
 * 
 * @param url The source image URL.
 * @param defaultWidth The fallback/default width in pixels.
 */
export function getOptimizedImage(url: string, defaultWidth: number = 600): { src: string; srcSet?: string } {
  if (!url) return { src: '' };

  // Handle Google/Blogger/Blogspot hosted images
  if (
    url.includes('googleusercontent.com') ||
    url.includes('blogspot.com') ||
    url.includes('bp.blogspot.com')
  ) {
    // 1. If it uses query-based parameters (e.g., ends in =s1600 or has =w320)
    if (url.includes('=')) {
      const cleanUrl = url.split('=')[0];
      const widths = defaultWidth <= 200 
        ? [48, 96, 144, 192, 256] 
        : [320, 480, 640, 800, 1024, 1200];
      
      const src = `${cleanUrl}=w${defaultWidth}-rw`;
      const srcSet = widths
        .map(w => `${cleanUrl}=w${w}-rw ${w}w`)
        .join(', ');
        
      return { src, srcSet };
    }

    // 2. If it uses path-based size modifiers like /s1600/ or /s72-c/ or /w640-h480/
    const pathModifierRegex = /\/([sw]\d+[-a-zA-Z0-9]*)\//;
    if (pathModifierRegex.test(url)) {
      const widths = defaultWidth <= 200 
        ? [48, 96, 144, 192, 256] 
        : [320, 480, 640, 800, 1024, 1200];

      const src = url.replace(pathModifierRegex, `/s${defaultWidth}-rw/`);
      const srcSet = widths
        .map(w => `${url.replace(pathModifierRegex, `/s${w}-rw/`)} ${w}w`)
        .join(', ');

      return { src, srcSet };
    }
  }

  // Handle Unsplash image URLs
  if (url.includes('unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('fm', 'webp');
      
      const widths = defaultWidth <= 200 
        ? [48, 96, 144, 192, 256] 
        : [320, 480, 640, 800, 1024, 1200];
      
      urlObj.searchParams.set('w', defaultWidth.toString());
      if (defaultWidth <= 200) {
        urlObj.searchParams.set('fit', 'crop');
        urlObj.searchParams.set('h', defaultWidth.toString());
      }
      const src = urlObj.toString();
      
      const srcSet = widths
        .map(w => {
          const u = new URL(url);
          u.searchParams.set('fm', 'webp');
          u.searchParams.set('w', w.toString());
          if (defaultWidth <= 200) {
            u.searchParams.set('fit', 'crop');
            u.searchParams.set('h', w.toString());
          }
          return `${u.toString()} ${w}w`;
        })
        .join(', ');
        
      return { src, srcSet };
    } catch (e) {
      return { src: url };
    }
  }

  // Fallback for any other/unrecognized image hosts
  return { src: url };
}
