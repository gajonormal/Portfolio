/* Rasterize the current window locally, then warp its scanlines into the Dock. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const paintImageCache = new Map();
  const imagePaintProperties = ['background-image', 'border-image-source'];
  const captures = new WeakMap();
  const paintProperties = (`display position box-sizing width height min-width min-height max-width max-height top right bottom left
    margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left overflow-x overflow-y
    color background-color background-image background-size background-position background-repeat
    border-top border-right border-bottom border-left border-radius border-image-source border-image-slice border-image-width
    border-image-outset border-image-repeat box-shadow opacity scrollbar-width
    font-family font-size font-weight font-style line-height letter-spacing word-spacing text-align text-decoration text-shadow white-space
    vertical-align flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self align-content justify-content
    gap grid-template-columns grid-template-rows grid-column grid-row object-fit object-position transform transform-origin visibility clip-path filter`).split(/\s+/);

  // The lower edge first forms a neck; the sheet then travels through that funnel.
  function row(rect, dock, progress, v) {
    const p = clamp(progress);
    const neck = smooth(p / .42);
    const pull = smooth((p - .32) / .68);
    const targetTop = dock.top ?? dock.y, targetBottom = targetTop + (dock.height || 0);
    const top = mix(rect.top, targetTop, pull);
    const bottom = mix(rect.top + rect.height, targetBottom, neck);
    const y = mix(top, bottom, v);
    const along = clamp((y - rect.top) / Math.max(1, targetBottom - rect.top));
    const bend = mix(neck * smooth(along), 1, pull);
    return {
      left: mix(rect.left, dock.x - dock.width / 2, bend),
      right: mix(rect.left + rect.width, dock.x + dock.width / 2, bend),
      y
    };
  }

  function bandMatrix(first, last, width, height) {
    const topWidth = first.right - first.left;
    const bottomWidth = last.right - last.left;
    const perspective = topWidth / bottomWidth;
    return [
      topWidth / width, 0, 0, 0,
      (last.left * perspective - first.left) / height,
      (last.y * perspective - first.y) / height,
      0,
      (perspective - 1) / height,
      0, 0, 1, 0,
      first.left, first.y, 0, 1
    ];
  }

  function bandPaintHeight(first, last, height, remaining, overlap) {
    const span = last.y - first.y;
    if (span <= 0 || remaining <= height) return height;
    // Invert the band's perspective transform so the overlap is measured
    // on screen, even when the source strip is squeezed near the Dock.
    const perspective = (first.right - first.left) / (last.right - last.left);
    const target = 1 + overlap / span;
    const divisor = perspective - target * (perspective - 1);
    return divisor > 0 ? Math.min(remaining, height * target / divisor) : remaining;
  }

  function freezeSurface(original, rect, embedImages = true) {
    const clone = original.cloneNode(true);
    const originals = [original, ...original.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    const pending = [];
    originals.forEach((source, index) => {
      const copy = copies[index];
      // Cross-origin pages cannot be captured, and clones must not load them again.
      if (source instanceof HTMLIFrameElement) {
        copy.remove();
        return;
      }
      const computed = getComputedStyle(source);
      // Resolve selectors, inherited fonts and layout before detaching the copy.
      for (const property of paintProperties) {
        copy.style.setProperty(property, computed.getPropertyValue(property));
      }
      if (original.style.visibility === 'hidden' && computed.visibility === 'hidden') {
        copy.style.visibility = 'visible';
      }
      if (source.hasAttribute('data-genie-preview')) copy.style.opacity = '1';
      copy.removeAttribute('id');
      copy.removeAttribute('autofocus');
      copy.style.setProperty('animation', 'none', 'important');
      copy.style.setProperty('transition', 'none', 'important');
      if (source instanceof HTMLInputElement) {
        copy.value = source.value;
        copy.setAttribute('value', source.value);
        copy.checked = source.checked;
      }
      if (source instanceof HTMLTextAreaElement) copy.textContent = source.value;
      if (source instanceof HTMLImageElement) {
        copy.loading = 'eager';
        const embedImage = () => {
          const imageCanvas = document.createElement('canvas');
          const bounds = source.getBoundingClientRect();
          const density = Math.min(2, devicePixelRatio || 1);
          // SVG intrinsic sizes can be tiny (the archive mark is 13 x 8).
          // Rasterize vectors at their displayed size instead of freezing those intrinsic pixels.
          const vector = /\.svg(?:[?#]|$)|^data:image\/svg\+xml/i.test(source.currentSrc || source.src);
          const scale = Math.min(
            vector ? Infinity : 1,
            Math.max(1, bounds.width * density) / source.naturalWidth,
            Math.max(1, bounds.height * density) / source.naturalHeight
          );
          imageCanvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
          imageCanvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
          imageCanvas.getContext('2d').drawImage(source, 0, 0, imageCanvas.width, imageCanvas.height);
          copy.src = imageCanvas.toDataURL('image/png');
        };
        if (!embedImages) copy.src = source.currentSrc || source.src;
        else if (source.complete && source.naturalWidth) embedImage();
        else if (source.hasAttribute('data-genie-preview')) pending.push(source.decode().then(embedImage));
        else copy.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
      }
      for (const property of imagePaintProperties) {
        const paint = computed.getPropertyValue(property);
        if (!embedImages || !paint.includes('url(')) continue;
        pending.push((async () => {
          let value = paint;
          for (const match of paint.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
            const url = match[1];
            if (!paintImageCache.has(url)) {
              const image = fetch(url)
                .then(response => {
                  if (!response.ok) throw new Error('Cannot capture window artwork');
                  return response.blob();
                })
                .then(blob => new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }))
                .catch(error => {
                  paintImageCache.delete(url);
                  throw error;
                });
              paintImageCache.set(url, image);
            }
            value = value.replace(match[0], `url("${await paintImageCache.get(url)}")`);
          }
          copy.style.setProperty(property, value);
        })());
      }
    });
    // Scroll offsets are not part of serialized HTML; translate visible children instead.
    originals.forEach((source, index) => {
      if (source.scrollTop || source.scrollLeft) {
        for (const child of copies[index].children) {
          const transform = child.style.transform === 'none' ? '' : child.style.transform;
          child.style.transform = `translate(${-source.scrollLeft}px,${-source.scrollTop}px) ${transform}`;
        }
      }
    });
    clone.hidden = false;
    clone.inert = true;
    clone.setAttribute('aria-hidden', 'true');
    const rootStyle = {
      position: 'absolute', inset: 'auto', left: '0px', top: '0px',
      width: `${rect.width}px`, height: `${rect.height}px`,
      minWidth: '0px', minHeight: '0px', maxWidth: 'none', maxHeight: 'none',
      margin: '0px', transform: 'none', visibility: 'visible', opacity: '1',
      boxShadow: 'none', resize: 'none', pointerEvents: 'none'
    };
    for (const [key, value] of Object.entries(rootStyle)) {
      clone.style.setProperty(
        key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),
        value,
        'important'
      );
    }
    // Important rules on zoomed windows must not override the frozen dimensions.
    clone.classList.remove('maximized');
    return { clone, pending };
  }

  async function rasterize(surface, rect) {
    await Promise.all(surface.pending);
    // Inline styles already resolved the local font and geometry. The stylesheet
    // preserves pseudo-elements such as search and disclosure icons.
    const styles = [...document.styleSheets]
      .map(sheet => {
        try {
          return [...sheet.cssRules].map(rule => rule.cssText).join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');
    const content = new XMLSerializer().serializeToString(surface.clone);
    const escapedStyles = styles.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    const markup = `<svg xmlns="${NS}" width="${rect.width}" height="${rect.height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${escapedStyles}</style>${content}</div></foreignObject></svg>`;
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const bitmap = document.createElement('canvas');
      const ratio = Math.min(2, devicePixelRatio || 1);
      bitmap.width = Math.round(rect.width * ratio);
      bitmap.height = Math.round(rect.height * ratio);
      bitmap.getContext('2d').drawImage(image, 0, 0, bitmap.width, bitmap.height);
      return bitmap;
    } finally {
      // decode() has completed; defer revocation until the current drawing turn ends.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  function captureRecord(element) {
    let record = captures.get(element);
    if (record) return record;
    record = { revision: 0, bitmap: null, pending: null, timer: 0, idle: 0 };
    const invalidate = () => {
      record.revision++;
      record.bitmap = null;
      schedule(element);
    };
    record.invalidateOnChanges = changes => {
      if (changes.some(change =>
        change.target !== element ||
        !['style', 'class', 'data-minimized', 'data-running'].includes(change.attributeName)
      )) invalidate();
    };
    record.observer = new MutationObserver(record.invalidateOnChanges);
    record.observer.observe(element, { subtree: true, childList: true, characterData: true, attributes: true });
    element.addEventListener('input', invalidate, true);
    element.addEventListener('scroll', invalidate, true);
    element.addEventListener('load', invalidate, true);
    captures.set(element, record);
    return record;
  }
  function prepare(element) {
    const record = captureRecord(element);
    const rect = element.getBoundingClientRect();
    record.invalidateOnChanges(record.observer.takeRecords());
    if (record.bitmap && record.width === rect.width && record.height === rect.height) {
      return Promise.resolve(record.bitmap);
    }
    const revision = record.revision;
    const previous = record.pending;
    if (
      previous?.revision === revision &&
      previous.width === rect.width &&
      previous.height === rect.height
    ) return previous.promise;
    const surface = freezeSurface(element, rect);
    const pending = { revision, width: rect.width, height: rect.height };
    record.pending = pending;
    pending.promise = rasterize(surface, rect)
      .then(bitmap => {
        record.invalidateOnChanges(record.observer.takeRecords());
        // A late image load can invalidate the cache while a restore is already
        // waiting for this frozen frame. Keep it usable for that animation.
        if (record.pending === pending && revision === record.revision) {
          record.bitmap = bitmap;
          record.width = rect.width;
          record.height = rect.height;
        }
        return bitmap;
      })
      .finally(() => {
        if (record.pending === pending) record.pending = null;
      });
    return pending.promise;
  }
  function schedule(element) {
    if (!element || element.nodeType !== 1 || location.protocol === 'file:') {
      return;
    }
    const record = captureRecord(element);
    clearTimeout(record.timer);
    if (record.idle && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(record.idle);
    }
    record.idle = 0;
    record.timer = setTimeout(() => {
      const warm = () => {
        record.idle = 0;
        if (!element.hidden && getComputedStyle(element).visibility === 'visible') {
          prepare(element).catch(() => { });
        }
      };
      // Finder's image-heavy snapshot must not compete with its first paint
      // or the Dock's launch bounce. Warm it only after opening has settled.
      if (typeof requestIdleCallback === 'function') {
        record.idle = requestIdleCallback(warm, { timeout: 2500 });
      } else {
        record.timer = setTimeout(warm, 80);
      }
    }, 1000);
  }

  function play(windowElement, dockElement, options = {}) {
    const captureStarted = performance.now();
    const rect = windowElement.getBoundingClientRect();
    let dock;
    function updateDockAnchor() {
      const preview = dockElement.querySelector('.dock-window-preview');
      const target = (preview || dockElement).getBoundingClientRect();
      dock = preview
        ? {
            x: target.left + target.width / 2,
            y: target.bottom,
            top: target.top,
            height: target.height,
            width: Math.max(1, target.width)
          }
        : {
            x: target.left + target.width / 2,
            y: target.bottom - 5,
            width: Math.max(18, target.width * .42)
          };
    }
    updateDockAnchor();
    let overlay = document.createElement('canvas');
    overlay.className = 'genie-surface';
    overlay.setAttribute('aria-hidden', 'true');
    const ratio = Math.min(2, devicePixelRatio || 1);
    overlay.width = Math.round(innerWidth * ratio);
    overlay.height = Math.round(innerHeight * ratio);
    overlay.style.width = `${innerWidth}px`; overlay.style.height = `${innerHeight}px`;
    const context = overlay.getContext('2d');
    const count = Math.ceil(rect.height);
    let captured = null;
    if (location.protocol !== 'file:' && options.renderer !== 'dom') {
      try { captured = prepare(windowElement); } catch {/* A blocked snapshot uses the DOM renderer below. */ }
    }
    let texture;
    let bands = null;
    let started = false;
    let preparationTimer = 0;
    // The Dock lives in the desktop's isolated stacking context. Keep the
    // animated surface in that same context, below the Dock in both directions.
    overlay.style.zIndex = String(Math.min(8999, Math.max(500, Number(windowElement.style.zIndex) || 0)));
    (windowElement.closest('#desktop') || document.body).append(overlay);

    const oldVisibility = windowElement.style.visibility;
    const oldPointerEvents = windowElement.style.pointerEvents;
    if (options.restore) {
      windowElement.style.visibility = 'hidden';
      windowElement.style.pointerEvents = 'none';
    }
    let progress = options.pausedAt === undefined
      ? (options.restore ? 1 : 0)
      : clamp(options.pausedAt);
    let goal = options.restore ? 0 : 1;
    let duration = Math.max(1, options.duration || 540);
    overlay.dataset.duration = String(duration);
    let previousTime = null;
    let frame = 0;
    let stopped = false;

    function render(p) {
      options.onprogress?.(p);
      updateDockAnchor();
      if (bands) {
        for (let i = 0; i < bands.length; i++) {
          const first = row(rect, dock, p, i / bands.length);
          const last = row(rect, dock, p, (i + 1) / bands.length);
          const h = rect.height / bands.length;
          bands[i].style.height = `${bandPaintHeight(
            first,
            last,
            h,
            (bands.length - i) * h,
            1.5 / ratio
          )}px`;
          bands[i].style.transform = `matrix3d(${bandMatrix(first, last, rect.width, h).join(',')})`;
        }
        overlay.dataset.progress = progress.toFixed(3);
        return;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, innerWidth, innerHeight);
      if (p === 0) {
        context.drawImage(texture, rect.left, rect.top, rect.width, rect.height);
        overlay.dataset.progress = '0.000';
        return;
      }
      for (let i = 0; i < count; i++) {
        const start = row(rect, dock, p, i / count);
        const end = row(rect, dock, p, (i + 1) / count);
        // Neighboring strips share a device-pixel edge. Fractional edges
        // can leave translucent seams even when their CSS coordinates meet.
        const top = Math.round(start.y * ratio) / ratio;
        const bottom = Math.round(end.y * ratio) / ratio;
        if (bottom === top) continue;
        const left = (start.left + end.left) / 2;
        const width = ((start.right - start.left) + (end.right - end.left)) / 2;
        const sourceY = i * texture.height / count;
        const sourceEnd = (i + 1) * texture.height / count;
        context.drawImage(texture, 0, sourceY, texture.width, sourceEnd - sourceY, left, top, width, bottom - top);
      }
      overlay.dataset.progress = progress.toFixed(3);
    }
    function clean() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(preparationTimer);
      overlay.remove();
      windowElement.style.visibility = oldVisibility;
      windowElement.style.pointerEvents = oldPointerEvents;
      window.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', visibilityChanged);
    }
    function finish() {
      if (stopped) return;
      windowElement.hidden = goal === 1;
      clean();
      options.onfinish?.();
    }
    function visibilityChanged() {
      if (document.hidden) finish();
    }
    function tick(time) {
      if (stopped) return;
      frame = 0;
      if (previousTime !== null) {
        progress = clamp(progress + (goal === 1 ? 1 : -1) * (time - previousTime) / duration);
      }
      previousTime = time;
      render(progress);
      if (progress === goal) finish();
      else frame = requestAnimationFrame(tick);
    }
    function start(image) {
      if (stopped || started) return;
      started = true;
      clearTimeout(preparationTimer);
      try {
        if (image) {
          texture = image;
          overlay.dataset.renderer = 'canvas';
        } else {
          const replacement = document.createElement('div');
          replacement.className = overlay.className;
          replacement.style.cssText = overlay.style.cssText;
          replacement.setAttribute('aria-hidden', 'true');
          replacement.inert = true;
          replacement.dataset.duration = String(duration);
          replacement.dataset.renderer = 'dom';
          const surface = freezeSurface(windowElement, rect, false).clone;
          const count = 64;
          const h = rect.height / count;
          bands = [];
          for (let i = 0; i < count; i++) {
            const band = document.createElement('div');
            band.className = 'genie-band';
            band.style.width = `${rect.width}px`;
            const content = surface.cloneNode(true);
            content.style.top = `${-i * h}px`;
            band.append(content);
            replacement.append(band);
            bands.push(band);
          }
          overlay.replaceWith(replacement); overlay = replacement;
        }
        overlay.dataset.captureMs = String(Math.round(performance.now() - captureStarted));
        windowElement.style.visibility = 'hidden';
        windowElement.style.pointerEvents = 'none';
        render(progress);
        if (options.pausedAt === undefined) {
          frame = requestAnimationFrame(tick);
        }
      } catch {
        // Window controls must still complete if neither renderer is available.
        queueMicrotask(finish);
      }
    }
    if (captured) {
      preparationTimer = setTimeout(() => start(), 900);
      captured.then(start, () => start());
    } else start();
    window.addEventListener('resize', finish, { once: true });
    document.addEventListener('visibilitychange', visibilityChanged);
    return {
      to(nextGoal, nextDuration) {
        goal = nextGoal;
        if (nextDuration) duration = nextDuration;
        overlay.dataset.duration = String(duration);
        previousTime = null;
        if (!frame && started && !stopped) frame = requestAnimationFrame(tick);
      },
      seek(value) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = null;
        progress = clamp(value);
        if (started && !stopped) render(progress);
      },
      cancel: clean,
      finish
    };
  }
  globalThis.GenieEffect = { play, row, bandMatrix, bandPaintHeight, schedule };
})();
