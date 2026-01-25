import { useState, useCallback, useEffect, useRef } from 'react';
import type { DiagramType } from '../types';
import { loadState, saveCode, saveActiveType, getDefaultCode } from '../utils/storage';

export function usePersistedState() {
  const [state, setState] = useState(() => {
    const persisted = loadState();
    return {
      diagramType: persisted.activeType,
      codes: persisted.code,
    };
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = state.codes[state.diagramType];

  const setCode = useCallback(
    (newCode: string) => {
      setState((prev) => ({
        ...prev,
        codes: {
          ...prev.codes,
          [prev.diagramType]: newCode,
        },
      }));

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveCode(state.diagramType, newCode);
      }, 500);
    },
    [state.diagramType]
  );

  const switchType = useCallback((type: DiagramType) => {
    setState((prev) => ({
      ...prev,
      diagramType: type,
    }));
    saveActiveType(type);
  }, []);

  const resetToTemplate = useCallback(() => {
    const defaultCode = getDefaultCode(state.diagramType);
    setState((prev) => ({
      ...prev,
      codes: {
        ...prev.codes,
        [prev.diagramType]: defaultCode,
      },
    }));
    saveCode(state.diagramType, defaultCode);
  }, [state.diagramType]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    code,
    diagramType: state.diagramType,
    setCode,
    switchType,
    resetToTemplate,
  };
}
