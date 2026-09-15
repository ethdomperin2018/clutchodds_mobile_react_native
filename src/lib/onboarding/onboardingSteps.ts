export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  ctaLabel?: string;
};

/** Same copy as web `lib/onboarding/onboardingSteps.ts`. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "philosophy",
    title: "The favorite isn't always the best bet",
    body: "Before you scan a single line, here's the idea behind Clutch Odds: the popular pick and the profitable pick aren't always the same. We help you find mispriced moneylines — not just who might win.",
  },
  {
    id: "ev",
    title: "What is expected value (+EV)?",
    body: "+EV means the price is better than the true odds imply. Over many similar bets, +EV picks should profit; one game can still lose.",
    bullets: [
      "Fair edge — best line vs a no-vig market estimate",
      "Green recommended team on Value Bets = best +EV line, not always the model favorite",
    ],
  },
  {
    id: "scanners",
    title: "Three boards, clear jobs",
    body: "Use whichever edge shows up — without mixing the jobs.",
    bullets: [
      "Arbitrage — lock profit when two books disagree. Recalculate before you bet.",
      "Value Bets — single-leg +EV moneylines with fair odds, best price, and value edge.",
      "Model Predictions (Elite) — pre-game win %, model favorite, confidence, and model edge.",
      "Filters on each board — sport, books, min ROI/edge, and quote sync.",
    ],
  },
  {
    id: "prediction-engine",
    title: "Elite: Value Bet pick vs Model favorite",
    body: "Keep two questions separate:",
    bullets: [
      "Value Bet — should I bet this price? EV on Pro; Elite adds Our Fair Odds, confidence, model %, market %, and edge (edge hidden on live)",
      "Model Predictions — who is most likely to win? Win %, confidence, and model edge on its own board",
      "Green recommended Value Bet side = best +EV line, not always the model favorite",
    ],
  },
  {
    id: "track",
    title: "Track whether your process works",
    body: "Log arbs from the board or Value Bets picks from a card. Your dashboard shows expected vs realized PNL, win rate, and book mix — so you know if the edge is real over time, not just one lucky night.",
    ctaLabel: "Get started",
  },
];
