/** Exercise the real offline website, including all product articles and configuration mounts. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { expect } = require('playwright/test');

/** Verify logo, navigation, docs/config rendering, search, responsive layouts and independent reference. */
async function run() {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const captures = process.argv[3] ? path.resolve(process.argv[3]) : null;
  const index = pathToFileURL(path.join(root, 'index.html')).href;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', offline: true });
    const errors = [], external = [];
    // Documentation must render without any external request.
    await context.route(/^https?:\/\//, route => { external.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    // Collect uncaught runtime failures throughout both entrypoints.
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(index);
    await expect(page.locator('#landing-view')).toBeVisible();
    const data = await page.evaluate(() => ({ product: window.COREX_SITE.brand.product, logo: window.COREX_SITE.brand.logo, official: window.COREX_SITE.links.official, count: window.COREX_DOCS.meta.articleCount, configCount: Object.keys(window.COREX_CONFIG_FILES.files).length, articles: window.COREX_DOCS.articles.map(a => ({ id: a.id, title: a.title, config: !!a.configFile })), starts: window.COREX_DOCS.hubs.instructionStarts || [] }));
    assert.ok((await page.title()).includes(data.product));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), data.official.replace(/\/?$/, '/'));
    await expect(page.locator('.preview-shell img.actual-screenshot')).toHaveCount(1);
    const logo = page.locator('.preview-shell img.actual-screenshot');
    await expect(logo).toBeVisible();
    assert.ok(await logo.evaluate(img => img.complete && img.naturalWidth > 0 && getComputedStyle(img).objectFit === 'contain'));
    assert.ok((await logo.getAttribute('src')).endsWith(data.logo));
    await expect(page.locator('.gallery-controls')).toHaveCount(0);
    assert.equal(data.articles.length, data.count);
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    if (captures) { await fs.mkdir(captures, { recursive: true }); await page.screenshot({ path: path.join(captures, data.product + '-desktop.png'), fullPage: false }); }

    /** Route through the actual app and wait for the selected article title. */
    async function navigate(id, title) {
      await page.evaluate(route => window.CCX.navigate(route), '#/docs/' + id);
      if (title) await expect(page.locator('#article-title')).toHaveText(title);
    }
    let configPages = 0;
    for (const article of data.articles) {
      await navigate(article.id, article.title);
      assert.ok(await page.evaluate(id => {
        const source = window.COREX_DOCS.articles.find(a => a.id === id);
        const original = new DOMParser().parseFromString(source.bodyHtml, 'text/html');
        return Array.from(original.querySelectorAll('h2[id],h3[id]'), h => h.id).every(id => document.getElementById('article-body').querySelector('[id="' + CSS.escape(id) + '"]'));
      }, article.id), article.id + ': lost heading');
      if (article.config) {
        configPages++;
        await expect(page.locator('#article-body .config-synced-file')).toHaveCount(1);
        assert.ok((await page.locator('#article-body .config-synced-file code').textContent()).length > 0);
      }
    }
    assert.equal(configPages, data.configCount);
    await navigate('overview');
    await expect(page.locator('#article-body .doc-card').first()).toBeVisible();
    await navigate('instructions');
    const starts = await page.locator('.start-card').first().getAttribute('href');
    assert.ok(starts.startsWith('#/docs/'));
    assert.ok(data.articles.some(a => '#/docs/' + a.id === starts));
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-dialog')).toBeVisible();
    assert.ok(await page.locator('.search-result').count() > 0);
    const configArticle = data.articles.find(a => a.config);
    await page.locator('#search-input').fill(configArticle.title);
    await expect(page.locator('.search-result').first()).toBeVisible();
    assert.ok((await page.locator('.search-result').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))).some(href => href.includes(configArticle.id)));
    await page.keyboard.press('Escape');
    for (const width of [390, 1440, 3440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.CCX.navigate('#/'));
      await expect(page.locator('#landing-view')).toBeVisible();
      if (width === 390) {
        await page.locator('[data-menu-toggle]').click();
        await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#header-nav')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-expanded', 'false');
      }
      // Wait for responsive layout before measuring the actual page geometry.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), width + ': landing overflow');
      if (width === 390 && captures) await page.screenshot({ path: path.join(captures, data.product + '-mobile.png'), fullPage: false });
      for (const id of ['overview', 'instructions', configArticle.id, ...data.starts]) {
        await navigate(id);
        // CSS layout settles on the next animation frames after route/viewport changes.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), width + ': ' + id + ' overflow');
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await navigate(configArticle.id);
    if (captures) await page.screenshot({ path: path.join(captures, data.product + '-config.png'), fullPage: true });
    await page.goto(pathToFileURL(path.join(root, 'reference.html')).href);
    await expect(page.locator('.reference-article')).toHaveCount(data.count);
    await expect(page.locator('.config-synced-file')).toHaveCount(data.configCount);
    assert.deepEqual(await page.locator('.reference-article').evaluateAll(nodes => nodes.map(n => n.dataset.articleId)), data.articles.map(a => a.id));
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(JSON.stringify({ status: 'PASS', product: data.product, articles: data.count, configPages, javascriptErrors: errors.length, externalRequests: external.length, widths: [390, 1440, 3440] }));
  } finally { await browser.close(); }
}

// Surface browser/contract failures to the caller without hiding the failed assertion.
run().catch(error => { console.error(error); process.exitCode = 1; });
