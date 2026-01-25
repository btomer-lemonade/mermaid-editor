import { useCallback, useEffect, useRef } from 'react';
import MonacoEditor, { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { DiagramType } from '../types';
import { registerMermaidLanguage, registerMermaidThemes, registerAllActions } from '../utils/monaco';
import { getSyntaxDocsUrl, getDiagramDisplayName } from '../utils/diagramConfig';
import EditorActionsBar from './EditorActionsBar';

interface EditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  diagramType: DiagramType;
  isDarkMode: boolean;
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  onNextDiagramType?: () => void;
  onPrevDiagramType?: () => void;
  onReset: () => void;
}

export default function Editor({
  code,
  onChange,
  diagramType,
  isDarkMode,
  editorRef,
  onNextDiagramType,
  onPrevDiagramType,
  onReset,
}: EditorProps) {
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const diagramTypeRef = useRef<DiagramType>(diagramType);
  const onNextDiagramTypeRef = useRef(onNextDiagramType);
  const onPrevDiagramTypeRef = useRef(onPrevDiagramType);

  useEffect(() => {
    diagramTypeRef.current = diagramType;
  }, [diagramType]);

  useEffect(() => {
    onNextDiagramTypeRef.current = onNextDiagramType;
    onPrevDiagramTypeRef.current = onPrevDiagramType;
  }, [onNextDiagramType, onPrevDiagramType]);

  const handleEditorBeforeMount: BeforeMount = useCallback((monaco) => {
    registerMermaidLanguage(monaco);
    registerMermaidThemes(monaco);
  }, []);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      registerAllActions(editor, monaco, {
        getDiagramType: () => diagramTypeRef.current,
        onNextDiagramType: () => onNextDiagramTypeRef.current?.(),
        onPrevDiagramType: () => onPrevDiagramTypeRef.current?.(),
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
        const domNode = editor.getDomNode();
        if (domNode) {
          (document.activeElement as HTMLElement)?.blur();
        }
      });

      editor.focus();
    },
    [editorRef]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {getDiagramDisplayName(diagramType)}
        </span>
        <a
          href={getSyntaxDocsUrl(diagramType)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-colors"
        >
          Mermaid Syntax
        </a>
      </div>
      <EditorActionsBar editorRef={editorRef} diagramType={diagramType} onReset={onReset} />
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="mermaid"
          theme={isDarkMode ? 'mermaid-dark' : 'mermaid-light'}
          value={code}
          onChange={onChange}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'line',
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
