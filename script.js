'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const works = portfolio.projects;
const normalizeSearch = value => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();
const projectSearchText = project => normalizeSearch([
  project.title,
  project.category,
  project.subtitle,
  project.summary,
  ...project.stack
].join(' '));
const apps = [
  { id: 'finder', name: 'My work', detail: 'Finder · Software projects', icon: 'assets/icons/macos-10.6/finder.png', keys: 'projects projetos programação software portfolio' },
  { id: 'notes', name: 'Stickies', detail: 'Desktop notes', icon: 'assets/icons/macos-10.6/stickies.png', keys: 'notes notas' },
  { id: 'mail', name: 'Contact', detail: 'Bernardo Maia · LinkedIn and GitHub', icon: 'assets/icons/macos-10.6/mail.png', keys: 'contacto linkedin projetos oportunidades' },
  { id: 'safari', name: 'Safari', detail: 'My archive · Projects and GitHub', icon: 'assets/icons/safari.png', keys: 'browser web biografia programação github atividade contribuições' },
  { id: 'portrait', name: 'hi.webp', detail: 'Preview · Bernardo Maia', icon: 'assets/icons/macos-10.6/preview.png', keys: 'profile photo portrait monograma' },
  { id: 'cv', name: 'CV.pdf', detail: 'Preview · Bernardo Maia', icon: 'assets/icons/cv-txt.png', keys: 'cv resume curriculum vitae' },
  { id: 'ipod', name: 'iPod Classic', detail: 'Music player', icon: 'assets/icons/ipod-classic.png', keys: 'music música songs canções playlist' },
  { id: 'settings', name: 'System Preferences', detail: 'Desktop & Sound', icon: 'assets/icons/macos-10.6/preferences.png', keys: 'wallpaper background sound motion' },
  { id: 'bin', name: 'Trash', detail: 'Trash is empty', icon: 'assets/icons/macos-10.6/trash-empty.png', keys: 'bin lixo caixote' },
  { id: 'about', name: 'About This Portfolio', detail: 'BMaiaOS · Bernardo Maia', icon: 'assets/icons/logochrome.svg?v=4b20f40a0838', keys: 'maia os x github portfolio' }
];
const portfolioPages = [
  { name: 'Bernardo Maia', route: '/wiki/Bernardo_Maia', icon: 'assets/images/me.webp', keys: 'computer engineer biography about me engenheiro informático biografia sobre mim' },
  { name: 'GitHub Contributions', route: '/wiki/GitHub', icon: 'assets/projects/github-icon.svg', keys: 'github activity contributions commits calendar atividade contribuições calendário' },
  { name: 'Languages and Tools', route: '/wiki/Technologies', icon: 'assets/icons/macos-10.6/stickies.png', keys: 'technology tools skills programming tecnologias programação' }
];
const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`zbor-v2:${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`zbor-v2:${key}`, JSON.stringify(value));
    } catch {
      /* Storage is optional in private browsing. */
    }
  }
};
let prefs = storage.get('preferences',{sound:false,motion:false});
let desktopWallpaper = 'galaxy';
if(!prefs || typeof prefs !== 'object') prefs = {};
let topZ = 20;
let activeApp = null;
let currentFolder = 'all';
let currentView = 'grid';
let selectedWork = null;
let previewIndex = 0;
let desktopHidden = [];
let toastTimer;
let spotlightExpanded = false;
const windowAnimations = new Map();
const folderHistory = ['all'];
let folderHistoryIndex = 0;
const windows = $$('.window');
const appWindow = id => $(`#${id}-window`);
const pinnedDockApps = new Set($$('#dock > [data-open]').map(button => button.dataset.open));
const dockWindowEntries = new Map();
const dockSlotMotions = new WeakMap();
let dockMenuAnchor = null;
function dockTarget(id) {
  return dockWindowEntries.get(id) || $(`#dock > [data-open="${appWindow(id)?.classList.contains('notes') ? 'notes' : id}"]`) || $('#dock');
}
function setDockSlotPresence(slot, value) {
  const presence = Math.max(0, Math.min(1, value));
  const button = $('.dock-window-entry', slot);
  const gap = parseFloat(getComputedStyle($('#dock')).columnGap) || 0;
  slot.dataset.presence = String(presence);
  slot.style.width = `${button.clientWidth * presence}px`;
  slot.style.marginLeft = `${-gap * (1 - presence)}px`;
  slot.style.opacity = String(presence);
}
function stopDockSlotMotion(slot) {
  const motion = dockSlotMotions.get(slot);
  if (motion) cancelAnimationFrame(motion.frame);
  dockSlotMotions.delete(slot);
}
function animateDockSlot(slot,target,onfinish){
  stopDockSlotMotion(slot);
  const from=Number(slot.dataset.presence??1);
  if (reduceMotion() || Math.abs(target - from) < .001) {
    setDockSlotPresence(slot, target);
    onfinish?.();
    return;
  }
  const start = performance.now();
  const motion = { frame: 0 };
  dockSlotMotions.set(slot, motion);
  const tick = time => {
    const t = Math.min(1, (time - start) / 280);
    const ease = t * t * (3 - 2 * t);
    setDockSlotPresence(slot, from + (target - from) * ease);
    if (t < 1) {
      motion.frame = requestAnimationFrame(tick);
    } else {
      dockSlotMotions.delete(slot);
      onfinish?.();
    }
  };
  motion.frame=requestAnimationFrame(tick);
}
function retireDockWindow(button){
  if(dockMenuAnchor===button)closeMenus();
  const slot=button.parentElement;slot.inert=true;
  animateDockSlot(slot,0,()=>{slot.remove();$('#dock-windows').hidden=!$('#dock-windows').childElementCount;const resized=fitDock();if(resized)for(const id of dockWindowEntries.keys()){setDockSlotPresence(dockWindowEntries.get(id).parentElement,Number(dockWindowEntries.get(id).parentElement.dataset.presence??1));updateDockThumbnail(id);}});
}
function transferDockWindow(id, progress) {
  const button = dockWindowEntries.get(id);
  if (!button) return;
  const slot = button.parentElement;
  stopDockSlotMotion(slot);
  const t = Math.max(0, Math.min(1, (progress - .12) / .72));
  setDockSlotPresence(slot, t * t * (3 - 2 * t));
  const blend = Math.max(0, Math.min(1, (progress - .78) / .22));
  button.style.setProperty('--preview-presence', String(blend * blend * (3 - 2 * blend)));
  button.classList.add('genie-transfer');
}
function fitDock() {
  const dock = $('#dock');
  const count = $$('.dock-item', dock).length;
  const mobile = innerWidth <= 640;
  const previousSize = dock.classList.contains('compact-dock')
    ? dock.style.getPropertyValue('--compact-icon-size')
    : 'normal';
  const compact = count * (mobile ? 45 : 58) + (count + 1) * (mobile ? 14 : 17) + 65 > innerWidth - 16;
  dock.classList.toggle('compact-dock',compact);
  if (compact) {
    dock.style.setProperty(
      '--compact-icon-size',
      `${Math.max(16, Math.floor((innerWidth - 80 - (count + 1) * 8) / count))}px`
    );
  }
  return previousSize !== (compact ? dock.style.getPropertyValue('--compact-icon-size') : 'normal');
}
function updateDockThumbnail(id) {
  const button = dockWindowEntries.get(id);
  const source = appWindow(id);
  if (!button || !source) return;
  const preview = $('.dock-window-preview', button);
  const rect = source.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const slotWidth = button.clientWidth;
  const slotHeight = slotWidth * .74;
  const aspect = rect.width / rect.height;
  const previewWidth = Math.min(slotWidth, slotHeight * aspect);
  const previewHeight = Math.min(slotHeight, slotWidth / aspect);
  preview.style.width = `${previewWidth}px`;
  preview.style.height = `${previewHeight}px`;
  button.style.setProperty('--window-preview-width', `${previewWidth}px`);
  const scale = Math.min(preview.clientWidth / rect.width, preview.clientHeight / rect.height);
  const clone = source.cloneNode(true);
  const originals = [source, ...$$('*', source)];
  const copies = [clone, ...$$('*', clone)];
  copies.forEach((copy, index) => {
    copy.removeAttribute('id');
    copy.removeAttribute('autofocus');
    if (copy instanceof HTMLInputElement) copy.value = originals[index].value;
    if (copy instanceof HTMLTextAreaElement) copy.value = originals[index].value;
  });
  $$('iframe',clone).forEach(frame=>frame.remove());
  $$('[data-genie-preview]',clone).forEach(image=>image.style.opacity='1');
  clone.hidden = false;
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.remove('maximized');
  const thumbnailStyle = {
    position: 'absolute',
    left: `${(preview.clientWidth - rect.width * scale) / 2}px`,
    top: `${(preview.clientHeight - rect.height * scale) / 2}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    'min-width': '0px',
    'min-height': '0px',
    'max-width': 'none',
    'max-height': 'none',
    margin: '0px',
    visibility: 'visible',
    opacity: '1',
    'pointer-events': 'none',
    resize: 'none',
    'box-shadow': 'none',
    animation: 'none',
    'transform-origin': '0 0',
    transform: `scale(${scale})`
  };
  for (const [property, value] of Object.entries(thumbnailStyle)) {
    clone.style.setProperty(property, value, 'important');
  }
  preview.replaceChildren(clone);
  copies.forEach((copy, index) => {
    if (originals[index].scrollTop) copy.scrollTop = originals[index].scrollTop;
    if (originals[index].scrollLeft) copy.scrollLeft = originals[index].scrollLeft;
  });
}
function syncDockWindows(){
  const zone=$('#dock-windows');
  for(const w of windows){
    const id=w.dataset.app;
    const wanted=w.dataset.running==='true'&&(w.dataset.minimized==='true'||w.dataset.restoring==='true');
    let button=dockWindowEntries.get(id);
    if(!wanted){if(button){dockWindowEntries.delete(id);retireDockWindow(button);}continue;}
    if(!button){
      button=document.createElement('button');button.className='dock-item dock-window-entry';button.dataset.windowId=id;
      button.setAttribute('aria-controls','dock-window-menu');button.setAttribute('aria-expanded','false');
      const tooltip=document.createElement('span');tooltip.className='dock-tooltip';
      const preview=document.createElement('span');preview.className='dock-window-preview';preview.setAttribute('aria-hidden','true');
      const badge=document.createElement('img');badge.className='dock-window-badge';badge.alt='';
      const badgeApp = w.classList.contains('notes') ? 'notes' : id;
      badge.src=pinnedDockApps.has(badgeApp)||id==='portrait'||id==='cv'||id==='ipod'?apps.find(app=>app.id===badgeApp).icon:'assets/icons/macos-10.6/finder.png';
      button.append(tooltip,preview,badge);button.addEventListener('click',e=>openApp(id,e.shiftKey));
      button.addEventListener('contextmenu',e=>{e.preventDefault();showDockWindowMenu(id,button);});
      button.addEventListener('keydown',e=>{if(e.key==='Delete'){e.preventDefault();hideWindow(id,true);}if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();showDockWindowMenu(id,button);}});
      const slot=document.createElement('div');slot.className='dock-window-slot';slot.dataset.presence='0';
      Object.assign(slot.style,{width:'0px',opacity:'0',marginLeft:`${-(parseFloat(getComputedStyle($('#dock')).columnGap)||0)}px`});
      slot.append(button);dockWindowEntries.set(id,button);zone.append(slot);
    }
    const label=$('.window-title',w).textContent;
    $('.dock-tooltip',button).textContent=label;
    button.setAttribute('aria-label',`Open window: ${label}`);
  }
  zone.hidden=!zone.childElementCount;const resized=fitDock();
  for(const [id,button] of dockWindowEntries){if(resized)setDockSlotPresence(button.parentElement,Number(button.parentElement.dataset.presence??1));if(resized||!$('.dock-window-preview',button).childElementCount)updateDockThumbnail(id);}
}
function showDockWindowMenu(id,button){
  closeMenus();
  const menu=$('#dock-window-menu'),action=$('#open-dock-window');
  dockMenuAnchor=button;
  button.setAttribute('aria-expanded','true');
  const title=$('.window-title',appWindow(id)).textContent;
  action.textContent=`Open “${title}”`;
  $('#close-dock-window').textContent=`Close “${title}”`;
  menu.hidden=false;
  const rect=$('.dock-window-preview',button).getBoundingClientRect();
  const center=rect.left+rect.width/2,width=menu.offsetWidth;
  const left=Math.max(8,Math.min(innerWidth-width-8,center-width/2));
  menu.style.left=`${left}px`;
  menu.style.top=`${rect.top-menu.offsetHeight-22}px`;
  menu.style.setProperty('--dock-menu-tip',`${Math.max(16,Math.min(width-16,center-left))}px`);
  action.focus({preventScroll:true});
}
$('#open-dock-window').addEventListener('click',e=>{
  if(dockMenuAnchor)openApp(dockMenuAnchor.dataset.windowId,e.shiftKey);
});
$('#close-dock-window').addEventListener('click',()=>{
  const id=dockMenuAnchor?.dataset.windowId;
  closeMenus();
  if(id)hideWindow(id,true);
});
$('#dock-window-menu').addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  e.stopPropagation();
  const anchor=dockMenuAnchor;
  closeMenus();
  anchor?.focus({preventScroll:true});
});
window.addEventListener('resize',()=>{fitDock();for(const [id,button] of dockWindowEntries){setDockSlotPresence(button.parentElement,Number(button.parentElement.dataset.presence??1));updateDockThumbnail(id);}});
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
function setActive(id) {
  activeApp = id;
  windows.forEach(window => window.classList.toggle('inactive', window.dataset.app !== id));
  const name = {
    finder: 'Finder',
    mail: 'Mail',
    safari: 'Safari',
    portrait: 'Preview',
    cv: 'Preview',
    ipod: 'iPod Classic',
    bin: 'Finder',
    settings: 'System Preferences',
    about: 'Finder'
  };
  $('#active-app').textContent = appWindow(id)?.classList.contains('notes') ? 'Stickies' : name[id] || 'Finder';
  $$('.safari-menu-button').forEach(button => button.hidden = id !== 'safari');
}
function focusWindow(id, keyboard = false) {
  const window = appWindow(id);
  if (!window) return;
  window.style.zIndex = ++topZ;
  setActive(id);
  if (keyboard) window.focus({ preventScroll: true });
}
function refreshIndicators() {
  $$('#dock > [data-open]').forEach(button => {
    const id = button.dataset.open;
    const running = id === 'notes'
      ? windows.some(window => window.classList.contains('notes') && window.dataset.running === 'true')
      : appWindow(id)?.dataset.running === 'true';
    button.classList.toggle('running', running);
  });
  syncDockWindows();
}
const ipodEmbed = 'https://ipod-classic-revamped.vercel.app/embed';
const ipodFrame = $('#portfolio-ipod');
async function ipodPlayerUrl(){
  const player = new URL(ipodEmbed);
  player.searchParams.set('youtube', 'visible');
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    player.searchParams.set('parentOrigin', location.origin);
  }
  const playlist = new URL('music/playlist.json', document.baseURI);
  try {
    const response = await fetch(playlist);
    if (!response.ok) return player.href;
    const tracks = await response.json();
    if (!Array.isArray(tracks) || !tracks.length) return player.href;
    if (tracks.some(track => typeof track?.url !== 'string' || !track.url.trim())) return player.href;
    const songs = tracks.map(track => ({
      ...track,
      url: new URL(track.url, playlist).href,
      ...(track.artwork?.url && {
        artwork: {
          ...track.artwork,
          url: new URL(track.artwork.url, playlist).href
        }
      })
    }));
    player.hash = new URLSearchParams({ playlist: JSON.stringify(songs) }).toString();
  } catch (error) {
    console.warn('Using the iPod demo playlist.', error);
  }
  return player.href;
}
let ipodPlayerSource;
function openApp(id, slow = false) {
  if (id === 'notes') {
    openStickies(slow);
    return;
  }
  const window = appWindow(id);
  if (!window) return;
  const wasMinimized = window.dataset.minimized === 'true';
  const wasRunning = window.dataset.running === 'true';
  window.dataset.restoring = String(wasMinimized || window.dataset.restoring === 'true');
  window.dataset.minimized = 'false';
  window.hidden = false;
  window.dataset.running = 'true';
  desktopHidden = desktopHidden.filter(app => app !== id);
  focusWindow(id, true);
  refreshIndicators();
  closeMenus();
  if (id === 'ipod' && !wasRunning) {
    ipodPlayerSource ??= ipodPlayerUrl();
    ipodPlayerSource.then(source => {
      if (window.dataset.running === 'true' && !ipodFrame.hasAttribute('src')) {
        ipodFrame.src = source;
      }
    });
  }
  if (wasMinimized) {
    animateToDock(window, true, slow);
  } else if (!wasRunning && !reduceMotion()) {
    const icon = $(`#dock > [data-open="${id}"]`);
    icon?.classList.remove('launching');
    if (icon) {
      void icon.offsetWidth;
      icon.classList.add('launching');
      setTimeout(() => icon.classList.remove('launching'), 700);
    }
  }
  globalThis.GenieEffect?.schedule(window);
}
function reduceMotion(){return !!prefs.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;}
function setIpodDisplay(w,off,immediate=false){
  const preview=$('[data-genie-preview]',w);
  const from=Number(getComputedStyle(preview).opacity),to=off?1:0;
  preview.getAnimations().forEach(animation=>animation.cancel());
  preview.style.opacity=String(to);
  if(immediate||from===to)return;
  return preview.animate([{opacity:from},{opacity:to}],{
    duration:off?190:260,
    easing:off?'ease-in':'ease-out'
  });
}
function animateToDock(w,restore=false,slow=false){
  const id=w.dataset.app;
  const icon=dockTarget(id);
  const settled=()=>{
    const button=dockWindowEntries.get(id);
    if(button){
      button.classList.remove('genie-transfer');
      button.style.removeProperty('--preview-presence');
      if(w.dataset.minimized==='true')setDockSlotPresence(button.parentElement,1);
    }
    w.dataset.restoring='false';
    syncDockWindows();
    if(w.dataset.minimized!=='true'){
      if(id==='ipod')setIpodDisplay(w,false,reduceMotion());
      if(activeApp===id)w.focus({preventScroll:true});
    }
  };
  if(reduceMotion()){windowAnimations.get(id)?.cancel();windowAnimations.delete(id);w.hidden=!restore;settled();return;}
  const duration=slow?5400:540;
  const running=windowAnimations.get(id);
  if(running){running.to(restore?0:1,duration);return;}
  const startGenie=()=>{
    try{
      const animation=GenieEffect.play(w,icon,{restore,duration,onprogress:progress=>transferDockWindow(id,progress),onfinish:()=>{if(windowAnimations.get(id)===animation)windowAnimations.delete(id);settled();}});
      windowAnimations.set(id,animation);
    }catch{w.hidden=!restore;w.style.visibility='';w.style.pointerEvents='';settled();}
  };
  if(id==='ipod'){
    const fade=setIpodDisplay(w,true,restore);
    if(fade){
      const powerOff={
        to(goal){
          if(goal===0){windowAnimations.delete(id);settled();}
        },
        cancel(){fade.cancel();},
        finish(){this.cancel();windowAnimations.delete(id);w.hidden=true;settled();}
      };
      windowAnimations.set(id,powerOff);
      fade.onfinish=()=>{
        if(windowAnimations.get(id)!==powerOff)return;
        windowAnimations.delete(id);
        startGenie();
      };
      return;
    }
  }
  startGenie();
}
function frontWindow(){return windows.filter(w=>!w.hidden).sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0];}
function hideWindow(id,close=false,slow=false){
  const w=appWindow(id);if(!w)return;
  if(close){windowAnimations.get(id)?.cancel();windowAnimations.delete(id);w.hidden=true;w.dataset.running='false';w.dataset.minimized='false';w.dataset.restoring='false';}
  else{w.dataset.minimized='true';syncDockWindows();updateDockThumbnail(id);animateToDock(w,false,slow);}
  if(close&&id==='ipod'){
    setIpodDisplay(w,false,true);
    ipodFrame.removeAttribute('src');
  }
  desktopHidden=desktopHidden.filter(a=>a!==id);refreshIndicators();const front=windows.filter(x=>x!==w&&!x.hidden&&x.dataset.minimized!=='true').sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0];setActive(front?.dataset.app||null);
  if(front)front.focus({preventScroll:true});else{const target=dockTarget(id);(target.matches('button')?target:$('#dock > [data-open="finder"]')).focus({preventScroll:true});}
}
function removeStickyWindow(window) {
  const id = window.dataset.app;
  windowAnimations.get(id)?.cancel();
  windowAnimations.delete(id);
  desktopHidden = desktopHidden.filter(app => app !== id);
  windows.splice(windows.indexOf(window), 1);
  window.remove();
  if (activeApp === id) setActive(frontWindow()?.dataset.app || null);
}
function maximize(id){
  const w=appWindow(id);
  const maximized=w.classList.toggle('maximized');
  const button=$('.traffic-lights button:nth-child(3)',w);
  button.title=maximized?'Restore':'Maximize';
  button.setAttribute('aria-label',`${button.title} ${id}`);
  button.setAttribute('aria-pressed',maximized);
  focusWindow(id);
}
function closeMenus(){
  $$('.menu').forEach(menu=>menu.hidden=true);
  dockMenuAnchor?.setAttribute('aria-expanded','false');
  dockMenuAnchor=null;
  $('.menubar nav button[aria-expanded="true"]')?.setAttribute('aria-expanded','false');
  $('#sound-toggle').setAttribute('aria-expanded','false');
}
function toggleMenu(menu,button){
  const wasOpen=!menu.hidden;
  closeMenus();
  if(wasOpen)return;
  menu.hidden=false;
  if(!button)return;
  const {left}=button.getBoundingClientRect();
  menu.style.left=`${Math.max(0,Math.min(left,innerWidth-menu.offsetWidth-8))}px`;
  if(button.closest('.menubar'))button.setAttribute('aria-expanded','true');
}
function arrangeWindows(){windows.forEach((w,i)=>{w.classList.remove('maximized');w.style.removeProperty('width');w.style.removeProperty('height');w.style.left=`${Math.max(8,Math.min(innerWidth-w.offsetWidth-15,innerWidth/2-300+i*24))}px`;w.style.top=`${Math.max(35,Math.min(65+i*22,innerHeight-w.offsetHeight-100))}px`;});}
function showDesktop(){for(const animation of [...windowAnimations.values()])animation.finish();const visible=windows.filter(w=>!w.hidden);if(visible.length){desktopHidden=visible.map(w=>w.dataset.app);visible.forEach(w=>w.hidden=true);setActive(null);}else{const saved=[...desktopHidden];desktopHidden=[];saved.forEach(openApp);}closeMenus();}
function setupWindow(w) {
  const id=w.dataset.app;
  const sticky=w.classList.contains('notes');
  const controls=[['Close','×',()=>hideWindow(id,true)],['Minimize','−',e=>hideWindow(id,false,e.shiftKey)],['Maximize','+',()=>maximize(id)]];
  if (sticky) {
    $('.sticky-close',w).addEventListener('click',()=>hideWindow(id,true));
    $('.sticky-corner',w).addEventListener('click',()=>moveStickyToCorner(w));
  } else {
    controls.forEach(([label,symbol,action])=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`${label} ${id}`);button.title=label;button.textContent=symbol;button.addEventListener('click',action);$('.traffic-lights',w).append(button);});
  }
  w.addEventListener('pointerdown',()=>focusWindow(id));
  const resizeHandle=document.createElement('div');
  resizeHandle.className='window-resize-handle';
  resizeHandle.setAttribute('aria-hidden','true');
  w.append(resizeHandle);
  resizeHandle.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    e.preventDefault();
    const {width,height}=w.getBoundingClientRect();
    const {clientX,clientY,pointerId}=e;
    let frame=0,nextWidth=width,nextHeight=height;
    const paint=()=>{
      frame=0;
      w.style.width=`${nextWidth}px`;
      w.style.height=`${nextHeight}px`;
      if(sticky&&w.classList.contains('sticky-in-corner'))moveStickyToCorner(w);
    };
    const resize=event=>{
      if(event.pointerId!==pointerId)return;
      nextWidth=Math.max(0,width+event.clientX-clientX);
      nextHeight=Math.max(0,height+event.clientY-clientY);
      if(!frame)frame=requestAnimationFrame(paint);
    };
    const stop=event=>{
      if(event.pointerId!==pointerId)return;
      if(frame){cancelAnimationFrame(frame);paint();}
      resizeHandle.removeEventListener('pointermove',resize);
      resizeHandle.removeEventListener('pointerup',stop);
      resizeHandle.removeEventListener('pointercancel',stop);
      resizeHandle.removeEventListener('lostpointercapture',stop);
      globalThis.GenieEffect?.schedule(w);
    };
    resizeHandle.setPointerCapture(pointerId);
    resizeHandle.addEventListener('pointermove',resize);
    resizeHandle.addEventListener('pointerup',stop);
    resizeHandle.addEventListener('pointercancel',stop);
    resizeHandle.addEventListener('lostpointercapture',stop);
  });
  const bar=$('.titlebar',w);
  bar.addEventListener('dblclick',e=>{if(!e.target.closest('button')){if(sticky)moveStickyToCorner(w);else hideWindow(id,false,e.shiftKey);}});
  bar.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary||e.target.closest('button')||w.classList.contains('maximized')||innerWidth<=640)return;
    w.classList.remove('sticky-in-corner');
    const rect=w.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,pointerId=e.pointerId;
    // Keep the window's layout fixed while dragging so filtered SVGs can be
    // composited with the window instead of forcing a new layout on each event.
    const maxLeft=Math.max(0,innerWidth-rect.width),maxTop=Math.max(30,innerHeight-125);
    let frame=0,left=rect.left,top=rect.top;
    const paint=()=>{
      frame=0;
      w.style.transform=`translate3d(${left-rect.left}px,${top-rect.top}px,0)`;
    };
    const move=event=>{
      if(event.pointerId!==pointerId)return;
      left=Math.max(0,Math.min(maxLeft,rect.left+event.clientX-sx));
      top=Math.max(30,Math.min(maxTop,rect.top+event.clientY-sy));
      if(!frame)frame=requestAnimationFrame(paint);
    };
    const stop=event=>{
      if(event.pointerId!==pointerId)return;
      if(frame)cancelAnimationFrame(frame);
      w.style.left=`${left}px`;
      w.style.top=`${top}px`;
      w.style.removeProperty('transform');
      w.classList.remove('window-dragging');
      bar.removeEventListener('pointermove',move);
      bar.removeEventListener('pointerup',stop);
      bar.removeEventListener('pointercancel',stop);
      bar.removeEventListener('lostpointercapture',stop);
    };
    w.classList.add('window-dragging');
    bar.setPointerCapture(pointerId);
    bar.addEventListener('pointermove',move);
    bar.addEventListener('pointerup',stop);
    bar.addEventListener('pointercancel',stop);
    bar.addEventListener('lostpointercapture',stop);
  });
}
windows.forEach(setupWindow);
$$('[data-open]:not(.desktop-file)').forEach(b=>b.addEventListener('click',e=>openApp(b.dataset.open,e.shiftKey)));
$('#active-app').addEventListener('click',()=>openApp(activeApp||'finder'));
$('#system-menu-button').addEventListener('click',e=>{e.stopPropagation();toggleMenu($('#system-menu'),e.currentTarget);});
$$('[data-menu]').forEach(button=>{
  button.setAttribute('aria-expanded','false');
  button.addEventListener('click',event=>{
    event.stopPropagation();
    toggleMenu($(`#${button.dataset.menu}`),button);
  });
});
document.addEventListener('click',e=>{if(!e.target.closest('.menu'))closeMenus();});
$('#close-active').addEventListener('click',()=>{if(activeApp)hideWindow(activeApp,true);closeMenus();});
$('#show-desktop').addEventListener('click',showDesktop);
$('#reset-layout').addEventListener('click',()=>{arrangeWindows();closeMenus();});
$('#context-arrange').addEventListener('click',()=>{arrangeWindows();closeMenus();});
$('#desktop').addEventListener('contextmenu',e=>{if(e.target.closest('.window,#dock,a,button'))return;e.preventDefault();closeMenus();const menu=$('#context-menu');menu.hidden=false;menu.style.left=`${Math.min(e.clientX,innerWidth-menu.offsetWidth-8)}px`;menu.style.top=`${Math.min(e.clientY,innerHeight-menu.offsetHeight-8)}px`;});
function renderGallery(){
  const q=normalizeSearch($('#work-search').value);
  const filtered=works.filter(w=>(currentFolder==='all'||(currentFolder==='apps'?['mobile','desktop'].includes(w.type):w.type===currentFolder))&&projectSearchText(w).includes(q));
  const grid=$('#gallery-grid');grid.replaceChildren();grid.classList.toggle('list',currentView==='list');
  filtered.forEach(w=>{
    const button=document.createElement('button');button.className='artwork';button.dataset.work=w.id;button.setAttribute('aria-label',`Open ${w.title}, ${w.category}`);
    button.classList.toggle('selected-art',w.id===selectedWork);
    button.setAttribute('aria-pressed',String(w.id===selectedWork));
    const frame=document.createElement('span');frame.className='artwork-image';
    const img=document.createElement('img');img.src=currentView==='list'?w.icon:w.file;img.alt=w.title;img.loading='lazy';img.decoding='async';frame.append(img);
    const info=document.createElement('span');info.className='artwork-info';const title=document.createElement('strong');title.textContent=w.title;const type=document.createElement('small');type.textContent=w.stack[0];info.append(title,type);button.append(frame,info);
    button.addEventListener('click',()=>selectArtwork(w.id));
    button.addEventListener('dblclick',()=>openSafariProject(w.id));
    button.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openSafariProject(w.id);}});grid.append(button);
  });
  $('#item-count').textContent=`${filtered.length} ${filtered.length===1?'item':'items'}`;$('#empty-search').hidden=!!filtered.length;
  $('#folder-name').textContent={all:'My work',web:'Web & cloud',apps:'Mobile & desktop'}[currentFolder];$('.folder-heading h1').textContent=$('#folder-name').textContent;
  $('#finder-window .window-title').textContent=$('#folder-name').textContent;
}
function selectArtwork(id){selectedWork=id;$$('.artwork').forEach(b=>{const selected=b.dataset.work===id;b.classList.toggle('selected-art',selected);b.setAttribute('aria-pressed',selected);});}
$('#work-search').addEventListener('input',renderGallery);
function changeFolder(folder,record=true){currentFolder=folder;selectedWork=null;if(record){folderHistory.splice(folderHistoryIndex+1);folderHistory.push(folder);folderHistoryIndex=folderHistory.length-1;}$$('[data-folder]').forEach(x=>x.classList.toggle('selected',x.dataset.folder===folder));$('#folder-back').disabled=folderHistoryIndex===0;$('#folder-forward').disabled=folderHistoryIndex===folderHistory.length-1;renderGallery();}
$$('[data-folder]').forEach(b=>b.addEventListener('click',()=>changeFolder(b.dataset.folder)));
$('#folder-back').addEventListener('click',()=>{if(folderHistoryIndex>0)changeFolder(folderHistory[--folderHistoryIndex],false);});
$('#folder-forward').addEventListener('click',()=>{if(folderHistoryIndex<folderHistory.length-1)changeFolder(folderHistory[++folderHistoryIndex],false);});
$('#quicklook-selected').addEventListener('click',()=>{if(selectedWork)openPreview(selectedWork);});
$('#finder-actions').addEventListener('click',e=>toggleMenu($('#view-menu'),e.currentTarget));
[['#grid-view','grid'],['#list-view','list']].forEach(([sel,mode])=>$(sel).addEventListener('click',()=>{currentView=mode;$('#grid-view').classList.toggle('selected',mode==='grid');$('#list-view').classList.toggle('selected',mode==='list');$('#grid-view').setAttribute('aria-pressed',mode==='grid');$('#list-view').setAttribute('aria-pressed',mode==='list');renderGallery();}));
function updatePreview(){
  const work=works[previewIndex];
  $('#preview-image').src=work.file;
  $('#preview-title').textContent=work.title;
  $('#preview-name').textContent=work.title;
  $('#preview-category').textContent=work.category;
  $('#preview-description').textContent=work.subtitle;
  $('#preview-stack').textContent=work.stack.join(' · ');
  $('#preview-counter').textContent=`${previewIndex+1} of ${works.length}`;
  $('#preview-prev').disabled=previewIndex===0;
  $('#preview-next').disabled=previewIndex===works.length-1;
}
function openPreview(id){previewIndex=works.findIndex(w=>w.id===id);if(previewIndex<0)return;updatePreview();if(!$('#quicklook').open)$('#quicklook').showModal();}
function stepPreview(delta){previewIndex=Math.max(0,Math.min(works.length-1,previewIndex+delta));updatePreview();}
$('#preview-prev').addEventListener('click',()=>stepPreview(-1));$('#preview-next').addEventListener('click',()=>stepPreview(1));$('#preview-close').addEventListener('click',()=>$('#quicklook').close());
const quickLook=$('#quicklook'), previewExpand=$('#preview-expand');
const previewBar=$('header',quickLook);
function positionPreview(left,top){
  const maxLeft=Math.max(0,innerWidth-quickLook.offsetWidth);
  const maxTop=Math.max(0,innerHeight-quickLook.offsetHeight);
  quickLook.style.setProperty('--preview-left',`${Math.max(0,Math.min(left,maxLeft))}px`);
  quickLook.style.setProperty('--preview-top',`${Math.max(0,Math.min(top,maxTop))}px`);
  quickLook.classList.add('preview-positioned');
}
function keepPreviewOnscreen(){
  if(!quickLook.open||!quickLook.matches('.preview-positioned:not(.preview-expanded)'))return;
  const {left,top}=quickLook.getBoundingClientRect();
  positionPreview(left,top);
}
previewBar.addEventListener('pointerdown',event=>{
  if(event.button!==0||!event.isPrimary||event.target.closest('button')||quickLook.classList.contains('preview-expanded'))return;
  const {left,top}=quickLook.getBoundingClientRect();
  const startX=event.clientX, startY=event.clientY;
  previewBar.setPointerCapture(event.pointerId);
  const drag=move=>positionPreview(left+move.clientX-startX,top+move.clientY-startY);
  previewBar.addEventListener('pointermove',drag);
  previewBar.addEventListener('lostpointercapture',()=>previewBar.removeEventListener('pointermove',drag),{once:true});
});
window.addEventListener('resize',keepPreviewOnscreen);
function setPreviewExpanded(expanded){
  quickLook.classList.toggle('preview-expanded',expanded);
  previewExpand.setAttribute('aria-pressed',String(expanded));
  if(!expanded)keepPreviewOnscreen();
}
previewExpand.addEventListener('click',()=>setPreviewExpanded(!quickLook.classList.contains('preview-expanded')));
quickLook.addEventListener('close',()=>{
  quickLook.classList.remove('preview-positioned');
  setPreviewExpanded(false);
});
['#quicklook','#spotlight'].forEach(s=>$(s).addEventListener('click',e=>{
  if(e.target!==e.currentTarget)return;
  const r=e.currentTarget.getBoundingClientRect();
  if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)return;
  if(s==='#spotlight')closeSpotlight();
  else e.currentTarget.close();
}));
function moveStickyToCorner(note, focus = true){
  note.classList.add('sticky-in-corner');
  const dockTop=$('#dock').getBoundingClientRect().top;
  note.style.left='0px';
  note.style.top=`${Math.max(30,dockTop-note.getBoundingClientRect().height-8)}px`;
  if(focus)focusWindow(note.dataset.app);
  globalThis.GenieEffect?.schedule(note);
}
window.addEventListener('resize',()=>{
  windows.filter(w=>!w.hidden&&w.classList.contains('sticky-in-corner')).forEach(w=>moveStickyToCorner(w,false));
});
$('#contact-form').addEventListener('submit',e=>{
  e.preventDefault();
  const data=new FormData(e.currentTarget);
  const subject=encodeURIComponent('Projects and opportunities');
  const body=encodeURIComponent(`Hi Bernardo,\n\n${data.get('message')}\n\n${data.get('name')}`);
  window.location.href=`mailto:${portfolio.email}?subject=${subject}&body=${body}`;
});
$('#copy-email').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(portfolio.email);toast('Email address copied.');}
  catch{toast(`Email: ${portfolio.email}`);}
});
const startSound=$('#start-sound'), soundToggle=$('#sound-toggle'), soundVolume=$('#sound-volume'), soundMenu=$('#sound-menu');
function applySoundPreferences(){
  const level=Number.isFinite(prefs.volume)?Math.max(1,Math.min(prefs.volume,100)):100;
  startSound.volume=level/100;
  startSound.muted=!prefs.sound;
  if(prefs.sound&&startSound.preload==='none'){
    startSound.preload='auto';
    startSound.load();
  }
  soundVolume.value=prefs.sound?level:0;
  soundVolume.setAttribute('aria-valuetext',prefs.sound?`${level}%`:'Muted');
  soundToggle.toggleAttribute('data-muted',!prefs.sound);
  $('#sound-setting').checked=!!prefs.sound;
}
function applyWallpaper(){
  const wallpaperOptions=$$('[data-wallpaper]');
  const personalWallpaper=({classic:'horizon','snowy-hills':'snow-leopard-prowl'})[prefs.wallpaper]||prefs.wallpaper;
  const wallpaper=document.body.classList.contains('desktop-admin')?desktopWallpaper:personalWallpaper;
  const selectedWallpaper=wallpaperOptions.find(button=>button.dataset.wallpaper===wallpaper)
    ||wallpaperOptions.find(button=>button.dataset.wallpaper===desktopWallpaper)||wallpaperOptions[0];
  $('#desktop').style.backgroundImage=`url('${$('img',selectedWallpaper).getAttribute('src')}')`;
  wallpaperOptions.forEach(button=>button.setAttribute('aria-pressed',button===selectedWallpaper));
}
function applyPreferences(){
  applyWallpaper();
  document.body.classList.toggle('reduce-motion',!!prefs.motion);$('#motion-setting').checked=!!prefs.motion;
  applySoundPreferences();
}
function savePreferences(){storage.set('preferences',prefs);applyPreferences();}
$$('[data-wallpaper]').forEach(b=>b.addEventListener('click',()=>{
  if(document.body.classList.contains('desktop-admin'))return;
  prefs.wallpaper=b.dataset.wallpaper;
  savePreferences();
}));
$('#sound-setting').addEventListener('change',e=>{prefs.sound=e.target.checked;savePreferences();});$('#motion-setting').addEventListener('change',e=>{prefs.motion=e.target.checked;savePreferences();});
soundToggle.addEventListener('click',event=>{
  event.stopPropagation();
  toggleMenu(soundMenu,soundToggle);
  if(!soundMenu.hidden)soundVolume.focus({preventScroll:true});
});
soundVolume.addEventListener('input',()=>{
  const level=soundVolume.valueAsNumber;
  prefs.sound=level>0;
  if(prefs.sound)prefs.volume=level;
  applySoundPreferences();
  storage.set('preferences',prefs);
});
soundMenu.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  event.stopPropagation();
  closeMenus();
  soundToggle.focus({preventScroll:true});
});
$('#settings-reset').addEventListener('click',()=>{prefs={sound:false,motion:false};savePreferences();toast('Desktop preferences reset.');});
function renderSpotlight(){
  const q=normalizeSearch($('#spotlight-input').value);
  const results=$('#spotlight-results');results.replaceChildren();results.hidden=!q;
  $('#spotlight-preferences').removeAttribute('aria-selected');
  $('#spotlight footer').hidden=!q;$('#spotlight-clear').hidden=!q;
  if(!q)return;
  const matches=[...portfolioPages.filter(item=>normalizeSearch(`${item.name} ${item.keys}`).includes(q)).map(item=>({...item,kind:'page'})),...works.filter(w=>projectSearchText(w).includes(q)).map(w=>({...w,name:w.title,icon:w.icon,kind:'work'})),...apps.filter(a=>normalizeSearch(`${a.name} ${a.detail} ${a.keys}`).includes(q)).map(a=>({...a,kind:'app'}))];
  if(!matches.length){const p=document.createElement('p');p.className='spotlight-empty';p.textContent='No results found';results.append(p);return;}
  const actions=document.createElement('div');actions.className='spotlight-top-actions';
  const all=document.createElement('button');all.type='button';all.className='spotlight-result spotlight-show-all';
  all.textContent=spotlightExpanded?'Show Less':'Show All';
  all.addEventListener('click',()=>{
    const focused=document.activeElement===all;
    spotlightExpanded=!spotlightExpanded;
    renderSpotlight();
    const next=$('.spotlight-show-all');
    if(focused)next.focus({preventScroll:true});
    else selectSpotlight(next);
  });
  actions.append(all);results.append(actions);
  const groups=[['Top Hit',[matches[0]]],['Applications',matches.filter(item=>item.kind==='app')],['Projects',matches.filter(item=>item.kind==='work')],['Pages',matches.filter(item=>item.kind==='page')]];
  for(const [label,items] of groups){
    if(!items.length)continue;
    const group=document.createElement('section');group.className='spotlight-group';group.setAttribute('aria-label',label);
    const category=document.createElement('span');category.className='spotlight-category';category.textContent=label;
    const list=document.createElement('div');list.className='spotlight-group-items';
    for(const item of items.slice(0,spotlightExpanded?20:5)){
      const b=document.createElement('button');b.type='button';b.className='spotlight-result';
      b.setAttribute('aria-selected',label==='Top Hit');
      const img=document.createElement('img');img.src=item.icon;img.alt='';const name=document.createElement('span');name.textContent=item.name;b.append(img,name);
      b.addEventListener('click',()=>activateSpotlight(item));list.append(b);
    }
    group.append(category,list);results.append(group);
  }
}
function selectSpotlight(button){
  $$('.spotlight-result',$('#spotlight')).forEach(row=>row.setAttribute('aria-selected',row===button));
}
let spotlightClosing=false;
async function closeSpotlight(){
  const dialog=$('#spotlight');
  if(!dialog.open||spotlightClosing)return false;
  spotlightClosing=true;
  $('#spotlight-toggle').setAttribute('aria-expanded','false');
  let fade;
  if(!reduceMotion()){
    fade=dialog.animate([{opacity:1},{opacity:0}],{duration:160,easing:'ease-out',fill:'forwards'});
    await Promise.race([fade.finished.catch(()=>{}),new Promise(resolve=>setTimeout(resolve,220))]);
  }
  const wasOpen=dialog.open;
  if(wasOpen)dialog.close();
  fade?.cancel();
  spotlightClosing=false;
  return wasOpen;
}
async function activateSpotlight(item){if(!(await closeSpotlight()))return;if(item.kind==='app')openApp(item.id);else if(item.kind==='page')safariNavigate(item.route);else openSafariProject(item.id);}
function openSpotlight(){if(!document.body.classList.contains('logged-in'))return;closeMenus();if($('#quicklook').open)$('#quicklook').close();spotlightExpanded=false;$('#spotlight-input').value='';renderSpotlight();if(!$('#spotlight').open)$('#spotlight').showModal();$('#spotlight-toggle').setAttribute('aria-expanded','true');$('#spotlight-input').focus();}
['#spotlight-toggle','#menu-search','#finder-spotlight'].forEach(s=>$(s).addEventListener('click',openSpotlight));$('#spotlight-input').addEventListener('input',()=>{spotlightExpanded=false;renderSpotlight();});
$('#spotlight-clear').addEventListener('click',()=>{$('#spotlight-input').value='';spotlightExpanded=false;renderSpotlight();$('#spotlight-input').focus();});
$('#spotlight-preferences').addEventListener('click',async()=>{if(await closeSpotlight())openApp('settings');});
$('#spotlight').addEventListener('cancel',e=>{e.preventDefault();closeSpotlight();});
$('#spotlight').addEventListener('close',()=>$('#spotlight-toggle').setAttribute('aria-expanded','false'));
// A native input caret follows font metrics and ignores a shorter line-height.
// Keep the real input/selection, but draw a fixed-height caret over it.
const spotlightMeasure=document.createElement('canvas').getContext('2d');
let spotlightCaretFrame=0;
function updateSpotlightCaret(){
  const input=$('#spotlight-input'),caret=$('#spotlight-caret');
  const start=input.selectionStart,end=input.selectionEnd;
  if(document.activeElement!==input||start===null||start!==end){caret.hidden=true;return;}
  const style=getComputedStyle(input);
  spotlightMeasure.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  spotlightMeasure.fontKerning=style.fontKerning;
  const text=input.value.slice(0,start);
  const spacing=parseFloat(style.letterSpacing)||0;
  const left=input.offsetLeft+parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft)+spotlightMeasure.measureText(text).width+spacing*text.length-input.scrollLeft;
  const min=input.offsetLeft+parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft);
  const max=input.offsetLeft+input.offsetWidth-parseFloat(style.borderRightWidth)-parseFloat(style.paddingRight);
  caret.hidden=left<min-1||left>max+1;
  caret.style.left=`${left}px`;
}
function queueSpotlightCaret(){
  cancelAnimationFrame(spotlightCaretFrame);
  spotlightCaretFrame=requestAnimationFrame(updateSpotlightCaret);
}
for(const event of ['focus','input','click','keyup','keydown','scroll','select'])$('#spotlight-input').addEventListener(event,queueSpotlightCaret);
$('#spotlight-input').addEventListener('blur',()=>{$('#spotlight-caret').hidden=true;});
document.addEventListener('selectionchange',()=>{if($('#spotlight').open)queueSpotlightCaret();});
window.addEventListener('resize',queueSpotlightCaret);
const spotlightDialog=$('#spotlight');
for(const event of ['pointermove','focusin']){
  spotlightDialog.addEventListener(event,e=>{
    const button=e.target.closest('.spotlight-result');
    if(button&&button.getAttribute('aria-selected')!=='true')selectSpotlight(button);
  });
}
spotlightDialog.addEventListener('keydown',e=>{
  const selected=$('.spotlight-result[aria-selected="true"]',spotlightDialog);
  if(e.key==='Enter'&&e.target===$('#spotlight-input')&&selected){
    e.preventDefault();
    selected.click();
  }
  if(!['ArrowDown','ArrowUp'].includes(e.key))return;
  const rows=$$('.spotlight-result',spotlightDialog).filter(row=>!row.closest('[hidden]'));
  if(!rows.length)return;
  e.preventDefault();
  const step=e.key==='ArrowDown'?1:-1;
  const current=rows.indexOf(selected);
  const next=rows[current<0?(step===1?0:rows.length-1):(current+step+rows.length)%rows.length];
  if(e.target.closest('.spotlight-result'))next.focus({preventScroll:true});
  selectSpotlight(next);
  next.scrollIntoView({block:'nearest'});
});
let hasEntered=false,loginTimer;
const loginScreen=$('#login-screen');
const loginPowerReturn=$('#login-power-return');
function setLoginPower(state){
  const poweredDown=Boolean(state);
  const previousState=loginScreen.dataset.power;
  loginScreen.classList.toggle('power-reduced-motion',reduceMotion());
  if(poweredDown)loginScreen.dataset.power=state;
  else delete loginScreen.dataset.power;
  $('.login-wrapper',loginScreen).inert=poweredDown;
  loginPowerReturn.inert=!poweredDown;
  if(poweredDown){
    $('#login-power-hint').textContent=state==='sleep'?'Click anywhere to wake up':'Click anywhere to start up';
    loginPowerReturn.focus({preventScroll:true});
  }else {
    const source=previousState==='shutdown'?'#login-shutdown':'#login-sleep';
    $(source).focus({preventScroll:true});
  }
}
$('#login-sleep').addEventListener('click',()=>setLoginPower('sleep'));
$('#login-restart').addEventListener('click',()=>location.reload());
$('#login-shutdown').addEventListener('click',()=>setLoginPower('shutdown'));
loginPowerReturn.addEventListener('click',()=>setLoginPower(''));
$('#login-button').addEventListener('click',()=>{
  if(prefs.sound){
    // The recording has about 240 ms of silence before the chime.
    startSound.currentTime=.22;
    startSound.play().catch(()=>{});
  }
  document.body.classList.add('logged-in');$('#desktop').inert=false;$('#login-screen').inert=true;
  $('.menubar').inert=false;
  if(!hasEntered){
    hasEntered=true;
    openApp('safari');
  }else if(frontWindow()){
    focusWindow(frontWindow().dataset.app,true);
  }else{
    $('#dock button').focus();
  }
  loginTimer=setTimeout(()=>$('#login-screen').hidden=true,600);
});
$('#lock').addEventListener('click',async()=>{
  if(!document.body.classList.contains('logged-in'))return;
  clearTimeout(loginTimer);
  closeMenus();
  $('#spotlight').close();
  $('#quicklook').close();
  const screen=$('#login-screen');
  const startOpacity=screen.hidden?'0':getComputedStyle(screen).opacity;
  screen.style.setProperty('--lock-start-opacity',startOpacity);
  $('#desktop').inert=true;
  $('.menubar').inert=true;
  document.body.classList.replace('logged-in','locking');
  screen.hidden=false;
  await Promise.race([
    Promise.allSettled(screen.getAnimations().map(animation=>animation.finished)),
    new Promise(resolve=>setTimeout(resolve,280))
  ]);
  document.body.classList.remove('locking');
  screen.style.removeProperty('--lock-start-opacity');
  screen.inert=false;
  $('#login-button').focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{
  const loggedIn=document.body.classList.contains('logged-in');
  if(!loggedIn || $('#stickies-editor').open)return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if($('#spotlight').open)closeSpotlight();else openSpotlight();return;}
  if($('#spotlight').open)return;
  if($('#quicklook').open){if(e.key==='ArrowLeft'){e.preventDefault();stepPreview(-1);}if(e.key==='ArrowRight'){e.preventDefault();stepPreview(1);}return;}
  const editing=e.target.matches('input,textarea,[contenteditable]');
  if(e.key==='Escape'){closeMenus();selectArtwork(null);$$('.selected-file').forEach(x=>x.classList.remove('selected-file'));}
  if(editing)return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='w'&&activeApp){e.preventDefault();hideWindow(activeApp,true);}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='m'&&activeApp){e.preventDefault();hideWindow(activeApp);}
  if(e.altKey&&e.key.toLowerCase()==='d'){e.preventDefault();showDesktop();}
  if(e.code==='Space'&&activeApp==='finder'&&selectedWork&&e.target.closest('.artwork')){e.preventDefault();openPreview(selectedWork);}
});
window.addEventListener('resize',()=>{if(innerWidth<=640)return;windows.filter(w=>!w.hidden&&!w.classList.contains('maximized')).forEach(w=>{const r=w.getBoundingClientRect();w.style.left=`${Math.max(0,Math.min(r.left,innerWidth-w.offsetWidth))}px`;w.style.top=`${Math.max(30,Math.min(r.top,innerHeight-125))}px`;});});
function updateTime(){const now=new Date();$('#datetime').dateTime=now.toISOString();$('#datetime').textContent=now.toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'}).replace(',','');$('#datetime').title=now.toLocaleDateString(undefined,{dateStyle:'full'});}
// One click selects a desktop file. Double click opens it.
const desktopFiles=$$('.desktop-file');
function arrangeDesktopFiles(){
  const rows=Math.max(1,Math.floor((innerHeight-152)/90));
  desktopFiles.filter(file=>!file.hidden).forEach((file,index)=>{
    file.style.setProperty('--file-row',index%rows);
    file.style.setProperty('--file-column',Math.floor(index/rows));
  });
}
arrangeDesktopFiles();
window.addEventListener('resize',arrangeDesktopFiles);
function activateDesktopFile(file){if(file.dataset.open)openApp(file.dataset.open);else if(file.dataset.desktopPage)safariNavigate(file.dataset.desktopPage);else window.open(file.dataset.desktopUrl || file.href,'_blank','noopener,noreferrer');}
desktopFiles.forEach((file,index)=>{
  file.draggable=false;
  $$('img',file).forEach(image=>image.draggable=false);
  file.addEventListener('dragstart',event=>event.preventDefault());
  file.style.setProperty('--file-index',index);
  let suppressClick=false,lastDrag=-Infinity;
  file.addEventListener('click',e=>{
    e.preventDefault();
    if(suppressClick){suppressClick=false;return;}
    const modified=e.metaKey||e.ctrlKey||e.shiftKey;
    if(!modified)desktopFiles.filter(x=>x!==file).forEach(x=>x.classList.remove('selected-file'));
    file.classList.add('selected-file');
  });
  file.addEventListener('dblclick',e=>{e.preventDefault();if(performance.now()-lastDrag>300)activateDesktopFile(file);});
  file.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();activateDesktopFile(file);}if(e.code==='Space'){e.preventDefault();file.classList.add('selected-file');}});
  file.addEventListener('pointerdown',e=>{
    if(e.button!==0||(e.pointerType==='touch'&&!document.body.classList.contains('desktop-admin')))return;
    suppressClick=false;
    const sx=e.clientX,sy=e.clientY,pointerId=e.pointerId;
    const selected=desktopFiles.filter(icon=>icon.classList.contains('selected-file'));
    const group=file.classList.contains('selected-file')?selected:
      (e.metaKey||e.ctrlKey||e.shiftKey?[...selected,file]:[file]);
    const origins=group.map(icon=>({icon,rect:icon.getBoundingClientRect(),parent:icon.parentElement.getBoundingClientRect()}));
    const bounds={left:Math.min(...origins.map(item=>item.rect.left)),right:Math.max(...origins.map(item=>item.rect.right)),top:Math.min(...origins.map(item=>item.rect.top)),bottom:Math.max(...origins.map(item=>item.rect.bottom))};
    let moved=false,frame=0,dx=0,dy=0;
    const paint=()=>{
      frame=0;
      for(const {icon,rect,parent} of origins){
        icon.style.right='auto';
        icon.style.left=`${rect.left-parent.left+dx}px`;
        icon.style.top=`${rect.top-parent.top+dy}px`;
      }
    };
    const move=ev=>{
      if(ev.pointerId!==pointerId||(Math.hypot(ev.clientX-sx,ev.clientY-sy)<4&&!moved))return;
      if(!moved){
        moved=true;
        desktopFiles.forEach(icon=>icon.classList.toggle('selected-file',group.includes(icon)));
        group.forEach(icon=>icon.classList.add('dragging'));
      }
      dx=Math.max(Math.min(0,-bounds.left),Math.min(Math.max(0,innerWidth-bounds.right),ev.clientX-sx));
      dy=Math.max(Math.min(0,24-bounds.top),Math.min(Math.max(0,innerHeight-100-bounds.bottom),ev.clientY-sy));
      if(!frame)frame=requestAnimationFrame(paint);
    };
    const stop=ev=>{
      if(ev.pointerId!==pointerId)return;
      if(frame){cancelAnimationFrame(frame);paint();}
      group.forEach(icon=>icon.classList.remove('dragging'));
      document.removeEventListener('pointermove',move);
      document.removeEventListener('pointerup',stop);
      document.removeEventListener('pointercancel',stop);
      if(moved){
        suppressClick=true;
        lastDrag=performance.now();
        group.forEach(icon=>icon.dispatchEvent(new Event('desktop-icon-moved',{bubbles:true})));
      }
    };
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
  });
});
$('#desktop').addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('.window,#dock,.desktop-file,#admin-controls'))return;
  desktopFiles.forEach(x=>x.classList.remove('selected-file'));setActive(null);
  const box=document.createElement('div');box.className='selection-marquee';$('#desktop').append(box);
  const x=e.clientX,y=e.clientY;
  const move=ev=>{const left=Math.min(x,ev.clientX),top=Math.min(y,ev.clientY),right=Math.max(x,ev.clientX),bottom=Math.max(y,ev.clientY);Object.assign(box.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`});desktopFiles.forEach(file=>{const r=file.getBoundingClientRect();file.classList.toggle('selected-file',r.left<right&&r.right>left&&r.top<bottom&&r.bottom>top);});};
  const stop=()=>{box.remove();document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',stop);document.removeEventListener('pointercancel',stop);};
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
});
// Toolbar disclosure pill belongs at the right of the title bar, not a fourth traffic light.
const disclosure=document.createElement('button');disclosure.className='toolbar-toggle';disclosure.setAttribute('aria-label','Hide toolbar');disclosure.setAttribute('aria-expanded','true');
disclosure.addEventListener('click',()=>{const bar=$('.finder-toolbar');bar.hidden=!bar.hidden;disclosure.setAttribute('aria-expanded',!bar.hidden);disclosure.setAttribute('aria-label',bar.hidden?'Show toolbar':'Hide toolbar');});
$('#finder-window .titlebar').append(disclosure);
// Dismiss the label before the click starts a window's Genie animation.
const dock=$('#dock');
dock.addEventListener('click',e=>{
  const item=e.target.closest('.dock-item');
  if(item)item.setAttribute('data-tooltip-dismissed','');
},true);
dock.addEventListener('pointerenter',e=>{
  if(e.target.matches('.dock-item'))e.target.removeAttribute('data-tooltip-dismissed');
},true);
dock.addEventListener('focusin',e=>e.target.closest('.dock-item')?.removeAttribute('data-tooltip-dismissed'));
// Dock magnification follows distance to the pointer instead of generic hover cards.
$('#dock').addEventListener('pointermove',e=>{if(reduceMotion()||e.pointerType==='touch'||document.body.classList.contains('desktop-admin'))return;$$('.dock-item').forEach(icon=>{const r=icon.getBoundingClientRect(),distance=Math.abs(e.clientX-(r.left+r.width/2)),scale=1+.38*Math.exp(-(distance*distance)/(75*75));icon.style.transform=`translateY(${-10*(scale-1)}px) scale(${scale})`;});});
$('#dock').addEventListener('pointerleave',()=>$$('.dock-item').forEach(icon=>icon.style.removeProperty('transform')));
$('#project-total').textContent=works.length;
$('#project-total-web').textContent=works.filter(work=>work.type==='web').length;
$('#project-total-apps').textContent=works.filter(work=>['mobile','desktop'].includes(work.type)).length;renderGallery();applyPreferences();updateTime();setInterval(updateTime,15000);
