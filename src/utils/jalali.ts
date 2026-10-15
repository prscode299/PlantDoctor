import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const JALALI_WEEK_DAYS = [
  'ش', // شنبه
  'ی', // یکشنبه
  'د', // دوشنبه
  'س', // سه‌شنبه
  'چ', // چهارشنبه
  'پ', // پنج‌شنبه
  'ج', // جمعه
];

export const JALALI_WEEK_DAYS_LONG = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

/**
 * Converts English digits to Persian digits (e.g., "123" -> "۱۲۳")
 */
export function toPersianDigits(input: string | number): string {
  const str = String(input);
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianNumbers[+w]);
}

/**
 * Formats a Date or ISO string into a Persian date string: e.g. "۲۴ مهر ۱۴۰۳"
 */
export function formatToJalali(dateInput: Date | string, includeYear = true): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const { jy, jm, jd } = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const monthName = JALALI_MONTH_NAMES[jm - 1];
  const dayStr = toPersianDigits(jd);
  const yearStr = toPersianDigits(jy);

  return includeYear ? `${dayStr} ${monthName} ${yearStr}` : `${dayStr} ${monthName}`;
}

/**
 * Formats to short numerical format: "۱۴۰۳/۰۷/۲۴"
 */
export function formatToJalaliShort(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const { jy, jm, jd } = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

/**
 * Returns current Jalali year and month
 */
export function getCurrentJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Returns today's ISO date string: YYYY-MM-DD
 */
export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds days to an ISO string or Date, returns YYYY-MM-DD
 */
export function addDays(dateInput: string | Date, days: number): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate difference in whole days between target date and today
 * positive: in future
 * negative: in past
 * zero: today
 */
export function getDaysDiffFromToday(targetIsoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetIsoDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Relative Persian label: "امروز", "فردا", "۳ روز دیگر", "دیروز", "۲ روز پیش"
 */
export function getRelativeJalaliLabel(targetIsoDate: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isFuture: boolean;
  diffDays: number;
} {
  const diff = getDaysDiffFromToday(targetIsoDate);

  if (diff === 0) {
    return { label: 'امروز', isOverdue: false, isToday: true, isFuture: false, diffDays: 0 };
  }
  if (diff === 1) {
    return { label: 'فردا', isOverdue: false, isToday: false, isFuture: true, diffDays: 1 };
  }
  if (diff === -1) {
    return { label: 'دیروز (معوق)', isOverdue: true, isToday: false, isFuture: false, diffDays: -1 };
  }
  if (diff > 1) {
    return {
      label: `${toPersianDigits(diff)} روز دیگر`,
      isOverdue: false,
      isToday: false,
      isFuture: true,
      diffDays: diff,
    };
  }
  return {
    label: `${toPersianDigits(Math.abs(diff))} روز قبل (معوق)`,
    isOverdue: true,
    isToday: false,
    isFuture: false,
    diffDays: diff,
  };
}

/**
 * Convert Jalali (jy, jm, jd) to Gregorian ISO string YYYY-MM-DD
 */
export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const m = String(gm).padStart(2, '0');
  const d = String(gd).padStart(2, '0');
  return `${gy}-${m}-${d}`;
}

export interface JalaliCalendarDay {
  jy: number;
  jm: number;
  jd: number;
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0 for Saturday in Persian week, up to 6 for Friday
}

/**
 * Generates month days grid for calendar view
 */
export function getJalaliMonthDays(jy: number, jm: number): JalaliCalendarDay[] {
  const monthLength = jalaaliMonthLength(jy, jm);
  const todayIso = getTodayIso();
  const days: JalaliCalendarDay[] = [];

  // Determine starting weekday of 1st day of month
  // In JavaScript: Sunday is 0, Monday 1, ..., Saturday 6
  // In Iranian calendar: Saturday is 0, Sunday 1, ..., Friday 6
  const firstDayGregorian = toGregorian(jy, jm, 1);
  const gDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const gDay = gDate.getDay(); // 0 is Sunday, 6 is Saturday
  const persianStartOffset = (gDay + 1) % 7; // Shift so Saturday is 0

  // Previous month padding days
  const prevMonth = jm === 1 ? 12 : jm - 1;
  const prevYear = jm === 1 ? jy - 1 : jy;
  const prevMonthLength = jalaaliMonthLength(prevYear, prevMonth);

  for (let i = persianStartOffset - 1; i >= 0; i--) {
    const jd = prevMonthLength - i;
    const isoDate = jalaliToIso(prevYear, prevMonth, jd);
    days.push({
      jy: prevYear,
      jm: prevMonth,
      jd,
      isoDate,
      isCurrentMonth: false,
      isToday: isoDate === todayIso,
      dayOfWeek: (persianStartOffset - 1 - i) % 7,
    });
  }

  // Current month days
  for (let jd = 1; jd <= monthLength; jd++) {
    const isoDate = jalaliToIso(jy, jm, jd);
    days.push({
      jy,
      jm,
      jd,
      isoDate,
      isCurrentMonth: true,
      isToday: isoDate === todayIso,
      dayOfWeek: (days.length) % 7,
    });
  }

  // Next month padding to fill complete weeks (multiples of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  const nextMonth = jm === 12 ? 1 : jm + 1;
  const nextYear = jm === 12 ? jy + 1 : jy;

  for (let jd = 1; jd <= remaining; jd++) {
    const isoDate = jalaliToIso(nextYear, nextMonth, jd);
    days.push({
      jy: nextYear,
      jm: nextMonth,
      jd,
      isoDate,
      isCurrentMonth: false,
      isToday: isoDate === todayIso,
      dayOfWeek: (days.length) % 7,
    });
  }

  return days;
}
