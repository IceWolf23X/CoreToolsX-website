/** Build a small public Pages artifact. Never copy the repository or private checkout wholesale. */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildDocsBundle } from './build-docs-bundle.mjs';
export const STATIC_ENTRIES = ['index.html', 'reference.html', 'assets', 'synced-configs'];
export const OPTIONAL_ROOT_FILES = ["features.html", "installation.html", "configuration.html", "docs.html", "faq.html", "support-policy.html", "pack-authoring.html", "CNAME", "robots.txt", "sitemap.xml"];

/** Reject private material and symbolic links before preparing a public artifact. */
async function verifyTree(file) {
  const stat = await fs.lstat(file);
  if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${file}`);
  const name = path.basename(file);
  if (name.startsWith('.env') || ['.git', '.sync', 'node_modules'].includes(name) || /\.(?:pem|key|pfx|p12)$/i.test(name)) {
    throw new Error(`Forbidden private file/directory in public assets: ${file}`);
  }
  if (stat.isDirectory()) for (const entry of await fs.readdir(file)) await verifyTree(path.join(file, entry));
  else if (!stat.isFile()) throw new Error(`Unsupported public file type: ${file}`);
}

/** Package public assets after verifying any authored documentation matches its offline snapshot. */
export async function preparePages(root) {
  root = path.resolve(root);
  // Include only named compatibility and hosting files when this checkout provides them.
  const publicEntries = [...STATIC_ENTRIES, ...OPTIONAL_ROOT_FILES.filter(file => existsSync(path.join(root, file)))];
  // Validate before touching the existing output. This also prevents symlink traversal.
  for (const entry of publicEntries) await verifyTree(path.join(root, entry));
  if (existsSync(path.join(root, 'assets/js/data/docs-content.js'))) await buildDocsBundle(root, { check: true });
  const output = path.join(root, '_site');
  const staging = path.join(root, '_site.tmp');
  for (const dir of [output, staging]) {
    const stat = await fs.lstat(dir).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
    if (stat?.isSymbolicLink()) throw new Error(`Refusing symbolic link output: ${dir}`);
  }
  await fs.rm(staging, { recursive: true, force: true });
  await fs.mkdir(staging);
  for (const entry of publicEntries) await fs.cp(path.join(root, entry), path.join(staging, entry), { recursive: true, dereference: false });
  await fs.writeFile(path.join(staging, '.nojekyll'), '');
  // Environment metadata is for build provenance only; it contains no credentials.
  await fs.writeFile(path.join(staging, 'build-info.json'), JSON.stringify({
    repository: process.env.GITHUB_REPOSITORY || null,
    commit: process.env.SITE_BUILD_COMMIT || process.env.GITHUB_SHA || null
  }, null, 2) + '\n');
  await fs.rm(output, { recursive: true, force: true });
  await fs.rename(staging, output);
  return output;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { console.log('Pages artifact prepared: ' + await preparePages(process.argv[2] || '.')); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
