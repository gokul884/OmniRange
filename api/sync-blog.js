import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle escaped newlines in private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in environment variables');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (e) {
      console.error('Error initializing Firebase Admin SDK:', e);
    }
  }
}

// Helper to strip HTML tags for plain text excerpt
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to optimize image URLs for compression and quality
const optimizeImageUrl = (src) => {
  if (!src) return src;
  if (src.includes('googleusercontent.com') || src.includes('blogspot.com') || src.includes('bp.blogspot.com')) {
    return src
      .replace(/\/s\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/')
      .replace(/\/w\d+(-[a-zA-Z0-9-]+)?\//, '/s1200-rw/')
      .replace(/[=sS]\d+([-a-zA-Z0-9]+)?$/, '=s1200-rw');
  } else if (src.includes('unsplash.com')) {
    try {
      const u = new URL(src);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', '80');
      u.searchParams.set('w', '1200');
      return u.toString();
    } catch (e) {
      // ignore
    }
  }
  return src;
};

// Helper to optimize image URLs inside HTML content
const optimizeHtmlImages = (html) => {
  if (!html) return '';
  return html.replace(/<img[^>]+src=["']([^"']+)["']/gi, (match, src) => {
    const optimizedSrc = optimizeImageUrl(src);
    return match.replace(src, optimizedSrc);
  });
};

// Helper to extract first image in content or fall back to Blogger thumbnail
const extractThumbnail = (contentHtml, entry) => {
  // 1. Search for the first image tag src in the content
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = contentHtml.match(imgRegex);
  if (match && match[1]) {
    return optimizeImageUrl(match[1]);
  }

  // 2. Try media$thumbnail as fallback
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    return optimizeImageUrl(entry.media$thumbnail.url);
  }

  // 3. High quality design illustration fallback
  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';
};

// Helper to derive slug from the post URL
const getSlugFromUrl = (urlStr) => {
  try {
    if (!urlStr) return '';
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname; // e.g., /2026/07/the-other-side-of-ai-agent-boom.html
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1); // e.g., the-other-side-of-ai-agent-boom.html
    return filename.replace(/\.html$/, ''); // e.g., the-other-side-of-ai-agent-boom
  } catch (e) {
    return '';
  }
};

// Main Serverless Function Request Handler
export default async function handler(req, res) {
  // Allow only POST or GET for cron triggering
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(451).json({ error: 'Method not allowed' });
  }

  // 1. Verify Authorization (using Cron secret)
  const authHeader = req.headers['authorization'];
  const cronSecretHeader = req.headers['x-cron-secret'];
  const querySecret = req.query?.secret;
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const isAuthorized = 
      authHeader === `Bearer ${expectedSecret}` ||
      cronSecretHeader === expectedSecret ||
      querySecret === expectedSecret;

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
    }
  }

  // Double check initialization
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin SDK not configured correctly. Check environment variables.' });
  }

  try {
    const db = admin.firestore();
    const postsCollection = db.collection('posts');

    // 2. Fetch Blogger Feed
    const bloggerUrl = 'https://omnirangesolutions.blogspot.com/feeds/posts/default?alt=json&max-results=50';
    const response = await fetch(bloggerUrl);
    if (!response.ok) {
      throw new Error(`Blogger API returned status ${response.status}`);
    }

    const data = await response.json();
    const entries = data.feed?.entry || [];

    let total = entries.length;
    let added = 0;
    let updated = 0;

    // 3. Process and upsert each entry
    for (const entry of entries) {
      const title = entry.title?.$t || entry.title?.text || '';
      const rawContentHtml = entry.content?.$t || entry.summary?.$t || '';
      const contentHtml = optimizeHtmlImages(rawContentHtml);
      
      // Alternate URL to derive the slug
      const alternateLink = entry.link?.find((l) => l.rel === 'alternate')?.href || '';
      const slug = getSlugFromUrl(alternateLink);

      if (!slug) {
        continue;
      }

      // Extract excerpt, category, and thumbnail
      const excerpt = stripHtml(contentHtml).substring(0, 150).trim() + '...';
      
      let category = 'General';
      if (entry.category && entry.category.length > 0) {
        category = entry.category[0].term || 'General';
      }

      const thumbnailUrl = extractThumbnail(contentHtml, entry);
      const author = entry.author?.[0]?.name?.$t || 'Gokul Krisnan';

      // Parse dates into Firestore Timestamps
      const publishedStr = entry.published?.$t || '';
      const updatedStr = entry.updated?.$t || '';

      const publishedAt = publishedStr 
        ? admin.firestore.Timestamp.fromDate(new Date(publishedStr))
        : admin.firestore.Timestamp.now();

      const updatedAt = updatedStr
        ? admin.firestore.Timestamp.fromDate(new Date(updatedStr))
        : admin.firestore.Timestamp.now();

      // Check if document already exists to distinguish added/updated for the summary
      const docRef = postsCollection.doc(slug);
      const docSnapshot = await docRef.get();

      const postData = {
        slug,
        title,
        contentHtml,
        excerpt,
        publishedAt,
        category,
        thumbnailUrl,
        author,
        updatedAt,
      };

      await docRef.set(postData, { merge: true });

      if (docSnapshot.exists) {
        updated++;
      } else {
        added++;
      }
    }

    return res.status(200).json({
      success: true,
      added,
      updated,
      total,
      message: `Successfully synchronized ${total} posts from Blogger.`,
    });

  } catch (error) {
    console.error('Error syncing Blogger feed to Firestore:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
