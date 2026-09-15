/** Display name for lists — mascot / short label (e.g. "St. Louis Cardinals" → "Cardinals"). */
export function shortTeamName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  if (parts.length === 1) return parts[0]!;

  const last = parts[parts.length - 1]!.toLowerCase();
  if ((last === "sox" || last === "jays") && parts.length >= 2) {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }

  return parts[parts.length - 1]!;
}

export function awayAtHomeLabel(awayTeam: string, homeTeam: string): string {
  return `${shortTeamName(awayTeam)} @ ${shortTeamName(homeTeam)}`;
}

/** 2–3 letter badge for team avatars. */
export function teamMonogram(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 3).toUpperCase();

  const city = parts.slice(0, -1);
  if (city.length >= 2) {
    const a = city[city.length - 2]!.replace(/\./g, "")[0] ?? "";
    const b = city[city.length - 1]![0] ?? "";
    return `${a}${b}`.toUpperCase();
  }

  return `${city[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function teamBadgeColors(fullName: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < fullName.length; i += 1) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue} 42% 32%)`, fg: "#f4f4f5" };
}
