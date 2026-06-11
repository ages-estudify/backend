#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';

const SUMMARY_PATH = 'coverage/coverage-summary.json';
const THRESHOLD = 80;

function main() {
  if (!existsSync(SUMMARY_PATH)) {
    console.error(`❌ Coverage summary not found at ${SUMMARY_PATH}`);
    process.exit(1);
  }

  const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  const total = summary.total;

  console.log('Coverage summary (backend):');
  console.log(
    `  lines: ${total.lines.pct}% | statements: ${total.statements.pct}% | branches: ${total.branches.pct}% | functions: ${total.functions.pct}%`,
  );

  const metrics = ['lines', 'statements', 'branches', 'functions'];
  const belowThreshold = metrics.filter((metric) => total[metric].pct < THRESHOLD);

  if (belowThreshold.length > 0) {
    console.error(
      `❌ Coverage below ${THRESHOLD}% for: ${belowThreshold.join(', ')}`,
    );
    process.exit(1);
  }

  console.log(`✅ All coverage metrics meet the ${THRESHOLD}% threshold.`);
}

main();
