/**
 * Deadline calculation utilities for AUSTRAC compliance.
 * 
 * TTR: Must be submitted within 10 business days of the transaction
 * SMR: Must be submitted within 3 business days of forming the suspicion
 */

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Calculate Easter Sunday for a given year using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Get Good Friday for a given year (2 days before Easter Sunday)
 */
function getGoodFriday(year: number): Date {
  const easter = getEasterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  return goodFriday;
}

/**
 * Get Easter Monday for a given year (1 day after Easter Sunday)
 */
function getEasterMonday(year: number): Date {
  const easter = getEasterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  return easterMonday;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get the Nth occurrence of a given weekday in a month.
 * weekday: 0=Sunday, 1=Monday, ... 6=Saturday
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  let dayOfMonth = 1 + ((weekday - firstDay + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, dayOfMonth);
}

/**
 * Get the substitute day when a holiday falls on a weekend.
 * Saturday → following Monday. Sunday → following Monday.
 * If Boxing Day (Dec 26) also falls on Monday (because Christmas was Sunday),
 * Boxing Day moves to Tuesday.
 */
function getSubstituteDay(date: Date, isBoxingDay = false): Date {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) {
    // Saturday → Monday
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2);
  }
  if (dayOfWeek === 0) {
    // Sunday → Monday (or Tuesday for Boxing Day if Christmas sub is already Monday)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (isBoxingDay ? 2 : 1));
  }
  return date;
}

/**
 * Australian public holidays — national + NSW state holidays.
 * Includes substitute-day rules for weekends.
 */
function isAustralianPublicHoliday(date: Date): boolean {
  const year = date.getFullYear();

  const holidays: Date[] = [];

  // --- National fixed holidays with substitute-day logic ---
  const newYears = new Date(year, 0, 1);
  holidays.push(getSubstituteDay(newYears));

  const australiaDay = new Date(year, 0, 26);
  holidays.push(getSubstituteDay(australiaDay));

  const anzacDay = new Date(year, 3, 25);
  // ANZAC Day: substitute only if Sunday (Saturday is observed on Saturday per convention)
  if (anzacDay.getDay() === 0) {
    holidays.push(new Date(year, 3, 26)); // Monday
  } else {
    holidays.push(anzacDay);
  }

  const christmas = new Date(year, 11, 25);
  const boxingDay = new Date(year, 11, 26);
  const christmasSub = getSubstituteDay(christmas);
  holidays.push(christmasSub);
  // Boxing Day: if Christmas was Sunday (sub Monday), Boxing Day goes to Tuesday
  const isChristmasSunday = christmas.getDay() === 0;
  holidays.push(getSubstituteDay(boxingDay, isChristmasSunday));

  // --- Easter (moveable) ---
  holidays.push(getGoodFriday(year));
  holidays.push(new Date(getEasterSunday(year).getTime() - 86400000)); // Easter Saturday
  holidays.push(getEasterMonday(year));

  // --- NSW state holidays ---
  // Queen's Birthday: second Monday of June
  holidays.push(getNthWeekdayOfMonth(year, 5, 1, 2));

  // Bank Holiday: first Monday of August
  holidays.push(getNthWeekdayOfMonth(year, 7, 1, 1));

  // Labour Day (NSW): first Monday of October
  holidays.push(getNthWeekdayOfMonth(year, 9, 1, 1));

  // Reconciliation Day: 27 May (substitute if weekend) — national from 2026
  const reconciliation = new Date(year, 4, 27);
  holidays.push(getSubstituteDay(reconciliation));

  return holidays.some(h => isSameDay(date, h));
}

/**
 * Check if a date is a business day (not weekend, not public holiday)
 */
function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isAustralianPublicHoliday(date);
}

/**
 * Add business days to a date
 */
function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Calculate TTR submission deadline (10 business days from transaction)
 */
export function calculateTTRDeadline(transactionDate: Date): Date {
  return addBusinessDays(transactionDate, 10);
}

/**
 * Calculate SMR submission deadline (3 business days from suspicion formed)
 */
export function calculateSMRDeadline(suspicionDate: Date): Date {
  return addBusinessDays(suspicionDate, 3);
}

/**
 * Calculate business days remaining until deadline
 */
export function getBusinessDaysRemaining(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  if (deadlineDate.getTime() === today.getTime()) {
    return 0; // Due today
  }

  if (deadlineDate < today) {
    // Overdue — count negative business days
    let overdueDays = 0;
    const current = new Date(deadlineDate);
    while (current < today) {
      current.setDate(current.getDate() + 1);
      if (isBusinessDay(current)) {
        overdueDays++;
      }
    }
    return -overdueDays;
  }

  let businessDays = 0;
  const current = new Date(today);

  while (current < deadlineDate) {
    current.setDate(current.getDate() + 1);
    if (isBusinessDay(current)) {
      businessDays++;
    }
  }

  return businessDays;
}

/**
 * Check if a deadline is approaching (within threshold business days)
 */
export function isDeadlineApproaching(deadline: Date, thresholdDays: number): boolean {
  return getBusinessDaysRemaining(deadline) <= thresholdDays;
}

/**
 * Check if a deadline has passed
 */
export function isDeadlinePassed(deadline: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  return deadlineDate < today;
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

