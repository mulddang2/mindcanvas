import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMindmap } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

const requestSchema = z.object({
  prompt: z.string().trim().min(1, '주제를 입력하세요').max(200, '주제가 너무 깁니다 (200자 이내)'),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력 오류' }, { status: 400 });
  }

  try {
    const mindmap = await generateMindmap(parsed.data.prompt);
    return NextResponse.json(mindmap);
  } catch (err) {
    console.error('[ai-generate]', err);
    const message = err instanceof Error ? err.message : 'AI 생성에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
