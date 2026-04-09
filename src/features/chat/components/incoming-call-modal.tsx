import { Phone, PhoneOff, Video, User } from 'lucide-react';

interface IncomingCallModalProps {
  open: boolean;
  callerName?: string;
  callerAvatar?: string;
  mode: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({
  open,
  callerName,
  callerAvatar,
  mode,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onReject} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/15 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -left-20 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="relative px-6 py-7 text-white">
          <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-xl">
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName || 'caller'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-10 w-10 text-white/80" />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-semibold tracking-tight">{callerName || '来电'}</h3>
            <p className="mt-2 text-sm text-white/80">{mode === 'video' ? '邀请你进行视频通话' : '邀请你进行语音通话'}</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              className="h-12 rounded-2xl bg-red-500/85 text-white shadow-lg transition hover:bg-red-500"
            >
              <span className="flex items-center justify-center gap-2">
                <PhoneOff className="h-4 w-4" />
                拒绝
              </span>
            </button>
            <button
              onClick={onAccept}
              className="h-12 rounded-2xl bg-emerald-500/85 text-white shadow-lg transition hover:bg-emerald-500"
            >
              <span className="flex items-center justify-center gap-2">
                {mode === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                接听
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
