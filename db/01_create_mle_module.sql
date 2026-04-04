-- Drop previous version if it exists (safe for re-runs)
BEGIN
  EXECUTE IMMEDIATE 'DROP MLE MODULE leave_engine_module';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE MLE MODULE leave_engine_module
LANGUAGE JAVASCRIPT AS

export function accrueDays(monthsWorked, leaveType) {
  if (monthsWorked < 0) return 0;
  const rates = { annual: 20, sick: 10, family: 3 };
  const annual = rates[leaveType];
  if (annual === undefined) throw new Error(`Unknown leave type: ${leaveType}`);
  return Math.round((annual / 12) * monthsWorked * 10) / 10;
}

export function validateRequest(requestedDays, availableBalance, noticeDays) {
  if (requestedDays <= 0)
    return { valid: false, reason: 'Requested days must be greater than zero' };
  if (requestedDays > 15)
    return { valid: false, reason: 'Single request cannot exceed 15 days' };
  if (requestedDays > availableBalance)
    return { valid: false, reason: 'Insufficient leave balance' };
  if (noticeDays < 2)
    return { valid: false, reason: 'Minimum 2 working days notice required' };
  return { valid: true, reason: null };
}

export function summarise(monthsWorked, daysTaken, leaveType) {
  const accrued = accrueDays(monthsWorked, leaveType);
  const balance = Math.max(0, accrued - daysTaken);
  return { accrued, taken: daysTaken, balance, leaveType };
}

export function processLeaveRequest(payloadJson) {
  const p       = JSON.parse(payloadJson);
  const summary = summarise(p.monthsWorked, p.daysTaken, p.leaveType);
  const check   = validateRequest(p.requestedDays, summary.balance, p.noticeDays);
  return JSON.stringify({ summary, check });
}
/
