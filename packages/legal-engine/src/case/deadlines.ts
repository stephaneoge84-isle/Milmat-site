export type FpsDeadlineKind = "RAPO" | "PAIEMENT";

export interface FpsDeadlineResult {
  kind: FpsDeadlineKind;
  notificationDate: string;
  deadlineDate: string;
  rule: string;
  basis: string;
}

function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Date invalide");
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calculateFpsDeadline(kind: FpsDeadlineKind, notificationDate: string): FpsDeadlineResult {
  const date = parseDate(notificationDate);

  if (kind === "RAPO") {
    return {
      kind,
      notificationDate,
      deadlineDate: isoDate(addMonths(date, 1)),
      rule: "1 mois à compter de la notification",
      basis: "CGCT art. R.2333-120-13",
    };
  }

  return {
    kind,
    notificationDate,
    deadlineDate: isoDate(addMonths(date, 3)),
    rule: "3 mois à compter de la notification",
    basis: "CGCT art. L.2333-87 IV",
  };
}
