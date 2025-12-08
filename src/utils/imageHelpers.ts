/**
 * Helper function to optimize image URLs
 * @param url - The original image URL
 * @param width - Desired width in pixels
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL with transformation parameters
 */
export const getOptimizedImageUrl = (url: string, width: number = 300, quality: number = 80, format: 'webp' | 'jpg' | 'auto' = 'auto'): string => {
  // If it's a Supabase storage URL, add transformation parameters
  if (url.includes('supabase.co/storage/v1/object/public')) {
    // Add width and quality parameters for Supabase image optimization
    const separator = url.includes('?') ? '&' : '?';
    const formatParam = format === 'webp' ? '&format=webp' : '';
    return `${url}${separator}width=${width}&quality=${quality}${formatParam}`;
  }
  
  // For external URLs (e.g., from Prom.ua), ensure they're valid
  // In a production environment, you might want to proxy these through your own server
  // or use a CDN service for optimization
  try {
    // Validate URL format
    new URL(url);
    return url;
  } catch (e) {
    // Return a placeholder if the URL is invalid
    return '/placeholder-product.jpg';
  }
};

/**
 * Generate srcset for responsive images
 */
export const getImageSrcSet = (url: string, sizes: number[] = [300, 600, 900, 1200]): string => {
  return sizes
    .map(size => `${getOptimizedImageUrl(url, size, 80, 'webp')} ${size}w`)
    .join(', ');
};

/**
 * Get WebP version of image URL
 */
export const getWebPImageUrl = (url: string, width: number = 300, quality: number = 80): string => {
  return getOptimizedImageUrl(url, width, quality, 'webp');
};

/**
 * Helper function to get a thumbnail URL
 * @param url - The original image URL
 * @returns Thumbnail URL with smaller dimensions
 */
export const getThumbnailUrl = (url: string): string => {
  return getOptimizedImageUrl(url, 150, 70);
};

/**
 * Helper function to get a large image URL
 * @param url - The original image URL
 * @returns Large image URL with higher quality
 */
export const getLargeImageUrl = (url: string): string => {
  return getOptimizedImageUrl(url, 800, 90);
};