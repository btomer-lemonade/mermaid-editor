import { useState, useCallback, useRef, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import ShortcutsModal from './components/ShortcutsModal';
import { usePersistedState } from './hooks/usePersistedState';
import { useMermaidParser } from './hooks/useMermaidParser';
import { getShortcutById, matchesKeybinding } from './utils/shortcuts';
import type { DiagramType } from './types';
import type { editor } from 'monaco-editor';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const { code, diagramType, setCode, switchType, resetToTemplate } = usePersistedState();

  const { svg, error, isLoading } = useMermaidParser(code, isDarkMode);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const focusEditorShortcut = getShortcutById('focus-editor');
    const openShortcutsShortcut = getShortcutById('open-shortcuts');

    const isEditorFocused = (): boolean => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;

      if (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      ) {
        return true;
      }

      const monacoEditor = activeElement.closest('.monaco-editor');
      return monacoEditor !== null;
    };

    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (isEditorFocused()) return;

      if (focusEditorShortcut && matchesKeybinding(e, focusEditorShortcut.keybindings)) {
        e.preventDefault();
        editorRef.current?.focus();
      }

      if (openShortcutsShortcut && matchesKeybinding(e, openShortcutsShortcut.keybindings)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setCode(value);
      }
    },
    [setCode]
  );

  const handleTypeChange = useCallback(
    (type: DiagramType) => {
      switchType(type);
    },
    [switchType]
  );

  const diagramTypes: DiagramType[] = ['flowchart', 'sequence'];

  const handleNextDiagramType = useCallback(() => {
    const currentIndex = diagramTypes.indexOf(diagramType);
    const nextIndex = (currentIndex + 1) % diagramTypes.length;
    switchType(diagramTypes[nextIndex]);
  }, [diagramType, switchType]);

  const handlePrevDiagramType = useCallback(() => {
    const currentIndex = diagramTypes.indexOf(diagramType);
    const prevIndex = (currentIndex - 1 + diagramTypes.length) % diagramTypes.length;
    switchType(diagramTypes[prevIndex]);
  }, [diagramType, switchType]);

  const handleExportSvg = useCallback(() => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-${diagramType}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [svg, diagramType]);

  const handleExportPng = useCallback(async () => {
    if (!svg) return;

    const svgElement = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;

    let svgWidth = 800;
    let svgHeight = 600;

    let viewBoxX = 0;
    let viewBoxY = 0;

    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && !parts.some(isNaN)) {
        viewBoxX = parts[0];
        viewBoxY = parts[1];
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    } else {
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      if (widthAttr && !widthAttr.includes('%')) {
        svgWidth = parseFloat(widthAttr) || 800;
      }
      if (heightAttr && !heightAttr.includes('%')) {
        svgHeight = parseFloat(heightAttr) || 600;
      }
    }

    const padding = 40;
    const totalWidth = svgWidth + padding * 2;
    const totalHeight = svgHeight + padding * 2;

    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = isDarkMode ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const expandedViewBox = `${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}`;
    svgElement.setAttribute('viewBox', expandedViewBox);
    svgElement.setAttribute('width', String(svgWidth));
    svgElement.setAttribute('height', String(svgHeight));
    const modifiedSvg = new XMLSerializer().serializeToString(svgElement);

    const img = new Image();
    const svgBytes = new TextEncoder().encode(modifiedSvg);
    const svgBase64 = btoa(Array.from(svgBytes, (byte) => String.fromCharCode(byte)).join(''));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    img.onload = () => {
      ctx.drawImage(img, padding, padding, svgWidth, svgHeight);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timestamp = Date.now();
      const modeStr = isDarkMode ? 'Dark' : 'Light';
      const filename = `${dateStr} - Mermaid_${timestamp} - ${modeStr}.png`;

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      a.click();
    };

    img.src = dataUrl;
  }, [svg, diagramType, isDarkMode]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
      <Toolbar
        diagramType={diagramType}
        onTypeChange={handleTypeChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
        hasError={!!error}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        diagramType={diagramType}
      />

      <div className="flex-1 min-h-0">
        <Allotment>
          <Allotment.Pane minSize={300}>
            <Editor
              key={diagramType}
              code={code}
              onChange={handleCodeChange}
              diagramType={diagramType}
              isDarkMode={isDarkMode}
              editorRef={editorRef}
              onNextDiagramType={handleNextDiagramType}
              onPrevDiagramType={handlePrevDiagramType}
              onReset={resetToTemplate}
            />
          </Allotment.Pane>
          <Allotment.Pane minSize={300}>
            <Preview svg={svg} error={error} isLoading={isLoading} />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default App;
