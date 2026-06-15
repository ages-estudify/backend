#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ALLOWED_PATTERNS = [
  /^src\/.+\.spec\.ts$/,
  /^test\/.+\.e2e-spec\.ts$/,
];

const DISALLOWED_PATTERNS = [/^tests\//, /\/tests\//];

function getTestFiles() {
  const patterns = ['**/*.spec.ts', '**/*.e2e-spec.ts'];

  const tracked = execSync(`git ls-files ${patterns.map((p) => `'${p}'`).join(' ')}`, {
    encoding: 'utf8',
  });

  let untracked = '';
  try {
    untracked = execSync(
      `git ls-files --others --exclude-standard ${patterns.map((p) => `'${p}'`).join(' ')}`,
      { encoding: 'utf8' },
    );
  } catch {
    // No untracked test files.
  }

  return [...tracked.split('\n'), ...untracked.split('\n')]
    .map((file) => file.trim())
    .filter((file) => file && existsSync(file));
}

function main() {
  const files = getTestFiles();
  const invalid = files.filter(
    (file) =>
      DISALLOWED_PATTERNS.some((pattern) => pattern.test(file)) ||
      !ALLOWED_PATTERNS.some((pattern) => pattern.test(file)),
  );

  if (invalid.length === 0) {
    console.log('✅ Test files follow the co-located structure.');
    return;
  }

  console.error('❌ Unit tests must live next to source code:\n');
  for (const file of invalid) {
    console.error(`  - ${file}`);
  }

  console.error('\nUse test/ only for e2e setup and integration tests.');
  process.exit(1);
}

main();
