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
  const status = $('#admin-status');
  const lock = $('#lock');
  const loginStatus = $('#admin-login-status');
  const loginAnnouncement = $('#admin-login-announcement');
  const files = new Map(desktopFiles.map(file => [file.dataset.desktopId || file.dataset.open, file]));
  const apps = new Map($$('#dock > [data-open]:not([data-open="bin"])').map(button => [button.dataset.open, button]));
  const defaults = {
    desktop: Object.fromEntries([...files.keys()].map(id => [id, null])),
    dock: [...apps.keys()]
  };
  let published = defaults;
  let layout = structuredClone(defaults);
  let editing = false;
  let busy = false;
  let signingIn = false;
  let loginShake;

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
      dock: next.dock.filter(id => apps.has(id))
    };
  }

  function applyLayout(next) {
    layout = completeLayout(next);
    for (const id of layout.dock) dock.insertBefore(apps.get(id), $('#dock-windows'));
    applyPositions();
  }

  const dirty = () => JSON.stringify(layout) !== JSON.stringify(published);
  const markDraft = () => {
    if (editing) status.textContent = 'Unsaved changes';
  };
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
      applyLayout(published);
      editing = true;
      document.body.classList.add('desktop-admin');
      controls.hidden = false;
      status.textContent = '';
      showPrompt(false, false);
      profile.click();
      $('#admin-save').focus();
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
    status.textContent = 'Saving…';
    const snapshot = structuredClone(layout);
    try {
      const result = await request('PUT', snapshot);
      published = completeLayout(result.layout);
      status.textContent = dirty()
        ? 'Layout published. New changes are unsaved.'
        : 'Layout published.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
    }
  });

  $('#admin-reset').addEventListener('click', () => {
    applyLayout(defaults);
    markDraft();
  });
  async function exitEditor() {
    if (busy || (dirty() && !confirm('Discard unpublished changes and lock the desktop?'))) return;
    busy = true;
    try {
      await request('DELETE', {});
      editing = false;
      document.body.classList.remove('desktop-admin');
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

  request().then(result => {
    if (!result.enabled) return;
    published = completeLayout(result.layout || defaults);
    if (!editing && result.layout) applyLayout(published);
    unlock.hidden = false;
  }).catch(() => {});
})();
