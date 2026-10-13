/** Elapsed calendar time between two instants: years, months, days, hours, minutes, seconds.
 * Calendar math is done on wall-clock fields in the given IANA time zone. */
export function wallParts(d: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function elapsed(start: Date, now: Date, timeZone = "America/Bogota") {
  if (now < start) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
  const a = wallParts(start, timeZone);
  const b = wallParts(now, timeZone);
  let seconds = b.s - a.s, minutes = b.mi - a.mi, hours = b.h - a.h;
  let days = b.d - a.d, months = b.m - a.m, years = b.y - a.y;
  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    months--;
    const pm = b.m - 1 === 0 ? 12 : b.m - 1;
    const py = b.m - 1 === 0 ? b.y - 1 : b.y;
    days += daysInMonth(py, pm);
  }
  if (months < 0) { months += 12; years--; }
  const totalDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return { years, months, days, hours, minutes, seconds, totalDays };
}

/** Next yearly occurrence of a YYYY-MM-DD date (or the date itself if not repeating). */
export function nextOccurrence(isoDate: string, repeats: boolean, today = new Date()) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!repeats) return new Date(y, m - 1, d);
  let n = new Date(t.getFullYear(), m - 1, d);
  if (n < t) n = new Date(t.getFullYear() + 1, m - 1, d);
  return n;
}

export function daysUntil(target: Date, today = new Date()) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - t.getTime()) / 86400000);
}

export function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}
