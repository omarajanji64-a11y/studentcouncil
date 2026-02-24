import type { Break } from "@/lib/types";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toMinutesOfDay = (timestamp: number) => {
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0;
  const date = new Date(safeTimestamp);
  return date.getHours() * 60 + date.getMinutes();
};

const getDayStart = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const getScheduleMinutes = (breakItem: Break) => ({
  startMinutes: toMinutesOfDay(breakItem.startTime),
  endMinutes: toMinutesOfDay(breakItem.endTime),
});

export const parseTimeInput = (value: string): number | null => {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const anchorDate = new Date(2000, 0, 1, 0, 0, 0, 0);
  anchorDate.setHours(hours, minutes, 0, 0);
  return anchorDate.getTime();
};

export const resolveMostRecentBreakWindow = (
  breakItem: Break,
  referenceTime = Date.now()
) => {
  const { startMinutes, endMinutes } = getScheduleMinutes(breakItem);
  const dayStart = getDayStart(referenceTime);
  let startTime = dayStart + startMinutes * MINUTE_MS;
  let endTime = dayStart + endMinutes * MINUTE_MS;

  if (endTime <= startTime) {
    endTime += DAY_MS;
  }

  if (startTime > referenceTime) {
    startTime -= DAY_MS;
    endTime -= DAY_MS;
  }

  return { startTime, endTime };
};

export const isBreakActiveAt = (breakItem: Break, referenceTime = Date.now()) => {
  const { startTime, endTime } = resolveMostRecentBreakWindow(breakItem, referenceTime);
  return referenceTime >= startTime && referenceTime < endTime;
};

export const resolveBreakForReference = (
  breakItem: Break,
  referenceTime = Date.now()
): Break => {
  const { startTime, endTime } = resolveMostRecentBreakWindow(
    breakItem,
    referenceTime
  );
  return { ...breakItem, startTime, endTime };
};

export const compareBreakBySchedule = (a: Break, b: Break) =>
  toMinutesOfDay(a.startTime) - toMinutesOfDay(b.startTime);
