import React from 'react';
import { ToastMessage } from '../hooks/useRealtimeState';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgColors = {
          success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
          warning: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
          error: 'bg-rose-950/90 border-rose-500/50 text-rose-100',
          info: 'bg-slate-900/95 border-sky-500/50 text-slate-100',
        }[toast.type];

        const icon = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          info: <Zap className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-pulse" />,
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bgColors}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">{toast.title}</p>
                <span className="text-[10px] opacity-60">Thời gian thực</span>
              </div>
              <p className="text-sm font-medium mt-0.5 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-60 hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
