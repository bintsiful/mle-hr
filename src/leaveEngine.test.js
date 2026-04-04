import { accrueDays, validateRequest, summarise } from '../src/leaveEngine.js';

// ── accrueDays ───────────────────────────────────────────
describe('accrueDays', () => {

  test('annual: 12 months = 20 days', () => {
    expect(accrueDays(12, 'annual')).toBe(20);
  });

  test('annual: 6 months = 10 days', () => {
    expect(accrueDays(6, 'annual')).toBe(10);
  });

  test('sick: 3 months = 2.5 days', () => {
    expect(accrueDays(3, 'sick')).toBe(2.5);
  });

  test('family: 12 months = 3 days', () => {
    expect(accrueDays(12, 'family')).toBe(3);
  });

  test('negative months returns 0', () => {
    expect(accrueDays(-1, 'annual')).toBe(0);
  });

  test('unknown type throws', () => {
    expect(() => accrueDays(12, 'sabbatical')).toThrow('Unknown leave type');
  });

  test('annual: 6 months is 10 days', () => {
    expect(accrueDays(6, 'annual')).toBe(10);
  });

});

// ── validateRequest ──────────────────────────────────────
describe('validateRequest', () => {

  test('valid request passes', () => {
    expect(validateRequest(5, 15, 3).valid).toBe(true);
  });

  test('zero days rejected', () => {
    expect(validateRequest(0, 15, 3).valid).toBe(false);
  });

  test('exceeds balance rejected', () => {
    const r = validateRequest(10, 8, 3);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/Insufficient/);
  });

  test('exceeds 15-day cap rejected', () => {
    expect(validateRequest(16, 30, 5).valid).toBe(false);
  });

  test('insufficient notice rejected', () => {
    const r = validateRequest(3, 15, 1);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/notice/);
  });

  test('notice error explains required notice', () => {
    const r = validateRequest(3, 15, 1);
    expect(r.reason).toMatch(/notice/);
  });

});

// ── summarise ────────────────────────────────────────────
describe('summarise', () => {

  test('balance = accrued minus taken', () => {
    const s = summarise(12, 5, 'annual');
    expect(s.accrued).toBe(20);
    expect(s.balance).toBe(15);
    expect(s.taken).toBe(5);
  });

  test('balance never goes negative', () => {
    const s = summarise(6, 99, 'annual');
    expect(s.balance).toBe(0);
  });

});
