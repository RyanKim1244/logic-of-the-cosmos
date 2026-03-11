"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/image-upload";

interface ImageUploadButtonProps {
  onInsert: (markdown: string) => void;
  className?: string;
}

export default function ImageUploadButton({ onInsert, className }: ImageUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const result = await uploadImage(file);

    if (result.error) {
      setError(result.error);
    } else {
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      const caption = prompt("캡션을 입력하세요 (선택사항):", "")?.trim() || "";
      const markdown = caption
        ? `![${alt}](${result.url} "${caption}")`
        : `![${alt}](${result.url})`;
      onInsert(markdown);
    }

    setUploading(false);
    // Reset input so the same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={className || "px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"}
        title="사진 삽입"
      >
        {uploading ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            업로드 중...
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            사진 삽입
          </span>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
