export function formatSignedPercent(value: number, digits = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n).toFixed(digits);
  if (n > 0) return `+${abs}%`;
  if (n < 0) return `-${abs}%`;
  return `${abs}%`;
}

export function formatPercent(value: number, digits = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(digits)}%`;
}

export function formatCurrency(value: number, digits = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n).toFixed(digits);
  if (n < 0) return `-$${abs}`;
  if (n > 0) return `$${abs}`;
  return `$${abs}`;
}

export function formatLocalDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function arbRoiPercent(arb: {
  totalStake: number;
  guaranteedProfit: number;
}): number {
  if (arb.totalStake <= 0) return 0;
  return (arb.guaranteedProfit / arb.totalStake) * 100;
}
