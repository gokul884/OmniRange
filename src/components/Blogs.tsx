/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  Clock, 
  ArrowUpRight, 
  X, 
  BookOpen, 
  User, 
  Share2, 
  Check,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Calendar,
  Sparkles,
  Heart,
  Twitter,
  Linkedin,
  Printer
} from 'lucide-react';
import { BLOGS_DATA, BlogPost } from '../types';
import { fetchBloggerFeed } from '../lib/blogger';
import ReactMarkdown from 'react-markdown';
import OptimizedImage from './OptimizedImage';


const parseInlineMarkdown = (text: string) => {
  if (!text) return '';
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-semibold text-on-surface">
          {part}
        </strong>
      );
    }
    return part;
  });
};

/**
 * Sanitizes blog content (e.g. cleans up super long alt text or titles on images to prevent giant labels).
 */
const cleanBlogPostContent = (contentHtml: string): string => {
  if (typeof window === 'undefined' || !contentHtml) return contentHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    
    // Clean up super long alt text / labels on all images inside the blog content to prevent giant labels
    const imgs = doc.querySelectorAll('img');
    for (const img of Array.from(imgs)) {
      const alt = img.getAttribute('alt') || '';
      if (alt.length > 100 || alt.toLowerCase().includes('create a') || alt.toLowerCase().includes('infographic') || alt.toLowerCase().includes('introduction')) {
        // Set alt attribute to empty so it doesn't render as a giant label/tooltip/caption
        img.setAttribute('alt', '');
        img.removeAttribute('title');
      }

      // Automatically compress and optimize inline Blogger and Unsplash images
      const src = img.getAttribute('src') || '';
      if (src) {
        if (src.includes('googleusercontent.com') || src.includes('blogspot.com') || src.includes('bp.blogspot.com')) {
          const pathModifierRegex = /\/([sw]\d+[-a-zA-Z0-9]*)\//;
          let optimizedSrc = src;
          if (pathModifierRegex.test(optimizedSrc)) {
            optimizedSrc = optimizedSrc.replace(pathModifierRegex, '/s1200-rw/');
          } else {
            const queryModifierRegex = /([=sS])\d+([-a-zA-Z0-9]*)$/;
            if (queryModifierRegex.test(optimizedSrc)) {
              optimizedSrc = optimizedSrc.replace(queryModifierRegex, '=s1200-rw');
            }
          }
          img.setAttribute('src', optimizedSrc);
        } else if (src.includes('unsplash.com')) {
          try {
            const u = new URL(src);
            u.searchParams.set('auto', 'format');
            u.searchParams.set('q', '80');
            u.searchParams.set('w', '1200');
            img.setAttribute('src', u.toString());
          } catch (e) {
            // ignore malformed URLs
          }
        }
      }
    }
    
    return doc.body.innerHTML;
  } catch (err) {
    console.error('Error cleaning blog content:', err);
    return contentHtml;
  }
};

interface BlogsProps {
  readingArticle: BlogPost | null;
  onSelectArticle: (post: BlogPost | null) => void;
  livePosts?: BlogPost[];
  isLoadingLive?: boolean;
  liveError?: string | null;
}

export default function Blogs({ 
  readingArticle, 
  onSelectArticle, 
  livePosts, 
  isLoadingLive, 
  liveError 
}: BlogsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Local state for feed data (with prop sync and self-contained fetching backup)
  const [localPosts, setLocalPosts] = useState<BlogPost[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (livePosts && livePosts.length > 0) {
      setLocalPosts(livePosts);
      setLocalLoading(isLoadingLive ?? false);
      setLocalError(liveError ?? null);
    } else {
      let isMounted = true;
      setLocalLoading(true);
      fetchBloggerFeed()
        .then((data) => {
          if (!isMounted) return;
          setLocalPosts(data);
          setLocalLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Failed to fetch Blogger feed inside Blogs.tsx:', err);
          setLocalError('Unable to load our latest insights at this time. Please check your connection or try again later.');
          setLocalLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [livePosts, isLoadingLive, liveError]);

  // Dynamically extract categories from live posts
  const categories = useMemo(() => {
    const labels = new Set<string>();
    localPosts.forEach(post => {
      if (post.category) {
        labels.add(post.category);
      }
    });
    return ['All', ...Array.from(labels)];
  }, [localPosts]);

  // Dynamically inject BlogPosting JSON-LD for individual articles
  useEffect(() => {
    // Clean up any existing BlogPosting JSON-LD script first
    const existingScript = document.getElementById('blogposting-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    if (readingArticle) {
      const formatSchemaDate = (dateStr: string): string => {
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        } catch (e) {
          // ignore
        }
        return '2026-06-28';
      };

      const formattedDate = formatSchemaDate(readingArticle.date);

      const jsonLD = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${window.location.origin}/#blogs?id=${readingArticle.id}`,
        "headline": readingArticle.title,
        "description": readingArticle.description,
        "image": readingArticle.image,
        "datePublished": formattedDate,
        "dateModified": formattedDate,
        "author": {
          "@type": "Person",
          "name": readingArticle.author,
          "jobTitle": readingArticle.authorRole,
          "image": readingArticle.authorAvatar
        },
        "publisher": {
          "@type": "Organization",
          "name": "OmniRange",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/logo-fav.svg`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${window.location.origin}/#blogs`
        },
        "keywords": readingArticle.metaKeywords || ""
      };

      const script = document.createElement('script');
      script.id = 'blogposting-jsonld';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(jsonLD, null, 2);
      document.head.appendChild(script);
    }

    return () => {
      const existingScriptCleanup = document.getElementById('blogposting-jsonld');
      if (existingScriptCleanup) {
        existingScriptCleanup.remove();
      }
    };
  }, [readingArticle]);

  // Comments state mapped by blog post id with extended reaction attributes
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{
    id: string; 
    name: string; 
    text: string; 
    date: string; 
    likes: number;
    dislikes: number;
    hearts: number;
    myReaction?: 'like' | 'dislike' | 'heart' | null;
  }>>>({
    b1: [
      { id: 'c1', name: 'David Carter', text: 'This is a fantastic analysis. Server-side tracking has completely restored our attribution accuracy in GA4. Thanks for sharing these details!', date: 'June 29, 2026', likes: 12, dislikes: 0, hearts: 4, myReaction: null },
      { id: 'c2', name: 'Sarah Miller', text: 'The part about Shapley values was very insightful. Do you recommend any specific tools for implementing this in custom dashboards?', date: 'June 29, 2026', likes: 5, dislikes: 1, hearts: 2, myReaction: null }
    ],
    b2: [
      { id: 'c3', name: 'Alex Rivera', text: 'INP replacing FID has been a major focus for our dev team. Pre-allocating image slots did wonders for our CLS score!', date: 'June 16, 2026', likes: 18, dislikes: 0, hearts: 6, myReaction: null },
      { id: 'c4', name: 'Nora Vance', text: 'Excellent summary. People often forget how much page speed correlates directly with mobile e-commerce checkout dropoffs.', date: 'June 17, 2026', likes: 8, dislikes: 0, hearts: 3, myReaction: null }
    ],
    b3: [
      { id: 'c5', name: 'Gavin Hughes', text: 'A perfect harmony of numbers and stories is exactly what builds iconic modern brands. Data tells us where, creative tells us why.', date: 'June 01, 2026', likes: 14, dislikes: 1, hearts: 5, myReaction: null }
    ]
  });

  // Inputs for posting a comment
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Filter and Search logic combined
  const filteredBlogs = useMemo(() => {
    return localPosts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [localPosts, selectedCategory, searchQuery]);

  const handleShareArticle = (title: string) => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim() || !readingArticle) return;

    const newComment = {
      id: `c_${Date.now()}`,
      name: newCommentName.trim(),
      text: newCommentText.trim(),
      date: 'Just now',
      likes: 0,
      dislikes: 0,
      hearts: 0,
      myReaction: null as 'like' | 'dislike' | 'heart' | null
    };

    setCommentsMap(prev => ({
      ...prev,
      [readingArticle.id]: [newComment, ...(prev[readingArticle.id] || [])]
    }));

    setNewCommentName('');
    setNewCommentText('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 3000);
  };

  const handleReactComment = (commentId: string, reactionType: 'like' | 'dislike' | 'heart') => {
    if (!readingArticle) return;
    setCommentsMap(prev => ({
      ...prev,
      [readingArticle.id]: (prev[readingArticle.id] || []).map(c => {
        if (c.id !== commentId) return c;
        
        let likes = c.likes;
        let dislikes = c.dislikes || 0;
        let hearts = c.hearts || 0;
        const currentReaction = c.myReaction || null;
        
        // Subtract existing reaction if any
        if (currentReaction === 'like') likes = Math.max(0, likes - 1);
        if (currentReaction === 'dislike') dislikes = Math.max(0, dislikes - 1);
        if (currentReaction === 'heart') hearts = Math.max(0, hearts - 1);
        
        // If clicked reaction matches current, they toggled it off
        if (currentReaction === reactionType) {
          return {
            ...c,
            likes,
            dislikes,
            hearts,
            myReaction: null
          };
        } else {
          // Add new reaction
          if (reactionType === 'like') likes++;
          if (reactionType === 'dislike') dislikes++;
          if (reactionType === 'heart') hearts++;
          
          return {
            ...c,
            likes,
            dislikes,
            hearts,
            myReaction: reactionType
          };
        }
      })
    }));
  };

  // Switch active blog post smoothly
  const handleSelectArticle = (post: BlogPost) => {
    onSelectArticle(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sidebar Blogs (other than the current reading one)
  const sidebarBlogs = useMemo(() => {
    if (!readingArticle) return [];
    return localPosts.filter(post => post.id !== readingArticle.id);
  }, [readingArticle, localPosts]);

  // Dynamically compute 2-3 related posts for the active article based on matching categories
  const relatedPosts = useMemo(() => {
    if (!readingArticle) return [];
    
    // Find articles in the same category, excluding the current one
    const sameCategory = localPosts.filter(
      (post) => post.category === readingArticle.category && post.id !== readingArticle.id
    );
    
    // If we have fewer than 3 same-category posts, fill with other posts (excluding current)
    if (sameCategory.length < 3) {
      const remainingNeeded = 3 - sameCategory.length;
      const others = localPosts.filter(
        (post) => post.category !== readingArticle.category && post.id !== readingArticle.id
      );
      return [...sameCategory, ...others.slice(0, remainingNeeded)];
    }
    
    return sameCategory.slice(0, 3);
  }, [readingArticle, localPosts]);

  // Current comments for reading article
  const currentComments = useMemo(() => {
    if (!readingArticle) return [];
    return commentsMap[readingArticle.id] || [];
  }, [readingArticle, commentsMap]);

  // Check if the blog body already has the featured image embedded
  const hasFeaturedImageInContent = useMemo(() => {
    if (!readingArticle || !readingArticle.image || !readingArticle.content) return false;
    
    // Normalize any Google Photos / Blogger image URL to its unique base identifier
    const normalizeImgUrl = (url: string) => {
      if (!url) return '';
      try {
        // Remove protocol and query parameters
        let clean = url.replace(/^(https?:)?\/\//i, '').split('?')[0];
        
        // Remove common resolution modifiers like /s1600/, /s640/, /s320/, /s72-c/, /w640-h480/, /s1600-h/
        clean = clean
          .replace(/\/s\d+(-[a-z0-9-]+)?\//gi, '/')
          .replace(/\/w\d+(-[a-z0-9-]+)?\//gi, '/')
          .replace(/\/s\d+(-[a-z0-9-]+)?$/gi, '')
          .replace(/\/w\d+(-[a-z0-9-]+)?$/gi, '')
          .replace(/[\/=](s\d+|w\d+|h\d+)(-[c-k-no]+)?\b/gi, '');
          
        return clean.toLowerCase().trim();
      } catch {
        return url.toLowerCase().trim();
      }
    };

    // Extract a unique long alphanumeric identifier token typical of Google/Blogger/Unsplash URLs
    const extractUniqueToken = (url: string): string => {
      if (!url) return '';
      const parts = url.split(/[\/\?&=_.-]/);
      for (const part of parts) {
        if (part.length > 20 && /^[a-z0-9-_]+$/i.test(part)) {
          return part.toLowerCase();
        }
      }
      return '';
    };

    // 1. Fast unique token containment check
    const featuredToken = extractUniqueToken(readingArticle.image);
    const contentLower = readingArticle.content.toLowerCase();
    if (featuredToken && contentLower.includes(featuredToken)) {
      return true;
    }
    
    const targetClean = normalizeImgUrl(readingArticle.image);
    if (!targetClean) return false;

    // 2. Check if any image inside the content HTML matches this normalized URL or token
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(readingArticle.content, 'text/html');
      const imgs = doc.querySelectorAll('img');
      
      for (const img of Array.from(imgs)) {
        const src = img.getAttribute('src') || '';
        const cleanSrc = normalizeImgUrl(src);
        
        if (cleanSrc && (cleanSrc === targetClean || cleanSrc.includes(targetClean) || targetClean.includes(cleanSrc))) {
          return true;
        }

        const srcToken = extractUniqueToken(src);
        if (srcToken && featuredToken && srcToken === featuredToken) {
          return true;
        }
      }
    } catch (e) {
      console.error('Error parsing DOM for featured image detection:', e);
    }
    
    // 3. Fallback: simple substring checks on normalized strings
    const targetUrlLower = readingArticle.image.toLowerCase();
    return contentLower.includes(targetClean) || contentLower.includes(targetUrlLower);
  }, [readingArticle]);

  // Clean the main blog body to avoid duplicate thumbnail image rendering
  const cleanedContent = useMemo(() => {
    if (!readingArticle) return '';
    return cleanBlogPostContent(readingArticle.content);
  }, [readingArticle]);

  return (
    <section id="blogs" className="py-24 bg-background relative z-10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {!readingArticle ? (
          /* =========================================================
             BLOG LISTING GRID VIEW
             ========================================================= */
          <>
            {/* Header and Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="font-headline font-extrabold text-headline-lg text-on-surface">
                  Our Insights
                </h2>
                <p className="font-sans text-body-md text-on-surface-variant">
                  Expert growth analysis and data strategy takes on the evolving B2B marketing landscape.
                </p>
              </div>

              {/* Interactive filter search controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full lg:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search marketing articles..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-surface-variant rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all text-on-surface shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex bg-surface-container rounded-full p-1 text-xs overflow-x-auto w-full sm:w-auto border border-surface-variant/30">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none ${
                        selectedCategory === cat
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-on-surface hover:text-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty state if search yields no results */}
            {localLoading ? (
              /* Grid Skeleton Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div 
                    key={`blog-skeleton-${n}`}
                    className="bg-white p-5 rounded-3xl border border-surface-variant flex flex-col justify-between space-y-4 animate-pulse"
                  >
                    <div>
                      {/* Card Image banner placeholder */}
                      <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-neutral-200" />

                      {/* Text Content placeholder */}
                      <div className="space-y-3 pt-4">
                        <div className="h-3 w-1/3 bg-neutral-200 rounded" />
                        <div className="h-6 w-3/4 bg-neutral-200 rounded" />
                        <div className="space-y-1.5 pt-1">
                          <div className="h-3 w-full bg-neutral-200 rounded" />
                          <div className="h-3 w-5/6 bg-neutral-200 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-surface-variant/30 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200" />
                        <div className="h-3 w-16 bg-neutral-200 rounded" />
                      </div>
                      <div className="h-3 w-16 bg-neutral-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : localError || localPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-surface-variant border-dashed max-w-xl mx-auto shadow-sm">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                <p className="font-headline font-bold text-sm text-on-surface">
                  {localError ? 'Oops! Couldn\'t fetch insights' : 'No insights found'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 px-4">
                  {localError || 'Our latest insights are temporarily unavailable. Please check back soon!'}
                </p>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="mt-4 bg-primary text-white text-xs font-headline font-bold px-5 py-2.5 rounded-full hover:opacity-95 transition-all shadow-sm"
                >
                  Reload Page
                </button>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-surface-variant border-dashed max-w-xl mx-auto shadow-sm">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                <p className="font-headline font-bold text-sm text-on-surface">No articles match your query</p>
                <p className="text-xs text-on-surface-variant mt-1">Try resetting the category filter or looking for broad keywords.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 bg-primary text-white text-xs font-headline font-bold px-5 py-2.5 rounded-full hover:opacity-95 transition-all shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* Grid Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map((post) => (
                  <a 
                    key={post.id}
                    href={`#/blog/${post.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectArticle(post);
                    }}
                    className="group text-left cursor-pointer bg-white p-5 rounded-3xl border border-surface-variant shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Image banner */}
                      <div className="overflow-hidden aspect-[16/10] border border-surface-variant/40 shadow-sm relative">
                        <OptimizedImage 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt={post.title}
                          src={post.image}
                          defaultWidth={400}
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-primary shadow-sm">
                          {post.category}
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          <span>{post.date}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" /> {post.readTime}
                          </span>
                        </div>

                        <h3 className="font-headline font-bold text-headline-sm text-on-surface leading-tight group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                          {post.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-surface-variant/30 mt-2">
                      <div className="flex items-center gap-2">
                        {post.authorAvatar && !post.authorAvatar.includes('g/1.1/default-avatar') && !post.authorAvatar.includes('b16-rounded.gif') ? (
                          <OptimizedImage 
                            className="w-6 h-6 rounded-full object-cover" 
                            src={post.authorAvatar} 
                            alt={post.author} 
                            defaultWidth={48}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline font-bold text-[10px] select-none uppercase border border-primary/20">
                            {post.author ? post.author.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2) : 'GK'}
                          </div>
                        )}
                        <span className="text-[10px] text-on-surface font-semibold">{post.author}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-1 transition-transform">
                        Read Article <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          /* =========================================================
             DEDICATED SEPARATE BLOG READER PAGE (DUAL-COLUMN)
             ========================================================= */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Back & Share Top Header Navigation Bar */}
            <div className="sticky top-[80px] z-30 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border border-surface-variant/60 shadow-sm">
              <button 
                onClick={() => onSelectArticle(null)}
                className="flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Blog Hub</span>
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/15 hidden sm:inline-block">
                  {readingArticle.category} Focus
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Share on Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(readingArticle.title)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] transition-all flex items-center justify-center cursor-pointer"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </a>

                  {/* Share on LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/20 text-[#0A66C2] transition-all flex items-center justify-center cursor-pointer"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>

                  {/* Copy link */}
                  <button 
                    onClick={() => handleShareArticle(readingArticle.title)}
                    className="px-2.5 py-2 sm:px-4 sm:py-2 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-variant/40 transition-all flex items-center gap-1.5 text-xs font-bold text-on-surface cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5 text-primary" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  {/* Print Article */}
                  <button 
                    onClick={() => window.print()}
                    className="px-2.5 py-2 sm:px-4 sm:py-2 rounded-full bg-primary hover:bg-[#0e5fc2] hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer shadow-sm shadow-blue-500/10 hover:shadow-md hover:scale-[1.02] active:scale-98"
                    title="Print Article"
                    id="print-article-btn"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print Article</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dual Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-full overflow-hidden">
              
              {/* LEFT COLUMN: Full Blog Content & Interactive Comments (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-8 max-w-full overflow-hidden">
                
                {/* Main Article Container with print-friendly layout trigger */}
                <div className="bg-white px-5 py-4 sm:p-6 md:p-10 rounded-3xl border border-surface-variant shadow-soft space-y-8 printable-article break-words overflow-hidden max-w-full">
                  
                  {/* Title & Metadata */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                        {readingArticle.category}
                      </span>
                      <span className="text-xs text-on-surface-variant/70">&bull;</span>
                      <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {readingArticle.readTime}
                      </span>
                    </div>
 
                    <h1 className="font-headline font-extrabold text-headline-lg text-on-surface leading-tight tracking-tight">
                      {readingArticle.title}
                    </h1>
 
                    {/* Author Premium Block (with special styling for print layout) */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 bg-surface-container rounded-2xl border border-surface-variant/50 author-block-print">
                      <div className="flex items-center gap-3">
                        <img 
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
                          alt={readingArticle.author} 
                          src={readingArticle.authorAvatar} 
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-headline font-bold text-xs text-on-surface leading-none">
                            {readingArticle.author}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            {readingArticle.authorRole}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right text-[10px] font-bold text-on-surface-variant/80 uppercase">
                        <span>Published</span>
                        <p className="text-xs text-on-surface mt-0.5">{readingArticle.date}</p>
                      </div>
                    </div>
                  </div>
 
                  {/* Featured Hero Banner */}
                  {!hasFeaturedImageInContent && (
                    <div className="w-full overflow-hidden flex justify-center">
                      <img 
                        className="w-full h-auto max-h-[550px] object-contain" 
                        alt={readingArticle.title} 
                        src={readingArticle.image} 
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
 
                  {/* Formatted Reading Content */}
                  <div className="max-w-[70ch] mx-auto w-full break-words text-[16px] md:text-[18px] lg:text-[19px] text-on-surface-variant leading-[1.8] font-normal font-sans border-b border-surface-variant/30 pb-12">
                    {readingArticle.content.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(readingArticle.content) ? (
                      <div 
                        className="prose-html space-y-6 text-on-surface-variant"
                        dangerouslySetInnerHTML={{ __html: cleanedContent }}
                      />
                    ) : (
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="font-headline font-bold text-3xl md:text-4xl text-on-surface pt-8 pb-3 tracking-tight leading-tight" {...props} />,
                          h2: ({node, ...props}) => <h2 className="font-headline font-bold text-2.5xl md:text-3.5xl text-on-surface pt-8 pb-3 tracking-tight leading-snug" {...props} />,
                          h3: ({node, ...props}) => <h3 className="font-headline font-semibold text-xl md:text-2xl text-on-surface pt-6 pb-2 tracking-tight leading-snug" {...props} />,
                          h4: ({node, ...props}) => <h4 className="font-headline font-semibold text-lg md:text-xl text-on-surface pt-4 pb-2 tracking-tight leading-snug" {...props} />,
                          p: ({node, ...props}) => <p className="text-on-surface-variant font-normal leading-[1.8] mb-6" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 my-4 text-on-surface-variant" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-3 my-4 text-on-surface-variant" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1 leading-[1.8]" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-on-surface" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          code: ({node, ...props}) => <code className="bg-surface-variant/30 px-1.5 py-0.5 rounded font-mono text-sm text-primary" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-surface-variant/20 p-4 rounded-xl font-mono text-sm overflow-x-auto my-6 border border-surface-variant/40" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-on-surface-variant/90" {...props} />
                        }}
                      >
                        {cleanedContent}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Related Posts Section based on matching tags / categories */}
                  {relatedPosts.length > 0 && (
                    <div className="border-t border-b border-surface-variant/40 py-8 my-8 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-on-surface">
                            You Might Also Like
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container px-2.5 py-1 rounded-md border border-surface-variant/40 w-fit">
                          Related {readingArticle.category} Articles
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {relatedPosts.map((post) => (
                          <a 
                            key={post.id}
                            href={`#/blog/${post.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectArticle(post);
                            }}
                            className="group cursor-pointer bg-surface-container/30 hover:bg-surface-container/60 p-4 rounded-2xl border border-surface-variant/30 hover:border-surface-variant/60 transition-all duration-300 flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="overflow-hidden aspect-[16/10] border border-surface-variant/40 shadow-sm relative">
                                <img 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                  alt={post.title}
                                  src={post.image}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                                  <span>{post.date}</span>
                                  <span>&bull;</span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-primary" /> {post.readTime}
                                  </span>
                                </div>
                                <h4 className="font-headline font-bold text-xs sm:text-sm text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                  {post.title}
                                </h4>
                              </div>
                            </div>
                            <div className="pt-2 flex items-center justify-between border-t border-surface-variant/20 mt-1">
                              <span className="text-[10px] text-primary font-bold group-hover:underline flex items-center gap-0.5">
                                Read Article <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Interactive Comments Block */}
                  <div className="space-y-6 pt-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-on-surface">
                        Reader Discussion ({currentComments.length})
                      </h3>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {currentComments.map((comment) => (
                        <div 
                          key={comment.id}
                          className="p-4 bg-surface-container rounded-2xl border border-surface-variant/40 space-y-2 hover:border-surface-variant transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                {comment.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface leading-tight">
                                  {comment.name}
                                </p>
                                <span className="text-[9px] text-on-surface-variant/60">
                                  {comment.date}
                                </span>
                              </div>
                            </div>

                            {/* Multi-Reactions Block */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {/* Like Button */}
                              <button 
                                type="button"
                                onClick={() => handleReactComment(comment.id, 'like')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all active:scale-90 select-none ${
                                  comment.myReaction === 'like'
                                    ? 'bg-[#1A56DB]/10 border-[#1A56DB] text-[#1A56DB]'
                                    : 'bg-white border-surface-variant/30 text-on-surface-variant hover:bg-[#1A56DB]/5 hover:text-[#1A56DB]'
                                }`}
                                title="Like"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{comment.likes}</span>
                              </button>

                              {/* Dislike Button */}
                              <button 
                                type="button"
                                onClick={() => handleReactComment(comment.id, 'dislike')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all active:scale-90 select-none ${
                                  comment.myReaction === 'dislike'
                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                    : 'bg-white border-surface-variant/30 text-on-surface-variant hover:bg-red-500/5 hover:text-red-500'
                                }`}
                                title="Dislike"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{comment.dislikes || 0}</span>
                              </button>

                              {/* Heart Button */}
                              <button 
                                type="button"
                                onClick={() => handleReactComment(comment.id, 'heart')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all active:scale-90 select-none ${
                                  comment.myReaction === 'heart'
                                    ? 'bg-pink-500/10 border-pink-500 text-pink-500'
                                    : 'bg-white border-surface-variant/30 text-on-surface-variant hover:bg-pink-500/5 hover:text-pink-500'
                                }`}
                                title="Heart"
                              >
                                <Heart className={`w-3 h-3 ${comment.myReaction === 'heart' ? 'fill-pink-500' : ''}`} />
                                <span>{comment.hearts || 0}</span>
                              </button>
                            </div>
                          </div>
                          
                          <p className="font-sans text-xs text-on-surface-variant leading-relaxed pl-0 sm:pl-10 mt-2">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
 
                    {/* Join Discussion Form */}
                    <form onSubmit={handleAddComment} className="bg-surface-container/60 p-5 rounded-2xl border border-surface-variant/50 space-y-4">
                      <p className="text-xs font-headline font-bold text-on-surface uppercase tracking-wider">
                        Join the Conversation
                      </p>
                      
                      {commentSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-800 text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 font-sans">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Thank you! Your draft comment has been successfully published to this page.</span>
                        </div>
                      )}
 
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Your Name</label>
                          <input 
                            type="text" 
                            required
                            value={newCommentName}
                            onChange={(e) => setNewCommentName(e.target.value)}
                            placeholder="Enter your name" 
                            className="w-full bg-white border border-surface-variant rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-on-surface shadow-inner"
                          />
                        </div>
                        <div className="md:col-span-8 space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Comment Message</label>
                          <textarea 
                            required
                            rows={2}
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Share your thoughts about this article..." 
                            className="w-full bg-white border border-surface-variant rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-on-surface shadow-inner resize-none"
                          />
                        </div>
                      </div>
 
                      <div className="flex justify-end pt-1">
                        <button 
                          type="submit"
                          className="bg-primary text-white hover:bg-primary-container hover:text-on-primary-container px-5 py-2.5 rounded-full font-headline text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm w-full sm:w-auto"
                        >
                          <span>Post Comment</span>
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </form>

                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: Sidebar (Popular & Latest Articles) (lg:col-span-4) */}
              <aside className="lg:col-span-4 space-y-6">
                
                {/* Popular Widget Container */}
                <div className="bg-white p-6 rounded-3xl border border-surface-variant shadow-soft space-y-6">
                  
                  <div className="flex items-center gap-1.5 pb-3 border-b border-surface-variant/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-headline font-extrabold text-xs uppercase tracking-wider text-on-surface">
                      Popular & Latest Blogs
                    </h3>
                  </div>

                  {/* Sidebar Stack */}
                  <div className="space-y-4">
                    {sidebarBlogs.map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => handleSelectArticle(post)}
                        className="group cursor-pointer flex gap-3 p-2 rounded-2xl hover:bg-surface-container transition-all"
                      >
                        {/* Sidebar Thumbnail */}
                        <div className="w-20 h-20 overflow-hidden shrink-0 border border-surface-variant/30 shadow-inner">
                          <img 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            src={post.image} 
                            alt={post.title} 
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Sidebar Details */}
                        <div className="flex flex-col justify-center space-y-1">
                          <span className="text-[8px] font-bold text-primary uppercase tracking-wider">
                            {post.category} &bull; {post.readTime}
                          </span>
                          <h4 className="text-xs font-bold text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          <span className="text-[9px] text-on-surface-variant/60 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {post.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Back to Listing Full Button */}
                  <button 
                    onClick={() => onSelectArticle(null)}
                    className="w-full text-center border border-outline hover:bg-surface-container py-3 rounded-full text-xs font-bold text-on-surface transition-colors uppercase tracking-wider"
                  >
                    View All Articles
                  </button>

                </div>

                {/* Consultation Promo Card */}
                <div className="bg-primary p-6 rounded-3xl border border-primary/20 shadow-lg text-white space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                  
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-primary-fixed">
                    Need Custom Strategy?
                  </h4>
                  <p className="font-sans text-xs text-white/90 leading-relaxed">
                    Set up a complimentary 1-on-1 performance consultation with our master experts. Let's optimize your organic search or web build footprint.
                  </p>
                  <button 
                    onClick={() => {
                      onSelectArticle(null);
                      const contactSection = document.getElementById('contact');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-white text-primary hover:bg-surface-container-low w-full text-center py-2.5 rounded-full text-xs font-bold transition-all shadow-sm uppercase tracking-wider"
                  >
                    Book Consultation
                  </button>
                </div>

              </aside>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}
