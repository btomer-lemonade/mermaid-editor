export const MERMAID_KEYWORDS = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'erDiagram',
  'gantt',
  'pie',
  'gitGraph',
  'mindmap',
  'timeline',
  'participant',
  'actor',
  'Note',
  'note',
  'loop',
  'alt',
  'else',
  'opt',
  'par',
  'and',
  'rect',
  'end',
  'activate',
  'deactivate',
  'over',
  'left of',
  'right of',
  'subgraph',
  'direction',
  'TB',
  'TD',
  'BT',
  'RL',
  'LR',
];

export const MERMAID_ARROWS = [
  '-->',
  '---',
  '-.->',
  '==>',
  '-->>',
  '->>',
  '->',
  '--)',
  '-)',
  '-x',
  '--x',
];

export function registerMermaidLanguage(monaco: typeof import('monaco-editor')): void {
  if (monaco.languages.getLanguages().some((lang) => lang.id === 'mermaid')) {
    return;
  }

  monaco.languages.register({ id: 'mermaid' });

  monaco.languages.setMonarchTokensProvider('mermaid', {
    keywords: MERMAID_KEYWORDS,
    arrows: MERMAID_ARROWS,
    tokenizer: {
      root: [
        [/%%.*$/, 'comment'],
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        [/-->|---|-\.->|==>|-->>|->>|->|--\)|-\)|-x|--x/, 'operator'],
        [/\[/, { token: 'delimiter.square', next: '@bracketContent' }],
        [/\(/, { token: 'delimiter.parenthesis', next: '@parenContent' }],
        [/\{/, { token: 'delimiter.curly', next: '@braceContent' }],
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/\|[^|]*\|/, 'string.label'],
        [/:/, 'delimiter'],
        [/;/, 'delimiter'],
      ],
      bracketContent: [
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/[^\]"']+/, 'string'],
        [/\]/, { token: 'delimiter.square', next: '@pop' }],
      ],
      parenContent: [
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/[^)"']+/, 'string'],
        [/\)/, { token: 'delimiter.parenthesis', next: '@pop' }],
      ],
      braceContent: [
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/[^}"']+/, 'string'],
        [/\}/, { token: 'delimiter.curly', next: '@pop' }],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('mermaid', {
    comments: {
      lineComment: '%%',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '|', close: '|' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '|', close: '|' },
    ],
  });
}
