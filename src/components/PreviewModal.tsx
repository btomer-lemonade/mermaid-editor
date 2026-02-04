import { useEffect, useRef, useState, useCallback } from 'react';
import { CloseIcon } from './Icons';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string | null;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP_BUTTON = 0.25;
const ZOOM_STEP_SCROLL = 0.05;
const CONTAINER_PADDING = 32;

export default function PreviewModal({ isOpen, onClose, svg }: PreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [baseScale, setBaseScale] = useState(1);

  const resetZoom = useCallback(() => setZoom(1), []);
  const zoomIn = useCallback(
    () => setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP_BUTTON)),
    []
  );
  const zoomOut = useCallback(
    () => setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP_BUTTON)),
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setSvgDimensions(null);
      setBaseScale(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && svg && containerRef.current && scrollContainerRef.current) {
      containerRef.current.innerHTML = svg;
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = 'none';
        svgElement.style.maxHeight = 'none';
        svgElement.style.display = 'block';

        let svgWidth = 800;
        let svgHeight = 600;

        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/).map(Number);
          if (parts.length === 4 && !parts.some(isNaN)) {
            svgWidth = parts[2];
            svgHeight = parts[3];
          }
        }

        svgElement.setAttribute('width', String(svgWidth));
        svgElement.setAttribute('height', String(svgHeight));
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const availableWidth = containerRect.width - CONTAINER_PADDING * 2;
        const availableHeight = containerRect.height - CONTAINER_PADDING * 2;

        const scaleX = availableWidth / svgWidth;
        const scaleY = availableHeight / svgHeight;
        const fitScale = Math.min(scaleX, scaleY, 1);

        setBaseScale(fitScale);
      }
    }
  }, [isOpen, svg]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!isOpen || !scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP_SCROLL : ZOOM_STEP_SCROLL;
        setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  const effectiveScale = baseScale * zoom;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[90vw] h-[90vh] mx-4 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Preview</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-auto bg-slate-50 dark:bg-slate-900/50"
        >
          {svg ? (
            <div
              className="p-8 flex items-center justify-center"
              style={{
                minWidth: '100%',
                minHeight: '100%',
                width: svgDimensions
                  ? Math.max(svgDimensions.width * effectiveScale + CONTAINER_PADDING * 2, 0)
                  : '100%',
                height: svgDimensions
                  ? Math.max(svgDimensions.height * effectiveScale + CONTAINER_PADDING * 2, 0)
                  : '100%',
              }}
            >
              <div
                ref={containerRef}
                style={{
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">No diagram to preview</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <kbd className="kbd-key text-xs">⌘</kbd> + scroll to zoom
            </p>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="w-6 h-6 flex items-center justify-center rounded-md text-sm font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom out"
              >
                −
              </button>
              <button
                onClick={resetZoom}
                className="min-w-[4rem] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="w-6 h-6 flex items-center justify-center rounded-md text-sm font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom in"
              >
                +
              </button>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <kbd className="kbd-key text-xs">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
