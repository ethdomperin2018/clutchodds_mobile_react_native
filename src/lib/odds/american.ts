export function americanToDecimal(american: number): number {
  if (american === 0 || !Number.isFinite(american)) {
    throw new Error("Invalid American odds");
  }
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
}
