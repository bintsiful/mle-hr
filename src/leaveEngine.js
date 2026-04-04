/**
 * leaveEngine.js
 * Oracle MLE-compatible ES Module.
 * No Node APIs. Runs in Jest AND Oracle 23ai MLE.
 */

// --- Constants -------------------------------------------
const ANNUAL_DAYS_PER_YEAR   = 20;
const SICK_DAYS_PER_YEAR     = 10;
const FAMILY_DAYS_PER_YEAR   = 3;
const MAX_SINGLE_REQUEST     = 15;   // days per request cap
const MIN_NOTICE_DAYS        = 2;    // working days notice required

// --- Accrue ----------------------------------------------
/**
 * Calculate earned leave days for a given leave type.
 * @param {number} monthsWorked
 * @param {'annual'|'sick'|'family'} leaveType
 * @returns {number} accrued days (rounded to 1 decimal)
 */
export function accrueDays(monthsWorked, leaveType) {
  if (monthsWorked < 0) return 0;
  const rates = {
    annual: ANNUAL_DAYS_PER_YEAR,
    sick:   SICK_DAYS_PER_YEAR,
    family: FAMILY_DAYS_PER_YEAR
  };
  const annual = rates[leaveType];
  if (annual === undefined) throw new Error(`Unknown leave type: ${leaveType}`);
  return Math.round((annual / 12) * monthsWorked * 10) / 10;
}

// --- Validate --------------------------------------------
/**
 * Validate a leave request against the current balance.
 * @param {number} requestedDays
 * @param {number} availableBalance
 * @param {number} noticeDays  - working days from today to start date
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateRequest(requestedDays, availableBalance, noticeDays) {
  if (requestedDays <= 0)
    return { valid: false, reason: 'Requested days must be greater than zero' };

  if (requestedDays > MAX_SINGLE_REQUEST)
    return { valid: false, reason: `Single request cannot exceed ${MAX_SINGLE_REQUEST} days` };

  if (requestedDays > availableBalance)
    return { valid: false, reason: 'Insufficient leave balance' };

  if (noticeDays < MIN_NOTICE_DAYS)
    return { valid: false, reason: `Minimum ${MIN_NOTICE_DAYS} working days notice required` };

  return { valid: true, reason: null };
}

// --- Summarise -------------------------------------------
/**
 * Build a leave summary object for display in APEX.
 * @param {number} monthsWorked
 * @param {number} daysTaken
 * @param {'annual'|'sick'|'family'} leaveType
 * @returns {{ accrued, taken, balance, leaveType }}
 */
export function summarise(monthsWorked, daysTaken, leaveType) {
  const accrued = accrueDays(monthsWorked, leaveType);
  const balance = Math.max(0, accrued - daysTaken);
  return { accrued, taken: daysTaken, balance, leaveType };
}

// --- APEX entry point ------------------------------------
/**
 * Single callable from PL/SQL. Accepts JSON string, returns JSON string.
 * @param {string} payloadJson
 * @returns {string}
 */
export function processLeaveRequest(payloadJson) {
  const p       = JSON.parse(payloadJson);
  const summary = summarise(p.monthsWorked, p.daysTaken, p.leaveType);
  const check   = validateRequest(p.requestedDays, summary.balance, p.noticeDays);
  return JSON.stringify({ summary, check });
}