const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

export interface UploadResult {
  url: string;
  error?: never;
}

export interface UploadError {
  url?: never;
  error: string;
}

export async function uploadImage(file: File): Promise<UploadResult | UploadError> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "지원하지 않는 파일 형식입니다. (PNG, JPG, GIF, WebP, SVG만 가능)" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "파일 크기가 5MB를 초과합니다." };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "업로드에 실패했습니다." };
    }

    return { url: data.url };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}

/**
 * Inserts markdown image syntax at the cursor position in a textarea value.
 * Returns the new text and cursor position after insertion.
 */
export function insertImageMarkdown(
  text: string,
  cursorPos: number,
  imageUrl: string,
  altText = "image"
): { newText: string; newCursorPos: number } {
  const markdown = `![${altText}](${imageUrl})`;
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);

  const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
  const suffix = after.length > 0 && !after.startsWith("\n") ? "\n" : "";

  const insertion = `${prefix}${markdown}${suffix}`;
  const newText = before + insertion + after;
  const newCursorPos = before.length + insertion.length;

  return { newText, newCursorPos };
}
