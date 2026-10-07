/* CoreX preview gallery. No dependencies, fetch(), cloned slides or lightbox.
 * The source list lives in COREX_SITE.assets[COREX_LANDING.hero.preview.assetKey].
 * Images are loaded/decoded once; only their presentation state changes afterwards.
 */
(function (root) {
  'use strict';

  function bounded(value, fallback, min, max) {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value)) : fallback;
  }
  function fit(value) { return value === 'cover' ? 'cover' : 'contain'; }
  function normalizeOptions(input) {
    input = input || {};
    return {
      autoplay: input.autoplay !== false,
      intervalMs: bounded(input.intervalMs, 5000, 1000, 600000),
      transitionMs: bounded(input.transitionMs, 240, 0, 1000),
      pauseOnHover: input.pauseOnHover !== false
    };
  }
  function normalizeSlides(input) {
    input = input || {};
    var list = Array.isArray(input.images) && input.images.length ? input.images
      : (input.src ? [{ src: input.src, alt: input.alt, caption: input.caption }] : []);
    var seen = new Set();
    return list.reduce(function (out, item) {
      if (typeof item === 'string') item = { src: item };
      if (!item || typeof item.src !== 'string' || !item.src.trim()) return out;
      var src = item.src.trim(), identity;
      // Never interpret executable URLs or arbitrary data documents as image sources.
      if (/^[a-z][\w+.-]*:/i.test(src) && !/^https?:\/\//i.test(src) &&
          !/^data:image\/(?:png|jpeg|jpg|gif|webp|avif|svg\+xml)[;,]/i.test(src)) return out;
      try {
        var url = new URL(src, 'https://corex.invalid/');
        url.hash = ''; identity = url.href;
      } catch (_) { return out; }
      if (seen.has(identity)) return out;
      seen.add(identity);
      out.push({ src: src, alt: typeof item.alt === 'string' ? item.alt : (input.alt || ''),
        caption: typeof item.caption === 'string' ? item.caption : '',
        objectFit: fit(item.objectFit || input.objectFit) });
      return out;
    }, []);
  }

  function mount(canvas, input, labels) {
    if (!canvas) return null;
    if (canvas._corexGallery) canvas._corexGallery.destroy();
    var doc = canvas.ownerDocument, win = doc.defaultView, shell = canvas.closest('.preview-shell') || canvas;
    var options = normalizeOptions(input), sources = normalizeSlides(input);
    var text = labels || {}, motion = win.matchMedia('(prefers-reduced-motion: reduce)');
    var slides = [], index = 0, timer = null, fadeTimer = null, stage = null, controls = null;
    var counter = null, status = null, toggle = null, dots = [];
    var destroyed = false, active = true, inViewport = true, hovered = false;
    var paused = !options.autoplay, focusStopped = false, toggleIntent = null, pointer = null, suppressClickUntil = 0;
    var listeners = [], loadCancels = [], observer = null;
    var caption = shell.querySelector('[data-preview-caption-text]');
    var originalCaption = caption ? caption.textContent : '';
    var originalLabel = shell.getAttribute('aria-label'), originalRole = shell.getAttribute('role');
    var originalDescription = shell.getAttribute('aria-roledescription');
    function label(key, fallback) { return typeof text[key] === 'string' ? text[key] : fallback; }
    function message(template, values) {
      return template.replace(/\{(\w+)\}/g, function (match, key) { return key in values ? String(values[key]) : match; });
    }
    function listen(el, type, fn, opts) {
      el.addEventListener(type, fn, opts); listeners.push(function () { el.removeEventListener(type, fn, opts); });
    }
    function element(tag, className, value) {
      var el = doc.createElement(tag); el.className = className;
      if (value !== undefined) el.textContent = value;
      return el;
    }
    function button(attribute, title, value) {
      var el = element('button', 'gallery-button', value);
      el.type = 'button'; el.setAttribute(attribute, ''); el.setAttribute('aria-label', title); el.title = title;
      return el;
    }
    function stopTimer() {
      if (timer !== null) win.clearTimeout(timer);
      timer = null; canvas.dataset.galleryPlaying = 'false';
    }
    function canRotate() {
      return !destroyed && slides.length > 1 && !paused && !focusStopped && !motion.matches &&
        active && inViewport && !doc.hidden && !(options.pauseOnHover && hovered);
    }
    function updateToggle() {
      if (!toggle) return;
      var title = paused || focusStopped ? label('play', 'Play slideshow') : label('pause', 'Pause slideshow');
      toggle.textContent = paused || focusStopped ? label('playShort', 'Play') : label('pauseShort', 'Pause');
      toggle.title = title; toggle.setAttribute('aria-label', title); toggle.hidden = motion.matches;
    }
    function schedule() {
      stopTimer(); updateToggle();
      if (!canRotate() || fadeTimer !== null) return;
      canvas.dataset.galleryPlaying = 'true';
      timer = win.setTimeout(function () {
        timer = null;
        if (canRotate()) show(index + 1, false);
        else schedule();
      }, options.intervalMs);
    }
    function finishFade() {
      if (fadeTimer !== null) win.clearTimeout(fadeTimer);
      fadeTimer = null;
      slides.forEach(function (slide) { slide.image.classList.remove('is-entering', 'is-leaving'); });
    }
    function describe(manual) {
      canvas.dataset.galleryIndex = String(index);
      if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
      if (caption) caption.textContent = slides[index].caption || originalCaption;
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', String(i === index));
      });
      if (status && manual) status.textContent = message(label('imageOf', 'Image {index} of {total}'),
        { index: index + 1, total: slides.length }) + (slides[index].alt ? ': ' + slides[index].alt : '');
    }
    function show(target, manual) {
      if (destroyed || slides.length < 2) return;
      target = ((Math.trunc(target) % slides.length) + slides.length) % slides.length;
      if (!Number.isFinite(target)) return;
      stopTimer();
      if (target === index) { schedule(); return; }
      finishFade();
      var previous = slides[index].image;
      // Keep the outgoing decoded image fully opaque underneath the incoming image.
      // This also makes rapid clicks safe: an interrupted fade never reveals the canvas.
      previous.classList.remove('is-active'); previous.classList.add('is-leaving');
      previous.setAttribute('aria-hidden', 'true');
      index = target;
      var incoming = slides[index].image;
      incoming.classList.add('is-active'); incoming.setAttribute('aria-hidden', 'false');
      var duration = motion.matches ? 0 : options.transitionMs;
      if (duration > 0) {
        incoming.classList.add('is-entering');
        fadeTimer = win.setTimeout(function () { finishFade(); schedule(); }, duration + 24);
      } else finishFade();
      describe(manual); schedule();
    }
    function load(source) {
      return new Promise(function (resolve) {
        var image = new win.Image(), settled = false;
        image.alt = source.alt; image.draggable = false;
        image.className = 'actual-screenshot gallery-slide'; image.style.objectFit = source.objectFit;
        image.decoding = 'async';
        var timeout = win.setTimeout(function () { done(false); }, 12000);
        function done(ok) {
          if (settled) return;
          settled = true; win.clearTimeout(timeout); image.onload = null; image.onerror = null;
          resolve(ok ? { src: source.src, alt: source.alt, caption: source.caption, image: image } : null);
        }
        loadCancels.push(function () { done(false); });
        image.onerror = function () { done(false); };
        image.onload = function () {
          if (!image.naturalWidth) { done(false); return; }
          if (typeof image.decode === 'function') image.decode().then(function () { done(true); }, function () { done(false); });
          else done(true);
        };
        image.src = source.src;
      });
    }
    function makeControls() {
      // Loading can finish while the cursor is already inside the original frame.
      hovered = shell.matches(':hover') && win.matchMedia('(hover: hover)').matches;
      controls = element('div', 'gallery-controls');
      controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', label('controls', 'Gallery controls'));
      toggle = button('data-gallery-toggle', label('pause', 'Pause slideshow'), label('pauseShort', 'Pause'));
      toggle.classList.add('gallery-toggle'); controls.appendChild(toggle);
      var previous = button('data-gallery-prev', label('previous', 'Previous image'), '\u2190');
      controls.appendChild(previous);
      var pagination = element('div', 'gallery-pagination');
      slides.forEach(function (_, i) {
        var dot = button('data-gallery-dot', message(label('showImage', 'Show image {index}'), {index:i+1}), '');
        dot.dataset.galleryDot = String(i); dot.className = 'gallery-dot';
        listen(dot, 'click', function () { show(i, true); }); dots.push(dot); pagination.appendChild(dot);
      });
      controls.appendChild(pagination);
      counter = element('span', 'gallery-counter'); counter.setAttribute('aria-hidden', 'true'); controls.appendChild(counter);
      var next = button('data-gallery-next', label('next', 'Next image'), '\u2192'); controls.appendChild(next);
      status = element('span', 'gallery-status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
      controls.appendChild(status); canvas.insertAdjacentElement('afterend', controls);
      listen(previous, 'click', function () { show(index - 1, true); });
      listen(next, 'click', function () { show(index + 1, true); });
      // Preserve the requested pointer action when focus first enters the rotation control.
      listen(toggle, 'pointerdown', function () { toggleIntent = !(paused || focusStopped); });
      listen(toggle, 'pointercancel', function () { toggleIntent = null; });
      listen(toggle, 'click', function () {
        paused = toggleIntent !== null ? toggleIntent : !(paused || focusStopped);
        toggleIntent = null; focusStopped = false; schedule();
      });
      listen(shell, 'focusin', function (event) {
        if (!shell.contains(event.relatedTarget)) { focusStopped = true; schedule(); }
      });
      listen(shell, 'keydown', function (event) {
        var target;
        if (event.key === 'ArrowRight') target = index + 1;
        else if (event.key === 'ArrowLeft') target = index - 1;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = slides.length - 1;
        else return;
        event.preventDefault(); show(target, true);
      });
      stage.classList.add('is-interactive'); stage.title = label('clickHint', 'Click to show the next image');
      listen(stage, 'click', function () {
        if (win.performance.now() < suppressClickUntil) return;
        show(index + 1, true);
      });
      listen(stage, 'pointerdown', function (event) {
        if (event.isPrimary === false || event.button !== 0) return;
        pointer = { id:event.pointerId, x:event.clientX, y:event.clientY };
      });
      listen(stage, 'pointercancel', function () { pointer = null; });
      listen(stage, 'pointerup', function (event) {
        if (!pointer || pointer.id !== event.pointerId) return;
        var dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; pointer = null;
        // Leave vertical gestures to the page and suppress the synthetic click after a swipe.
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          suppressClickUntil = win.performance.now() + 500; show(index + (dx < 0 ? 1 : -1), true);
        } else if (Math.abs(dy) > 20 || Math.abs(dx) > 20) suppressClickUntil = win.performance.now() + 500;
      });
      listen(shell, 'pointerenter', function (event) {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') { hovered = true; schedule(); }
      });
      listen(shell, 'pointerleave', function () { hovered = false; schedule(); });
      listen(doc, 'visibilitychange', function () { if (doc.hidden) finishFade(); schedule(); });
      function motionChange() { finishFade(); schedule(); }
      if (motion.addEventListener) listen(motion, 'change', motionChange);
      else { motion.addListener(motionChange); listeners.push(function () { motion.removeListener(motionChange); }); }
      if ('IntersectionObserver' in win) {
        observer = new win.IntersectionObserver(function (entries) {
          inViewport = entries.some(function (entry) { return entry.isIntersecting; }); schedule();
        }, { threshold: 0 });
        observer.observe(shell);
      }
      shell.setAttribute('role', 'region'); shell.setAttribute('aria-roledescription', label('carousel', 'carousel'));
      shell.setAttribute('aria-label', label('label', 'In-game screenshot gallery'));
      updateToggle();
    }
    function restoreAttribute(name, value) {
      if (value === null) shell.removeAttribute(name); else shell.setAttribute(name, value);
    }
    var controller = {
      ready: null,
      next: function () { show(index + 1, true); },
      previous: function () { show(index - 1, true); },
      goTo: function (value) { show(Number(value), true); },
      setActive: function (value) { active = !!value; if (!active) finishFade(); schedule(); },
      destroy: function () {
        if (destroyed) return;
        destroyed = true; stopTimer(); finishFade(); loadCancels.forEach(function (cancel) { cancel(); });
        listeners.forEach(function (remove) { remove(); }); if (observer) observer.disconnect();
        if (stage) stage.remove(); if (controls) controls.remove();
        canvas.classList.remove('has-gallery'); canvas.style.removeProperty('--gallery-transition');
        ['galleryState','galleryCount','galleryIndex','galleryPlaying'].forEach(function (key) { delete canvas.dataset[key]; });
        restoreAttribute('role', originalRole); restoreAttribute('aria-label', originalLabel);
        restoreAttribute('aria-roledescription', originalDescription);
        if (caption) caption.textContent = originalCaption;
        if (canvas._corexGallery === controller) delete canvas._corexGallery;
      }
    };
    canvas._corexGallery = controller;
    canvas.dataset.galleryState = sources.length ? 'loading' : 'placeholder';
    canvas.dataset.galleryCount = '0'; canvas.dataset.galleryIndex = '0'; canvas.dataset.galleryPlaying = 'false';
    controller.ready = Promise.all(sources.map(load)).then(function (loaded) {
      loadCancels = [];
      if (destroyed) return { count: 0 };
      slides = loaded.filter(Boolean);
      if (!slides.length) { canvas.dataset.galleryState = 'placeholder'; return { count:0 }; }
      stage = element('div', 'gallery-stage');
      slides.forEach(function (slide, i) {
        slide.image.setAttribute('aria-hidden', String(i !== 0));
        if (i === 0) slide.image.classList.add('is-active');
        stage.appendChild(slide.image);
      });
      canvas.appendChild(stage); canvas.classList.add('has-gallery');
      canvas.style.setProperty('--gallery-transition', options.transitionMs + 'ms');
      canvas.dataset.galleryCount = String(slides.length);
      canvas.dataset.galleryState = slides.length > 1 ? 'ready' : 'single';
      if (slides.length > 1) makeControls();
      describe(false); schedule();
      return { count: slides.length };
    });
    return controller;
  }
  var api = { mount: mount, normalizeSlides: normalizeSlides, normalizeOptions: normalizeOptions };
  root.COREX_GALLERY = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
