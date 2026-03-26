import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type EditorActionsHandlers = {
  cut?: () => void;
  copy?: () => void;
  paste?: () => void;
  selectAll?: () => void;
};

type EditorActionsState = {
  canCutCopy: boolean;
  canPaste: boolean;
};

type EditorActionsContextValue = {
  cut: () => void;
  copy: () => void;
  paste: () => void;
  selectAll: () => void;
  state: EditorActionsState;
  setState: React.Dispatch<React.SetStateAction<EditorActionsState>>;
  setHandlers: (handlers: EditorActionsHandlers | null) => void;
};

const EditorActionsContext = createContext<EditorActionsContextValue | null>(
  null,
);

const EditorActionsProvider = ({ children }: { children: ReactNode }) => {
  const handlersRef = useRef<EditorActionsHandlers>({});
  const [state, setState] = useState<EditorActionsState>({
    canCutCopy: false,
    canPaste: false,
  });

  const setHandlers = useCallback((handlers: EditorActionsHandlers | null) => {
    handlersRef.current = handlers ?? {};
  }, []);

  const cut = useCallback(() => {
    handlersRef.current.cut?.();
  }, []);

  const copy = useCallback(() => {
    handlersRef.current.copy?.();
  }, []);

  const paste = useCallback(() => {
    handlersRef.current.paste?.();
  }, []);

  const selectAll = useCallback(() => {
    handlersRef.current.selectAll?.();
  }, []);

  const value = useMemo(
    () => ({ cut, copy, paste, selectAll, state, setState, setHandlers }),
    [cut, copy, paste, selectAll, setHandlers, state],
  );

  return (
    <EditorActionsContext.Provider value={value}>
      {children}
    </EditorActionsContext.Provider>
  );
};

const useEditorActions = () => {
  const context = useContext(EditorActionsContext);

  if (!context) {
    throw new Error(
      "useEditorActions must be used within an EditorActionsProvider",
    );
  }

  return context;
};

export { EditorActionsProvider, useEditorActions };
