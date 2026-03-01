import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface SnackbarProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  variant?: 'info' | 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  message,
  isOpen,
  onClose,
  duration = 4000,
  variant = 'info',
  actionLabel,
  onAction,
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const baseClasses = "fixed left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-4 px-4 py-3 min-w-[300px] max-w-[90vw] rounded-xl shadow-2xl transition-all animate-[slide-up-fade_0.3s_ease-out]";
  
  const variantClasses = {
      info: "bg-inverse-surface text-inverse-on-surface",
      success: "bg-inverse-surface text-inverse-on-surface",
      error: "bg-error-container text-on-error-container"
  };
  
  const finalClass = `${baseClasses} ${variant === 'error' ? variantClasses.error : variantClasses.info}`;

  return createPortal(
    <div className={finalClass} role="alert" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}>
      <span className="flex-1 text-sm font-medium tracking-wide">{message}</span>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="text-inverse-primary text-sm font-bold uppercase tracking-wider hover:bg-white/10 px-2 py-1 rounded transition-colors"
        >
          {actionLabel}
        </button>
      )}
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
         <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
         </svg>
      </button>
      <style>{`
        @keyframes slide-up-fade {
            from { opacity: 0; transform: translate(-50%, 100%); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>,
    document.body
  );
};
