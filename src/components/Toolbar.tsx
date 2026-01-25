import type { DiagramType } from '../types';
import { KeyboardIcon, SunIcon, MoonIcon, LogoIcon } from './Icons';

interface ToolbarProps {
  diagramType: DiagramType;
  onTypeChange: (type: DiagramType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  hasError: boolean;
  onOpenShortcuts: () => void;
}

export default function Toolbar({
  diagramType,
  onTypeChange,
  isDarkMode,
  onToggleDarkMode,
  onExportSvg,
  onExportPng,
  hasError,
  onOpenShortcuts,
}: ToolbarProps) {
  return (
    <header className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <LogoIcon className="w-6 h-6 text-primary-500" />
          Tomer's Mermaid Editor
        </h1>

        <div className="type-selector ml-4">
          <button
            className={`type-selector-btn ${diagramType === 'flowchart' ? 'active' : ''}`}
            onClick={() => onTypeChange('flowchart')}
          >
            Flowchart
          </button>
          <button
            className={`type-selector-btn ${diagramType === 'sequence' ? 'active' : ''}`}
            onClick={() => onTypeChange('sequence')}
          >
            Sequence
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onOpenShortcuts} className="toolbar-btn" title="Keyboard shortcuts (⌘/)">
          <KeyboardIcon className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleDarkMode}
          className="toolbar-btn"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <button
          onClick={onExportSvg}
          className="toolbar-btn"
          disabled={hasError}
          title="Export as SVG"
        >
          SVG
        </button>

        <button
          onClick={onExportPng}
          className="toolbar-btn toolbar-btn-primary"
          disabled={hasError}
          title="Export as PNG"
        >
          PNG
        </button>
      </div>
    </header>
  );
}
