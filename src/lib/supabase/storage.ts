import { createClient } from './client';

const BUCKET = 'canvas-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_PREFIX = 'image/';

/**
 * 사용자 폴더(canvas-images/<uid>/<random>.<ext>)에 이미지를 업로드하고 public URL을 돌려준다.
 * 크기·MIME 검증은 클라이언트 측에서도 한 번 막아 RLS 거절 전에 빠르게 피드백한다.
 */
export async function uploadCanvasImage(file: File): Promise<string> {
  if (!file.type.startsWith(ALLOWED_PREFIX)) {
    throw new Error('이미지 파일만 업로드할 수 있습니다');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('파일이 너무 큽니다 (최대 5MB)');
  }

  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('로그인이 필요합니다');

  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'png';
  const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
