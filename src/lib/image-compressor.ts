/**
 * ==============================================================================
 * Kenzo Treasury — Client-Side WebP Image Compressor (Fase F12)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mengompres foto barang impian secara lokal di browser menggunakan HTML5 Canvas
 * menjadi format WebP dengan dimensi maksimal 1200px dan target ukuran file <200KB
 * sebelum disimpan ke Supabase Storage (`wishlist-images`) atau sebagai DataURL.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  maxSizeBytes?: number;
  initialQuality?: number;
}

export interface CompressedImageResult {
  blob: Blob;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Mengompres berkas gambar menjadi WebP berukuran <200KB dan dimensi <=1200px.
 */
export async function compressImageToWebP(
  sourceFile: File,
  options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
  const maxDimension = options.maxDimension ?? 1200;
  const maxSizeBytes = options.maxSizeBytes ?? 200 * 1024;
  let quality = options.initialQuality ?? 0.82;

  const imageBitmap = await loadHtmlImage(sourceFile);

  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung konteks HTML5 Canvas 2D.");
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  let blob = await canvasToWebPBlob(canvas, quality);

  // Turunkan kualitas bertahap hingga ukuran berada di bawah 200KB
  while (blob.size > maxSizeBytes && quality > 0.35) {
    quality = Math.max(0.3, Number((quality - 0.12).toFixed(2)));
    blob = await canvasToWebPBlob(canvas, quality);
  }

  const dataUrl = await blobToDataUrl(blob);
  const safeBaseName = sourceFile.name.replace(/\.[^/.]+$/, "");
  const compressedFile = new File([blob], `${safeBaseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    blob,
    file: compressedFile,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: blob.size,
  };
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memuat berkas gambar untuk dikompresi."));
    };
    img.src = objectUrl;
  });
}

function canvasToWebPBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengonversi gambar ke format WebP."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca DataURL hasil kompresi WebP."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca Blob gambar."));
    reader.readAsDataURL(blob);
  });
}
