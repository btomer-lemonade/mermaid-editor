import { useRef, useEffect } from 'react';
import { SpinnerIcon, WarningIcon, DiagramIcon } from './Icons';

interface PreviewProps {
  svg: string | null;
  error: string | null;
  isLoading: boolean;
}

export default function Preview({ svg, error, isLoading }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && svg) {
      containerRef.current.innerHTML = svg;

      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '100%';
        svgElement.style.width = 'auto';
        svgElement.style.height = 'auto';
      }
    }
  }, [svg]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Preview</span>
        {isLoading && (
          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <SpinnerIcon className="animate-spin h-3 w-3" />
            Rendering...
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-900">
        {error ? (
          <div className="p-4">
            <div className="error-banner">
              <div className="flex items-start gap-2">
                <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Syntax Error</p>
                  <p className="mt-1 text-sm opacity-90">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : svg ? (
          <div ref={containerRef} className="p-8 flex items-center justify-center h-full" />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <DiagramIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Start typing to see your diagram</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
