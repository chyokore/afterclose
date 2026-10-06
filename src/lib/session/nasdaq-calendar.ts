import { z } from "zod";

export const CALENDAR_SOURCE = "https://www.nasdaqtrader.com/Trader.aspx?id=Calendar";
export const HOURS_SOURCE = "https://www.nasdaq.com/market-activity/stock-market-holiday-schedule";
// Manually reviewed official schedule, not a live exchange-status feed.
export const nasdaqSchedule = {
  mode: "live" as const, market: "XNAS" as const, timezone: "America/New_York" as const,
  source: CALENDAR_SOURCE, hoursSource: HOURS_SOURCE,
  observedAtMs: Date.parse("2026-09-26T17:53:32Z"),
  validFromDate: "2026-01-01", validUntilDate: "2026-12-06",
  holidays: ["2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25"],
  earlyCloses: ["2026-11-27", "2026-12-24"],
};
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const scheduleSchema = z.object({
  mode: z.enum(["live", "synthetic"]), market: z.literal("XNAS"), timezone: z.literal("America/New_York"),
  source: z.literal(CALENDAR_SOURCE), hoursSource: z.literal(HOURS_SOURCE),
  observedAtMs: z.number().int().nonnegative(), validFromDate: date, validUntilDate: date,
  holidays: z.array(date), earlyCloses: z.array(date),
});
// Local review policy for display-only schedule evidence, not an engine threshold or source guarantee.
const MAX_REVIEW_AGE_MS = 7 * 86_400_000;
export type CalendarEvidence = {
  market: "XNAS"; timezone: "America/New_York"; calendarDate: string | null;
  session: "premarket" | "regular" | "postmarket" | "closed" | "unknown";
  availability: "available" | "unavailable"; scope: "published-schedule";
  mode: "live" | "synthetic"; source: string; hoursSource: string;
  observedAtMs: number | null; evaluatedAtMs: number | null;
  validFromDate: string | null; validUntilDate: string | null;
  authoritativeStatus: "unverified"; reason: string;
};
export function observeNasdaqSchedule(nowMs: number, raw: unknown = nasdaqSchedule, mode: "live" | "synthetic" = "live"): CalendarEvidence {
  const result: CalendarEvidence = {
    market: "XNAS", timezone: "America/New_York", calendarDate: null, session: "unknown",
    availability: "unavailable", scope: "published-schedule", mode, source: CALENDAR_SOURCE,
    hoursSource: HOURS_SOURCE, observedAtMs: null, evaluatedAtMs: Number.isSafeInteger(nowMs) ? nowMs : null,
    validFromDate: null, validUntilDate: null, authoritativeStatus: "unverified", reason: "Calendar unavailable or invalid.",
  };
  if (!Number.isSafeInteger(nowMs) || nowMs < 0 || nowMs > 8.64e15) return result;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: result.timezone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(nowMs);
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === key)!.value;
  result.calendarDate = `${part("year")}-${part("month")}-${part("day")}`;
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success || parsed.data.mode !== mode) return result;
  const s = parsed.data;
  Object.assign(result, { observedAtMs: s.observedAtMs, validFromDate: s.validFromDate, validUntilDate: s.validUntilDate });
  if (s.validFromDate >= s.validUntilDate || result.calendarDate < s.validFromDate || result.calendarDate >= s.validUntilDate) {
    result.reason = "Outside reviewed schedule coverage; December 6 hours change requires review."; return result;
  }
  if (nowMs < s.observedAtMs || nowMs - s.observedAtMs > MAX_REVIEW_AGE_MS) {
    result.reason = "Calendar review is future-dated or older than the local seven-day review limit."; return result;
  }
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  if (["Sat", "Sun"].includes(part("weekday")) || s.holidays.includes(result.calendarDate)) {
    result.session = "closed";
  } else if (s.earlyCloses.includes(result.calendarDate) && minutes >= 780) {
    result.reason = "Regular session ends at 13:00 ET; early-close extended hours need a separate exchange notice."; return result;
  } else {
    result.session = minutes < 240 || minutes >= 1200 ? "closed" : minutes < 570 ? "premarket" : minutes < 960 ? "regular" : "postmarket";
  }
  result.availability = "available";
  result.reason = "Published schedule only. Live exchange status, security halts and fresh equity quotes are not verified.";
  return result;
}
