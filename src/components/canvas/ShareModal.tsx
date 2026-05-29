'use client';

import { useEffect, useState } from 'react';
import { X, Link2, Copy, Check, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateShareToken, getShareInfo, revokeShareToken } from '@/lib/supabase/permissions';
import type { ShareRole } from '@/lib/supabase/canvases';

interface Props {
  canvasId: string;
  onClose: () => void;
}

/**
 * 캔버스 공유 모달. 토큰이 없으면 role 선택 후 발급, 있으면 링크 복사·회수.
 * 소유자만 노출되는 진입점에서 열기 — 권한 체크는 호출 측 책임.
 */
export function ShareModal({ canvasId, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<ShareRole>('view');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 첫 mount 시 현재 토큰 상태 조회.
  useEffect(() => {
    const client = createClient();
    getShareInfo(client, canvasId).then((res) => {
      if ('error' in res) {
        setError(res.error);
      } else {
        setToken(res.token);
        if (res.role) setRole(res.role);
      }
      setLoading(false);
    });
  }, [canvasId]);

  const onGenerate = async () => {
    setBusy(true);
    setError(null);
    const client = createClient();
    const res = await generateShareToken(client, canvasId, role);
    if ('error' in res) setError(res.error);
    else setToken(res.token);
    setBusy(false);
  };

  const onRevoke = async () => {
    setBusy(true);
    setError(null);
    const client = createClient();
    const res = await revokeShareToken(client, canvasId);
    if ('error' in res) setError(res.error);
    else setToken(null);
    setBusy(false);
  };

  const shareUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/canvas/share/${token}`
    : '';

  const onCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">캔버스 공유</h2>
          <button
            type="button"
            onClick={onClose}
            title="닫기"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">불러오는 중…</p>
        ) : token ? (
          <>
            <p className="mb-3 text-sm text-neutral-700">
              아래 링크를 가진 사람은 이 캔버스를{' '}
              <span className="font-medium">{role === 'edit' ? '편집' : '읽기'}</span>할 수 있습니다.
            </p>
            <div className="mb-3 flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2">
              <Link2 size={14} className="shrink-0 text-neutral-500" />
              <input
                value={shareUrl}
                readOnly
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-transparent text-xs text-neutral-800 outline-none"
              />
              <button
                type="button"
                onClick={onCopy}
                title="링크 복사"
                className="rounded p-1 text-neutral-600 hover:bg-neutral-200"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={onRevoke}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={12} />
              링크 회수
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-neutral-700">
              공유 링크가 없습니다. 권한을 선택하고 링크를 만드세요.
            </p>
            <div className="mb-4 flex gap-2">
              {(['view', 'edit'] as const).map((r) => {
                // 'edit' 공유는 후속 PR. UI는 노출하되 비활성으로 표시.
                const disabled = r === 'edit';
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => !disabled && setRole(r)}
                    disabled={disabled}
                    title={disabled ? '편집 공유는 후속 작업' : undefined}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      role === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {r === 'view' ? '읽기' : '편집'}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onGenerate}
              disabled={busy}
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-400"
            >
              {busy ? '생성 중…' : '링크 생성'}
            </button>
          </>
        )}

        {error && (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
