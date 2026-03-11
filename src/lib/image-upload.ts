import { supabase } from "./supabase";

const BUCKET = "problem-images";
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

  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    return { error: `업로드 실패: ${error.message}` };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl };
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

  // Add newlines around image if not at line boundaries
  const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
  const suffix = after.length > 0 && !after.startsWith("\n") ? "\n" : "";

  const insertion = `${prefix}${markdown}${suffix}`;
  const newText = before + insertion + after;
  const newCursorPos = before.length + insertion.length;

  return { newText, newCursorPos };
}
