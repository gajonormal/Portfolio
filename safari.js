'use strict';

const openSafariProject = id => safariNavigate(`/wiki/Projects/${id}`);
const safariNavigate = (() => {
  const profile = portfolio;
  let language = storage.get('wiki-language', 'en') === 'pt' ? 'pt' : 'en';
  const tr = (en, pt) => language === 'pt' ? pt : en;
  const t = label => language === 'pt' ? wikiStringsPortuguese[label] ?? label : label;
  const locale = () => tr('en-GB', 'pt-PT');
  const localWork = work => {
    const copy = language === 'pt' ? wikiProjectsPortuguese[work.id] : null;
    if (!copy) return work;
    if (!work.screenshots) return { ...work, ...copy };
    const localizeItems = key => work[key].map((item, index) => ({
      ...item,
      ...copy[key][index]
    }));
    return {
      ...work,
      ...copy,
      setup: { ...work.setup, ...copy.setup },
      screenshots: localizeItems('screenshots'),
      sources: localizeItems('sources'),
      architectureDiagram: work.architectureDiagram.replace(/\.svg$/, '.pt.svg')
    };
  };
  const localizedWorks = () => works.map(localWork);

  const home = '/';
  const bio = '/wiki/Bernardo_Maia';
  const index = '/wiki/Projects';
  const technologies = '/wiki/Technologies';
  const github = '/wiki/GitHub';
  const contact = '/wiki/Contact';
  const host = 'maia.local';
  const page = $('#safari-page');
  const address = $('#safari-address');
  const search = $('#safari-search');
  const tabsBar = $('#safari-tabs');
  const titlebar = $('#safari-window .window-title');
  const languagePicker = $('#wiki-language');
  const languageButtons = [...languagePicker.querySelectorAll('button')];
  const chrome = $('.safari-chrome');
  const chromeLabels = $$('.safari-bookmarks button, #safari-bookmarks-menu button').filter(node => !node.children.length)
    .map(node => [node, node.textContent.trim().replace(/\s+/g, ' ')]);
  const chromeAttributes = $$('#safari-window [aria-label], #safari-window [title], #safari-address[placeholder]')
    .flatMap(node => ['aria-label', 'title', 'placeholder'].filter(name => node.hasAttribute(name))
      .map(name => [node, name, node.getAttribute(name)]))
    .filter(([, , label]) => Object.hasOwn(wikiStringsPortuguese, label) || label === 'Wiki language');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
  const asset = path => typeof path === 'string' &&
    /^[\w./ -]+$/.test(path) &&
    !path.startsWith('/') &&
    !path.split('/').includes('..')
    ? escape(path)
    : '';
  const link = (route, label) => `<a href="#${escape(route)}" data-safari-page="${escape(route)}">${escape(label)}</a>`;
  const anchor = (id, label) => `<a href="#${id}" data-safari-section="${id}">${escape(label)}</a>`;
  const projectRoute = id => `${index}/${id}`;
  const external = (url, label) =>
    `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
  const stack = tools => `<ul class="archive-stack">${tools.map(tool => `<li><a href="#/search?q=${encodeURIComponent(tool)}" data-safari-page="/search?q=${encodeURIComponent(tool)}"><span>${escape(tool)}</span></a></li>`).join('')}</ul>`;
  const tabs = [{ entries: [{ route: home, scroll: 0 }], cursor: 0 }];
  let selected = 0;
  const tab = () => tabs[selected];
  const entry = () => tab().entries[tab().cursor];
  const recent = [];
  const defaultArchiveYear = '2009';
  const latestArchiveYear = new Date().getFullYear();
  const webBookmarks = [
    ['Apple', 'http://www.apple.com/', 'Mac, iPod and iPhone'],
    ['YouTube', 'http://www.youtube.com/', 'Videos and channels'],
    ['Wikipedia', 'http://en.wikipedia.org/wiki/Main_Page', 'The free encyclopedia'],
    ['Google', 'http://www.google.com/', 'Web search'],
    ['Yahoo!', 'http://www.yahoo.com/', 'News, email and search'],
    ['Flickr', 'http://www.flickr.com/', 'Photography and photo sharing'],
    ['Newgrounds', 'http://www.newgrounds.com/', 'Flash games and animation'],
    ['Mozilla', 'http://www.mozilla.com/', 'Firefox and the open web'],
    ['BBC News', 'http://news.bbc.co.uk/', 'World news'],
    ['Internet Archive', 'http://www.archive.org/', 'The archive of the web']
  ];
  // Verified captures for the default year. These bookmarks can open even
  // when the live capture index is unavailable.
  const knownHomeCaptures = new Map([
    ['2009 youtube.com', { timestamp: '20090101094601', url: 'https://web.archive.org/web/20090101094601/http://www.youtube.com/' }],
    ['2009 apple.com', { timestamp: '20090101041218', url: 'https://web.archive.org/web/20090101041218/http://www.apple.com:80/' }]
  ]);
  const captures = new Map();
  const isWebRoute = route => route === '/web' || route.startsWith('/web?');
  const webRoute = (query, year = defaultArchiveYear) => '/web?' + new URLSearchParams({ q: query, year });
  function webState(route) {
    const params = new URLSearchParams(route.split('?')[1]);
    const year = params.get('year');
    return {
      query: (params.get('q') || '').trim().slice(0, 300),
      year: /^\d{4}$/.test(year) && +year >= 1996 && +year <= latestArchiveYear
        ? year
        : defaultArchiveYear
    };
  }
  function archivedAddress(value) {
    if (!value || /\s/.test(value)) return null;
    try {
      const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : 'http://' + value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) ||
        url.hostname.endsWith('.local')
      ) return null;
      url.hash = '';
      return url.href;
    } catch {
      return null;
    }
  }
  const webTitle = year => tr('Web of ' + year, 'Web de ' + year);
  function archivePage(route) {
    const { query, year } = webState(route);
    const url = archivedAddress(query);
    const needle = normalizeSearch(query);
    const matches = webBookmarks.filter(([name, target, detail]) =>
      normalizeSearch([name, target, detail, t(detail)].join(' ')).includes(needle));
    const catalog = matches.map(([name, target, detail]) =>
      `<li>${link(webRoute(target, year), name)}<p>${escape(t(detail))} · ${escape(new URL(target).hostname)}</p></li>`).join('');
    const result = url
      ? `<h2>${escape(new URL(url).hostname)}</h2><div id="wayback-capture" role="status"><p>${tr(`Looking for a capture from ${year}…`, `A procurar uma captura de ${year}…`)}</p></div><p>${external(`https://web.archive.org/web/${year}*/${url}`, tr(`Browse ${year} captures in Wayback Machine`, `Consultar capturas de ${year} na Wayback Machine`))}</p>`
      : `<h2>${query ? t("Matching bookmarks") : t("Period bookmarks")}</h2>${catalog ? `<ul class="wayback-bookmarks">${catalog}</ul>` : '<p>${t("No matching bookmark. Try a website address such as www.apple.com.")}</p>'}`;
    return {
      title: webTitle(year), html: `<article class="wayback-page" lang="${locale()}"><header><small>${t("MAIA ARCHIVE · WEB HISTORY")}</small><h1>${webTitle(year)}</h1><p>${t("Explore websites as they appeared in the Wayback Machine.")}</p></header>
      <form id="wayback-search" role="search" aria-label="${t("Search archived websites")}"><label>${t("Website")}<input name="q" type="search" placeholder="${t("Site name or web address")}" value="${escape(query)}" maxlength="300" required></label><label>${t("Year")}<input name="year" type="number" min="1996" max="${latestArchiveYear}" value="${year}" required></label><button type="submit">${t("Search")}</button></form>
      ${result}<footer>${link(home, t("My archive"))} · ${external('https://web.archive.org/', 'Internet Archive')}</footer></article>`
    };
  }
  function showCapture(output, capture, query, year, date) {
    const host = new URL(archivedAddress(query)).hostname;
    const viewer = document.createElement('section');
    viewer.className = 'wayback-viewer';
    viewer.lang = locale();
    viewer.innerHTML = `<header class="wayback-viewer-bar">
      <span><strong>${escape(host)}</strong> · ${escape(date)}</span>
      <form id="wayback-search" aria-label="${t("Choose another archive year")}">
        <input name="q" type="hidden" value="${escape(query)}">
        <label>${t('Year')} <input name="year" type="number" min="1996" max="${latestArchiveYear}" value="${year}" required></label>
        <button type="submit">${t("Go")}</button>
      </form>
      ${external(capture.url, t("Open in Wayback Machine"))}
    </header>
    <div class="wayback-frame"><span>${t('Archived page')} · ${escape(host)}</span></div>`;
    const frame = document.createElement('iframe');
    frame.title = `${host} · Wayback Machine · ${date}`;
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.referrerPolicy = 'no-referrer';
    frame.src = capture.url;
    $('.wayback-frame', viewer).append(frame);
    output.closest('.wayback-page').replaceWith(viewer);
    address.value = archivedAddress(query);
    updateDockThumbnail('safari');
    GenieEffect.schedule(appWindow('safari'));
  }
  async function loadCapture(route) {
    const output = $('#wayback-capture', page);
    if (!output) return;
    const { query, year } = webState(route);
    const url = archivedAddress(query);
    const key = `${year} ${url}`;
    try {
      const target = new URL(url);
      let capture = target.pathname === '/' && !target.search && !target.port
        ? knownHomeCaptures.get(`${year} ${target.hostname.replace(/^www\./, '')}`)
        : null;
      if (!capture && !captures.has(key)) {
        const endpoint = new URL('api/wayback', location.href);
        endpoint.search = new URLSearchParams({ url, year });
        const pending = fetch(endpoint, { signal: AbortSignal.timeout(7000) })
          .then(response => {
            if (!response.ok) throw new Error('Wayback lookup failed');
            return response.json();
          })
          .catch(error => {
            if (captures.get(key) === pending) captures.delete(key);
            throw error;
          });
        if (captures.size >= 50) captures.delete(captures.keys().next().value);
        captures.set(key, pending);
      }
      if (!capture) ({ capture } = await captures.get(key));
      if (!output.isConnected) return;
      if (!capture) {
        output.textContent = tr(`No capture found in ${year}. Try another year or browse the archive calendar.`, `Não foram encontradas capturas de ${year}. Experimenta outro ano ou consulta o calendário do arquivo.`);
        return;
      }
      const stamp = capture.timestamp;
      if (
        !new RegExp(`^${year}\\d{10}$`).test(stamp) ||
        !capture.url?.startsWith(`https://web.archive.org/web/${stamp}/`)
      ) throw new Error('Invalid capture');
      const date = new Intl.DateTimeFormat(locale(), { dateStyle: 'long', timeZone: 'UTC' }).format(
        new Date(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T00:00:00Z`)
      );
      showCapture(output, capture, query, year, date);
    } catch {
      if (output.isConnected) output.textContent = t("The live index is unavailable. You can still open the Wayback calendar below.");
    }
  }

  const archiveLinks = () => [
    [home, t("Main page")], [bio, t("About me")], [index, t("Projects")],
    [technologies, t("Technologies")], [github, t("GitHub activity")], [contact, t("Contact")]
  ];
  function archiveSidebar() {
    return `<aside class="archive-sidebar">
      <a class="archive-wordmark" href="#/" data-safari-page="/">
        <img src="assets/images/archive.png" width="96" height="60" alt="">
        <span lang="en">My archive</span>
      </a>
      <section class="archive-portlet"><h2>${t("navigation")}</h2><nav aria-label="${t("Portfolio pages")}">
        ${archiveLinks().map(([url, label]) => link(url, label)).join('')}
      </nav></section>
      <section class="archive-portlet"><h2>${t("search")}</h2>
        <form id="archive-search" role="search" aria-label="${t("Search My archive")}">
          <input name="q" type="search" aria-label="${t("Search My archive")}" maxlength="150" required>
          <div><button type="submit" value="go"><strong>${t("Go")}</strong></button><button type="submit" value="search">${t("Search")}</button></div>
        </form>
      </section>
      <section class="archive-portlet"><h2>${t("toolbox")}</h2><nav aria-label="${t("Archive tools")}">
        ${link('/web', t("Web of 2009"))}${external(profile.github, t("Source repositories"))}
      </nav></section>
    </aside>`;
  }
  function wiki(title, body, crumb = '', frontPage = false, tabLabel = 'article') {
    const route = entry().route;
    const projectPage = route.startsWith(index + '/');
    const sections = [[home, t("Main page")], [index, projectPage ? tabLabel : t("Projects")], [technologies, t("Technologies")], [contact, t("Contact")]];
    const sectionTabs = sections.map(([url, label]) =>
      (route === url || (url === index && projectPage))
        ? `<span aria-current="page">${escape(label)}</span>`
        : link(url, label)
    ).join('');
    return `<div class="archive-wiki">${archiveSidebar()}<div class="archive-main">
      <nav class="archive-tabs" aria-label="${t("Archive sections")}">${sectionTabs}</nav>
      <article class="archive-article${frontPage ? ' archive-front' : ''}${route === bio ? ' archive-biography' : ''}"${projectPage ? ` data-project="${escape(route.slice(index.length + 1))}"` : ''} lang="${tr('en', 'pt-PT')}">
        ${frontPage ? '' : `<header><h1>${escape(title)}</h1></header>`}
        ${body}
      </article>
    </div></div>`;
  }
  function mainPage() {
    const panels = (title, content) => `<section class="archive-home-panel"><h2>${title}</h2>${content}</section>`;
    const featured = localizedWorks().slice(0, 3).map(work =>
      `<li><img src="${asset(work.icon)}" alt=""><div><strong>${link(projectRoute(work.id), work.title)}</strong> - ${escape(work.subtitle)}</div></li>`
    ).join('');
    return wiki(t("Welcome to my archive"), `
      <header class="archive-welcome">
        <div><h1>${t("Welcome to my archive")}</h1>
        <p>${t("Things I’ve built, ideas I’m exploring, and what I want to create next.")}</p>
        <small>${link(index, tr(`${works.length} project articles`, `${works.length} artigos sobre projetos`))} ${tr('to explore', 'para explorar')}</small></div>
        <ul>${archiveLinks().slice(1).concat([['/web', t("Web of 2009")]]).map(([url, label]) => `<li>${link(url, label)}</li>`).join('')}</ul>
      </header>
      <nav class="archive-front-links" aria-label="${t("Main page shortcuts")}">
        <span>${link(bio, t("Overview"))} · ${link(contact, t("Contact"))}</span>
        <span>${link(index, t("Contents"))} · ${link(technologies, t("Technologies"))} · ${link(github, t("GitHub activity"))}</span>
      </nav>
      <div class="archive-home-columns">
        <div class="archive-home-column archive-home-green">
          ${panels(t("Featured projects"), `<ul class="archive-featured">${featured}</ul><p class="archive-panel-more">${link(index, t("More projects…"))}</p>`)}
          ${panels(t("From the project archive"), `<ul><li>${link(projectRoute('ipod'), 'iPod Classic Revamped')} ${tr('is my fork of an iPod simulator, adapted to play music on websites.', 'é o meu fork de um simulador do iPod, adaptado para tocar música em sites.')}</li><li>${link(projectRoute('visitar'), 'VisitAR')} ${tr('was tested at Parque do Barrocal.', 'foi testado no Parque do Barrocal.')}</li><li>${tr(`The ${link(technologies, 'technology index')} lists the tools used in the public repositories.`, `O ${link(technologies, 'índice de tecnologias')} reúne as ferramentas usadas nos repositórios públicos.`)}</li></ul>`)}
        </div>
        <div class="archive-home-column archive-home-blue">
          ${panels(t("About me"), `<img class="archive-home-avatar" src="assets/images/me.webp" alt=""><p>${tr('I’m', 'Sou o')} <strong>${link(bio, profile.name)}</strong>. ${tr('This archive brings together the projects I’ve worked on, with notes on what they do and how they were built. You’ll also find a bit about me and the tools I use.', 'Neste arquivo reúno os projetos em que trabalhei, com descrições do que fazem e de como foram desenvolvidos. Também conto um pouco sobre mim e partilho as ferramentas que uso.')}</p><p class="archive-panel-more">${link(bio, t("Read the biography…"))}</p>`)}
          ${panels(t("Around the archive"), `<ul><li>${link(github, t("GitHub contributions"))} ${tr('and public repositories.', 'e repositórios públicos.')}</li><li>${link('/web', t("Web of 2009"))}, ${tr('a collection of sites you can revisit in Safari.', 'uma coleção de sites que podes revisitar no Safari.')}</li></ul>`)}
        </div>
      </div>
      <section class="archive-home-column archive-home-blue archive-home-activity">
        ${panels(t("GitHub contributions"), calendar())}
      </section>`, '', true);
  }
  function contents(items) {
    return `<details class="archive-contents" open><summary>${t("Contents")}</summary><ol>${items.map(([id, title]) => `<li>${anchor(id, title)}</li>`).join('')}</ol></details>`;
  }
  function projectGrid(list) {
    return `<div class="archive-project-grid">${list.map(work => `<a href="#${projectRoute(work.id)}" data-safari-page="${projectRoute(work.id)}"><img src="${asset(work.file)}" alt="" loading="lazy" decoding="async"><strong>${escape(work.title)}</strong><small>${escape(work.category)}</small></a>`).join('')}</div>`;
  }
  function calendar() {
    return `<figure class="archive-calendar"><div class="archive-calendar-chart" aria-busy="true"><p>${t("Loading GitHub activity…")}</p></div><figcaption><span class="archive-calendar-date"></span>${external(profile.github + '#contribution-activity', t("View activity on GitHub"))}</figcaption></figure>`;
  }
  const calendarPalette = ['#edf0f3', '#cfdfee', '#a6c2db', '#749dbd', '#426f98'];
  const calendarDay = 86400000;
  const calendarFormats = Object.fromEntries(
    ['en-GB', 'pt-PT'].map(code => [code, {
      date: new Intl.DateTimeFormat(code, { dateStyle: 'long', timeZone: 'UTC' }),
      month: new Intl.DateTimeFormat(code, { month: 'short', timeZone: 'UTC' })
    }])
  );
  const calendarDate = date => calendarFormats[locale()].date.format(date);
  const calendarMonth = date => calendarFormats[locale()].month.format(date);
  let calendarRequest;
  async function fetchCalendar() {
    try {
      const response = await fetch(
        new URL('api/contributions', location.href),
        { signal: AbortSignal.timeout(8000) }
      );
      if (!response.ok) throw new Error('Calendar request failed');
      const data = await response.json();
      if (!Array.isArray(data.days) || !data.days.length) throw new Error('Calendar is empty');
      return data;
    } catch {
      // Preserve a dated snapshot if the deployment is static or GitHub is down.
      const response = await fetch('assets/images/github-contributions.svg', { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error('No calendar snapshot');
      const svg = await response.text();
      const colors = ['#22364b', '#304b63', '#45647e', '#60829a', '#82a4b5'];
      const days = [...svg.matchAll(/<rect\b[^>]*fill="([^"]+)"[^>]*><title>(\d{4}-\d{2}-\d{2}): (\d+) contributions?<\/title>/g)]
        .map(([, color, date, count]) => ({
          date,
          count: Number(count),
          level: Math.max(0, colors.indexOf(color))
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!days.length) throw new Error('Calendar snapshot is empty');
      return { days, updated: days.at(-1).date, snapshot: true };
    }
  }
  function calendarGraphic(days) {
    const start = Date.parse(days[0].date);
    const sunday = start - new Date(start).getUTCDay() * calendarDay;
    const pitch = 12;
    const left = 27;
    const top = 18;
    const week = date => Math.floor((Date.parse(date) - sunday) / (7 * calendarDay));
    const width = left + (week(days.at(-1).date) + 1) * pitch;
    const months = [];
    const cells = days.map(day => {
      const date = new Date(day.date);
      const column = week(day.date);
      const x = left + column * pitch;
      const y = top + date.getUTCDay() * pitch;
      if (date.getUTCDate() === 1) months.push(`<text x="${x}" y="12">${calendarMonth(date)}</text>`);
      const label = `${calendarDate(date)}: ${day.count} ${day.count === 1 ? tr('contribution', 'contribuição') : tr('contributions', 'contribuições')}`;
      return `<rect x="${x}" y="${y}" width="9" height="9" fill="${calendarPalette[day.level]}" stroke="#778a9b" stroke-opacity=".28" stroke-width=".5"><title>${escape(label)}</title></rect>`;
    });
    const total = days.reduce((sum, day) => sum + day.count, 0);
    return `<svg viewBox="0 0 ${width} 103" role="img" aria-label="${tr(`${total} GitHub contributions from ${days[0].date} through ${days.at(-1).date}`, `${total} contribuições no GitHub de ${days[0].date} a ${days.at(-1).date}`)}">
      <g font-family="Arial, sans-serif" font-size="9" fill="#4b5560">${months.join('')}<text x="1" y="37">${t("Mon")}</text><text x="1" y="61">${t("Wed")}</text><text x="1" y="85">${t("Fri")}</text></g>
      ${cells.join('')}</svg>`;
  }
  async function renderCalendar(figure) {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    if (calendarRequest?.day !== day || calendarRequest.retryAt <= now) {
      const state = { day, retryAt: Infinity };
      state.promise = fetchCalendar()
        .then(data => {
          if (data.snapshot) state.retryAt = Date.now() + 300000;
          return data;
        })
        .catch(() => {
          state.retryAt = Date.now() + 300000;
          return null;
        });
      calendarRequest = state;
    }
    const data = await calendarRequest.promise;
    if (!figure.isConnected) return;
    const chart = $('.archive-calendar-chart', figure);
    chart.removeAttribute('aria-busy');
    if (!data) {
      chart.textContent = t("The activity calendar is currently unavailable.");
      return;
    }
    chart.innerHTML = calendarGraphic(data.days);
    const legend = calendarPalette.map(color => `<i style="background:${color}"></i>`).join('');
    $('.archive-calendar-date', figure).textContent = `${data.snapshot ? t("Snapshot") : t("Updated")}: ${calendarDate(new Date(data.updated))}. `;
    chart.insertAdjacentHTML('afterend', `<div class="archive-calendar-legend" aria-hidden="true">${t('Less')} ${legend} ${t('More')}</div>`);
  }
  function profileAge(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(now);
    const date = Object.fromEntries(
      parts
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, Number(part.value)])
    );
    const birthday = profile.birthDate;
    return date.year - birthday.year - Number(date.month < birthday.month || (date.month === birthday.month && date.day < birthday.day));
  }
  function aboutMePage() {
    return wiki(profile.name, `
      <aside class="archive-infobox archive-profile"><strong>${escape(profile.name)}</strong><img src="assets/images/me.webp" alt="Bernardo Maia"><dl><dt>${t("Age")}</dt><dd><span data-profile-age>${profileAge()}</span></dd><dt>${t("From")}</dt><dd>Abrantes, Santarém, Portugal</dd><dt>${t("Field")}</dt><dd>${t("Computer Science")}</dd><dt>${t("Education")}</dt><dd>${external('https://www.ipcb.pt/escolas/tecnologia/', 'ESTCB')} / ${external('https://www.ipcb.pt/', 'IPCB')}</dd><dt>GitHub</dt><dd>${external(profile.github, '@gajonormal')}</dd><dt>LinkedIn</dt><dd>${external(profile.linkedin, 'Bernardo Maia')}</dd><dt>${t("Email")}</dt><dd><a href="mailto:${escape(profile.email)}">${escape(profile.email)}</a></dd></dl></aside>
      <p>${tr(`I’m Bernardo Maia, a ${external('https://www2.ipcb.pt/estudar/cursos/licenciatura/licenciatura-em-engenharia-informatica/', t("Computer Science"))} graduate from ${external('https://www.ipcb.pt/escolas/tecnologia/', 'ESTCB')} / ${external('https://www.ipcb.pt/', 'IPCB')}. I’ve always been interested in technology, especially understanding how things work and what else I could do with them. That interest often led me to experiment with the devices I had, even when I didn’t quite know what I was doing yet.`, `O meu nome é Bernardo Maia. Licenciei-me em ${external('https://www2.ipcb.pt/estudar/cursos/licenciatura/licenciatura-em-engenharia-informatica/', t("Computer Science"))} pela ${external('https://www.ipcb.pt/escolas/tecnologia/', 'ESTCB')} / ${external('https://www.ipcb.pt/', 'IPCB')}. Sempre me interessei por tecnologia, sobretudo por perceber como as coisas funcionam e o que mais podia fazer com elas. Esse interesse levava-me a experimentar com os aparelhos que tinha, mesmo quando ainda não sabia bem o que estava a fazer.`)}</p>
      ${contents([['primeira-consola', t("Maybe it all started with a PSP")], ['formacao', t("Studying Computer Science")], ['projetos', t("Personal projects")], ['a-seguir', t("What’s next")]])}
      <section class="archive-bio-section"><h2 id="primeira-consola">${t("Maybe it all started with a PSP")}</h2>
      <p>${tr(`For Christmas in 2013, I received my first console, a ${external('https://en.wikipedia.org/wiki/PlayStation_Portable#PSP_Street_(E1000)', 'PSP E1000')}. I only had a few games, so I kept replaying them. I probably finished <em>Geronimo Stilton no Reino da Fantasia</em> more than ten times over the following year.`, `No Natal de 2013 recebi a minha primeira consola, uma ${external('https://en.wikipedia.org/wiki/PlayStation_Portable#PSP_Street_(E1000)', 'PSP E1000')}. Tinha poucos jogos, por isso jogava sempre os mesmos. Devo ter acabado <em>Geronimo Stilton no Reino da Fantasia</em> mais de dez vezes no ano seguinte.`)}</p>
      <figure class="archive-bio-figure archive-bio-cover">
        <img src="assets/images/geronimo-goty.webp" width="750" height="1293" loading="lazy" decoding="async" alt="${tr('PSP cover of Geronimo Stilton no Reino da Fantasia', 'Capa para PSP de Geronimo Stilton no Reino da Fantasia')}">
        <figcaption>GOTY</figcaption>
      </figure>
      <p>${tr(`In 2015, I started searching for things like “how to get more PSP games for free.” At the time, I didn’t even know there were different PSP models or what custom firmware was, but somehow I managed to get it working.`, `Em 2015 comecei a pesquisar coisas como «como ter mais jogos para a PSP de graça». Na altura nem sabia que havia vários modelos de PSP, nem o que era custom firmware. Mesmo assim, lá consegui pôr aquilo a funcionar.`)}</p>
      <p>${tr(`I spent the next week playing the four or so games I’d managed to fit onto my 4 GB ${external('https://en.wikipedia.org/wiki/Memory_Stick', 'Memory Stick')}. Then, one day, I turned on my PSP to keep playing, and all the games were gone. (R.I.P.)`, `Passei a semana seguinte a jogar os 4 jogos, ou pouco mais, que consegui pôr no meu ${external('https://en.wikipedia.org/wiki/Memory_Stick', 'Memory Stick')} de 4 GB. Até que um dia liguei a PSP para continuar a jogar e tinha desaparecido tudo. Estava completamente limpa, vazia e sem os meus saves. :( (R.I.P.)`)}</p>
      <p>${tr(`My mourning didn’t last long. I went straight back to researching what had happened. Once I figured out where I’d gone wrong, I tried again, this time with more care and a better idea of what I was doing. And it’s stayed that way ever since. :)`, `O meu luto durou pouco. Voltei logo a pesquisar para perceber o que tinha acontecido. Quando descobri onde tinha falhado, voltei a tentar, desta vez com mais cuidado e já a saber o que estava a fazer. E assim ficou até hoje. :)`)}</p>
      <figure class="archive-bio-figure archive-bio-psp">
        <img src="assets/images/psp-larp-device.webp" width="900" height="665" loading="lazy" decoding="async" alt="${tr('My PSP E1000 with its home screen on', 'A minha PSP E1000 ligada no menu principal')}">
        <figcaption>larp device</figcaption>
      </figure>
      <p>${tr(`Looking back, I was starting to enjoy figuring out how the console worked as much as playing the games. That interest stayed with me over the years and eventually led me to study Computer Science.`, `Olhando para trás, começava a gostar tanto de perceber como a consola funcionava como de jogar. Esse interesse acompanhou-me ao longo dos anos e acabou por me levar a estudar Engenharia Informática.`)}</p></section>
      <section class="archive-bio-section"><h2 id="formacao">${t("Studying Computer Science")}</h2>
      <figure class="archive-bio-figure"><a href="#${projectRoute('visitar')}" data-safari-page="${projectRoute('visitar')}"><img src="assets/projects/visitar-icon.svg" alt="${t("VisitAR icon")}" loading="lazy"></a><figcaption>${t("VisitAR, my final-year team project.")}</figcaption></figure>
      <p>${tr(`I went on to complete a three-year bachelor’s degree in Computer Science at ${external('https://www.ipcb.pt/escolas/tecnologia/', 'ESTCB')} / ${external('https://www.ipcb.pt/', 'IPCB')}. During that time, I explored different areas of computing and worked with a range of technologies, from mobile and web development to databases and cloud infrastructure.`, `Concluí a licenciatura de três anos em Engenharia Informática na ${external('https://www.ipcb.pt/escolas/tecnologia/', 'ESTCB')} / ${external('https://www.ipcb.pt/', 'IPCB')}. Durante esse tempo explorei várias áreas e trabalhei com tecnologias de desenvolvimento móvel e web, bases de dados e infraestrutura na nuvem.`)}</p>
      <p>${tr(`Two projects that stood out for me were ${link(projectRoute('visitar'), 'VisitAR')} and ${link(projectRoute('oportunia'), 'Oportunia')}. For my final-year project, I worked with a classmate on VisitAR, an app for exploring ${external('https://barrocal-parque.pt/index.html', 'Parque do Barrocal')} through routes, location-based features, panoramic content and offline access. Oportunia was another team project, bringing together job opportunities and recommendations in a web application.`, `Dois projetos que se destacaram para mim foram o ${link(projectRoute('visitar'), 'VisitAR')} e o ${link(projectRoute('oportunia'), 'Oportunia')}. No projeto de fim de curso, trabalhei com um colega no VisitAR, uma aplicação para explorar o ${external('https://barrocal-parque.pt/index.html', 'Parque do Barrocal')} com percursos, funcionalidades de localização, panoramas e acesso sem ligação. O Oportunia foi outro projeto de equipa, uma aplicação web que reúne ofertas de trabalho e recomendações.`)}</p></section>
      <section class="archive-bio-section"><h2 id="projetos">${t("Personal projects")}</h2>
      <p>${tr(`Alongside my university work, I’ve been building projects of my own, including ${link(projectRoute('nethergate'), 'Nethergate')}, a desktop app for managing Minecraft Java servers, and ${link(projectRoute('abisso'), 'ABISSO')}, an interactive experience for creating procedural aquariums.`, `Além do trabalho do curso, tenho desenvolvido projetos pessoais, como o ${link(projectRoute('nethergate'), 'Nethergate')}, uma aplicação de computador para gerir servidores Minecraft Java, e o ${link(projectRoute('abisso'), 'ABISSO')}, uma experiência interativa de criação de aquários procedurais.`)}</p>
      <p>${tr(`This portfolio is an ongoing project in itself: a virtual desktop that I can keep expanding with new projects, apps and experiments. The desktop is a place to interact with them, while the wiki documents what they do and how they work.`, `O próprio portfólio é um projeto em evolução. É um ambiente de trabalho virtual onde posso ir acrescentando projetos, aplicações e experiências. No ambiente de trabalho podes interagir com eles, e na wiki podes ler o que fazem e como funcionam.`)}</p>
      <p>${tr(`Its appearance looks back at an earlier era of computing, but I want to keep adding new things to it as I learn and build.`, `O aspeto lembra uma época anterior da informática. Quero continuar a acrescentar-lhe coisas novas à medida que vou aprendendo e criando.`)}</p>
      <p>${tr(`You can explore the ${link(index, 'projects')}, see the ${link(technologies, 'tools I use')}, or browse the source on ${external(profile.github, 'GitHub')}.`, `Podes explorar os ${link(index, 'projetos')}, ver as ${link(technologies, 'ferramentas que uso')} ou consultar o código no ${external(profile.github, 'GitHub')}.`)}</p></section>
      <section class="archive-bio-section"><h2 id="a-seguir">${t("What’s next")}</h2>
      <p>${tr(`I’m open to work and looking for my next opportunity in software development. If you have a project or a team I could be part of, ${link(contact, 'get in touch')}.`, `Estou à procura da minha próxima oportunidade em desenvolvimento de software. Se tens um projeto ou uma equipa onde eu possa ajudar, ${link(contact, 'entra em contacto')}.`)}</p></section>
    `);
  }
  function describe(route) {
    if (isWebRoute(route)) return archivePage(route);
    if (route === home) return { title: t("My archive"), html: mainPage() };
    if (route === bio) return { title: profile.name, html: aboutMePage() };
    if (route === index) return { title: t("Projects"), html: wiki(t("Software projects"), `<p>${tr('Explore the projects I’ve worked on, how they were built, and where to find their source code.', 'Explora os projetos em que trabalhei, vê como foram desenvolvidos e consulta o código-fonte.')}</p><h2>${t("Selected projects")}</h2>${projectGrid(localizedWorks())}`, '', false, t("Projects")) };
    if (route === technologies) return { title: t("Technologies"), html: wiki(t("Languages and tools"), `<p>${tr('Technologies used in my public repositories. Select a technology to find projects that use it.', 'Tecnologias usadas nos meus repositórios públicos. Seleciona uma tecnologia para encontrar os projetos que a utilizam.')}</p>${profile.technologies.map(group => `<h2>${escape(t(group.label))}</h2>${stack(group.items)}`).join('')}<h2>${t("More on GitHub")}</h2><p>${external('https://github.com/gajonormal/MyPortfolio', 'MyPortfolio')} · TypeScript and Next.js.</p>`) };
    if (route === github) return { title: 'GitHub', html: wiki(t("GitHub contributions"), `<p>${tr('Contribution activity from the public profile of', 'Contribuições do perfil público de')} ${external(profile.github, '@gajonormal')}.</p>${calendar()}<h2>${t("Featured repositories")}</h2><ul class="archive-repositories">${localizedWorks().map(work => `<li>${link(projectRoute(work.id), work.title)} <small>${escape(work.category)} · ${escape(work.stack[0])}</small> ${external(work.repo, t("Source"))}</li>`).join('')}</ul><p>${external(profile.github + '?tab=repositories', t("View repositories on GitHub"))}</p>`) };
    if (route === contact) return { title: t("Contact"), html: wiki(t("Contact"), `<p>${tr('For project inquiries or Computer Science opportunities, email me or reach out on LinkedIn.', 'Para falar sobre projetos ou oportunidades na área de Engenharia Informática, escreve-me por email ou pelo LinkedIn.')}</p><ul><li><a href="mailto:${escape(profile.email)}">${escape(profile.email)}</a></li><li>${external(profile.linkedin, 'LinkedIn · Bernardo Maia')}</li><li>${external(profile.github, 'GitHub · @gajonormal')}</li></ul>`) };

    const projectId = /^\/wiki\/Projects\/([a-z0-9-]+)$/.exec(route)?.[1];
    const original = works.find(item => item.id === projectId);
    const work = original && localWork(original);
    if (work) {
      const number = works.indexOf(original);
      const navigation = `<nav class="archive-project-nav" aria-label="${t("More projects")}">${number > 0 ? link(projectRoute(works[number - 1].id), `← ${works[number - 1].title}`) : ''}${link(index, t("All projects"))}${number + 1 < works.length ? link(projectRoute(works[number + 1].id), `${works[number + 1].title} →`) : ''}</nav>`;
      const projectPage = article => ({ title: work.title, html: wiki(work.title, article, ` · ${link(index, t("Projects"))}`, false, work.title) });
      if (work.id === 'ipod') {
        return projectPage(`
          <p class="archive-project-subtitle">${escape(work.subtitle)}</p>
          <p>${escape(work.summary)}</p>
          <p><strong>${external(work.demo, tr('Visit the iPod site', 'Visitar o site do iPod'))}</strong></p>
          <img class="archive-project-showcase" src="assets/projects/screenshots/ipod/site.png" width="1000" height="876" alt="${tr('Home page of the iPod site showing the black and silver players', 'Página inicial do site do iPod com os leitores em preto e prateado')}">
          <h2>${tr('What I changed in the fork', 'O que alterei no fork')}</h2>
          <p>${escape(work.forkChanges)}</p>
          <p class="archive-credit">${tr('Original simulator by', 'Simulador original de')} ${external(work.upstream, 'Tanner Villarete')}. ${external(work.repo, tr('My fork on GitHub', 'O meu fork no GitHub'))}</p>
          ${navigation}`);
      }
      const introduction = `<aside class="archive-infobox archive-project-info"><strong>${escape(work.category)}</strong><img src="${asset(work.icon)}" alt=""><dl><dt>${t("Source")}</dt><dd>${external(work.repo, 'GitHub')}</dd>${work.demo ? `<dt>${t("Demo")}</dt><dd>${external(work.demo, t("Open app"))}</dd>` : ''}${work.upstream ? `<dt>${t("Upstream")}</dt><dd>${external(work.upstream, t("Team repository"))}</dd>` : ''}</dl></aside>
        <p class="archive-project-subtitle">${escape(work.subtitle)}</p><p>${escape(work.summary)}</p><p class="archive-credit">${escape(work.credit)}</p>`;
      const paragraphs = items => items.map(item => `<p>${escape(item)}</p>`).join('');
      const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;
      const sections = [['contexto', t("Overview")], ['galeria', t("Screenshots")], ['funcionalidades', t("Features")], ['utilizacao', t("User workflow")], ['arquitetura', t("Architecture")], ['desenvolvimento', t("Engineering decisions")], ['executar', t("Run locally")], ['limitacoes', t("Limitations")], ['validacao', t("Validation and sources")]];
      if (work.id === 'abisso') sections.splice(1, 0, ['aquario', t("Interactive aquarium")]);
      const gallery = `<div class="archive-screenshots">${work.screenshots.map((shot, imageIndex) => `<figure><a href="${asset(shot.src)}" data-project-image="${imageIndex}" aria-label="${escape(tr(`View ${shot.title} at full size`, `Ver ${shot.title} em tamanho real`))}"><img src="${asset(shot.src)}" alt="${escape(shot.alt)}" loading="lazy" decoding="async"></a><figcaption><strong>${escape(shot.title)}</strong><span>${escape(shot.caption)}</span></figcaption></figure>`).join('')}</div>`;
      const steps = work.process.map(step => `<section class="archive-step"><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p></section>`).join('');
      const sources = work.sources.map(source => `<li>${source.url ? external(source.url, source.label) : escape(source.label)}${source.note ? ` - ${escape(source.note)}` : ''}</li>`).join('');
      const article = `${introduction}${contents(sections)}
        <h2 id="contexto">${t("Overview")}</h2><p>${escape(work.context)}</p><p>${escape(work.ownership)}</p>
        ${work.id === 'abisso' ? `<section class="archive-aquarium"><h2 id="aquario">${t("Interactive aquarium")}</h2><p>${t("Drag to rotate the aquarium.")}</p><iframe src="abisso-widget.html${language === 'pt' ? '?lang=pt' : ''}" title="${t("Abisso aquarium")}" loading="lazy" sandbox="allow-scripts" style="display:block;width:100%;height:420px;border:0;background:transparent"></iframe></section>` : ''}
        <h2 id="galeria">${t("Screenshots")}</h2><p class="archive-gallery-hint">${t("Select an image to view it at full size.")}</p>${gallery}
        <h2 id="funcionalidades">${t("Features")}</h2>${list(work.features)}
        <h2 id="utilizacao">${t("User workflow")}</h2><ol>${work.journey.map(item => `<li>${escape(item)}</li>`).join('')}</ol>
        <h2 id="arquitetura">${t("Architecture")}</h2><figure class="archive-architecture"><a href="${asset(work.architectureDiagram)}" data-project-architecture aria-label="${escape(tr(`View ${work.title} architecture`, `Ver arquitetura de ${work.title}`))}"><img src="${asset(work.architectureDiagram)}" alt="${escape(tr(`${work.title} architecture with components and data flows`, `Arquitetura de ${work.title} com componentes e fluxos de dados`))}" loading="lazy"></a></figure>${stack(work.stack)}<table class="archive-component-table"><thead><tr><th scope="col">${t("Component")}</th><th scope="col">${t("Responsibility and connections")}</th></tr></thead><tbody>${work.architecture.map(item => `<tr><th scope="row">${escape(item.title)}</th><td>${escape(item.text)}</td></tr>`).join('')}</tbody></table><div class="archive-runtime-flows">${work.architectureFlows.map(flow => `<section><h3>${escape(flow.title)}</h3><ol>${flow.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></section>`).join('')}</div>
        <h2 id="desenvolvimento">${t("Engineering decisions")}</h2>${steps}
        <h2 id="executar">${t("Run locally")}</h2>${list(work.setup.requirements)}<pre class="archive-code"><code>${escape(work.setup.commands.join('\n'))}</code></pre><p>${escape(work.setup.note)}</p>
        <h2 id="limitacoes">${t("Limitations")}</h2>${list(work.limitations)}
        <h2 id="validacao">${t("Validation and sources")}</h2><p>${escape(work.validation)}</p><ul class="archive-sources">${sources}</ul>
        ${navigation}`;
      return projectPage(article);
    }
    if (route.startsWith('/search?')) {
      const query = new URLSearchParams(route.slice(8)).get('q') || '';
      const needle = normalizeSearch(query);
      const pages = [[bio, profile.name, tr(profile.summary, 'O meu nome é Bernardo Maia. Sou recém-licenciado em Engenharia Informática. Desenvolvo aplicações web, móveis e de computador e gosto de explorar como as decisões de arquitetura afetam quem as usa.')], [index, t("Projects"), t("Web, mobile, and desktop software.")], [technologies, t("Technologies"), t("Languages and tools: ") + profile.technologies.flatMap(group => group.items).join(', ')], [github, 'GitHub', t("Contributions and public repositories.")], [contact, t("Contact"), t("Bernardo Maia on GitHub and LinkedIn.")], ...localizedWorks().map(work => [projectRoute(work.id), work.title, work.subtitle, projectSearchText(work)])];
      const matches = pages.filter(item => normalizeSearch(item.join(' ')).includes(needle));
      return { title: t("Search"), html: wiki(t("Search results"), `<p>${matches.length} ${matches.length === 1 ? tr('result', 'resultado') : tr('results', 'resultados')} ${tr('for', 'para')} <strong>${escape(query)}</strong>.</p>${matches.length ? `<ol class="archive-search-results">${matches.map(([url, label, detail]) => `<li>${link(url, label)}<p>${escape(detail)}</p></li>`).join('')}</ol>` : `<p>${tr('Try a technology or a project name, or', 'Experimenta o nome de uma tecnologia ou de um projeto, ou')} ${link(index, t("browse the projects"))}.</p>`}`) };
    }
    const shown = route.startsWith('/unavailable?') ? new URLSearchParams(route.slice(13)).get('address') : route;
    return { title: t("Failed to open page"), html: `<div class="safari-error"><img src="assets/icons/safari.png" alt=""><div><h1>${t("Safari can’t open the page.")}</h1><p><strong>${escape(shown)}</strong> ${tr('is not a My archive page.', 'não é uma página do meu arquivo.')}</p><p>${link(home, t("Home"))} · ${link(index, t("Projects"))}</p></div></div>` };
  }

  function routeTitle(route) {
    if (isWebRoute(route)) return webTitle(webState(route).year);
    if (route === home) return t('My archive');
    if (route.startsWith('/search?')) return t('Search');
    return works.find(work => projectRoute(work.id) === route)?.title
      ?? (route === bio ? profile.name : route === github ? 'GitHub' : archiveLinks().find(([url]) => url === route)?.[1])
      ?? t('Failed to open page');
  }
  function renderTabs() {
    tabsBar.hidden = tabs.length < 2;
    tabsBar.replaceChildren();
    if (tabsBar.hidden) return;
    tabs.forEach((item, position) => {
      const label = routeTitle(item.entries[item.cursor].route);
      const wrapper = document.createElement('div');
      wrapper.className = 'safari-tab';
      wrapper.classList.toggle('selected', position === selected);
      wrapper.setAttribute('role', 'presentation');
      const choose = document.createElement('button');
      choose.type = 'button'; choose.setAttribute('role', 'tab'); choose.setAttribute('aria-selected', String(position === selected)); choose.textContent = label;
      choose.addEventListener('click', () => { rememberScroll(); selected = position; render(); focusPage(); });
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'safari-tab-close'; close.setAttribute('aria-label', tr(`Close tab: ${label}`, `Fechar separador: ${label}`)); close.textContent = '×';
      close.addEventListener('click', () => closeTab(position));
      wrapper.append(choose, close); tabsBar.append(wrapper);
    });
  }
  const imageViewer = $('#safari-media-viewer');
  let viewerItems = [], viewerIndex = 0, viewerOpener = null;
  let inertViewerSiblings = [];
  function renderViewerImage() {
    const item = viewerItems[viewerIndex];
    $('#media-viewer-image').src = item.src;
    $('#media-viewer-image').alt = item.alt || item.title;
    $('#media-viewer-count').textContent = `${viewerIndex + 1} / ${viewerItems.length}`;
    $('#media-viewer-title').textContent = item.title;
    $('#media-viewer-caption').textContent = item.caption || '';
    $('#media-viewer-download').href = item.src;
    $('#media-viewer-previous').disabled = viewerIndex === 0;
    $('#media-viewer-next').disabled = viewerIndex === viewerItems.length - 1;
    imageViewer.classList.remove('original-size');
    $('#media-viewer-zoom').setAttribute('aria-pressed', 'false');
    $('#media-viewer-zoom').setAttribute('aria-label', t("Show original size"));
    $('#media-viewer-stage').scrollTop = $('#media-viewer-stage').scrollLeft = 0;
  }
  function closeImageViewer(restoreFocus = true) {
    if (imageViewer.hidden) return;
    imageViewer.hidden = true;
    for (const [element, wasInert] of inertViewerSiblings) element.inert = wasInert;
    inertViewerSiblings = [];
    $('#media-viewer-image').removeAttribute('src');
    if (restoreFocus && viewerOpener?.isConnected) viewerOpener.focus({ preventScroll: true });
    viewerItems = [];
  }
  function openImageViewer(items, index, opener) {
    if (!items.length || !items[index]) return;
    closeImageViewer(false);
    viewerItems = items;
    viewerIndex = index;
    viewerOpener = opener;
    inertViewerSiblings = [...imageViewer.parentElement.children]
      .filter(element => element !== imageViewer && !element.classList.contains('titlebar') && !element.classList.contains('window-resize-handle'))
      .map(element => [element, element.inert]);
    for (const [element] of inertViewerSiblings) element.inert = true;
    imageViewer.hidden = false;
    renderViewerImage();
    $('#media-viewer-close').focus({ preventScroll: true });
  }
  function stepViewer(delta) {
    const next = viewerIndex + delta;
    if (next < 0 || next >= viewerItems.length) return;
    viewerIndex = next;
    renderViewerImage();
    // Keep keyboard focus on the viewer if an arrow becomes disabled.
    if (document.activeElement?.disabled) $('#media-viewer-close').focus({ preventScroll: true });
  }
  $('#media-viewer-close').addEventListener('click', () => closeImageViewer());
  $('#media-viewer-previous').addEventListener('click', () => stepViewer(-1));
  $('#media-viewer-next').addEventListener('click', () => stepViewer(1));
  $('#media-viewer-zoom').addEventListener('click', () => {
    const original = imageViewer.classList.toggle('original-size');
    $('#media-viewer-zoom').setAttribute('aria-pressed', String(original));
    $('#media-viewer-zoom').setAttribute('aria-label', original ? t("Fit image to viewer") : t("Show original size"));
  });
  $('#media-viewer-stage').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeImageViewer();
  });
  imageViewer.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeImageViewer();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      stepViewer(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Tab') {
      const controls = [...imageViewer.querySelectorAll('button:not(:disabled),a[href]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === imageViewer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function rememberScroll() {
    entry().scroll = page.scrollTop;
  }
  function focusPage() {
    page.focus({ preventScroll: true });
  }
  function render() {
    closeImageViewer(false);
    const current = entry();
    const view = describe(current.route);
    titlebar.textContent = view.title;
    address.value = `http://${host}${current.route}`;
    page.innerHTML = view.html;
    $$('.archive-calendar', page).forEach(renderCalendar);
    const searchLabel = isWebRoute(current.route) ? t("Search the archived web") : t("Search the archive");
    search.placeholder = searchLabel;
    search.setAttribute('aria-label', searchLabel);
    search.form.setAttribute('aria-label', searchLabel);
    if (isWebRoute(current.route)) loadCapture(current.route);
    page.scrollTop = current.scroll;
    const seen = recent.findIndex(item => item.route === current.route);
    if (seen !== -1) recent.splice(seen, 1);
    recent.unshift({ route: current.route });
    recent.length = Math.min(recent.length, 8);
    const menu = $('#safari-recent');
    menu.replaceChildren(...recent.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.safariPage = item.route;
      button.textContent = routeTitle(item.route);
      return button;
    }));
    $$('[data-safari-command="back"]').forEach(button => button.disabled = tab().cursor === 0);
    $$('[data-safari-command="forward"]').forEach(button => button.disabled = tab().cursor >= tab().entries.length - 1);
    renderTabs();
    if (!appWindow('safari').hidden) {
      updateDockThumbnail('safari');
      GenieEffect.schedule(appWindow('safari'));
    }
  }
  function navigate(route, newTab = false) {
    rememberScroll();
    if (newTab) {
      tabs.push({ entries: [{ route, scroll: 0 }], cursor: 0 });
      selected = tabs.length - 1;
    } else if (entry().route !== route) {
      tab().entries.splice(tab().cursor + 1);
      tab().entries.push({ route, scroll: 0 });
      tab().cursor++;
    } else {
      // Desktop shortcuts to the current page should restore it, not recreate
      // its iframe/WebGL scene and invalidate the Genie snapshot.
      const window = appWindow('safari');
      if (activeApp !== 'safari' || window.hidden || window.dataset.minimized === 'true') openApp('safari');
      if (!windowAnimations.has('safari')) focusPage();
      return;
    }
    render();
    if (
      activeApp !== 'safari' ||
      appWindow('safari').hidden ||
      appWindow('safari').dataset.minimized === 'true'
    ) openApp('safari');
    if (!windowAnimations.has('safari')) focusPage();
  }
  function go(delta) {
    const next = tab().cursor + delta;
    if (next < 0 || next >= tab().entries.length) return;
    rememberScroll();
    tab().cursor = next;
    render();
    focusPage();
  }
  function closeTab(position = selected) {
    if (tabs.length === 1) { hideWindow('safari', true); return; }
    rememberScroll();
    tabs.splice(position, 1);
    if (position < selected) selected--;
    else if (position === selected) selected = Math.min(selected, tabs.length - 1);
    render(); focusPage();
  }
  const lookup = value => navigate(isWebRoute(entry().route)
    ? webRoute(value.trim().slice(0, 300), webState(entry().route).year)
    : `/search?q=${encodeURIComponent(value.trim().slice(0, 150))}`);
  $('#safari-address-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = address.value.trim().slice(0, 300);
    if (!value) return;
    const local = value.startsWith('/') && !value.startsWith('//')
      ? value : /^(?:https?:\/\/)?maia\.local(?=[/?#]|$)/i.test(value)
        ? (/^https?:\/\//i.test(value) ? value : `http://${value}`) : null;
    if (local) {
      const url = new URL(local, `http://${host}`);
      if (url.hostname === host) {
        navigate(url.pathname + url.search);
        return;
      }
    }
    navigate(webRoute(value, webState(entry().route).year));
  });
  $('#safari-search-form').addEventListener('submit', event => { event.preventDefault(); if (search.value.trim()) lookup(search.value); });
  page.addEventListener('submit', event => {
    if (event.target.id === 'archive-search') {
      event.preventDefault();
      const query = new FormData(event.target).get('q').trim();
      if (!query) return;
      const titles = archiveLinks().concat(localizedWorks().map(work => [projectRoute(work.id), work.title]));
      const match = event.submitter?.value === 'go' && titles.find(([, title]) => normalizeSearch(title) === normalizeSearch(query));
      navigate(match ? match[0] : `/search?q=${encodeURIComponent(query)}`);
      return;
    }
    if (event.target.id !== 'wayback-search') return;
    event.preventDefault();
    const fields = new FormData(event.target);
    const query = fields.get('q').trim();
    if (query) navigate(webRoute(query, fields.get('year')));
  });
  $('#preview-open-safari').addEventListener('click', () => { const work = works[previewIndex]; $('#quicklook').close(); if (work) openSafariProject(work.id); });
  document.addEventListener('click', event => {
    const architectureLink = event.target.closest('[data-project-architecture]');
    if (architectureLink) {
      event.preventDefault();
      const project = localizedWorks().find(work => projectRoute(work.id) === entry().route);
      if (project) openImageViewer([{ src: project.architectureDiagram, title: tr(project.title + ' architecture', 'Arquitetura de ' + project.title), alt: tr(project.title + ' architecture', 'Arquitetura de ' + project.title), caption: t("Application components and the data exchanged between them.") }], 0, architectureLink);
      return;
    }
    const imageLink = event.target.closest('[data-project-image]');
    if (imageLink) {
      event.preventDefault();
      const project = localizedWorks().find(work => projectRoute(work.id) === entry().route);
      if (project) openImageViewer(project.screenshots, Number(imageLink.dataset.projectImage), imageLink);
      return;
    }
    const route = event.target.closest('[data-safari-page]');
    if (route) { event.preventDefault(); closeMenus(); navigate(route.dataset.safariPage, event.ctrlKey || event.metaKey); return; }
    const section = event.target.closest('[data-safari-section]');
    if (section) { event.preventDefault(); document.getElementById(section.dataset.safariSection)?.scrollIntoView({ block: 'start' }); return; }
    const control = event.target.closest('[data-safari-command]');
    if (!control) return;
    closeMenus();
    switch (control.dataset.safariCommand) {
      case 'back': go(-1); break;
      case 'forward': go(1); break;
      case 'reload': rememberScroll(); render(); focusPage(); break;
      case 'new-tab': navigate(home, true); address.focus(); address.select(); break;
      case 'close-tab': closeTab(); break;
      case 'address': address.focus(); address.select(); break;
      case 'search': search.focus(); break;
      case 'minimize': hideWindow('safari', false, event.shiftKey); break;
      case 'zoom': maximize('safari'); break;
    }
  });
  function localizeChrome() {
    for (const button of languageButtons) button.setAttribute('aria-pressed', String(button.dataset.language === language));
    for (const element of [chrome, page, tabsBar, imageViewer, titlebar]) element.lang = locale();
    for (const [node, label] of chromeLabels) node.textContent = t(label);
    for (const [node, name, label] of chromeAttributes) node.setAttribute(name, t(label));
  }
  languagePicker.addEventListener('click', event => {
    const button = event.target.closest('button[data-language]');
    if (!button || button.dataset.language === language) return;
    rememberScroll();
    language = button.dataset.language;
    storage.set('wiki-language', language);
    localizeChrome();
    render();
  });
  localizeChrome();
  render();
  setInterval(() => { const age = page.querySelector('[data-profile-age]'); if (age) age.textContent = profileAge(); }, 60000);
  return navigate;
})();
