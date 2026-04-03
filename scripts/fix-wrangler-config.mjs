/**
 * Cleans the generated dist/server/wrangler.json after astro build.
 *
 * The @astrojs/cloudflare adapter generates a full wrangler config with many
 * fields that Cloudflare Pages doesn't support. This script strips it down
 * to only the fields Pages accepts.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const configPath = 'dist/server/wrangler.json';
if (!existsSync(configPath)) {
  console.log('[fix-config] No generated wrangler.json found, skipping');
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));

// Keep only fields that Cloudflare Pages accepts
const clean = {
  name: config.name,
  main: config.main,
  compatibility_date: config.compatibility_date,
  compatibility_flags: config.compatibility_flags,
  no_bundle: config.no_bundle,
  assets: config.assets,
  ...(config.vars && Object.keys(config.vars).length > 0 && { vars: config.vars }),
  ...(config.images?.binding && { images: config.images }),
};

// Point back to the user config
if (config.configPath) clean.configPath = config.configPath;
if (config.userConfigPath) clean.userConfigPath = config.userConfigPath;

writeFileSync(configPath, JSON.stringify(clean, null, 2));
console.log('[fix-config] Cleaned dist/server/wrangler.json for Pages');
