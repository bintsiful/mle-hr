import { readFileSync } from 'fs';
import oracledb from 'oracledb';

const args = process.argv.slice(2);
const runIdArg = args.find((arg) => arg.startsWith('--run-id='));
const RUN_ID = runIdArg ? runIdArg.slice('--run-id='.length) : new Date().toISOString();
const raw    = JSON.parse(readFileSync('./jest-results.json', 'utf-8'));
const rows   = [];

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
      err:      (t.failureMessages[0] || '').substring(0, 4000) || null
    });
  }
}

const connectConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS
};

if (process.env.DB_CONFIG_DIR && process.env.DB_SERVICE) {
  connectConfig.connectString = process.env.DB_SERVICE;
  connectConfig.configDir = process.env.DB_CONFIG_DIR;
} else if (process.env.DB_CS) {
  connectConfig.connectString = process.env.DB_CS;
} else {
  throw new Error('Missing connection settings. Set either DB_CS or DB_CONFIG_DIR + DB_SERVICE.');
}

const conn = await oracledb.getConnection(connectConfig);

await conn.execute(`DELETE FROM mle_test_results WHERE run_id = :r`, { r: RUN_ID });
await conn.executeMany(
  `INSERT INTO mle_test_results(run_id,suite_name,test_name,status,duration_ms,error_message)
   VALUES(:runId,:suite,:name,:status,:ms,:err)`,
  rows,
  { bindDefs: {
    runId:  { type: oracledb.STRING, maxSize: 100  },
    suite:  { type: oracledb.STRING, maxSize: 200  },
    name:   { type: oracledb.STRING, maxSize: 500  },
    status: { type: oracledb.STRING, maxSize: 10   },
    ms:     { type: oracledb.NUMBER },
    err:    { type: oracledb.STRING, maxSize: 4000 }
  }}
);
await conn.commit();
await conn.close();
console.log(`Pushed ${rows.length} results for run: ${RUN_ID}`);
