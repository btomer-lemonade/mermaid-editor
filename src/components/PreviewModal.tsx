import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string | null;
}

export default function PreviewModal({ isOpen, onClose, svg }: PreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && svg && containerRef.current) {
      containerRef.current.innerHTML = svg;
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = 'none';
        svgElement.style.maxHeight = 'none';
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
    }
  }, [isOpen, svg]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[90vw] h-[90vh] mx-4 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Preview
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-slate-50 dark:bg-slate-900/50">
          {svg ? (
            <div
              ref={containerRef}
              className="p-8 flex items-center justify-center h-full w-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">No diagram to preview</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Press <kbd className="kbd-key text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
