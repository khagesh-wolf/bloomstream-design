/**
 * Image Optimization Utilities for Cloudflare R2
 * Handles WebP conversion and compression
 */

// Image quality presets
export const IMAGE_QUALITY = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 300, quality: 75 },
  medium: { width: 600, height: 600, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  original: { quality: 90 }
} as const;

export type ImageSize = keyof typeof IMAGE_QUALITY;

/**
 * Get optimized image URL - returns original since R2 doesn't have image resizing
 */
export function getOptimizedImageUrl(src: string, _size?: ImageSize): string {
  return src || '';
}

/**
 * Compress and convert image to WebP before upload
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress to WebP
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate srcset for responsive images (placeholder for future CDN support)
 */
export function generateSrcSet(src: string): string {
  // R2 basic doesn't support image resizing, return empty
  return '';
}

/**
 * Calculate optimal image size based on container
 */
export function getOptimalSize(containerWidth: number): ImageSize {
  if (containerWidth <= 150) return 'thumbnail';
  if (containerWidth <= 300) return 'small';
  if (containerWidth <= 600) return 'medium';
  return 'large';
}
