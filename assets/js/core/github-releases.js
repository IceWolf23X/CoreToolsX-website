/* Public GitHub Releases source. No token, JSONP, private repo access or binary fetch. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./releases-core.js'));
  else root.COREX_GITHUB_RELEASES = factory(root.COREX_RELEASES_CORE);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  var DEFAULT_NAMES = {paper:['papermc.jar','paper.jar','*-paper-*.jar','*-paper.jar'], velocity:['velocity.jar','*-velocity-*.jar','*-velocity.jar']};
  function repository(config) {
    if (!config || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(config.owner || '') || !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(config.repository || '')) throw new Error('Invalid GitHub release repository.');
    return config.owner + '/' + config.repository;
  }
  function repoURL(config) { return 'https://github.com/' + repository(config) + '/releases'; }
  function number(value, fallback, min, max) {return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;}
  function safeGithubURL(value, config, kind) {
    try {
      var url = new URL(value), prefix = '/' + repository(config).toLowerCase() + '/releases/' + kind + '/';
      if (url.protocol !== 'https:' || url.host !== 'github.com' || url.username || url.password || !url.pathname.toLowerCase().startsWith(prefix)) return '';
      return url.href;
    } catch (_) {return '';}
  }
  function glob(pattern, name) {
    if (typeof pattern !== 'string' || pattern.length > 200) return false;
    var source = pattern.split('*').map(function (p) {return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');}).join('.*');
    return new RegExp('^' + source + '$', 'i').test(name);
  }
  function selectAsset(assets, platform, config, warnings, tag) {
    var names = config.assetNames && config.assetNames[platform] || DEFAULT_NAMES[platform];
    var valid = assets.filter(function (a) {
      return a && a.state === 'uploaded' && typeof a.name === 'string' && /\.jar$/i.test(a.name) && !/(?:-sources|-javadoc)\.jar$|^original-/i.test(a.name) && Number.isFinite(a.size) && a.size > 0 && safeGithubURL(a.browser_download_url, config, 'download');
    });
    for (var pattern of names) {
      var matches = valid.filter(function (a) {return glob(pattern, a.name);});
      if (matches.length > 1) {warnings.push(tag + ': ambiguous ' + platform + ' assets (' + pattern + ').'); return {exists:false};}
      if (matches.length === 1) {
        var a = matches[0], hash = typeof a.digest === 'string' && a.digest.match(/^sha256:([a-f0-9]{64})$/i);
        return {exists:true, path:safeGithubURL(a.browser_download_url, config, 'download'), downloadName:a.name, size:a.size, sha256:hash ? hash[1].toLowerCase() : '', downloads:number(a.download_count, 0, 0, Number.MAX_SAFE_INTEGER)};
      }
    }
    return {exists:false};
  }
  function publicRecord(r) {return r && r.draft === false && typeof r.tag_name === 'string' && r.tag_name.length > 0 && r.tag_name.length <= 200 && !/[\u0000-\u001f\u007f]/.test(r.tag_name) && typeof r.published_at === 'string' && Number.isFinite(Date.parse(r.published_at)) && Array.isArray(r.assets);}
  function normalizeReleases(records, config) {
    repository(config);
    var releases = [], warnings = [], seen = new Set();
    (Array.isArray(records) ? records : []).forEach(function (r) {
      if (!publicRecord(r) || seen.has(r.tag_name)) return;
      seen.add(r.tag_name);
      var paper = selectAsset(r.assets, 'paper', config, warnings, r.tag_name), velocity = selectAsset(r.assets, 'velocity', config, warnings, r.tag_name);
      if (!paper.exists && !velocity.exists) return;
      var md = typeof r.body === 'string' ? r.body : '';
      releases.push({version:r.tag_name, title:r.name || r.tag_name, channel:core.classifyVersion(r.tag_name, r.prerelease),
        publishedAt:r.published_at, url:safeGithubURL(r.html_url, config, 'tag') || repoURL(config) + '/tag/' + encodeURIComponent(r.tag_name),
        paper:paper, velocity:velocity, changelogMarkdown:md, changelogHtml:core.renderMarkdownSafe(md)});
    });
    releases.sort(function (a,b) {return core.compareVersions(a.version, b.version) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt);});
    return {releases:releases, warnings:warnings};
  }
  function makeSnapshot(records, config, generatedAt) {
    // Store raw public fields, not generated HTML; every view re-renders Markdown safely.
    var releases = records.filter(publicRecord).map(function (r) {
      return {tag_name:r.tag_name,name:typeof r.name === 'string' ? r.name : '',body:typeof r.body === 'string' ? r.body : '',
        html_url:r.html_url,draft:false,prerelease:!!r.prerelease,published_at:r.published_at,
        assets:r.assets.filter(function (a) {return a && a.state === 'uploaded' && /\.jar$/i.test(a.name || '') && safeGithubURL(a.browser_download_url, config, 'download');}).map(function (a) {
          return {name:a.name,state:a.state,size:a.size,digest:typeof a.digest === 'string' ? a.digest : null,browser_download_url:a.browser_download_url,download_count:a.download_count || 0};
        })};
    });
    return {schemaVersion:2,provider:'github',repository:repository(config),generatedAt:generatedAt || null,releases:releases};
  }
  function error(kind, message, retryAt) {var e = new Error(message); e.kind = kind; e.retryAt = retryAt || 0; return e;}
  function readNext(link, expectedPath, seen) {
    var m = String(link || '').match(/<([^>]+)>\s*;\s*rel="next"/i); if (!m) return '';
    var u; try {u = new URL(m[1]);} catch (_) {throw error('response', 'Invalid GitHub pagination URL.');}
    if (u.origin !== 'https://api.github.com' || u.pathname !== expectedPath || u.username || u.password || u.hash || seen.has(u.href)) throw error('response', 'Unsafe or repeated GitHub pagination URL.');
    return u.href;
  }
  async function fetchAll(config, fetcher, clock) {
    var path = '/repos/' + repository(config) + '/releases';
    var url = 'https://api.github.com' + path + '?per_page=100&page=1', records = [], seen = new Set();
    var limit = Math.floor(number(config.maxPages, 10, 1, 100)), now = clock || Date.now;
    for (var page = 0; url; page++) {
      if (page >= limit) throw error('pagination', 'GitHub pagination exceeds maxPages; no partial catalog was saved.');
      seen.add(url);
      var controller = new AbortController(), timer = setTimeout(function () {controller.abort();}, number(config.requestTimeoutMs, 10000, 50, 60000));
      try {
        var response = await fetcher(url, {method:'GET', headers:{Accept:'application/vnd.github+json'}, credentials:'omit', cache:'no-store', signal:controller.signal});
        if (!response.ok) {
          var rate = response.status === 429 || response.status === 403;
          var reset = Number(response.headers.get('x-ratelimit-reset') || 0) * 1000;
          var after = response.headers.get('retry-after'), retry = after ? (/^\d+$/.test(after) ? now() + Number(after) * 1000 : Date.parse(after)) : 0;
          throw error(rate ? 'rateLimit' : response.status === 404 ? 'notFound' : 'http', 'GitHub API returned HTTP ' + response.status + '.', rate ? Math.max(now() + 60000, reset || 0, retry || 0) : 0);
        }
        var batch = await response.json();
        if (!Array.isArray(batch)) throw error('response', 'Unexpected GitHub API response: expected an array.');
        records = records.concat(batch);
        url = readNext(response.headers.get('link'), path, seen);
      } catch (e) {
        if (e.kind) throw e;
        throw error(e.name === 'AbortError' ? 'timeout' : 'network', e.name === 'AbortError' ? 'GitHub request timed out.' : 'GitHub request failed.');
      } finally {clearTimeout(timer);}
    }
    return records;
  }
  function createClient(config, options) {
    options = options || {};
    var repo = repository(config), now = options.now || Date.now, storage = options.storage, fetcher = options.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    var key = 'corex.github-releases.v2:' + repo.toLowerCase();
    var snapshot = options.snapshot, raw = [], fetchedAt = 0, hasCache = false, pending = null, listeners = [];
    var state = {source:'snapshot', status:'idle', releases:[], warnings:[], updatedAt:null, error:null, retryAt:0};
    function valid(value) {return value && value.schemaVersion === 2 && value.provider === 'github' && String(value.repository).toLowerCase() === repo.toLowerCase() && Array.isArray(value.releases);}
    function setRecords(records) {var result = normalizeReleases(records, config); raw = records; state.releases = result.releases; state.warnings = result.warnings;}
    if (valid(snapshot)) {setRecords(snapshot.releases); state.updatedAt = snapshot.generatedAt;}
    try {
      var cached = JSON.parse(storage && storage.getItem(key) || 'null');
      if (valid(cached) && Number.isFinite(cached.fetchedAt) && cached.fetchedAt <= now() && cached.fetchedAt >= (Date.parse(state.updatedAt) || 0)) {
        setRecords(cached.releases); fetchedAt = cached.fetchedAt; hasCache = true; state.updatedAt = new Date(fetchedAt).toISOString(); state.source = 'cache';
      }
      if (valid(cached) && Number.isFinite(cached.retryAt) && cached.retryAt > now()) {
        state.retryAt = cached.retryAt; state.status = 'error';
        state.error = {kind:cached.error && cached.error.kind || 'network', message:'GitHub refresh is temporarily unavailable.'};
      }
    } catch (_) { /* Storage is optional, including in file:// and privacy modes. */ }
    function notify() {listeners.forEach(function (fn) {fn(state);});}
    function persist() {
      try {if (storage) storage.setItem(key, JSON.stringify(Object.assign(makeSnapshot(raw, config, state.updatedAt), {fetchedAt:hasCache ? fetchedAt : null, retryAt:state.retryAt,error:state.error})));} catch (_) { /* Keep the in-memory catalog if storage is blocked/full. */ }
    }
    function load(opts) {
      opts = opts || {};
      if (pending) return pending;
      if (state.retryAt > now()) return Promise.resolve(state);
      if (!opts.force && hasCache && now() - fetchedAt < number(config.cacheMinutes, 15, 0, 1440) * 60000) {state.status = 'ready'; return Promise.resolve(state);}
      state.status = 'loading'; state.error = null; notify();
      // Start synchronously so concurrent calls share the same fetch chain.
      pending = (fetcher ? fetchAll(config, fetcher, now) : Promise.reject(error('network', 'Fetch is unavailable.')))
        .then(function (records) {
          var clean = makeSnapshot(records, config, new Date(now()).toISOString());
          setRecords(clean.releases); fetchedAt = now(); hasCache = true;
          state.source = 'live'; state.status = 'ready'; state.updatedAt = new Date(fetchedAt).toISOString(); state.error = null; state.retryAt = 0;
          persist();
        }).catch(function (e) {
          state.status = 'error'; state.error = {kind:e.kind || 'network', message:e.message}; state.retryAt = e.retryAt || now() + 60000; persist();
        }).then(function () {pending = null; notify(); return state;});
      return pending;
    }
    return {load:load,getState:function () {return state;},subscribe:function (fn) {listeners.push(fn); return function () {listeners = listeners.filter(function (x) {return x !== fn;});};}};
  }
  return {repository:repository, repoURL:repoURL, normalizeReleases:normalizeReleases, makeSnapshot:makeSnapshot, fetchAll:fetchAll, createClient:createClient};
}));
