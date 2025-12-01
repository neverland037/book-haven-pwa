import ePub from 'epubjs';

export interface BookMetadata {
  title: string;
  author: string;
  coverUrl?: string;
}

/**
 * Extract metadata from EPUB file
 */
export async function extractMetadata(file: File | Blob): Promise<BookMetadata> {
  // Convert file to ArrayBuffer for ePub.js
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  
  try {
    await book.ready;
    
    const metadata = await book.loaded.metadata;
    const cover = await book.coverUrl();
    
    return {
      title: metadata.title || 'Unknown Title',
      author: metadata.creator || 'Unknown Author',
      coverUrl: cover || undefined,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
    };
  } finally {
    book.destroy();
  }
}

/**
 * Convert cover image to base64 data URL (for storage efficiency)
 */
export async function coverToBase64(coverUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(coverUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting cover to base64:', error);
    return undefined;
  }
}

/**
 * Create thumbnail from cover (resize to max 300px width)
 */
export async function createCoverThumbnail(coverUrl: string): Promise<string | undefined> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }

        const maxWidth = 300;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => resolve(undefined);
      img.src = coverUrl;
    });
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return undefined;
  }
}
