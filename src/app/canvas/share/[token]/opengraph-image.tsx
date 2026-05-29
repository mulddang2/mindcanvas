import { ImageResponse } from 'next/og';
import { createShareClient } from '@/lib/supabase/shareServer';

export const runtime = 'nodejs';
export const alt = 'MindCanvas — AI 협업 마인드맵';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: { token: string };
}

/**
 * 공유 링크가 외부 사이트(Slack·Twitter 등)에 노출될 때 표시되는 OG 이미지.
 * share token으로 캔버스 제목을 가져와 동적으로 렌더한다.
 */
export default async function OpengraphImage({ params }: Props) {
  const { token } = params;
  let title = 'MindCanvas';
  try {
    const supabase = await createShareClient(token);
    const { data } = await supabase
      .from('canvases')
      .select('title')
      .eq('share_token', token)
      .maybeSingle();
    if (data?.title) title = data.title;
  } catch {
    // 조회 실패 시 기본 제목으로 진행
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          backgroundColor: '#1f2933',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="96" fill="#ffffff" />
            <g fill="none" stroke="#1f2933" strokeWidth="14" strokeLinecap="round">
              <line x1="256" y1="168" x2="168" y2="280" />
              <line x1="256" y1="168" x2="344" y2="280" />
              <line x1="256" y1="168" x2="256" y2="344" />
            </g>
            <g fill="#1f2933">
              <circle cx="256" cy="168" r="40" />
              <circle cx="168" cy="280" r="32" />
              <circle cx="344" cy="280" r="32" />
              <circle cx="256" cy="344" r="32" />
            </g>
          </svg>
          <span style={{ fontSize: 32, fontWeight: 600 }}>MindCanvas</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28, color: '#94a3b8' }}>공유된 마인드맵</span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: 1040,
              overflow: 'hidden',
            }}
          >
            {title}
          </span>
        </div>

        <span style={{ fontSize: 24, color: '#94a3b8' }}>
          AI 협업 마인드맵 / 플로우 차트 SaaS
        </span>
      </div>
    ),
    { ...size },
  );
}
