export function nowISO(): string {
  return new Date().toISOString();
}

export function toDateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
