import { PlaceholderScreen } from "@/features/shared/PlaceholderScreen";

export function PredictionScreen() {
  return (
    <PlaceholderScreen
      title="Prediction"
      subtitle="Model Predictions board for pre-game favorites, win %, confidence, and model edge."
      bullets={[
        "sport filters + confidence / edge thresholds",
        "top prediction card + ranked opportunity list",
        "Elite-gated engine predictions wired to the existing API",
      ]}
      tone="info"
    />
  );
}
