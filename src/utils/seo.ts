/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MetaTagProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  keywords?: string;
  author?: string;
  ogType?: string;
  ogUrl?: string;
}

/**
 * Dynamically updates the document head with meta tags to improve SEO
 * for specific sections/pages.
 */
export function generateMetaTags(props: MetaTagProps) {
  if (typeof window === 'undefined') return;

  const updateOrCreateMeta = (nameOrProperty: string, contentValue: string) => {
    const isProperty = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('twitter:');
    const attributeName = isProperty ? 'property' : 'name';
    const selector = `meta[${attributeName}="${nameOrProperty}"]`;
    
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, nameOrProperty);
      document.head.appendChild(element);
    }
    element.setAttribute('content', contentValue);
  };

  // Update Title & OG Title & Twitter Title
  if (props.title) {
    document.title = props.title;
    updateOrCreateMeta('og:title', props.title);
    updateOrCreateMeta('twitter:title', props.title);
  }

  // Update Description & OG/Twitter Description
  if (props.description) {
    updateOrCreateMeta('description', props.description);
    updateOrCreateMeta('og:description', props.description);
    updateOrCreateMeta('twitter:description', props.description);
  }

  // Update Keywords
  if (props.keywords) {
    updateOrCreateMeta('keywords', props.keywords);
  }

  // Update Author
  if (props.author) {
    updateOrCreateMeta('author', props.author);
  }

  // Update OG Image & Twitter Image
  if (props.ogImage) {
    updateOrCreateMeta('og:image', props.ogImage);
    updateOrCreateMeta('twitter:image', props.ogImage);
  }

  // Update OG Type
  if (props.ogType) {
    updateOrCreateMeta('og:type', props.ogType);
  }

  // Update OG URL
  if (props.ogUrl) {
    updateOrCreateMeta('og:url', props.ogUrl);
  }

  // Update Canonical Link
  if (props.canonical) {
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', props.canonical);
  }
}
