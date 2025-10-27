export function b64ToBlobUrl(b64?: string | null, mime = "image/png"): string | null {
  if (!b64) return null;
  try {
    const byteStr = atob(b64);
    const len = byteStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
