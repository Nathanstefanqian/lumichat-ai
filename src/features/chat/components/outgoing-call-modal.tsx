import { Loader2, Phone, PhoneOff, User, Video } from 'lucide-react';

interface OutgoingCallModalProps {
  open: boolean;
  calleeName?: string;
  calleeAvatar?: string;
  mode: 'audio' | 'video';
  onCancel: () => void;
}

export function OutgoingCallModal({
  open,
  calleeName,
  calleeAvatar,
  mode,
  onCancel,
}: OutgoingCallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="relative px-6 py-7 text-white">
          <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-xl">
            {calleeAvatar ? (
              <img src={calleeAvatar} alt={calleeName || 'callee'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-10 w-10 text-white/80" />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-semibold tracking-tight">{calleeName || '对方'}</h3>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/85">
              {mode === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              正在呼叫中…
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            等待对方接听
          </div>
          <div className="mt-8">
            <button
              onClick={onCancel}
              className="h-12 w-full rounded-2xl bg-red-500/85 text-white shadow-lg transition hover:bg-red-500"
            >
              <span className="flex items-center justify-center gap-2">
                <PhoneOff className="h-4 w-4" />
                取消拨号
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
