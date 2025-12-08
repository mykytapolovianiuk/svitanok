/**
 * Dynamic Sitemap Generator
 * Generates XML sitemap from products and static pages
 * Cached for 1 hour
 */

import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from './utils/cors.js';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let cachedSitemap = null;
let cacheTimestamp = 0;

// Static pages
const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/catalog', changefreq: 'daily', priority: '0.9' },
  { url: '/about', changefreq: 'monthly', priority: '0.7' },
  { url: '/contacts', changefreq: 'monthly', priority: '0.7' },
  { url: '/delivery', changefreq: 'monthly', priority: '0.6' },
  { url: '/faq', changefreq: 'monthly', priority: '0.6' },
  { url: '/auth', changefreq: 'monthly', priority: '0.5' },
];

function generateSitemapXML(urls, baseUrl) {
  const urlEntries = urls.map(({ url, changefreq, priority, lastmod }) => {
    const fullUrl = `${baseUrl}${url}`;
    const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `  <url>
    <loc>${escapeXML(fullUrl)}</loc>
    ${lastmodTag}
    <changefreq>${changefreq || 'weekly'}</changefreq>
    <priority>${priority || '0.5'}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  // CORS headers (sitemap can be accessed from anywhere)
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Check cache
    const now = Date.now();
    if (cachedSitemap && (now - cacheTimestamp) < CACHE_DURATION) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      return res.status(200).send(cachedSitemap);
    }
    
    // Get base URL
    const baseUrl = process.env.VITE_SITE_URL || 
                    process.env.SITE_URL || 
                    (req.headers.host ? `https://${req.headers.host}` : 'https://svitanok.com');
    
    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Return static sitemap if Supabase not configured
      const staticSitemap = generateSitemapXML(STATIC_PAGES, baseUrl);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(staticSitemap);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('in_stock', true)
      .order('updated_at', { ascending: false });
    
    if (error) {
      // Error handling in production
      // Return static sitemap on error
      const staticSitemap = generateSitemapXML(STATIC_PAGES, baseUrl);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(staticSitemap);
    }
    
    // Build URLs array
    const urls = [
      ...STATIC_PAGES,
      ...(products || []).map(product => ({
        url: `/product/${product.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : null,
      })),
    ];
    
    // Generate XML
    const sitemapXML = generateSitemapXML(urls, baseUrl);
    
    // Cache sitemap
    cachedSitemap = sitemapXML;
    cacheTimestamp = now;
    
    // Return sitemap
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    return res.status(200).send(sitemapXML);
    
  } catch (error) {
    // Error handling in production
    
    // Return static sitemap on error
    const baseUrl = process.env.VITE_SITE_URL || 'https://svitanok.com';
    const staticSitemap = generateSitemapXML(STATIC_PAGES, baseUrl);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(staticSitemap);
  }
}



