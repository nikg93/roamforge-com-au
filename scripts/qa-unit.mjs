#!/usr/bin/env bun
// Minimal unit test runner for QA. Kept dependency-free (no vitest/jest)
// so `bun run qa:unit` works in every environment. Each test file exports
// an object of `name: () => void|Promise<void>` and this runner asserts.

import { pathToFileURL } from "node:url";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "tests/unit");

function collect(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...collect(p));
    else if (/\.test\.m?[jt]s$/.test(e)) out.push(p);
  }
  return out;
}

const files = collect(ROOT);
if (files.length === 0) {
  console.log("[qa:unit] no tests found under tests/unit — passing.");
  process.exit(0);
}

let passed = 0;
let failed = 0;
for (const file of files) {
  const mod = await import(pathToFileURL(file).href);
  const suite = mod.default ?? mod;
  for (const [name, fn] of Object.entries(suite)) {
    if (typeof fn !== "function") continue;
    try {
      await fn();
      passed++;
      console.log(`  ok  ${file.replace(process.cwd() + "/", "")} › ${name}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL  ${file.replace(process.cwd() + "/", "")} › ${name}`);
      console.error(err instanceof Error ? err.stack : err);
    }
  }
}
console.log(`\n[qa:unit] ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
