export function nowISO(): string {
  return new Date().toISOString();
}

export function toDateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function parseISOTime(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export function compareISODesc(left: string | undefined, right: string | undefined, fallback = 0): number {
  const leftTime = parseISOTime(left);
  const rightTime = parseISOTime(right);
  if (leftTime === null || rightTime === null) {
    return fallback;
  }
  return rightTime - leftTime;
}

export function ageInDays(isoTimestamp: string | undefined, now: Date = new Date()): number | null {
  const time = parseISOTime(isoTimestamp);
  if (time === null) {
    return null;
  }
  return Math.floor((now.getTime() - time) / 86_400_000);
}
