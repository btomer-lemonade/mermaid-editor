export type DiagramType = 'flowchart' | 'sequence';

export interface PersistedState {
  activeType: DiagramType;
  code: {
    flowchart: string;
    sequence: string;
  };
}

export interface EditorState {
  code: string;
  diagramType: DiagramType;
  error: string | null;
}

export const DEFAULT_FLOWCHART = `flowchart LR
  edge(Edge Service)
  platform_a(Platform A)
  platform_b(Platform B)

  edge --> platform_a
  edge --> platform_b
`;

export const DEFAULT_SEQUENCE = `sequenceDiagram
  actor user as User
  participant api as API Server
  participant db as Database

  user->>api: Get report
  api->>db: Run query
  db->>api: Query results
  api->>user: Report
`;
