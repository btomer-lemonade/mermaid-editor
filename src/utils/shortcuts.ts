import type { DiagramType } from '../types';

export interface KeyBinding {
  ctrlCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
  key: string;
}

export interface PlatformKeyBinding {
  mac: KeyBinding;
  other: KeyBinding;
}

type SingleKeybinding = KeyBinding | PlatformKeyBinding;

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  keybindings: SingleKeybinding[];
  applicableTo?: DiagramType[];
}

function isPlatformKeyBinding(kb: KeyBinding | PlatformKeyBinding): kb is PlatformKeyBinding {
  return 'mac' in kb && 'other' in kb;
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform === 'macOS';
  }

  return /Mac|Macintosh/.test(navigator.userAgent);
}

function getEffectiveKeybinding(kb: KeyBinding | PlatformKeyBinding): KeyBinding {
  if (isPlatformKeyBinding(kb)) {
    return isMac() ? kb.mac : kb.other;
  }
  return kb;
}

export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'focus-editor',
    label: 'Toggle Editor Focus',
    description: 'Focus or unfocus the code editor',
    keybindings: [{ key: 'I' }, { ctrlCmd: true, key: 'J' }],
  },
  {
    id: 'open-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'Open the keyboard shortcuts dialog',
    keybindings: [{ shift: true, key: '?' }],
  },
];

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'swap-arrow',
    label: 'Swap Arrow Direction',
    description: 'Swap source and destination in the current line',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'S' }],
  },
  {
    id: 'new-element',
    label: 'New Element',
    description: 'Insert a new node (flowchart) or participant (sequence)',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'P' }],
    applicableTo: ['flowchart', 'sequence'],
  },
  {
    id: 'new-arrow',
    label: 'New Arrow',
    description: 'Insert an arrow template',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'A' }],
  },
  {
    id: 'request-response',
    label: 'Request-Response',
    description: 'Insert a request-response pair (sequence diagrams)',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'R' }],
    applicableTo: ['sequence'],
  },
  {
    id: 'action-response',
    label: 'Action-Response',
    description: 'Insert an action-response pair (sequence diagrams)',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'E' }],
    applicableTo: ['sequence'],
  },
  {
    id: 'duplicate-line',
    label: 'Duplicate Line',
    description: 'Duplicate the current line',
    keybindings: [
      { ctrlCmd: true, key: 'D' },
      { ctrlCmd: true, shift: true, key: 'D' },
    ],
  },
  {
    id: 'next-diagram-type',
    label: 'Next Diagram Type',
    description: 'Switch to the next diagram type',
    keybindings: [
      {
        mac: { ctrl: true, ctrlCmd: true, key: 'RightArrow' },
        other: { ctrl: true, alt: true, key: 'RightArrow' },
      },
    ],
  },
  {
    id: 'previous-diagram-type',
    label: 'Previous Diagram Type',
    description: 'Switch to the previous diagram type',
    keybindings: [
      {
        mac: { ctrl: true, ctrlCmd: true, key: 'LeftArrow' },
        other: { ctrl: true, alt: true, key: 'LeftArrow' },
      },
    ],
  },
  {
    id: 'prettify',
    label: 'Prettify Code',
    description: 'Format the Mermaid code with consistent indentation',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'F' }],
  },
  {
    id: 'select-all-occurrences',
    label: 'Select All Occurrences',
    description: 'Select all occurrences of the current selection',
    keybindings: [{ ctrlCmd: true, shift: true, key: 'L' }],
  },
];

const KEY_DISPLAY_MAP: Record<string, string> = {
  RightArrow: '→',
  LeftArrow: '←',
  UpArrow: '↑',
  DownArrow: '↓',
};

function getKeyDisplay(key: string): string {
  return KEY_DISPLAY_MAP[key] || key;
}

function getKeybindingParts(kb: KeyBinding): string[] {
  const mac = isMac();
  const parts: string[] = [];

  if (kb.ctrl) parts.push(mac ? '⌃' : 'Ctrl');
  if (kb.ctrlCmd) parts.push(mac ? '⌘' : 'Ctrl');
  if (kb.shift) parts.push(mac ? '⇧' : 'Shift');
  if (kb.alt) parts.push(mac ? '⌥' : 'Alt');
  parts.push(getKeyDisplay(kb.key));

  return parts;
}

function formatKeybindingDisplay(kb: KeyBinding): string {
  return getKeybindingParts(kb).join('+');
}

export function getShortcutDisplays(shortcutId: string): string[] {
  const allShortcuts = [...GLOBAL_SHORTCUTS, ...SHORTCUTS];
  const shortcut = allShortcuts.find((s) => s.id === shortcutId);
  if (!shortcut) return [];

  return shortcut.keybindings.map((kb) => {
    const effectiveBinding = getEffectiveKeybinding(kb);
    return formatKeybindingDisplay(effectiveBinding);
  });
}

export function getShortcutDisplay(shortcutId: string): string {
  const displays = getShortcutDisplays(shortcutId);
  return displays[0] ?? '';
}

export function getShortcutKeyParts(shortcutId: string): string[] {
  const allShortcuts = [...GLOBAL_SHORTCUTS, ...SHORTCUTS];
  const shortcut = allShortcuts.find((s) => s.id === shortcutId);
  if (!shortcut || shortcut.keybindings.length === 0) return [];

  const effectiveBinding = getEffectiveKeybinding(shortcut.keybindings[0]);
  return getKeybindingParts(effectiveBinding);
}

export function getAllShortcutKeyParts(shortcutId: string): string[][] {
  const allShortcuts = [...GLOBAL_SHORTCUTS, ...SHORTCUTS];
  const shortcut = allShortcuts.find((s) => s.id === shortcutId);
  if (!shortcut) return [];

  return shortcut.keybindings.map((kb) => {
    const effectiveBinding = getEffectiveKeybinding(kb);
    return getKeybindingParts(effectiveBinding);
  });
}

export function toMonacoKeybinding(
  keybinding: SingleKeybinding,
  monaco: typeof import('monaco-editor')
): number {
  const kb = getEffectiveKeybinding(keybinding);
  let binding = 0;

  if (kb.ctrlCmd) binding |= monaco.KeyMod.CtrlCmd;
  if (kb.shift) binding |= monaco.KeyMod.Shift;
  if (kb.alt) binding |= monaco.KeyMod.Alt;
  if (kb.ctrl) binding |= monaco.KeyMod.WinCtrl;

  const keyCode = getMonacoKeyCode(kb.key, monaco);
  binding |= keyCode;

  return binding;
}

export function toMonacoKeybindings(
  keybindings: SingleKeybinding[],
  monaco: typeof import('monaco-editor')
): number[] {
  return keybindings.map((kb) => toMonacoKeybinding(kb, monaco));
}

function getMonacoKeyCode(key: string, monaco: typeof import('monaco-editor')): number {
  const keyMap: Record<string, number> = {
    RightArrow: monaco.KeyCode.RightArrow,
    LeftArrow: monaco.KeyCode.LeftArrow,
    UpArrow: monaco.KeyCode.UpArrow,
    DownArrow: monaco.KeyCode.DownArrow,
    '/': monaco.KeyCode.Slash,
    '1': monaco.KeyCode.Digit1,
    '2': monaco.KeyCode.Digit2,
    '3': monaco.KeyCode.Digit3,
    '4': monaco.KeyCode.Digit4,
    '5': monaco.KeyCode.Digit5,
    '6': monaco.KeyCode.Digit6,
    '7': monaco.KeyCode.Digit7,
    '8': monaco.KeyCode.Digit8,
    '9': monaco.KeyCode.Digit9,
    '0': monaco.KeyCode.Digit0,
  };

  if (keyMap[key] !== undefined) {
    return keyMap[key];
  }

  if (key.length === 1 && /^[A-Z]$/.test(key)) {
    const keyCodeName = `Key${key}` as keyof typeof monaco.KeyCode;
    return monaco.KeyCode[keyCodeName];
  }

  return 0;
}

function matchesSingleKeybinding(event: KeyboardEvent, keybinding: SingleKeybinding): boolean {
  const kb = getEffectiveKeybinding(keybinding);

  const ctrlCmdPressed = event.metaKey || event.ctrlKey;
  const shiftPressed = event.shiftKey;
  const altPressed = event.altKey;
  const ctrlPressed = event.ctrlKey;

  if (kb.ctrlCmd && !ctrlCmdPressed) return false;
  if (kb.shift && !shiftPressed) return false;
  if (kb.alt && !altPressed) return false;

  if (kb.ctrl && !kb.ctrlCmd && !ctrlPressed) return false;

  const eventKey = normalizeEventKey(event.key);
  const bindingKey = kb.key.toLowerCase();

  return eventKey === bindingKey;
}

export function matchesKeybinding(event: KeyboardEvent, keybindings: SingleKeybinding[]): boolean {
  return keybindings.some((kb) => matchesSingleKeybinding(event, kb));
}

function normalizeEventKey(key: string): string {
  const keyMap: Record<string, string> = {
    ArrowRight: 'rightarrow',
    ArrowLeft: 'leftarrow',
    ArrowUp: 'uparrow',
    ArrowDown: 'downarrow',
  };
  return keyMap[key] || key.toLowerCase();
}

export function getShortcutById(id: string): ShortcutDefinition | undefined {
  return [...GLOBAL_SHORTCUTS, ...SHORTCUTS].find((s) => s.id === id);
}
