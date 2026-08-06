import { PlaceholderScreen } from "@/features/shared/PlaceholderScreen";

export function EdgeCenterScreen() {
  return (
    <PlaceholderScreen
      title="Edge Center"
      subtitle="Reserved for value-bet workflows, model overlays, and premium insight modules without coupling them to the arbitrage route."
      bullets={[
        "feature folder separated from arbitrage so models can evolve independently",
        "room for premium gating and plan-aware modules",
        "query keys can segment scanner, predictions, and saved picks",
      ]}
    />
  );
}
