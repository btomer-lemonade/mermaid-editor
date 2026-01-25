import { useEffect, useRef } from 'react';
import { SHORTCUTS, GLOBAL_SHORTCUTS, getAllShortcutKeyParts } from '../utils/shortcuts';
import type { DiagramType } from '../types';
import { KeyboardIcon, CloseIcon } from './Icons';

function KeyboardShortcut({ shortcutId }: { shortcutId: string }) {
  const allParts = getAllShortcutKeyParts(shortcutId);

  return (
    <span className="inline-flex items-center gap-1">
      {allParts.map((parts, keybindingIndex) => (
        <span key={keybindingIndex} className="inline-flex items-center gap-0.5">
          {keybindingIndex > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 mx-1">or</span>
          )}
          {parts.map((part, partIndex) => (
            <kbd key={partIndex} className="kbd-key">
              {part}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramType: DiagramType;
}

export default function ShortcutsModal({ isOpen, onClose, diagramType }: ShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter(
    (shortcut) => !shortcut.applicableTo || shortcut.applicableTo.includes(diagramType)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <KeyboardIcon className="w-5 h-5" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Global
              </h3>
              <div className="space-y-2">
                {GLOBAL_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.id} className="flex items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-white">
                        {shortcut.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {shortcut.description}
                      </div>
                    </div>
                    <KeyboardShortcut shortcutId={shortcut.id} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Editor
              </h3>
              <div className="space-y-2">
                {filteredShortcuts.map((shortcut) => (
                  <div key={shortcut.id} className="flex items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-white">
                        {shortcut.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {shortcut.description}
                      </div>
                    </div>
                    <KeyboardShortcut shortcutId={shortcut.id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Press <kbd className="kbd-key text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
