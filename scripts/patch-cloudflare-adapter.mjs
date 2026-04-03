/**
 * Patches @astrojs/cloudflare to not add the "ASSETS" binding.
 * wrangler 4.80+ reserves "ASSETS" for Pages projects, but the adapter
 * still adds it by default, causing build failures.
 *
 * This can be removed once @astrojs/cloudflare fixes the issue upstream.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'node_modules/@astrojs/cloudflare/dist/wrangler.js';
const src = readFileSync(file, 'utf8');

const patched = src.replace(
  /assets:\s*hasAssetsBinding\s*\?\s*void 0\s*:\s*\{[\s\S]*?binding:\s*DEFAULT_ASSETS_BINDING_NAME[\s\S]*?\}/,
  'assets: void 0',
);

if (patched === src) {
  console.log('[patch] wrangler.js already patched or pattern not found');
} else {
  writeFileSync(file, patched);
  console.log('[patch] Removed ASSETS binding from @astrojs/cloudflare');
}
