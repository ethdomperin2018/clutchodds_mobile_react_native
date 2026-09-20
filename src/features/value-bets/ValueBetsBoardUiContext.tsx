import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ValueBetsBoardUiContextValue = {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  activeFilterCount: number;
  setActiveFilterCount: (count: number) => void;
};

const ValueBetsBoardUiContext =
  createContext<ValueBetsBoardUiContextValue | null>(null);

export function ValueBetsBoardUiProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const value = useMemo(
    () => ({
      filtersOpen,
      setFiltersOpen,
      activeFilterCount,
      setActiveFilterCount,
    }),
    [filtersOpen, activeFilterCount]
  );

  return (
    <ValueBetsBoardUiContext.Provider value={value}>
      {children}
    </ValueBetsBoardUiContext.Provider>
  );
}

export function useValueBetsBoardUi() {
  const ctx = useContext(ValueBetsBoardUiContext);
  if (!ctx) {
    throw new Error(
      "useValueBetsBoardUi must be used within ValueBetsBoardUiProvider"
    );
  }
  return ctx;
}

export function useOpenValueBetsFilters() {
  const { setFiltersOpen } = useValueBetsBoardUi();
  return useCallback(() => setFiltersOpen(true), [setFiltersOpen]);
}
