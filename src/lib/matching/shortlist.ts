const STORAGE_KEY = 'degreelens_shortlist_ids';

let inMemoryShortlist: string[] = [];

export function getShortlistIds(): string[] {
  if (typeof window === 'undefined') {
    return inMemoryShortlist;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return inMemoryShortlist;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return inMemoryShortlist;
  }
}

export function addToShortlist(programId: string): string[] {
  const current = getShortlistIds();
  if (current.includes(programId)) return current;
  const updated = [...current, programId];
  saveShortlistIds(updated);
  return updated;
}

export function removeFromShortlist(programId: string): string[] {
  const current = getShortlistIds();
  const updated = current.filter(id => id !== programId);
  saveShortlistIds(updated);
  return updated;
}

export function toggleShortlist(programId: string): { shortlisted: boolean; ids: string[] } {
  const current = getShortlistIds();
  if (current.includes(programId)) {
    const updated = removeFromShortlist(programId);
    return { shortlisted: false, ids: updated };
  } else {
    const updated = addToShortlist(programId);
    return { shortlisted: true, ids: updated };
  }
}

export function isShortlisted(programId: string): boolean {
  return getShortlistIds().includes(programId);
}

export function clearShortlist(): void {
  saveShortlistIds([]);
}

function saveShortlistIds(ids: string[]): void {
  inMemoryShortlist = ids;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore local storage errors in restrictive browser environments
    }
  }
}
