'use strict';

const defaultStickies = {
  shortcut: true,
  notes: [{
    id: 'hire-me',
    title: 'Hire me',
    text: 'hi, im open to work',
    linkLabel: 'Hire me?',
    link: `mailto:${portfolio.email}`,
    colour: 'yellow',
    visible: true,
    images: ['monke']
  }]
};
const stickyWindows = new Map();
const stickyTitle = note => note.title.trim() || 'Untitled note';
const stickyImage = image => image === 'monke' ? 'assets/images/monke.webp' : image;
const validStickyLink = value => /^(https?:\/\/|mailto:)[^\s]+$/i.test(value);
const stickySettingsSize = settings => new TextEncoder().encode(JSON.stringify(settings)).length;

function renderStickies({ shortcut, notes }) {
  const visible = notes.filter(note => note.visible);
  const icon = $('.desktop-file[data-open="notes"]');
  icon.hidden = !shortcut || !visible.length;
  if (icon.hidden) icon.classList.remove('selected-file');
  $('span:last-child', icon).textContent = visible.length === 1 ? stickyTitle(visible[0]) : 'Stickies';
  arrangeDesktopFiles();

  for (const [id, window] of stickyWindows) {
    if (visible.some(note => note.id === id)) continue;
    removeStickyWindow(window);
    stickyWindows.delete(id);
  }

  visible.forEach((note, index) => {
    let window = stickyWindows.get(note.id);
    if (!window) {
      window = $('#sticky-template').content.firstElementChild.cloneNode(true);
      window.dataset.app = `sticky-${note.id}`;
      window.id = `${window.dataset.app}-window`;
      const column = index % 3;
      const row = Math.floor(index / 3);
      if (index > 0) {
        window.style.left = `clamp(8px, calc(50% - 140px + ${column * 160 - (row % 2) * 100}px), calc(100% - 288px))`;
        window.style.top = `clamp(35px, ${90 + row * 100 + column * 32}px, calc(100% - 285px))`;
      }
      $('#stickies-windows').append(window);
      windows.push(window);
      setupWindow(window);
      stickyWindows.set(note.id, window);
    }
    window.style.setProperty('--sticky-index', index);
    const title = stickyTitle(note);
    window.dataset.colour = note.colour;
    window.setAttribute('aria-label', title);
    $('.window-title', window).textContent = title;
    const paper = $('.note-paper', window);
    paper.replaceChildren();
    if (note.text) {
      const text = document.createElement('p');
      text.textContent = note.text;
      paper.append(text);
    }
    const media = document.createElement('div');
    media.className = 'sticky-media';
    if (note.linkLabel && validStickyLink(note.link)) {
      const link = document.createElement('a');
      link.href = note.link;
      link.textContent = note.linkLabel;
      media.append(link);
    }
    for (const source of note.images) {
      const img = document.createElement('img');
      img.src = stickyImage(source);
      img.alt = source === 'monke' ? 'A monkey looking thoughtful' : '';
      img.draggable = false;
      media.append(img);
    }
    if (media.childElementCount) paper.append(media);
  });
  refreshIndicators();
}

function openStickies(slow) {
  if (!stickyWindows.size) {
    closeMenus();
    toast('No visible notes.');
    return;
  }
  for (const window of stickyWindows.values()) openApp(window.dataset.app, slow);
}

async function encodeStickyImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose a PNG, JPEG, WebP, GIF or AVIF up to 12 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    for (const size of [650, 480, 320, 220]) {
      const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/webp', 0.78);
      if (image.startsWith('data:image/webp;') && image.length <= 65559) return image;
    }
    throw new Error('This image is too large.');
  } finally {
    bitmap.close();
  }
}

function setupStickiesEditor({ getSettings, change }) {
  const dialog = $('#stickies-editor');
  const picker = $('#stickies-picker');
  const fields = $('#sticky-fields');
  const shortcut = $('#stickies-shortcut');
  const upload = $('#sticky-upload');
  const status = $('#stickies-status');
  const visible = $('#sticky-visible');
  const add = $('#stickies-add');
  const done = $('#stickies-done');
  const inputs = {
    title: $('#sticky-title'),
    text: $('#sticky-text'),
    colour: $('#sticky-colour'),
    linkLabel: $('#sticky-link-label'),
    link: $('#sticky-link')
  };
  let uploading = false;
  const notes = () => getSettings().notes;
  const selected = () => notes().find(note => note.id === picker.value);

  function refreshFields() {
    const note = selected();
    fields.hidden = !note;
    if (!note) return;
    for (const [key, input] of Object.entries(inputs)) input.value = note[key];
    visible.checked = note.visible;
    renderImages(note);
  }

  function renderImages(note) {
    const images = $('#sticky-images');
    images.replaceChildren();
    upload.disabled = uploading || note.images.length >= 4;
    note.images.forEach((image, index) => {
      const item = document.createElement('div');
      const preview = document.createElement('img');
      preview.src = stickyImage(image);
      preview.alt = '';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove image ${index + 1}`);
      remove.addEventListener('click', () => {
        note.images.splice(index, 1);
        status.textContent = '';
        change();
        renderImages(note);
      });
      item.append(preview, remove);
      images.append(item);
    });
  }

  function refreshPicker(id = picker.value) {
    picker.replaceChildren(...notes().map(note => new Option(stickyTitle(note), note.id)));
    if (notes().some(note => note.id === id)) picker.value = id;
    picker.disabled = !notes().length;
    add.disabled = notes().length >= 12;
    refreshFields();
  }

  picker.addEventListener('change', refreshFields);
  shortcut.addEventListener('change', () => {
    getSettings().shortcut = shortcut.checked;
    change();
  });
  visible.addEventListener('change', () => {
    selected().visible = visible.checked;
    change();
  });
  for (const [key, input] of Object.entries(inputs)) {
    input.addEventListener('input', () => {
      const note = selected();
      const value = key === 'link' ? input.value.trim() : input.value;
      if (key === 'link' && value && !validStickyLink(value)) {
        status.textContent = 'Enter a link starting with https://, http:// or mailto:.';
        return;
      }
      status.textContent = '';
      const previous = note[key];
      note[key] = value;
      if (stickySettingsSize(getSettings()) > 278000) {
        note[key] = input.value = previous;
        status.textContent = 'Remove an image to make room for more text.';
        return;
      }
      if (key === 'title') picker.selectedOptions[0].textContent = stickyTitle(note);
      change();
    });
  }
  add.addEventListener('click', () => {
    const note = {
      id: crypto.randomUUID(),
      title: 'New note',
      text: '',
      linkLabel: '',
      link: '',
      colour: 'yellow',
      visible: true,
      images: []
    };
    notes().push(note);
    refreshPicker(note.id);
    change();
    inputs.title.focus();
    inputs.title.select();
  });
  $('#stickies-delete').addEventListener('click', () => {
    const note = selected();
    if (!note || !confirm(`Delete “${stickyTitle(note)}”?`)) return;
    notes().splice(notes().indexOf(note), 1);
    refreshPicker();
    change();
    (picker.disabled ? add : picker).focus();
  });
  upload.addEventListener('change', async () => {
    const note = selected();
    const file = upload.files[0];
    upload.value = '';
    if (!file || !note || uploading || note.images.length >= 4) return;
    uploading = upload.disabled = done.disabled = true;
    status.textContent = 'Preparing image…';
    try {
      const image = await encodeStickyImage(file);
      if (!notes().includes(note)) return;
      note.images.push(image);
      if (stickySettingsSize(getSettings()) > 278000) {
        note.images.pop();
        throw new Error('Remove an image to make room for this one.');
      }
      change();
      status.textContent = '';
    } catch (error) {
      status.textContent = error instanceof DOMException ? 'Could not open this image.' : error.message;
    } finally {
      uploading = done.disabled = false;
      if (selected()) renderImages(selected());
    }
  });
  done.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    if (uploading) event.preventDefault();
  });
  return () => {
    shortcut.checked = getSettings().shortcut;
    status.textContent = '';
    refreshPicker();
    dialog.showModal();
  };
}

renderStickies(defaultStickies);
