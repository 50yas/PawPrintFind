#!/usr/bin/env node
/**
 * bump-version.js  (ESM)
 *
 * Auto-generates version.json from live git state before every build.
 * Runs automatically via `prebuild` in package.json.
 *
 * Output fields:
 *   version         — from package.json
 *   buildNumber     — total git commit count (grows monotonically)
 *   buildTimestamp  — ISO timestamp of this build
 *   commitHash      — short SHA of HEAD (7 chars)
 *   commitHashFull  — full SHA of HEAD
 *   commitMessage   — subject line of HEAD commit
 *   commitDate      — author date of HEAD commit (YYYY-MM-DD)
 *   branch          — current git branch name
 *   isProduction    — true when NODE_ENV=production
 *   environment     — "production" | "development"
 *   appName         — from package.json
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: rootDir,
    }).trim();
  } catch {
    return '';
  }
}

const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const environment = isProduction ? 'production' : 'development';

const buildNumber = parseInt(git('rev-list --count HEAD') || '0', 10);
const commitHash = git('rev-parse --short=7 HEAD');
const commitHashFull = git('rev-parse HEAD');
const commitMessage = git('log -1 --format=%s');
const commitDate = git('log -1 --format=%as');   // YYYY-MM-DD
const branch = git('branch --show-current') || git('rev-parse --abbrev-ref HEAD');

const version = {
  version: pkg.version,
  buildNumber,
  buildTimestamp: new Date().toISOString(),
  commitHash,
  commitHashFull,
  commitMessage,
  commitDate,
  branch,
  isProduction,
  environment,
  appName: pkg.name || 'PawPrintFind',
};

writeFileSync(resolve(rootDir, 'version.json'), JSON.stringify(version, null, 2) + '\n');

console.log(
  `\x1b[36m[version]\x1b[0m v${version.version} · build #${buildNumber} · ${commitHash} · ${branch} · ${environment}`
);
