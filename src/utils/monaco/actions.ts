import type { editor } from 'monaco-editor';
import type { DiagramType } from '../../types';
import {
  swapArrowDirection,
  findLastNonEmptyIndentation,
  generateNodeId,
  findEnclosingSubgraph,
  findLastNodeInBlock,
  findLastParticipantLine,
} from '../mermaidHelpers';
import { toMonacoKeybindings, getShortcutById } from '../shortcuts';
import { prettifyMermaid } from '../mermaidFormatter';

export interface ActionContext {
  getDiagramType: () => DiagramType;
  onNextDiagramType?: () => void;
  onPrevDiagramType?: () => void;
}

type Monaco = typeof import('monaco-editor');

function getKeybindings(id: string, monaco: Monaco): number[] {
  const shortcut = getShortcutById(id);
  return shortcut ? toMonacoKeybindings(shortcut.keybindings, monaco) : [];
}

function getTrailingNewlineIfAtEnd(model: editor.ITextModel, lineNumber: number): string {
  return lineNumber === model.getLineCount() ? '\n' : '';
}

function snakeCaseToTitleCase(snakeCase: string): string {
  return snakeCase
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function createNewElementAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'new-element',
    label: 'Mermaid: Insert New Element',
    keybindings: getKeybindings('new-element', monaco),
    run: (ed) => {
      const diagramType = context.getDiagramType();

      if (diagramType === 'sequence') {
        insertNewParticipant(ed);
      } else if (diagramType === 'flowchart') {
        insertNewNode(ed);
      }
    },
  };
}

function insertNewParticipant(ed: editor.ICodeEditor): void {
  const model = ed.getModel();
  if (!model) return;

  const selection = ed.getSelection();
  const selectedText = selection && !selection.isEmpty() ? model.getValueInRange(selection) : '';
  const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedText);

  const result = findLastParticipantLine(model);
  const insertAfterLine = result ? result.line : 1;
  const indent = result ? result.indent : '  ';

  const insertLineContent = model.getLineContent(insertAfterLine);
  const trailingNewline = getTrailingNewlineIfAtEnd(model, insertAfterLine);

  if (isValidIdentifier) {
    const alias = snakeCaseToTitleCase(selectedText);
    const participantLine = `\n${indent}participant ${selectedText} as ${alias}${trailingNewline}`;

    ed.executeEdits('new-element', [
      {
        range: {
          startLineNumber: insertAfterLine,
          startColumn: insertLineContent.length + 1,
          endLineNumber: insertAfterLine,
          endColumn: insertLineContent.length + 1,
        },
        text: participantLine,
      },
    ]);
    return;
  }

  ed.setPosition({
    lineNumber: insertAfterLine,
    column: insertLineContent.length + 1,
  });

  const snippetController = ed.getContribution('snippetController2') as unknown as {
    insert: (snippet: string, opts?: { adjustWhitespace?: boolean }) => void;
  } | null;
  snippetController?.insert(
    `\n${indent}participant \${1:new_participant} as \${1/([a-z]+)(_)?/\${1:/capitalize}\${2:+ }/g}$0${trailingNewline}`,
    { adjustWhitespace: false }
  );
}

function insertNewNode(ed: editor.ICodeEditor): void {
  const model = ed.getModel();
  const position = ed.getPosition();
  if (!model || !position) return;

  const selection = ed.getSelection();
  const selectedText = selection && !selection.isEmpty() ? model.getValueInRange(selection) : '';
  const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedText);

  const enclosingBlock = findEnclosingSubgraph(model, position.lineNumber);

  const blockStart = enclosingBlock ? enclosingBlock.startLine + 1 : 2;
  const blockEnd = enclosingBlock ? enclosingBlock.endLine - 1 : model.getLineCount();
  const blockIndent = enclosingBlock ? enclosingBlock.indent + '  ' : '  ';

  const lastNode = findLastNodeInBlock(model, blockStart, blockEnd);

  let insertAfterLine: number;
  let indent: string;

  if (lastNode) {
    insertAfterLine = lastNode.line;
    indent = lastNode.indent;
  } else if (enclosingBlock) {
    insertAfterLine = enclosingBlock.startLine;
    indent = blockIndent;
  } else {
    insertAfterLine = 1;
    indent = blockIndent;
  }

  const insertLineContent = model.getLineContent(insertAfterLine);
  const trailingNewline = getTrailingNewlineIfAtEnd(model, insertAfterLine);

  if (isValidIdentifier) {
    const label = snakeCaseToTitleCase(selectedText);
    const nodeLine = `\n${indent}${selectedText}(${label})${trailingNewline}`;

    ed.executeEdits('new-element', [
      {
        range: {
          startLineNumber: insertAfterLine,
          startColumn: insertLineContent.length + 1,
          endLineNumber: insertAfterLine,
          endColumn: insertLineContent.length + 1,
        },
        text: nodeLine,
      },
    ]);
    return;
  }

  const currentCode = model.getValue();
  const nodeId = generateNodeId(currentCode);

  ed.setPosition({
    lineNumber: insertAfterLine,
    column: insertLineContent.length + 1,
  });

  const snippetController = ed.getContribution('snippetController2') as unknown as {
    insert: (snippet: string, opts?: { adjustWhitespace?: boolean }) => void;
  } | null;
  snippetController?.insert(
    `\n${indent}\${1:${nodeId}}(\${1/([a-z]+)(_)?/\${1:/capitalize}\${2:+ }/g})$0${trailingNewline}`,
    {
      adjustWhitespace: false,
    }
  );
}

export function createNewArrowAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'new-arrow',
    label: 'Mermaid: Insert New Arrow',
    keybindings: getKeybindings('new-arrow', monaco),
    run: (ed) => {
      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const selection = ed.getSelection();
      const selectedText =
        selection && !selection.isEmpty() ? model.getValueInRange(selection) : '';
      const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedText);

      const lineContent = model.getLineContent(position.lineNumber);
      const indent = findLastNonEmptyIndentation(model, position.lineNumber, '  ');

      ed.setPosition({
        lineNumber: position.lineNumber,
        column: lineContent.length + 1,
      });

      const snippetController = ed.getContribution('snippetController2') as unknown as {
        insert: (snippet: string, opts?: { adjustWhitespace?: boolean }) => void;
      } | null;

      const diagramType = context.getDiagramType();
      const trailingNewline = getTrailingNewlineIfAtEnd(model, position.lineNumber);

      if (diagramType === 'sequence') {
        const source = isValidIdentifier ? selectedText : '${1:A}';
        const destination = isValidIdentifier ? '${1:B}' : '${2:B}';
        const message = isValidIdentifier ? '${2:message}' : '${3:message}';
        snippetController?.insert(
          `\n${indent}${source}->>${destination}: ${message}$0${trailingNewline}`,
          {
            adjustWhitespace: false,
          }
        );
      } else {
        const source = isValidIdentifier ? selectedText : '${1:A}';
        const destination = isValidIdentifier ? '${1:B}' : '${2:B}';
        snippetController?.insert(`\n${indent}${source} --> ${destination}$0${trailingNewline}`, {
          adjustWhitespace: false,
        });
      }
    },
  };
}

export function createRequestResponseAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'request-response',
    label: 'Mermaid: Insert Request-Response Pair',
    keybindings: getKeybindings('request-response', monaco),
    run: (ed) => {
      if (context.getDiagramType() !== 'sequence') return;

      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const selection = ed.getSelection();
      const selectedText =
        selection && !selection.isEmpty() ? model.getValueInRange(selection) : '';

      const lineContent = model.getLineContent(position.lineNumber);
      const indent = findLastNonEmptyIndentation(model, position.lineNumber, '  ');

      const snippetController = ed.getContribution('snippetController2') as unknown as {
        insert: (snippet: string, opts?: { adjustWhitespace?: boolean }) => void;
      } | null;

      // Check if selected text is a full sequence arrow line (e.g., "A->>B: Get user details")
      const sequenceLineMatch = selectedText.match(
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(->>?|-->>?)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/
      );

      const trailingNewline = getTrailingNewlineIfAtEnd(model, position.lineNumber);

      if (sequenceLineMatch) {
        const [, source, , destination, message] = sequenceLineMatch;
        const responseMessage = extractResponseMessage(message);

        ed.setPosition({
          lineNumber: position.lineNumber,
          column: lineContent.length + 1,
        });

        snippetController?.insert(
          `\n${indent}${destination}->>${source}: ${responseMessage}$0${trailingNewline}`,
          {
            adjustWhitespace: false,
          }
        );
        return;
      }

      const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedText);

      ed.setPosition({
        lineNumber: position.lineNumber,
        column: lineContent.length + 1,
      });

      const source = isValidIdentifier ? selectedText : '${1:A}';
      const destination = isValidIdentifier ? '${1:B}' : '${2:B}';
      const entity = isValidIdentifier ? '${2:entity}' : '${3:entity}';
      const entityCapitalized = isValidIdentifier
        ? '${2/^(.)/\${1:/upcase}/}'
        : '${3/^(.)/\${1:/upcase}/}';

      snippetController?.insert(
        `\n${indent}${source}->>${destination}: Get ${entity}\n${indent}${destination}->>${source}: ${entityCapitalized}$0${trailingNewline}`,
        { adjustWhitespace: false }
      );
    },
  };
}

function extractResponseMessage(requestMessage: string): string {
  // Handle common patterns like "Get X" -> "X", "Fetch X" -> "X", etc.
  const getPattern = /^(Get|Fetch|Request|Load|Retrieve)\s+(.+)$/i;
  const match = requestMessage.match(getPattern);
  if (match) {
    const entity = match[2];
    return entity.charAt(0).toUpperCase() + entity.slice(1);
  }
  // Default: capitalize first letter of the message
  return requestMessage.charAt(0).toUpperCase() + requestMessage.slice(1);
}

function extractActionResponseMessage(actionMessage: string): string {
  const actionPattern = /^(Perform|Execute|Run|Process|Handle)\s+(.+)$/i;
  const match = actionMessage.match(actionPattern);
  if (match) {
    const action = match[2];
    return action.charAt(0).toUpperCase() + action.slice(1) + ' done';
  }
  return 'Result';
}

export function createActionResponseAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'action-response',
    label: 'Mermaid: Insert Action-Response Pair',
    keybindings: getKeybindings('action-response', monaco),
    run: (ed) => {
      if (context.getDiagramType() !== 'sequence') return;

      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const selection = ed.getSelection();
      const selectedText =
        selection && !selection.isEmpty() ? model.getValueInRange(selection) : '';

      const lineContent = model.getLineContent(position.lineNumber);
      const indent = findLastNonEmptyIndentation(model, position.lineNumber, '  ');

      const snippetController = ed.getContribution('snippetController2') as unknown as {
        insert: (snippet: string, opts?: { adjustWhitespace?: boolean }) => void;
      } | null;

      // Check if selected text is a full sequence arrow line (e.g., "A->>B: Perform action")
      const sequenceLineMatch = selectedText.match(
        /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(->>?|-->>?)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/
      );

      const trailingNewline = getTrailingNewlineIfAtEnd(model, position.lineNumber);

      if (sequenceLineMatch) {
        const [, source, , destination, message] = sequenceLineMatch;
        const responseMessage = extractActionResponseMessage(message);

        ed.setPosition({
          lineNumber: position.lineNumber,
          column: lineContent.length + 1,
        });

        snippetController?.insert(
          `\n${indent}${destination}->>${source}: ${responseMessage}$0${trailingNewline}`,
          {
            adjustWhitespace: false,
          }
        );
        return;
      }

      const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(selectedText);

      ed.setPosition({
        lineNumber: position.lineNumber,
        column: lineContent.length + 1,
      });

      const source = isValidIdentifier ? selectedText : '${1:A}';
      const destination = isValidIdentifier ? '${1:B}' : '${2:B}';
      const action = isValidIdentifier ? '${2:Perform}' : '${3:Perform}';

      snippetController?.insert(
        `\n${indent}${source}->>${destination}: ${action}\n${indent}${destination}->>${source}: Success$0${trailingNewline}`,
        { adjustWhitespace: false }
      );
    },
  };
}

export function createSwapArrowAction(monaco: Monaco): editor.IActionDescriptor {
  return {
    id: 'swap-arrow',
    label: 'Mermaid: Swap Arrow Direction',
    keybindings: getKeybindings('swap-arrow', monaco),
    run: (ed) => {
      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const lineNumber = position.lineNumber;
      const lineContent = model.getLineContent(lineNumber);
      const swapped = swapArrowDirection(lineContent);

      if (swapped !== lineContent) {
        ed.executeEdits('swap-arrow', [
          {
            range: {
              startLineNumber: lineNumber,
              startColumn: 1,
              endLineNumber: lineNumber,
              endColumn: lineContent.length + 1,
            },
            text: swapped,
          },
        ]);
      }
    },
  };
}

export function createDuplicateLineAction(monaco: Monaco): editor.IActionDescriptor {
  return {
    id: 'duplicate-line',
    label: 'Duplicate Line',
    keybindings: getKeybindings('duplicate-line', monaco),
    run: (ed) => {
      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const lineNumber = position.lineNumber;
      const lineContent = model.getLineContent(lineNumber);
      const lineLength = lineContent.length;
      const trailingNewline = getTrailingNewlineIfAtEnd(model, lineNumber);

      ed.executeEdits('duplicate-line', [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: lineLength + 1,
            endLineNumber: lineNumber,
            endColumn: lineLength + 1,
          },
          text: '\n' + lineContent + trailingNewline,
        },
      ]);

      ed.setPosition({
        lineNumber: lineNumber + 1,
        column: position.column,
      });
    },
  };
}

export function createPrettifyAction(monaco: Monaco): editor.IActionDescriptor {
  return {
    id: 'prettify',
    label: 'Mermaid: Prettify Code',
    keybindings: getKeybindings('prettify', monaco),
    run: (ed) => {
      const model = ed.getModel();
      if (!model) return;

      const currentCode = model.getValue();
      const prettified = prettifyMermaid(currentCode);

      if (prettified !== currentCode) {
        const fullRange = model.getFullModelRange();
        ed.executeEdits('prettify', [
          {
            range: fullRange,
            text: prettified,
          },
        ]);
      }
    },
  };
}

export function createNextDiagramTypeAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'next-diagram-type',
    label: 'Mermaid: Next Diagram Type',
    keybindings: getKeybindings('next-diagram-type', monaco),
    run: () => {
      context.onNextDiagramType?.();
    },
  };
}

export function createPrevDiagramTypeAction(
  monaco: Monaco,
  context: ActionContext
): editor.IActionDescriptor {
  return {
    id: 'previous-diagram-type',
    label: 'Mermaid: Previous Diagram Type',
    keybindings: getKeybindings('previous-diagram-type', monaco),
    run: () => {
      context.onPrevDiagramType?.();
    },
  };
}

export function registerAllActions(
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  context: ActionContext
): void {
  editorInstance.addAction(createNewElementAction(monaco, context));
  editorInstance.addAction(createNewArrowAction(monaco, context));
  editorInstance.addAction(createRequestResponseAction(monaco, context));
  editorInstance.addAction(createActionResponseAction(monaco, context));
  editorInstance.addAction(createSwapArrowAction(monaco));
  editorInstance.addAction(createDuplicateLineAction(monaco));
  editorInstance.addAction(createPrettifyAction(monaco));
  editorInstance.addAction(createNextDiagramTypeAction(monaco, context));
  editorInstance.addAction(createPrevDiagramTypeAction(monaco, context));
}
