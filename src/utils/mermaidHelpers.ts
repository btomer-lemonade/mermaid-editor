export function swapArrowDirection(line: string): string {
  const flowchartArrowPattern =
    /^(\s*)(\S+)(\s*)(-->|--o|--x|<-->|o--o|x--x|---|-\.->|==>)(\s*)(\S+)(.*)$/;
  const sequenceArrowPattern = /^(\s*)(\S+)(->>|-->>|->|-->|-x|--x|-\)|--\))(\s*)([^:\s]+)(:\s*.*)?$/;

  const flowMatch = line.match(flowchartArrowPattern);
  if (flowMatch) {
    const [, indent, source, ws1, arrow, ws2, target, rest] = flowMatch;
    return `${indent}${target}${ws1}${arrow}${ws2}${source}${rest}`;
  }

  const seqMatch = line.match(sequenceArrowPattern);
  if (seqMatch) {
    const [, indent, source, arrow, ws, target, rest = ''] = seqMatch;
    return `${indent}${target}${arrow}${ws}${source}${rest}`;
  }

  return line;
}

export function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

export function findLastNonEmptyIndentation(
  model: TextModel,
  fromLine: number,
  fallback: string = ''
): string {
  for (let i = fromLine; i >= 1; i--) {
    const lineContent = model.getLineContent(i);
    const indent = getIndentation(lineContent);
    if (indent.length > 0) {
      return indent;
    }
  }
  return fallback;
}

export function generateNodeId(code: string): string {
  const existingNumbers = new Set<number>();
  const idPattern = /\btemp(\d+)\b/g;
  let match;

  while ((match = idPattern.exec(code)) !== null) {
    existingNumbers.add(parseInt(match[1], 10));
  }

  let num = 1;
  while (existingNumbers.has(num)) {
    num++;
  }

  return `temp${num}`;
}

export interface SubgraphBlock {
  startLine: number;
  endLine: number;
  indent: string;
}

interface TextModel {
  getLineCount(): number;
  getLineContent(lineNumber: number): string;
}

export function findEnclosingSubgraph(model: TextModel, lineNumber: number): SubgraphBlock | null {
  const lineCount = model.getLineCount();
  const stack: { startLine: number; indent: string }[] = [];
  let enclosingBlock: SubgraphBlock | null = null;

  for (let i = 1; i <= lineCount; i++) {
    const lineContent = model.getLineContent(i);
    const line = lineContent.trim().toLowerCase();

    if (line.startsWith('subgraph')) {
      stack.push({ startLine: i, indent: getIndentation(lineContent) });
    } else if (line === 'end' && stack.length > 0) {
      const block = stack.pop()!;
      if (lineNumber > block.startLine && lineNumber < i) {
        if (!enclosingBlock || block.startLine > enclosingBlock.startLine) {
          enclosingBlock = { ...block, endLine: i };
        }
      }
    }
  }

  return enclosingBlock;
}

export function findLastNodeInBlock(
  model: TextModel,
  blockStart: number,
  blockEnd: number
): { line: number; indent: string } | null {
  const nodeShapePattern = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[\[\(\{>]/;
  const arrowPattern = /-->|---|-\.->|==>|-->>|->>|->|--\)|-\)|-x|--x/;

  let lastNodeLine = -1;
  let lastNodeIndent = '';
  let nestedDepth = 0;

  for (let i = blockStart; i <= blockEnd; i++) {
    const lineContent = model.getLineContent(i);
    const trimmedLine = lineContent.trim().toLowerCase();

    if (trimmedLine.startsWith('subgraph')) {
      nestedDepth++;
      continue;
    }
    if (trimmedLine === 'end' && nestedDepth > 0) {
      nestedDepth--;
      continue;
    }

    if (nestedDepth === 0 && nodeShapePattern.test(lineContent) && !arrowPattern.test(lineContent)) {
      lastNodeLine = i;
      lastNodeIndent = getIndentation(lineContent);
    }
  }

  return lastNodeLine > 0 ? { line: lastNodeLine, indent: lastNodeIndent } : null;
}

export function findLastParticipantLine(model: TextModel): { line: number; indent: string } | null {
  const lineCount = model.getLineCount();

  for (let i = lineCount; i >= 1; i--) {
    const line = model.getLineContent(i);
    if (/^\s*(participant|actor)\s+/i.test(line)) {
      return { line: i, indent: getIndentation(line) };
    }
  }

  return null;
}
