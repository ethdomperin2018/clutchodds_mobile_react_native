import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";

export type PredictionUnavailableCopy = {
  headline: string;
  /** Compact list/card label (Fair Odds / Confidence cells). */
  short: string;
  detail?: string;
};

/** Elite users — model row missing (too early, not in feed yet, etc.). */
export function getPredictionUnavailableCopy(
  commenceTime: string,
  now = new Date()
): PredictionUnavailableCopy {
  const commenceMs = new Date(commenceTime).getTime();
  const nowMs = now.getTime();

  const slateBatchDetail =
    "The Prediction Engine posts win chances for the full day's slate a few hours before the first game starts (Eastern Time).";

  if (!Number.isFinite(commenceMs)) {
    return {
      headline: "Prediction not available yet.",
      short: "Not available yet",
      detail: slateBatchDetail,
    };
  }

  if (!isEligibleSportPredictionWindow(commenceTime, now)) {
    return {
      headline: "Predictions load once this game is on today's slate.",
      short: "Off today's slate",
      detail: slateBatchDetail,
    };
  }

  if (commenceMs > nowMs) {
    return {
      headline: "Prediction not loaded for this matchup yet.",
      short: "Not loaded yet",
      detail:
        "Today's slate usually fills in together before first pitch — check back soon or refresh.",
    };
  }

  return {
    headline: "Prediction not available for this game.",
    short: "No prediction",
    detail: "We could not load model output for this matchup.",
  };
}
