import type { editor } from 'monaco-editor';
import type { DiagramType } from '../types';
import { getShortcutDisplay, getShortcutById } from '../utils/shortcuts';
import {
  SwapIcon,
  AddParticipantIcon,
  AddNodeIcon,
  ArrowIcon,
  RequestResponseIcon,
  ActionResponseIcon,
  DuplicateIcon,
  SelectAllOccurrencesIcon,
  FormatIcon,
  ResetIcon,
} from './Icons';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcutId: string;
  onClick: () => void;
}

interface ActionDef {
  shortcutId: string;
  actionId: string;
  icon: React.ReactNode;
  label: string;
  customOnClick?: () => void;
}

function ActionButton({ icon, label, shortcutId, onClick }: ActionButtonProps) {
  const shortcut = getShortcutDisplay(shortcutId);
  const tooltip = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
      title={tooltip}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />;
}

interface EditorActionsBarProps {
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  diagramType: DiagramType;
  onReset: () => void;
}

export default function EditorActionsBar({
  editorRef,
  diagramType,
  onReset,
}: EditorActionsBarProps) {
  const triggerAction = (actionId: string) => {
    const ed = editorRef.current;
    if (!ed) return;

    ed.focus();
    ed.trigger('editorActionsBar', actionId, null);
  };

  const isApplicable = (shortcutId: string): boolean => {
    const shortcut = getShortcutById(shortcutId);
    if (!shortcut?.applicableTo) return true;
    return shortcut.applicableTo.includes(diagramType);
  };

  const newElementProps =
    diagramType === 'sequence'
      ? { icon: <AddParticipantIcon className="w-4 h-4" />, label: 'New Participant' }
      : { icon: <AddNodeIcon className="w-4 h-4" />, label: 'New Node' };

  const sections: ActionDef[][] = [
    [
      {
        shortcutId: 'new-element',
        actionId: 'new-element',
        icon: newElementProps.icon,
        label: newElementProps.label,
      },
      {
        shortcutId: 'new-arrow',
        actionId: 'new-arrow',
        icon: <ArrowIcon className="w-4 h-4" />,
        label: 'New Arrow',
      },
      {
        shortcutId: 'request-response',
        actionId: 'request-response',
        icon: <RequestResponseIcon className="w-4 h-4" />,
        label: 'Request-Response',
      },
      {
        shortcutId: 'action-response',
        actionId: 'action-response',
        icon: <ActionResponseIcon className="w-4 h-4" />,
        label: 'Action-Response',
      },
    ],
    [
      {
        shortcutId: 'swap-arrow',
        actionId: 'swap-arrow',
        icon: <SwapIcon className="w-4 h-4" />,
        label: 'Swap Arrow',
      },
    ],
    [
      {
        shortcutId: 'duplicate-line',
        actionId: 'duplicate-line',
        icon: <DuplicateIcon className="w-4 h-4" />,
        label: 'Duplicate Line',
      },
      {
        shortcutId: 'select-all-occurrences',
        actionId: 'editor.action.selectHighlights',
        icon: <SelectAllOccurrencesIcon className="w-4 h-4" />,
        label: 'Select All Occurrences',
      },
    ],
    [
      {
        shortcutId: 'prettify',
        actionId: 'prettify',
        icon: <FormatIcon className="w-4 h-4" />,
        label: 'Prettify Code',
      },
      {
        shortcutId: 'reset-template',
        actionId: 'reset-template',
        icon: <ResetIcon className="w-4 h-4" />,
        label: 'Reset to Template',
        customOnClick: () => {
          if (window.confirm('Are you sure you want to reset? All changes will be lost.')) {
            onReset();
          }
        },
      },
    ],
  ];

  const filteredSections = sections
    .map((section) => section.filter((action) => isApplicable(action.shortcutId)))
    .filter((section) => section.length > 0);

  return (
    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-0.5">
      {filteredSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="contents">
          {sectionIndex > 0 && <Divider />}
          {section.map((action) => (
            <ActionButton
              key={action.shortcutId}
              icon={action.icon}
              label={action.label}
              shortcutId={action.shortcutId}
              onClick={action.customOnClick ?? (() => triggerAction(action.actionId))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
