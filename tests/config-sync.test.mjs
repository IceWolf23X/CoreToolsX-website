import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { syncDefaults } from '../tools/sync-plugin-configs.mjs';

/** Create isolated source and destination roots for synchronization boundary tests. */
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'corex-sync-'));
  // Remove only this isolated temporary fixture.
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const plugin = path.join(root, 'plugin'), site = path.join(root, 'website');
  await fs.mkdir(path.join(plugin, 'src/main/resources'), { recursive: true });
  await fs.mkdir(site);
  await fs.writeFile(path.join(plugin, 'src/main/resources/config.yml'), 'debug: false\r\n');
  const entry = { source: 'src/main/resources/config.yml', target: 'synced-configs/paper/config.yml' };
  return { plugin, site, entry };
}

// Windows and CI must produce the same public text and a second run must be stable.
test('sync normalizes text, records provenance and is idempotent', async t => {
  const { plugin, site, entry } = await fixture(t);
  assert.equal(syncDefaults(plugin, site, [entry], { sourceCommit: 'abc123' }), 2);
  assert.equal(await fs.readFile(path.join(site, entry.target), 'utf8'), 'debug: false\n');
  const state = JSON.parse(await fs.readFile(path.join(site, 'synced-configs/.sync-state.json'), 'utf8'));
  assert.equal(state.sourceCommit, 'abc123');
  assert.equal(state.textNormalization, 'LF');
  assert.equal(syncDefaults(plugin, site, [entry], { sourceCommit: 'abc123' }), 0);
});

// A bad entry must fail before even the first valid file is copied.
test('sync preflight rejects missing files without partial updates', async t => {
  const { plugin, site, entry } = await fixture(t);
  assert.throws(() => syncDefaults(plugin, site, [entry, { source: 'src/main/resources/missing.yml', target: 'synced-configs/paper/missing.yml' }]), /missing/);
  await assert.rejects(fs.access(path.join(site, 'synced-configs')));
});

// Descriptors, source code and escaping paths must never become public configuration.
test('sync refuses private files, descriptors and path traversal', async t => {
  const { plugin, site, entry } = await fixture(t);
  for (const source of ['../config.yml', 'src/main/java/Secret.java', 'src/main/resources/plugin.yml', 'src/main/resources/../../../../private.yml']) {
    assert.throws(() => syncDefaults(plugin, site, [{ ...entry, source }]), /public|escapes|Invalid/);
  }
  assert.throws(() => syncDefaults(plugin, site, [{ ...entry, target: 'synced-configs/paper/../../../private.yml' }]), /escapes|Invalid/);
  assert.throws(() => syncDefaults(plugin, site, [entry, entry]), /Duplicate/);
});

// Broken links must not bypass the path boundary merely because their destination is absent.
test('sync refuses a broken destination directory link before writing snapshots', async t => {
  const { plugin, site, entry } = await fixture(t);
  const missing = path.join(path.dirname(site), 'missing-private-directory');
  try { await fs.symlink(missing, path.join(site, 'synced-configs'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) { t.skip('Windows account cannot create a directory link; checked by Linux CI.'); return; }
    throw error;
  }
  assert.throws(() => syncDefaults(plugin, site, [entry]), /symbolic link/i);
  await assert.rejects(fs.access(missing));
});
