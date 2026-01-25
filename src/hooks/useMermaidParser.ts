import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';

interface ParseResult {
  svg: string | null;
  error: string | null;
  isLoading: boolean;
}

function initMermaid(isDark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
    },
  });
}

export function useMermaidParser(code: string, isDarkMode: boolean): ParseResult {
  const [result, setResult] = useState<ParseResult>({
    svg: null,
    error: null,
    isLoading: true,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(
    async (diagramCode: string, renderId: number) => {
      if (!diagramCode.trim()) {
        setResult({ svg: null, error: null, isLoading: false });
        return;
      }

      try {
        initMermaid(isDarkMode);

        // Call mermaid.parse so that an error is thrown here if the diagram is invalid, and no error UI will be rendered by Mermaid.
        // If we just call mermaid.render and there's an error, the error UI will be rendered by Mermaid.
        await mermaid.parse(diagramCode);

        const id = `mermaid-${Date.now()}-${renderId}`;
        const { svg } = await mermaid.render(id, diagramCode);

        if (renderId === renderIdRef.current) {
          setResult({ svg, error: null, isLoading: false });
        }
      } catch (err) {
        if (renderId === renderIdRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to parse diagram';
          setResult({ svg: null, error: errorMessage, isLoading: false });
        }
      }
    },
    [isDarkMode]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setResult((prev) => ({ ...prev, isLoading: true }));

    const currentRenderId = ++renderIdRef.current;

    debounceRef.current = setTimeout(() => {
      renderDiagram(code, currentRenderId);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, renderDiagram]);

  return result;
}
