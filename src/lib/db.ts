import { get, set, del, keys } from 'idb-keyval';
import SparkMD5 from 'spark-md5';

export interface EpubFile {
  hash: string;
  blob: Blob;
  fileName: string;
}

/**
 * Generate MD5 hash from file
 */
export async function generateFileHash(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();

    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      resolve(spark.end());
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Store EPUB file in IndexedDB
 */
export async function storeEpubFile(hash: string, file: File): Promise<void> {
  const epubFile: EpubFile = {
    hash,
    blob: file,
    fileName: file.name,
  };
  await set(`epub_${hash}`, epubFile);
}

/**
 * Retrieve EPUB file from IndexedDB
 */
export async function getEpubFile(hash: string): Promise<EpubFile | null> {
  const file = await get<EpubFile>(`epub_${hash}`);
  return file || null;
}

/**
 * Delete EPUB file from IndexedDB
 */
export async function deleteEpubFile(hash: string): Promise<void> {
  await del(`epub_${hash}`);
}

/**
 * Get all stored EPUB hashes
 */
export async function getAllEpubHashes(): Promise<string[]> {
  const allKeys = await keys();
  return allKeys
    .filter((key) => String(key).startsWith('epub_'))
    .map((key) => String(key).replace('epub_', ''));
}
