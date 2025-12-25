
export const getOptimizedImageUrl = (url: string, width: number = 300, quality: number = 80, format: 'webp' | 'jpg' | 'auto' = 'auto'): string => {
  
  if (url.includes('supabase.co/storage/v1/object/public')) {
    
    const separator = url.includes('?') ? '&' : '?';
    const formatParam = format === 'webp' ? '&format=webp' : '';
    return `${url}${separator}width=${width}&quality=${quality}${formatParam}`;
  }
  
  
  
  
  try {
    
    new URL(url);
    return url;
  } catch (e) {
    
    return '/placeholder-product.jpg';
  }
};


export const getImageSrcSet = (url: string, sizes: number[] = [300, 600, 900, 1200]): string => {
  return sizes
    .map(size => `${getOptimizedImageUrl(url, size, 80, 'webp')} ${size}w`)
    .join(', ');
};


export const getWebPImageUrl = (url: string, width: number = 300, quality: number = 80): string => {
  return getOptimizedImageUrl(url, width, quality, 'webp');
};


export const getThumbnailUrl = (url: string): string => {
  return getOptimizedImageUrl(url, 150, 70);
};


export const getLargeImageUrl = (url: string): string => {
  return getOptimizedImageUrl(url, 800, 90);
};