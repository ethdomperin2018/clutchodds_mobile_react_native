import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ModelPredictionsBoardUiContextValue = {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  activeFilterCount: number;
  setActiveFilterCount: (count: number) => void;
};

const ModelPredictionsBoardUiContext =
  createContext<ModelPredictionsBoardUiContextValue | null>(null);

export function ModelPredictionsBoardUiProvider({
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
    <ModelPredictionsBoardUiContext.Provider value={value}>
      {children}
    </ModelPredictionsBoardUiContext.Provider>
  );
}

export function useModelPredictionsBoardUi() {
  const ctx = useContext(ModelPredictionsBoardUiContext);
  if (!ctx) {
    throw new Error(
      "useModelPredictionsBoardUi must be used within ModelPredictionsBoardUiProvider"
    );
  }
  return ctx;
}

export function useOpenModelPredictionsFilters() {
  const { setFiltersOpen } = useModelPredictionsBoardUi();
  return useCallback(() => setFiltersOpen(true), [setFiltersOpen]);
}
