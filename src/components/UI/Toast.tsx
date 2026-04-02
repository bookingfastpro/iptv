import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const typeStyles = {
  success: { border: '#00d4ff', icon: '✓', bg: 'rgba(0,212,255,0.15)' },
  error: { border: '#f87171', icon: '✕', bg: 'rgba(248,113,113,0.15)' },
  info: { border: '#7c3aed', icon: 'ℹ', bg: 'rgba(124,58,237,0.15)' },
};

export default function Toast({ message, type, onClose }: ToastProps) {
  const style = typeStyles[type];

  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose, message]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up shadow-2xl mx-4"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#fff',
          maxWidth: '400px',
          width: '100%',
        }}
        onClick={onClose}
      >
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: style.border, color: '#000' }}
        >
          {style.icon}
        </span>
        <span className="flex-1">{message}</span>
      </div>
    </div>
  );
}
