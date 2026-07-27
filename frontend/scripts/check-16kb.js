#!/usr/bin/env node
/**
 * Checks whether every 64-bit native library inside an AAB/APK is aligned for
 * 16 KB memory pages (Google Play requirement).
 *
 * Usage: node scripts/check-16kb.js [path-to-aab-or-apk]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REQUIRED_ALIGNMENT = 16384;
const PT_LOAD = 1;

const archive =
  process.argv[2] ||
  path.join(
    __dirname,
    '..',
    'android',
    'app',
    'build',
    'outputs',
    'bundle',
    'release',
    'app-release.aab',
  );

if (!fs.existsSync(archive)) {
  console.error(`Archive not found: ${archive}`);
  process.exit(1);
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'align16kb-'));

function extract() {
  // Expand-Archive only accepts .zip, so stage a copy with that extension.
  const staged = path.join(workDir, '__archive.zip');
  fs.copyFileSync(archive, staged);
  const target = path.join(workDir, 'unpacked');

  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath '${staged}' -DestinationPath '${target}' -Force`,
    ],
    { stdio: 'inherit' },
  );

  fs.rmSync(staged, { force: true });
  return target;
}

function collectSharedObjects(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSharedObjects(full, found);
    else if (entry.name.endsWith('.so')) found.push(full);
  }
  return found;
}

/** Returns the max PT_LOAD alignment for 64-bit ELF files, or null otherwise. */
function maxLoadAlignment(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 64 || buf.readUInt32BE(0) !== 0x7f454c46) return null;
  if (buf[4] !== 2) return null; // only 64-bit matters for this requirement

  const phOff = Number(buf.readBigUInt64LE(0x20));
  const phEntSize = buf.readUInt16LE(0x36);
  const phNum = buf.readUInt16LE(0x38);

  let maxAlign = 0;
  for (let i = 0; i < phNum; i += 1) {
    const off = phOff + i * phEntSize;
    if (off + 0x38 > buf.length) break;
    if (buf.readUInt32LE(off) !== PT_LOAD) continue;
    const align = Number(buf.readBigUInt64LE(off + 0x30));
    if (align > maxAlign) maxAlign = align;
  }
  return maxAlign;
}

try {
  const root = extract();

  const misaligned = [];
  const aligned = [];

  for (const so of collectSharedObjects(root)) {
    const rel = path.relative(root, so).split(path.sep).join('/');
    if (!rel.includes('arm64-v8a') && !rel.includes('x86_64')) continue;

    const align = maxLoadAlignment(so);
    if (align === null) continue;

    (align >= REQUIRED_ALIGNMENT ? aligned : misaligned).push({ rel, align });
  }

  console.log(`Archive: ${archive}\n`);
  console.log(`NOT 16 KB aligned: ${misaligned.length}`);
  for (const { rel, align } of misaligned) console.log(`  ${align.toString().padStart(6)}  ${rel}`);

  console.log(`\n16 KB aligned: ${aligned.length}`);
  for (const { rel, align } of aligned) console.log(`  ${align.toString().padStart(6)}  ${rel}`);

  process.exit(misaligned.length ? 1 : 0);
} finally {
  fs.rmSync(workDir, { recursive: true, force: true });
}
