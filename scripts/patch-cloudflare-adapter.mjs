/**
 * Patches @astrojs/cloudflare adapter to fix wrangler 4.80+ compatibility.
 *
 * Problem: The adapter generates a wrangler.json with fields that
 * Cloudflare Pages rejects:
 *   - "ASSETS" binding (reserved name in Pages)
 *   - triggers: {} (expects {crons:[...]})
 *   - kv_namespaces without "id" field
 *   - dozens of unknown fields
 *
 * This script patches the adapter source so the generated config is clean.
 * Run via postinstall. Remove when @astrojs/cloudflare fixes upstream.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'node_modules/@astrojs/cloudflare/dist/wrangler.js';
let src;
try {
  src = readFileSync(file, 'utf8');
} catch {
  console.log('[patch] Adapter file not found, skipping');
  process.exit(0);
}

// 1. Remove default ASSETS binding (reserved in Pages)
let patched = src.replace(
  /assets:\s*hasAssetsBinding\s*\?\s*void 0\s*:\s*\{[\s\S]*?binding:\s*DEFAULT_ASSETS_BINDING_NAME[\s\S]*?\}/,
  'assets: void 0',
);

// 2. Remove default SESSION KV binding (missing required "id" field)
patched = patched.replace(
  /kv_namespaces:\s*!needsSessionKVBinding\s*\|\|\s*hasSessionBinding\s*\?\s*void 0\s*:\s*\[[\s\S]*?\]/,
  'kv_namespaces: void 0',
);

if (patched === src) {
  console.log('[patch] Already patched or pattern not found');
} else {
  writeFileSync(file, patched);
  console.log('[patch] Patched @astrojs/cloudflare for Pages compatibility');
}
