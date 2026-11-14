'use strict';
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const api = new URL('api/desktop-layout', location.href);
  const desktop = $('#desktop');
  const form = $('#admin-form');
  const password = $('#admin-password');
  const unlock = $('#admin-unlock');
  const profile = $('#login-button');
  const loginPanel = unlock.closest('.login-wrapper');
  const controls = $('#admin-controls');
  const tools = $('#admin-tools');
  const moveHandle = $('#admin-move');
  const toggle = $('#admin-toggle');
  const status = $('#admin-status');
  const cvFile = $('#cv-file');
  const cvStatus = $('#cv-status');
  const cvPreview = $('#cv-preview');
  const cvEndpoint = new URL(api);
  cvEndpoint.searchParams.set('cv', '1');
  const wallpaperSelect = $('#admin-wallpaper');
  const wallpaperOptions = $$('[data-wallpaper]');
  for (const button of wallpaperOptions) {
    wallpaperSelect.add(new Option($('span', button).textContent, button.dataset.wallpaper));
  }
  const lock = $('#lock');
  const loginStatus = $('#admin-login-status');
  const loginAnnouncement = $('#admin-login-announcement');
  const files = new Map(desktopFiles.map(file => [file.dataset.desktopId || file.dataset.open, file]));
  const apps = new Map($$('#dock > [data-open]:not([data-open="bin"])').map(button => [button.dataset.open, button]));
  const defaults = {
    desktop: Object.fromEntries([...files.keys()].map(id => [id, null])),
    dock: [...apps.keys()],
    hasCv: false,
    wallpaper: 'galaxy',
    stickies: defaultStickies,
    windows: defaultWindowSettings
  };
  let published = defaults;
  let layout = structuredClone(defaults);
  let editing = false;
  let busy = false;
  let signingIn = false;
  let loginShake;
  let pendingCv;
  let readingCv = false;

  async function request(method = 'GET', body) {
    const response = await fetch(api, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The desktop could not be updated.');
    return result;
  }

  function bounds(file) {
    const area = desktop.getBoundingClientRect();
    const parent = file.parentElement.getBoundingClientRect();
    const top = Math.max(area.top, $('.menubar').getBoundingClientRect().bottom) + 6;
    const bottom = dock.getBoundingClientRect().top - 6;
    return {
      x: area.left + 6,
      y: top,
      parent,
      width: Math.max(0, area.width - file.offsetWidth - 12),
      height: Math.max(0, bottom - top - file.offsetHeight)
    };
  }

  function applyPositions() {
    for (const [id, file] of files) {
      const position = layout.desktop[id];
      if (!position) {
        for (const property of ['left', 'right', 'top']) file.style.removeProperty(property);
        continue;
      }
      const { x, y, width, height, parent } = bounds(file);
      file.style.left = `${x - parent.left + position[0] * width}px`;
      file.style.top = `${y - parent.top + position[1] * height}px`;
      file.style.right = 'auto';
    }
  }

  function completeLayout(next) {
    return {
      desktop: { ...defaults.desktop, ...next.desktop },
      dock: next.dock.filter(id => apps.has(id)),
      hasCv: next.hasCv ?? defaults.hasCv,
      wallpaper: next.wallpaper ?? defaults.wallpaper,
      stickies: structuredClone(next.stickies ?? defaultStickies),
      windows: normalizeWindows(next.windows ?? defaultWindowSettings)
    };
  }

  function applyLayout(next) {
    layout = completeLayout(next);
    for (const id of layout.dock) dock.insertBefore(apps.get(id), $('#dock-windows'));
    applyPositions();
    renderCv();
    wallpaperSelect.value = desktopWallpaper = layout.wallpaper;
    applyWallpaper();
    renderStickies(layout.stickies);
    windowSettings = layout.windows;
  }

  const dirty = () => Boolean(pendingCv) || JSON.stringify(layout) !== JSON.stringify(published);
  const markDraft = () => {
    status.textContent = dirty() ? 'Unsaved changes' : '';
  };
  const stickiesEditor = setupStickiesEditor({
    getSettings: () => layout.stickies,
    change() {
      renderStickies(layout.stickies);
      markDraft();
    }
  });
  $('#admin-edit-stickies').addEventListener('click', () => {
    if (editing && !busy) stickiesEditor();
  });

  const windowDialog = $('#window-settings');
  const windowSelect = $('#window-settings-app');
  const startup = $('#window-settings-startup');
  const startupOrder = $('#startup-order-list');
  const originalSize = $('#window-settings-default');
  const sizeFields = $('#window-size-fields');
  const sizeForm = $('#window-size-form');
  const widthField = $('#window-settings-width');
  const heightField = $('#window-settings-height');
  const captureSize = $('#window-settings-capture');
  const previewSize = $('#window-settings-preview');
  const capturePosition = $('#window-position-capture');
  const resetPosition = $('#window-position-reset');
  const positionStatus = $('#window-position-status');
  const windowLabels = {
    safari: 'Safari', finder: 'Finder', mail: 'Mail', notes: 'Stickies',
    cv: 'CV', portrait: 'Preview', ipod: 'iPod Classic', settings: 'System Preferences',
    bin: 'Trash', about: 'About This Portfolio'
  };
  const windowIds = Object.keys(windowLabels);
  for (const [id, label] of Object.entries(windowLabels)) windowSelect.add(new Option(label, id));

  function normalizeWindows(settings) {
    return Object.fromEntries(windowIds.flatMap(id => {
      const item = settings[id];
      if (!item?.startup && !item?.size && !item?.position) return [];
      return [[id, {
        startup: item.startup,
        ...(item.size && { size: [...item.size] }),
        ...(item.position && { position: [...item.position] }),
        ...(item.startup && item.order !== undefined && { order: item.order })
      }]];
    }));
  }

  const selectedWindows = () => windows.filter(window => windowSettingsId(window) === windowSelect.value);
  const currentWindow = () => selectedWindows().sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))
    .find(window => !window.hidden && !window.classList.contains('maximized'));
  function refreshPositionSettings() {
    const position = layout.windows[windowSelect.value]?.position;
    capturePosition.disabled = innerWidth <= 640 || !currentWindow();
    resetPosition.disabled = !position;
    if (innerWidth <= 640) {
      positionStatus.textContent = 'Use a wider screen to set the opening position.';
    } else if (capturePosition.disabled) {
      positionStatus.textContent = 'Preview the window first, then move it.';
    } else {
      positionStatus.textContent = position ? 'Custom position set.' : 'Drag the window to set its opening position.';
    }
  }

  function renderStartupOrder(focusId, direction) {
    const ids = startupWindowIds(layout.windows);
    let nextFocus;
    startupOrder.replaceChildren();
    startupOrder.hidden = !ids.length;
    $('#startup-order-empty').hidden = Boolean(ids.length);
    ids.forEach((id, index) => {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = windowLabels[id];
      row.append(label);
      for (const [step, text] of [[-1, 'Move back'], [1, 'Move forward']]) {
        const target = index + step;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.setAttribute('aria-label', `${text} ${windowLabels[id]}`);
        button.disabled = target < 0 || target >= ids.length;
        button.addEventListener('click', () => {
          [ids[index], ids[target]] = [ids[target], ids[index]];
          ids.forEach((app, order) => { layout.windows[app].order = order; });
          markDraft();
          renderStartupOrder(id, step);
        });
        if (id === focusId && !button.disabled && (!nextFocus || step === direction)) nextFocus = button;
        row.append(button);
      }
      startupOrder.append(row);
    });
    if (focusId) (nextFocus ?? startup).focus();
  }

  function setWindowSetting(id, settings) {
    if (settings.startup || settings.size || settings.position) layout.windows[id] = settings;
    else delete layout.windows[id];
    layout.windows = normalizeWindows(layout.windows);
    windowSettings = layout.windows;
    markDraft();
  }

  function updateWindowSetting() {
    if (!sizeForm.checkValidity()) return false;
    const id = windowSelect.value;
    setWindowSetting(id, {
      ...layout.windows[id],
      startup: startup.checked,
      size: originalSize.checked ? undefined : [widthField.valueAsNumber, heightField.valueAsNumber]
    });
    return true;
  }

  function useWindowSize(window) {
    const { width, height } = window.getBoundingClientRect();
    widthField.value = Math.round(Math.max(220, Math.min(width, 2560)));
    heightField.value = Math.round(Math.max(150, Math.min(height, 1600)));
  }

  function refreshWindowSettings() {
    const settings = layout.windows[windowSelect.value];
    startup.checked = settings?.startup ?? false;
    originalSize.checked = !settings?.size;
    sizeFields.hidden = widthField.disabled = heightField.disabled = originalSize.checked;
    widthField.value = settings?.size?.[0] ?? '';
    heightField.value = settings?.size?.[1] ?? '';
    captureSize.disabled = !currentWindow();
    previewSize.disabled = !selectedWindows().length;
    refreshPositionSettings();
  }

  $('#admin-edit-windows').addEventListener('click', () => {
    if (!editing || busy) return;
    refreshWindowSettings();
    renderStartupOrder();
    windowDialog.showModal();
  });
  windowSelect.addEventListener('change', refreshWindowSettings);
  startup.addEventListener('change', () => {
    const id = windowSelect.value;
    setWindowSetting(id, { ...layout.windows[id], startup: startup.checked });
    renderStartupOrder();
  });
  originalSize.addEventListener('change', () => {
    sizeFields.hidden = widthField.disabled = heightField.disabled = originalSize.checked;
    if (!originalSize.checked && !widthField.value) {
      const window = currentWindow();
      if (window) useWindowSize(window);
      else widthField.focus();
    }
    updateWindowSetting();
  });
  for (const field of [widthField, heightField]) field.addEventListener('change', updateWindowSetting);
  captureSize.addEventListener('click', () => {
    const window = currentWindow();
    if (!window) return;
    originalSize.checked = sizeFields.hidden = widthField.disabled = heightField.disabled = false;
    useWindowSize(window);
    updateWindowSetting();
  });
  function recordWindowPosition(window) {
    const id = windowSettingsId(window);
    const left = window.offsetLeft;
    const top = window.offsetTop;
    const style = window.style.cssText;
    const hasCustomSize = window.hasAttribute('data-opening-size');
    // Measure the space the window will have at its opening size.
    applyOpeningSize(window);
    const area = openingPositionBounds(window);
    window.style.cssText = style;
    window.toggleAttribute('data-opening-size', hasCustomSize);
    const fraction = (distance, range) => range ? Math.min(1, Math.max(0, distance / range)) : 0;
    const offset = windowPositionOffset(window);
    setWindowSetting(id, {
      startup: false,
      ...layout.windows[id],
      position: [fraction(left - offset, area.width), fraction(top - 30 - offset, area.height)]
    });
  }
  desktop.addEventListener('window-position-changed', event => {
    if (editing) recordWindowPosition(event.target);
  });
  capturePosition.addEventListener('click', () => {
    const window = currentWindow();
    if (!window || innerWidth <= 640) return;
    recordWindowPosition(window);
    refreshPositionSettings();
  });
  resetPosition.addEventListener('click', () => {
    const id = windowSelect.value;
    setWindowSetting(id, { ...layout.windows[id], position: undefined });
    refreshPositionSettings();
  });
  window.addEventListener('resize', () => {
    if (windowDialog.open) refreshPositionSettings();
  });
  $('#window-settings-done').addEventListener('click', () => {
    if (sizeForm.reportValidity() && updateWindowSetting()) windowDialog.close();
  });
  sizeForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!updateWindowSetting()) return;
    windowDialog.close();
    const id = windowSelect.value;
    for (const window of selectedWindows()) {
      window.classList.remove('maximized');
      applyOpeningSize(window);
    }
    openApp(id);
    selectedWindows().forEach(window => {
      applyOpeningPosition(window, true);
      if (!windowSettings[id]?.position) fitOpeningWindow(window);
    });
  });

  function renderCv() {
    const source = pendingCv?.url || (layout.hasCv ? cvEndpoint.href : '');
    $('#cv-empty').hidden = Boolean(source);
    $('#cv-links').hidden = cvPreview.hidden = !source;
    if (source && cvPreview.getAttribute('src') !== source) {
      cvPreview.src = $('#cv-open').href = $('#cv-download').href = source;
    } else if (!source) {
      cvPreview.removeAttribute('src');
    }
  }
  function clearPendingCv() {
    if (pendingCv) URL.revokeObjectURL(pendingCv.url);
    pendingCv = undefined;
    cvFile.value = '';
    cvStatus.textContent = '';
  }
  $('#admin-edit-cv').addEventListener('click', () => {
    openApp('cv');
    cvFile.focus();
  });
  cvFile.addEventListener('change', async () => {
    const file = cvFile.files[0];
    if (!file || !editing || busy) return;
    readingCv = true;
    cvFile.disabled = true;
    $('#admin-save').disabled = true;
    try {
      if (file.size > 3 * 1024 * 1024 || await file.slice(0, 5).text() !== '%PDF-') {
        cvFile.value = '';
        cvStatus.textContent = 'Choose a valid PDF up to 3 MB.';
        return;
      }
      clearPendingCv();
      pendingCv = { file, url: URL.createObjectURL(file) };
      cvStatus.textContent = `${file.name} is ready to publish with Save changes.`;
      renderCv();
      markDraft();
    } catch {
      cvStatus.textContent = 'Could not read the PDF. Choose the file again.';
    } finally {
      readingCv = false;
      cvFile.disabled = false;
      $('#admin-save').disabled = false;
    }
  });
  function encodePdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',', 2)[1]);
      reader.onerror = () => reject(new Error('Could not read the PDF. Choose the file again.'));
      reader.readAsDataURL(file);
    });
  }
  function changeWallpaper(wallpaper) {
    wallpaperSelect.value = desktopWallpaper = layout.wallpaper = wallpaper;
    applyWallpaper();
    markDraft();
  }
  wallpaperSelect.addEventListener('change', () => changeWallpaper(wallpaperSelect.value));
  for (const button of wallpaperOptions) {
    button.addEventListener('click', () => {
      if (editing) changeWallpaper(button.dataset.wallpaper);
    });
  }

  function movePanel(left, top) {
    const area = desktop.getBoundingClientRect();
    const menuBottom = $('.menubar').getBoundingClientRect().bottom - area.top + 4;
    const bottom = dock.getBoundingClientRect().top - area.top - controls.offsetHeight - 4;
    controls.style.left = `${Math.max(4, Math.min(left, area.width - controls.offsetWidth - 4))}px`;
    controls.style.top = `${Math.max(menuBottom, Math.min(top, bottom))}px`;
  }
  function fitPanel() {
    if (editing) movePanel(controls.offsetLeft, controls.offsetTop);
  }
  toggle.addEventListener('click', () => {
    tools.hidden = !tools.hidden;
    toggle.textContent = tools.hidden ? '+' : '−';
    toggle.setAttribute('aria-expanded', String(!tools.hidden));
    toggle.title = tools.hidden ? 'Restore admin panel' : 'Minimize admin panel';
    toggle.setAttribute('aria-label', toggle.title);
    fitPanel();
  });
  moveHandle.addEventListener('keydown', event => {
    const offset = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
    if (!offset) return;
    event.preventDefault();
    event.stopPropagation();
    movePanel(controls.offsetLeft + offset[0], controls.offsetTop + offset[1]);
  });
  let panelDrag;
  moveHandle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    moveHandle.setPointerCapture(event.pointerId);
    panelDrag = {
      pointer: event.pointerId,
      x: event.clientX - controls.offsetLeft,
      y: event.clientY - controls.offsetTop
    };
  });
  moveHandle.addEventListener('pointermove', event => {
    if (panelDrag?.pointer !== event.pointerId) return;
    movePanel(event.clientX - panelDrag.x, event.clientY - panelDrag.y);
  });
  moveHandle.addEventListener('lostpointercapture', () => { panelDrag = undefined; });
  new ResizeObserver(fitPanel).observe(controls);
  window.addEventListener('resize', fitPanel);

  const fraction = (offset, length) => length ? Math.min(1, Math.max(0, offset / length)) : 0;
  desktop.addEventListener('desktop-icon-moved', event => {
    if (!editing) return;
    const file = event.target;
    const { x, y, width, height } = bounds(file);
    const rect = file.getBoundingClientRect();
    layout.desktop[file.dataset.desktopId || file.dataset.open] = [
      fraction(rect.left - x, width),
      fraction(rect.top - y, height)
    ];
    applyPositions();
    markDraft();
  });
  window.addEventListener('resize', applyPositions);

  function showPrompt(open, restoreFocus = true) {
    loginPanel.toggleAttribute('data-admin-prompt', open);
    unlock.setAttribute('aria-expanded', String(open));
    $('#login-guest-actions').inert = open;
    $('#login-admin-actions').inert = !open;
    profile.inert = open;
    form.inert = !open;
    form.reset();
    loginStatus.textContent = '';
    loginAnnouncement.textContent = '';
    password.classList.remove('static-login-error');
    loginShake?.cancel();
    if (open) password.focus({ preventScroll: true });
    else if (restoreFocus) unlock.focus({ preventScroll: true });
  }
  unlock.addEventListener('click', () => showPrompt(true));
  $('#admin-cancel').addEventListener('click', () => {
    if (!signingIn) showPrompt(false);
  });
  $('#admin-help').addEventListener('click', () => {
    if (!signingIn) loginStatus.textContent = 'Only the site owner can reset the administrator password.';
  });
  password.addEventListener('input', () => password.classList.remove('static-login-error'));
  loginPanel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !form.inert) {
      event.preventDefault();
      if (!signingIn) showPrompt(false);
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (signingIn) return;
    signingIn = true;
    loginStatus.textContent = '';
    loginAnnouncement.textContent = '';
    password.classList.remove('static-login-error');
    const credential = password.value;
    form.reset();
    try {
      const result = await request('POST', { password: credential });
      published = completeLayout(result.layout || defaults);
      editing = true;
      document.body.classList.add('desktop-admin');
      applyLayout(published);
      $('#cv-admin').hidden = false;
      controls.hidden = false;
      status.textContent = '';
      showPrompt(false, false);
      profile.click();
      (tools.hidden ? toggle : $('#admin-save')).focus();
    } catch (error) {
      loginAnnouncement.textContent = error.message;
      password.focus({ preventScroll: true });
      loginShake?.cancel();
      if (reduceMotion()) {
        password.classList.add('static-login-error');
      } else {
        loginShake = loginPanel.animate(
          [0, -12, 12, -9, 9, -5, 4, 0].map(x => ({ transform: `translateX(${x}px)` })),
          { duration: 420, easing: 'ease-out' }
        );
      }
    } finally {
      signingIn = false;
    }
  });

  $('#admin-save').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    cvFile.disabled = true;
    status.textContent = 'Saving…';
    const snapshot = structuredClone(layout);
    try {
      if (pendingCv) snapshot.cvPdf = await encodePdf(pendingCv.file);
      const result = await request('PUT', snapshot);
      published = completeLayout(result.layout);
      layout.hasCv = published.hasCv;
      clearPendingCv();
      renderCv();
      status.textContent = dirty()
        ? 'Changes published. New changes are unsaved.'
        : 'Changes published.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      cvFile.disabled = false;
      busy = false;
    }
  });

  $('#admin-reset').addEventListener('click', () => {
    applyLayout({ ...layout, desktop: defaults.desktop, dock: defaults.dock });
    markDraft();
  });
  async function exitEditor() {
    if (busy || readingCv || (dirty() && !confirm('Discard unpublished changes and lock the desktop?'))) return;
    busy = true;
    try {
      await request('DELETE', {});
      editing = false;
      document.body.classList.remove('desktop-admin');
      $('#cv-admin').hidden = true;
      clearPendingCv();
      controls.hidden = true;
      applyLayout(published);
      lock.click();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
    }
  }
  $('#admin-lock').addEventListener('click', exitEditor);
  lock.addEventListener('click', event => {
    if (!editing) return;
    event.stopImmediatePropagation();
    closeMenus();
    exitEditor();
  }, true);

  function reorder(button, others, before) {
    const next = [...others];
    next.splice(before, 0, button.dataset.open);
    layout.dock = next;
    dock.insertBefore(
      button,
      apps.get(others[before]) || $('#dock-windows')
    );
    markDraft();
  }

  let suppressClick = null;
  dock.addEventListener('click', event => {
    if (!suppressClick?.contains(event.target)) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    suppressClick = null;
  }, true);
  dock.addEventListener('pointerdown', event => {
    suppressClick = null;
    const button = event.target.closest('button[data-open]');
    if (
      !editing ||
      event.button !== 0 ||
      !button ||
      apps.get(button.dataset.open) !== button
    ) return;
    const id = button.dataset.open;
    const others = layout.dock.filter(item => item !== id);
    const start = event.clientX;
    let dropIndex = -1;
    let marker;
    const move = next => {
      if (
        next.pointerId !== event.pointerId ||
        (dropIndex < 0 && Math.abs(next.clientX - start) < 6)
      ) return;
      dropIndex = others.findIndex(item => {
        const rect = apps.get(item).getBoundingClientRect();
        return next.clientX < rect.left + rect.width / 2;
      });
      if (dropIndex < 0) dropIndex = others.length;
      marker?.removeAttribute('data-dock-drop');
      marker = apps.get(others[dropIndex] || others.at(-1));
      marker.dataset.dockDrop = dropIndex === others.length ? 'after' : 'before';
      button.classList.add('admin-dock-dragging');
    };
    const stop = next => {
      if (next.pointerId !== event.pointerId) return;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
      marker?.removeAttribute('data-dock-drop');
      button.classList.remove('admin-dock-dragging');
      if (dropIndex < 0 || next.type !== 'pointerup' || !editing) return;
      suppressClick = button;
      reorder(button, others, dropIndex);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  });
  dock.addEventListener('keydown', event => {
    const button = event.target;
    if (
      !editing ||
      !event.altKey ||
      !['ArrowLeft', 'ArrowRight'].includes(event.key) ||
      apps.get(button.dataset.open) !== button
    ) return;
    event.preventDefault();
    const id = button.dataset.open;
    const position = layout.dock.indexOf(id);
    const next = position + (event.key === 'ArrowLeft' ? -1 : 1);
    if (next < 0 || next >= layout.dock.length) return;
    reorder(button, layout.dock.filter(item => item !== id), next);
    button.focus();
  });

  desktopLayoutReady = request().then(result => {
    if (!result.enabled) return;
    if (!editing && !signingIn && result.layout) {
      published = completeLayout(result.layout);
      applyLayout(published);
    }
    unlock.hidden = false;
  }).catch(() => {});
})();
