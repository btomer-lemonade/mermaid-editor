type DiagramType = 'flowchart' | 'sequence';

function detectDiagramType(code: string): DiagramType | null {
  const trimmed = code.trim().toLowerCase();
  if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) {
    return 'flowchart';
  }
  if (trimmed.startsWith('sequencediagram')) {
    return 'sequence';
  }
  return null;
}

function formatFlowchartLine(line: string): string {
  const arrowPattern =
    /^(\S+(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|>>[^>]*>>)?)\s*(--+>|--o|--x|<--+>|o--o|x--x|--+|-\.->|\.->|==+>|<==|==+)\s*(\|[^|]*\|)?\s*(.+)$/;
  const match = line.match(arrowPattern);

  if (match) {
    const [, source, arrow, label, target] = match;
    if (label) {
      return `${source} ${arrow}${label} ${target.trim()}`;
    }
    return `${source} ${arrow} ${target.trim()}`;
  }

  return line;
}

function prettifyFlowchart(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let currentIndent = 0;
  const indentUnit = '  ';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
      }
      continue;
    }

    if (trimmed.startsWith('%%')) {
      result.push(indentUnit.repeat(currentIndent) + trimmed);
      continue;
    }

    const lowered = trimmed.toLowerCase();

    if (lowered === 'end') {
      currentIndent = Math.max(0, currentIndent - 1);
      result.push(indentUnit.repeat(currentIndent) + trimmed);
      continue;
    }

    if (lowered.startsWith('flowchart') || lowered.startsWith('graph')) {
      result.push(trimmed);
      currentIndent = 1;
      continue;
    }

    if (lowered.startsWith('subgraph')) {
      result.push(indentUnit.repeat(currentIndent) + trimmed);
      currentIndent++;
      continue;
    }

    if (lowered.startsWith('direction ')) {
      result.push(indentUnit.repeat(currentIndent) + trimmed);
      continue;
    }

    const formattedLine = formatFlowchartLine(trimmed);
    result.push(indentUnit.repeat(currentIndent) + formattedLine);
  }

  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.join('\n') + '\n';
}

function formatSequenceLine(line: string): string {
  const participantPattern = /^(participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/i;
  const participantMatch = line.match(participantPattern);
  if (participantMatch) {
    const [, keyword, id, alias] = participantMatch;
    if (alias) {
      return `${keyword.toLowerCase()} ${id} as ${alias.trim()}`;
    }
    return `${keyword.toLowerCase()} ${id}`;
  }

  const arrowPattern = /^(\S+)\s*(->>|-->>|->|-->|-x|--x|-\)|--\))\s*(\S+)\s*:\s*(.*)$/;
  const arrowMatch = line.match(arrowPattern);
  if (arrowMatch) {
    const [, source, arrow, target, message] = arrowMatch;
    return `${source}${arrow}${target}: ${message.trim()}`;
  }

  const notePattern = /^(note)\s+(over|left of|right of)\s+(.+?):\s*(.*)$/i;
  const noteMatch = line.match(notePattern);
  if (noteMatch) {
    const [, noteKw, position, participants, text] = noteMatch;
    return `${noteKw.toLowerCase()} ${position.toLowerCase()} ${participants.trim()}: ${text.trim()}`;
  }

  return line;
}

function prettifySequence(code: string): string {
  const lines = code.split('\n');
  const indentUnit = '  ';

  // First pass: separate participants from other content
  // Collect participants with preserved single empty line separators
  // Collect non-participant lines with preserved single empty line separators
  const participants: string[] = [];
  const nonParticipantLines: string[] = [];
  let participantPendingEmpty = 0;
  let nonParticipantPendingEmpty = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const lowered = trimmed.toLowerCase();

    if (lowered === 'sequencediagram') {
      continue;
    }

    if (!trimmed) {
      participantPendingEmpty++;
      nonParticipantPendingEmpty++;
      continue;
    }

    const isParticipant = lowered.startsWith('participant ') || lowered.startsWith('actor ');

    if (isParticipant) {
      if (participantPendingEmpty > 0 && participants.length > 0) {
        participants.push('');
      }
      participantPendingEmpty = 0;
      participants.push(formatSequenceLine(trimmed));
    } else {
      if (nonParticipantPendingEmpty > 0 && nonParticipantLines.length > 0) {
        nonParticipantLines.push('');
      }
      nonParticipantPendingEmpty = 0;
      nonParticipantLines.push(trimmed);
    }
  }

  // Build result: sequenceDiagram + participants + empty line separator + non-participants
  const result: string[] = ['sequenceDiagram'];

  for (const p of participants) {
    if (p === '') {
      result.push('');
    } else {
      result.push(indentUnit + p);
    }
  }

  if (participants.length > 0 && nonParticipantLines.length > 0) {
    result.push('');
  }

  // Process non-participant lines with block indentation logic
  let inBlock = false;
  let blockIndent = 1;

  for (const line of nonParticipantLines) {
    if (line === '') {
      result.push('');
      continue;
    }

    const trimmed = line;
    const lowered = trimmed.toLowerCase();

    if (trimmed.startsWith('%%')) {
      result.push(indentUnit.repeat(inBlock ? blockIndent : 1) + trimmed);
      continue;
    }

    if (lowered === 'end') {
      blockIndent = Math.max(1, blockIndent - 1);
      if (blockIndent === 1) inBlock = false;
      result.push(indentUnit.repeat(blockIndent) + trimmed);
      continue;
    }

    const blockStarters = ['loop', 'alt', 'else', 'opt', 'par', 'and', 'critical', 'break', 'rect'];
    const isBlockStarter = blockStarters.some((b) => lowered.startsWith(b + ' ') || lowered === b);
    const isElse = lowered.startsWith('else');

    if (isElse) {
      result.push(indentUnit.repeat(Math.max(1, blockIndent - 1)) + trimmed);
      continue;
    }

    if (isBlockStarter) {
      result.push(indentUnit.repeat(blockIndent) + trimmed);
      blockIndent++;
      inBlock = true;
      continue;
    }

    const formattedLine = formatSequenceLine(trimmed);
    result.push(indentUnit.repeat(inBlock ? blockIndent : 1) + formattedLine);
  }

  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.join('\n') + '\n';
}

export function prettifyMermaid(code: string): string {
  const diagramType = detectDiagramType(code);

  if (diagramType === 'flowchart') {
    return prettifyFlowchart(code);
  }

  if (diagramType === 'sequence') {
    return prettifySequence(code);
  }

  return code;
}
