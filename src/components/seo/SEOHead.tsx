

import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  keywords?: string;
  noindex?: boolean;
  canonical?: string;
}

const DEFAULT_TITLE = 'Svitanok - Косметика для красивої шкіри';
const DEFAULT_DESCRIPTION = 'Якісна косметика для догляду за шкірою. Широкий асортимент продуктів для здорової та красивої шкіри.';
const DEFAULT_IMAGE = '/images/og-image.jpg';
const SITE_NAME = 'Svitanok';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://svitanok.com';

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = SITE_NAME,
  keywords,
  noindex = false,
  canonical,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const fullImage = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}${DEFAULT_IMAGE}`;
  const fullUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL;
  const canonicalUrl = canonical || fullUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      
      {}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      {}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}