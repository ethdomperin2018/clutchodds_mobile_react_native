import { PlaceholderScreen } from "@/features/shared/PlaceholderScreen";

export function ArbitrageScreen() {
  return (
    <PlaceholderScreen
      title="Arbitrage"
      subtitle="Structured for a high-frequency opportunity list, fast filters, and detail sheets tuned for live market movement."
      bullets={[
        "polling query hook for fast refetch intervals",
        "opportunity feed + filters + stake calculator zones",
        "future push/deep-link integration into bookmakers",
      ]}
      tone="success"
    />
  );
}
