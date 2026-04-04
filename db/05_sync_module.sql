-- Run with: sql user/pass@connstr @sql/05_sync_module.sql
-- SQLcl's 'script' block lets us read a local file and build DDL dynamically

script
  const src  = util.readFile('src/leaveEngine.js');
  const ddl  = `CREATE OR REPLACE MLE MODULE leave_engine_module
LANGUAGE JAVASCRIPT AS\n${src}\n/`;

  sqlcl.setStmt(ddl);
  sqlcl.run();

  ctx.write('MLE module synced from: src/leaveEngine.js\n');
/
