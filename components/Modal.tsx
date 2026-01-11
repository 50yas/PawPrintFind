
import React, { ReactNode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const contentId = `modal-content-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus first element or container
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            (focusable[0] as HTMLElement).focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  if (!isOpen || !mounted) return null;

  return ReactDOM.createPortal(
    <div 
      id="modal-root"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in outline-none"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={contentId}
    >
      <div 
        ref={modalRef}
        className="bg-slate-900/90 rounded-3xl shadow-2xl w-full max-w-lg md:max-w-2xl relative border border-white/10 max-h-[90vh] flex flex-col overflow-hidden backdrop-blur-2xl focus:outline-none" 
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0 bg-white/5">
            <h3 id={titleId} className="text-2xl font-black text-white font-mono-tech tracking-tight uppercase">{title}</h3>
            <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            aria-label="Close"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
        
        {/* Scrollable Content */}
        <div id={contentId} className="p-6 overflow-y-auto custom-scrollbar">
            {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
