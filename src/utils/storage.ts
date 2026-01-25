import type { PersistedState, DiagramType } from '../types';
import { DEFAULT_FLOWCHART, DEFAULT_SEQUENCE } from '../types';

const STORAGE_KEY = 'mermaid-editor-state';

const DEFAULT_STATE: PersistedState = {
  activeType: 'flowchart',
  code: {
    flowchart: DEFAULT_FLOWCHART,
    sequence: DEFAULT_SEQUENCE,
  },
};

export function loadState(): PersistedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;

    const parsed = JSON.parse(stored) as Partial<PersistedState>;

    return {
      activeType: parsed.activeType || DEFAULT_STATE.activeType,
      code: {
        flowchart: parsed.code?.flowchart || DEFAULT_STATE.code.flowchart,
        sequence: parsed.code?.sequence || DEFAULT_STATE.code.sequence,
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn('Failed to save state to localStorage');
  }
}

export function saveCode(type: DiagramType, code: string): void {
  const state = loadState();
  state.code[type] = code;
  saveState(state);
}

export function saveActiveType(type: DiagramType): void {
  const state = loadState();
  state.activeType = type;
  saveState(state);
}

export function getDefaultCode(type: DiagramType): string {
  return type === 'flowchart' ? DEFAULT_FLOWCHART : DEFAULT_SEQUENCE;
}
