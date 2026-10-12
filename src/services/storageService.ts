import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses and optimizes an image file in-browser for high performance on both PC and mobile devices.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 900,
  maxHeight: number = 900,
  quality: number = 0.75
): Promise<Blob> {
  return new Promise((resolve) => {
    // If it's already an SVG, don't try to compress via canvas
    if (file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try modern WebP first
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              // Fallback to JPEG for older Safari/iOS
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob && jpegBlob.size > 0) {
                    resolve(jpegBlob);
                  } else {
                    resolve(file);
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        console.warn('Image element failed to load file for compression, using raw file');
        resolve(file);
      };
    };

    reader.onerror = () => {
      console.warn('FileReader failed, using raw file');
      resolve(file);
    };
  });
}

/**
 * Converts a Blob to a Base64 data URL.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads an image from PC or Mobile device with graceful fallback:
 * 1. Compresses client-side for rapid transmission.
 * 2. Attempts Firebase Storage upload with a safety timeout.
 * 3. If Firebase Storage is unavailable or unconfigured, falls back to an ultra-compact WebP data URL
 *    so adding products/banners/categories works 100% of the time without being blocked.
 */
export async function uploadImage(
  file: File,
  folder: string = 'products',
  onProgress?: (progress: number) => void,
  options?: ImageCompressionOptions
): Promise<string> {
  try {
    const maxWidth = options?.maxWidth || (folder === 'banners' ? 1400 : folder === 'categories' ? 500 : 900);
    const maxHeight = options?.maxHeight || (folder === 'banners' ? 700 : folder === 'categories' ? 500 : 900);
    const quality = options?.quality || (folder === 'banners' ? 0.78 : 0.72);

    // 1. Optimize image in browser
    if (onProgress) onProgress(20);
    const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
    if (onProgress) onProgress(45);

    // 2. Check if ImgBB API Key is configured in environment
    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (imgbbKey) {
      try {
        const formData = new FormData();
        formData.append('image', compressedBlob, file.name);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data?.data?.url) {
          if (onProgress) onProgress(100);
          return data.data.url;
        }
      } catch (err) {
        console.warn('ImgBB upload error:', err);
      }
    }

    // 3. Try Firebase Storage if initialized
    if (storage) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${folder}/${Date.now()}_${cleanName}.webp`;
        const storageRef = ref(storage, filename);

        const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
          contentType: compressedBlob.type || 'image/webp',
        });

        // Race upload against a 6-second timeout so admin never hangs on invalid/pending storage buckets
        const uploadPromise = new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0) {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(Math.min(95, 45 + Math.round(p * 0.5)));
              }
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (e) {
                reject(e);
              }
            }
          );
        });

        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Firebase Storage timeout')), 6000);
        });

        const uploadedUrl = await Promise.race([uploadPromise, timeoutPromise]);
        if (onProgress) onProgress(100);
        return uploadedUrl;
      } catch (err: any) {
        console.warn('Firebase Storage upload unavailable or timed out, using optimized fallback:', err?.message || err);
      }
    }

    // 4. Reliable fallback: Convert ultra-compressed WebP blob to Data URL
    // Since it was compressed to ~20-50KB, it safely stores and renders anywhere without external host dependency
    const dataUrl = await blobToDataUrl(compressedBlob);
    if (onProgress) onProgress(100);
    return dataUrl;
  } catch (err: any) {
    console.error('Image compression or upload error:', err);
    throw new Error('Image upload failed: ' + (err.message || 'Unknown error'));
  }
}
