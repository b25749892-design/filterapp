import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transition-all duration-200">
      <div className="flex items-center gap-2 rounded-full border border-sky-400/30 bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-black backdrop-blur-md">
        {type === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-sky-400 shrink-0" />
        )}
        <span className="whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
};
