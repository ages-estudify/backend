#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_REF = process.env.BASE_REF ?? 'origin/main';
const WAIVER_FILE = '.github/test-waivers.txt';

const SOURCE_PATTERNS = [
  /^src\/.+\.service\.ts$/,
  /^src\/.+\/utils\/.+\.ts$/,
  /^src\/.+\/mapper\/.+\.ts$/,
];

const IGNORE_PATTERNS = [/\.spec\.ts$/, /\.e2e-spec\.ts$/, /\.dto\.ts$/];

function loadWaivers() {
  if (!existsSync(WAIVER_FILE)) {
    return new Set();
  }

  return new Set(
    readFileSync(WAIVER_FILE, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  );
}

function getChangedFiles() {
  try {
    execSync(`git fetch origin main --depth=1`, { stdio: 'ignore' });
  } catch {
    // Best effort when offline or in shallow clones.
  }

  let diffRange = `${BASE_REF}...HEAD`;
  try {
    execSync(`git rev-parse --verify ${BASE_REF}`, { stdio: 'ignore' });
  } catch {
    diffRange = 'HEAD~1...HEAD';
  }

  const output = execSync(`git diff --name-only --diff-filter=ACMRT ${diffRange}`, {
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function requiresTest(file) {
  if (IGNORE_PATTERNS.some((pattern) => pattern.test(file))) {
    return false;
  }

  return SOURCE_PATTERNS.some((pattern) => pattern.test(file));
}

function getExpectedTestFiles(file) {
  const ext = path.extname(file);
  const base = file.slice(0, -ext.length);

  return [`${base}.spec${ext}`];
}

function main() {
  const waivers = loadWaivers();
  const prBody = process.env.PR_BODY ?? '';
  const changedFiles = getChangedFiles();
  const missingTests = [];

  for (const file of changedFiles) {
    if (!requiresTest(file) || waivers.has(file)) {
      continue;
    }

    if (prBody.includes(`[test-waiver:${file}]`)) {
      continue;
    }

    const expectedTests = getExpectedTestFiles(file);
    const hasTest = expectedTests.some((testFile) => existsSync(testFile));

    if (!hasTest) {
      missingTests.push({ file, expectedTests });
    }
  }

  if (missingTests.length === 0) {
    console.log('✅ All changed source files include co-located tests.');
    return;
  }

  console.error('❌ Missing co-located tests for changed source files:\n');
  for (const { file, expectedTests } of missingTests) {
    console.error(`  - ${file}`);
    console.error(`    expected: ${expectedTests.join(' or ')}`);
  }

  console.error(
    '\nAdd a co-located spec file or register an approved waiver in .github/test-waivers.txt',
  );
  console.error('You can also add [test-waiver:path/to/file.ts] to the PR description.');
  process.exit(1);
}

main();
