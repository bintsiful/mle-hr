# MLE HR

`mle-hr` is a small Oracle Database MLE demo that implements leave-request logic in JavaScript, tests it with Jest, and syncs the module into Oracle for use from PL/SQL and APEX.

## What It Includes

- `src/leaveEngine.js`: core leave engine logic written as an ES module
- `src/leaveEngine.test.js`: Jest tests for the leave engine
- `db/01_create_mle_module.sql`: creates the Oracle MLE module
- `db/02_create_mle_env.sql`: creates the MLE environment
- `db/03_create_plsql_specs.sql`: exposes the MLE module through a PL/SQL function
- `db/04_create_results_table.sql`: stores test execution results
- `scripts/deploy.sh`: runs tests, syncs the module, and pushes results
- `scripts/push_results.js`: inserts Jest results into Oracle

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file from the template:

```bash
cp scripts/.env.example scripts/.env
```

3. Edit `scripts/.env` with your Oracle connection details.

## Running Tests

```bash
npm test
```

To generate JSON test output:

```bash
npm run test:json
```

## Deploying

From the project root:

```bash
bash scripts/deploy.sh
```

The deploy script supports both:

- direct Oracle connect strings with `DB_CS`
- OCI wallet connections with `DB_WALLET` and `DB_SERVICE`

## Environment Template

The checked-in template is:

- `scripts/.env.example`

Your real credentials should go in:

- `scripts/.env`

`scripts/.env` is ignored by Git.

## Publishing To GitHub

This folder is ready to be turned into a Git repository and pushed to GitHub.

Suggested commands:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
