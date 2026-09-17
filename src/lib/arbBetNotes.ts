export const ARB_EVENT_NOTE_PREFIX = "arbEvent:";

export function parseArbEventIdFromNotes(notes: string | null): string | null {
  if (!notes?.startsWith(ARB_EVENT_NOTE_PREFIX)) return null;
  const id = notes.slice(ARB_EVENT_NOTE_PREFIX.length).trim();
  return id || null;
}
