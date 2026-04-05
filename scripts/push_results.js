import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const runIdArg = args.find((arg) => arg.startsWith('--run-id='));
const RUN_ID = runIdArg ? runIdArg.slice('--run-id='.length) : new Date().toISOString();
const raw    = JSON.parse(readFileSync('./jest-results.json', 'utf-8'));
const rows   = [];

function normalizeSqlText(value, maxLength = 4000) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value)
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength) || null;
}

for (const suite of raw.testResults) {
  const suitePath = suite.name || '';
  const suiteName = suitePath.split('/').pop().replace('.test.js', '');
  for (const t of suite.assertionResults || []) {
    rows.push({
      runId:    RUN_ID,
      suite:    suiteName,
      name:     t.fullName,
      status:   t.status === 'passed' ? 'PASS' : t.status === 'failed' ? 'FAIL' : 'SKIP',
      ms:       t.duration || 0,
      err:      normalizeSqlText(t.failureMessages[0])
    });
  }
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return Number.isFinite(value) ? String(value) : 'NULL';
}

const statements = [
  'DELETE FROM mle_test_results WHERE run_id = ' + sqlString(RUN_ID) + ';'
];

for (const row of rows) {
  statements.push(
    'INSERT INTO mle_test_results(run_id,suite_name,test_name,status,duration_ms,error_message) VALUES(' +
      [
        sqlString(row.runId),
        sqlString(row.suite),
        sqlString(row.name),
        sqlString(row.status),
        sqlNumber(row.ms),
        sqlString(row.err)
      ].join(',') +
    ');'
  );
}

statements.push('COMMIT;');
console.log(statements.join('\n'));
