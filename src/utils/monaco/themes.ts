import type { editor } from 'monaco-editor';

export const MERMAID_LIGHT_THEME: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' },
    { token: 'identifier', foreground: '334155' },
    { token: 'operator', foreground: 'f97316' },
    { token: 'string', foreground: '16a34a' },
    { token: 'string.label', foreground: '8b5cf6' },
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'delimiter', foreground: '64748b' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#334155',
    'editorLineNumber.foreground': '#94a3b8',
    'editorLineNumber.activeForeground': '#0ea5e9',
    'editor.selectionBackground': '#bae6fd',
    'editor.lineHighlightBackground': '#f1f5f9',
  },
};

export const MERMAID_DARK_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
    { token: 'identifier', foreground: 'e2e8f0' },
    { token: 'operator', foreground: 'fb923c' },
    { token: 'string', foreground: '4ade80' },
    { token: 'string.label', foreground: 'a78bfa' },
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'delimiter', foreground: '94a3b8' },
  ],
  colors: {
    'editor.background': '#1e293b',
    'editor.foreground': '#e2e8f0',
    'editorLineNumber.foreground': '#64748b',
    'editorLineNumber.activeForeground': '#38bdf8',
    'editor.selectionBackground': '#0c4a6e',
    'editor.lineHighlightBackground': '#334155',
  },
};

export function registerMermaidThemes(monaco: typeof import('monaco-editor')): void {
  monaco.editor.defineTheme('mermaid-light', MERMAID_LIGHT_THEME);
  monaco.editor.defineTheme('mermaid-dark', MERMAID_DARK_THEME);
}
