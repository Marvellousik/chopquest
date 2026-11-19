/**
 * Shrink a photo to ~768px on its longest side and re-encode as JPEG, in the browser.
 * Keeps uploads small (free-tier friendly, fast on mobile data) and strips EXIF/location.
 */
export async function resizeToJpeg(file: Blob, maxSide = 768, quality = 0.8): Promise<string> {
  let source: CanvasImageSource;
  let w: number;
  let h: number;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bmp;
    w = bmp.width;
    h = bmp.height;
  } catch {
    // Older Safari: fall back to an <img>.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      source = img;
      w = img.naturalWidth;
      h = img.naturalHeight;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (!w || !h) throw new Error("Could not read image");
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
