export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function versionNumber(birthday: string, today = localDay()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const birth = new Date(`${birthday}T00:00:00Z`);
  const now = new Date(`${today}T00:00:00Z`);
  if (
    !Number.isFinite(birth.getTime()) ||
    !Number.isFinite(now.getTime()) ||
    birth.toISOString().slice(0, 10) !== birthday ||
    now.toISOString().slice(0, 10) !== today ||
    birth > now
  )
    return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  let anniversary = new Date(Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (anniversary > now) {
    age -= 1;
    anniversary = new Date(Date.UTC(now.getUTCFullYear() - 1, birth.getUTCMonth(), birth.getUTCDate()));
  }
  const days = Math.floor((now.getTime() - anniversary.getTime()) / 86_400_000);
  return `${Math.floor(age / 10)}.${age % 10}.${days}`;
}
