import type { ReservationData } from "./njangui-data";

export type StayPhase = "upcoming" | "ongoing" | "finished" | "cancelled" | "unknown";

export const STAY_TODAY = new Date();

const MONTH_INDEX: Record<string, number> = {
  janv: 0, janvier: 0, fevr: 1, fevrier: 1, mars: 2, avr: 3, avril: 3,
  mai: 4, juin: 5, juil: 6, juillet: 6, aout: 7, sept: 8, septembre: 8,
  oct: 9, octobre: 9, nov: 10, novembre: 10, dec: 11, decembre: 11,
};

function normalizeMonth(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "");
}

export function parseStayDates(dates: string) {
  const iso = dates.match(/\d{4}-\d{2}-\d{2}/g);
  if (iso && iso.length > 0) {
    const start = new Date(`${iso[0]}T00:00:00`);
    const end = new Date(`${iso[iso.length - 1]}T00:00:00`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) return { start, end };
  }

  const normalized = dates.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const range = normalized.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s+([^\s]+)(?:\s+(\d{4}))?$/i);
  if (range) {
    const month = MONTH_INDEX[normalizeMonth(range[3])];
    const year = Number(range[4] ?? STAY_TODAY.getFullYear());
    if (month !== undefined) {
      return {
        start: new Date(year, month, Number(range[1])),
        end: new Date(year, month, Number(range[2])),
      };
    }
  }

  const single = normalized.match(/^(\d{1,2})\s+([^\s]+)(?:\s+(\d{4}))?$/i);
  if (single) {
    const month = MONTH_INDEX[normalizeMonth(single[2])];
    const year = Number(single[3] ?? STAY_TODAY.getFullYear());
    if (month !== undefined) {
      const day = new Date(year, month, Number(single[1]));
      return { start: day, end: day };
    }
  }

  return null;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getStayPhase(r: ReservationData): StayPhase {
  if (r.status === "Annulée") return "cancelled";
  if (r.status === "Terminée") return "finished";
  const range = parseStayDates(r.dates);
  if (!range) return "unknown";
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);
  const today = startOfDay(STAY_TODAY);
  if (today > end) return "finished";
  if (today >= start) return "ongoing";
  return "upcoming";
}
