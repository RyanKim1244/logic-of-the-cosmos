import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthServerSupabase } from "@/lib/supabase-server";

const BUCKET = "problem-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

type AdminClient = ReturnType<typeof createClient>;

function getAdminClient(): AdminClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let bucketReady = false;

async function ensureBucket(admin: AdminClient): Promise<boolean> {
  if (bucketReady) return true;

  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.some((b) => b.id === BUCKET)) {
    bucketReady = true;
    return true;
  }

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  });

  if (error) return false;
  bucketReady = true;
  return true;
}

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const supabase = await createAuthServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "지원하지 않는 파일 형식입니다. (PNG, JPG, GIF, WebP, SVG만 가능)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일 크기가 5MB를 초과합니다." }, { status: 400 });
  }

  // Ensure bucket exists
  const ready = await ensureBucket(admin);
  if (!ready) {
    return NextResponse.json({ error: "스토리지 버킷 생성에 실패했습니다." }, { status: 500 });
  }

  // Upload file
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
