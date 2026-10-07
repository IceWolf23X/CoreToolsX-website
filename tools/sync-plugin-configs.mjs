/** Synchronize only declared, public YAML defaults; never publish a private checkout wholesale. */
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CONFIG_FILES, SOURCE_REPOSITORY, SOURCE_REF } from './config-sync-map.mjs';

/** Resolve a declared file within its root and reject symbolic-link traversal. */
export function confinedPath(root, name) {
  root = realpathSync(root);
  if (typeof name !== 'string' || isAbsolute(name) || name.includes('\\') || name.split('/').includes('..')) throw new Error(`Invalid relative path: ${name}`);
  const destination = resolve(root, name);
  const rel = relative(root, destination);
  if (!rel || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) throw new Error(`Path escapes root: ${name}`);
  let current = root;
  for (const segment of rel.split(sep)) {
    current = resolve(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error(`Refusing symbolic link: ${name}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return destination;
}

/** Preflight every source before updating LF-normalized snapshots and their source provenance. */
export function syncDefaults(pluginRoot, siteRoot, entries = CONFIG_FILES, provenance = {}) {
  if (!existsSync(pluginRoot)) throw new Error(`Plugin checkout not found: ${pluginRoot}`);
  const seen = new Set();
  // Validate every declared source/target before reading or changing public snapshots.
  const pending = entries.map(item => {
    if (!/^src\/main\/resources\/.+\.ya?ml$/.test(item.source || '') || /(?:^|\/)plugin\.yml$/i.test(item.source)) throw new Error(`Not a public resource default: ${item.source}`);
    if (!/^synced-configs\/paper\/.+\.ya?ml$/.test(item.target || '')) throw new Error(`Invalid snapshot target: ${item.target}`);
    if (seen.has(item.target)) throw new Error(`Duplicate snapshot target: ${item.target}`);
    seen.add(item.target);
    const from = confinedPath(pluginRoot, item.source);
    const to = confinedPath(siteRoot, item.target);
    if (!existsSync(from) || !lstatSync(from).isFile()) throw new Error(`Required default is missing: ${item.source}`);
    return { to, content: readFileSync(from, 'utf8').replace(/\r\n?/g, '\n') };
  });
  const statePath = confinedPath(siteRoot, 'synced-configs/.sync-state.json');
  const state = JSON.stringify({ schemaVersion: 1, sourceRepository: SOURCE_REPOSITORY, sourceRef: SOURCE_REF, sourceCommit: provenance.sourceCommit || null, textNormalization: 'LF' }, null, 2) + '\n';
  let changed = 0;
  for (const file of [...pending, { to: statePath, content: state }]) {
    if (existsSync(file.to) && readFileSync(file.to, 'utf8') === file.content) continue;
    mkdirSync(dirname(file.to), { recursive: true });
    writeFileSync(file.to, file.content, 'utf8');
    changed++;
  }
  return changed;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const pluginRoot = resolve(process.argv[2] || 'plugin-source');
    const siteRoot = process.argv[3] ? resolve(process.argv[3]) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
    // Exact-path exception supports mapped Windows checkouts without changing global Git settings.
    const sourceCommit = execFileSync('git', ['-c', `safe.directory=${pluginRoot.replace(/\\/g, '/')}`, '-C', pluginRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['-c', `safe.directory=${pluginRoot.replace(/\\/g, '/')}`, '-C', pluginRoot, 'status', '--porcelain', '--', ...CONFIG_FILES.map(item => item.source)], { encoding: 'utf8' }).trim();
    if (dirty) throw new Error('Commit the source-default changes before recording their provenance.');
    console.log(`Updated ${syncDefaults(pluginRoot, siteRoot, CONFIG_FILES, { sourceCommit })} snapshot/provenance file(s).`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
