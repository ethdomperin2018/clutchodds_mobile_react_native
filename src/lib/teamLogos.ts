import lightPlates from "./team-logo-light-plates.json";
import manifest from "./team-logos-manifest.json";
import { TEAM_LOGO_REQUIRES } from "./teamLogoRequires.generated";

const TEAM_LOGO_MANIFEST = manifest as Record<string, Record<string, string>>;
const LIGHT_PLATE_PATHS = new Set(lightPlates as string[]);

function normalizeTeamLabel(value: string): string {
  return value
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const EXTRA_ALIASES: Record<string, Record<string, string>> = {
  basketball_nba: {
    "los angeles clippers": "la clippers",
  },
};

export function getTeamLogoPath(
  sportKey: string,
  teamName: string
): string | null {
  if (!sportKey || sportKey === "all") return null;
  const league = TEAM_LOGO_MANIFEST[sportKey];
  if (!league) return null;

  const normalized = normalizeTeamLabel(teamName);
  const aliasTarget = EXTRA_ALIASES[sportKey]?.[normalized];
  const lookupKey = aliasTarget ?? normalized;
  return league[lookupKey] ?? null;
}

export function teamLogoNeedsLightPlate(
  sportKey: string | undefined,
  teamName: string
): boolean {
  if (!sportKey) return false;
  const logoPath = getTeamLogoPath(sportKey, teamName);
  return logoPath != null && LIGHT_PLATE_PATHS.has(logoPath);
}

export function getTeamLogoSource(
  sportKey: string | undefined,
  teamName: string
): number | null {
  if (!sportKey) return null;
  const logoPath = getTeamLogoPath(sportKey, teamName);
  if (!logoPath) return null;
  return TEAM_LOGO_REQUIRES[logoPath] ?? null;
}
