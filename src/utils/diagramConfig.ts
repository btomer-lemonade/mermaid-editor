import type { DiagramType } from '../types';

export function getSyntaxDocsUrl(diagramType: DiagramType): string {
  switch (diagramType) {
    case 'flowchart':
      return 'https://mermaid.js.org/syntax/flowchart.html';
    case 'sequence':
      return 'https://mermaid.js.org/syntax/sequenceDiagram.html';
    default: {
      const exhaustiveCheck: never = diagramType;
      throw new Error(`Unhandled diagram type: ${exhaustiveCheck}`);
    }
  }
}

export function getDiagramDisplayName(diagramType: DiagramType): string {
  switch (diagramType) {
    case 'flowchart':
      return 'Flowchart';
    case 'sequence':
      return 'Sequence Diagram';
    default: {
      const exhaustiveCheck: never = diagramType;
      throw new Error(`Unhandled diagram type: ${exhaustiveCheck}`);
    }
  }
}
