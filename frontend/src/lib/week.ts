// ISO week helpers — week starts on Monday.

const MS_PER_DAY = 86_400_000;

export function isoWeekStart(d: Date): Date {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + offsetToMonday);
  return monday;
}

export function todayWeekStart(): Date {
  return isoWeekStart(new Date());
}

export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n * 7);
  return out;
}

export function isoWeekNumber(d: Date): number {
  // ISO 8601 week number.
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  // Thursday of the same ISO week determines the year.
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * MS_PER_DAY));
}

export function formatWeekLabel(d: Date): string {
  const week = String(isoWeekNumber(d)).padStart(2, "0");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (x: Date) =>
    `${String(x.getDate()).padStart(2, "0")}/${String(
      x.getMonth() + 1,
    ).padStart(2, "0")}`;
  return `Sem ${week} · ${fmt(d)}–${fmt(end)}`;
}
