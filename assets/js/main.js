/* ============================================================
   harsh@dev — portfolio interactions
   file switching · terminal · command palette
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Don't let the browser restore a stale inner-scroll on reload — always open a file at its top.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- file registry ---------- */
  const FILES = {
    about:        { file: 'about.md',        lang: 'Markdown' },
    skills:       { file: 'skills.json',      lang: 'JSON' },
    experience:   { file: 'experience.log',   lang: 'Log' },
    education:    { file: 'education.md',      lang: 'Markdown' },
    projects:     { file: 'projects/',        lang: 'Shell' },
    publications: { file: 'publications.bib',  lang: 'BibTeX' },
    contact:      { file: 'contact.sh',        lang: 'Shell Script' },
  };
  const ORDER = Object.keys(FILES);

  const editor = $('#editor');
  const statusLang = $('#status-lang');
  const statusPos = $('#status-pos');
  const sidebar = $('#sidebar');

  /* ---------- open a file ---------- */
  function resolve(name) {
    if (!name) return null;
    let n = name.trim().toLowerCase().replace(/\/$/, '');
    n = n.replace(/\.(md|json|log|bib|sh)$/, '');
    return FILES[n] ? n : null;
  }

  function openFile(key, opts = {}) {
    if (!FILES[key]) return false;
    $$('.panel').forEach((p) => p.classList.toggle('active', p.dataset.file === key));
    $$('.tab').forEach((t) => {
      const on = t.dataset.file === key;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $$('.file').forEach((f) => f.classList.toggle('active', f.dataset.file === key));

    statusLang.textContent = FILES[key].lang;
    if (statusPos) statusPos.textContent = 'Ln 1, Col 1';

    if (!opts.silent && location.hash !== '#' + key) history.replaceState(null, '', '#' + key);

    // keep active tab in view — horizontal only (never touch the editor's scroll)
    const tabs = $('#tabs');
    const tab = $('.tab[data-file="' + key + '"]');
    if (tabs && tab) tabs.scrollLeft = tab.offsetLeft - (tabs.clientWidth - tab.clientWidth) / 2;

    if (editor) editor.scrollTop = 0;

    setSidebar(false);
    return true;
  }

  // clicks: tabs, tree, action buttons
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-file]');
    if (nav && (nav.classList.contains('tab') || nav.classList.contains('file'))) {
      openFile(nav.dataset.file);
      return;
    }
    const act = e.target.closest('[data-action]');
    if (act) {
      e.preventDefault();
      if (act.dataset.action === 'open') openFile(act.dataset.arg);
    }
  });

  /* ---------- mobile explorer ---------- */
  const scrim = $('#scrim');
  function setSidebar(open) {
    if (sidebar) sidebar.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('show', open);
  }
  const menuBtn = $('#menu-btn');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); setSidebar(!sidebar.classList.contains('open')); });
    if (scrim) scrim.addEventListener('click', () => setSidebar(false));
  }

  /* ---------- terminal ---------- */
  const out = $('#term-out');
  const form = $('#term-form');
  const input = $('#term-input');

  function print(html, cls) {
    if (!out) return;
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const HELP = [
    ['help', 'show this list'],
    ['ls', 'list files'],
    ['open &lt;file&gt;', 'open a file (also: cat, cd)'],
    ['whoami', 'about me in one line'],
    ['resume', 'download my résumé'],
    ['github / linkedin / email', 'open a link'],
    ['clear', 'clear the terminal'],
    ['↑ ↓ · tab', 'command history &amp; autocomplete'],
  ];

  const openLink = (url) => window.open(url, '_blank', 'noopener');
  const LINKS = {
    github: 'https://github.com/Harsh-Shah012001',
    linkedin: 'https://www.linkedin.com/in/harshshah012001',
    email: 'mailto:hshah012001@gmail.com',
    resume: 'Resume_Harsh_Shah.pdf',
  };

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    print('<span style="color:var(--green)">harsh@dev</span><span style="color:var(--fg-mute)">:</span><span style="color:var(--blue)">~</span><span style="color:var(--fg-mute)">$</span> ' + esc(line));
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        HELP.forEach(([c, d]) => print('  <span style="color:var(--amber)">' + c + '</span>  <span style="color:var(--fg-mute)">— ' + d + '</span>'));
        break;
      case 'ls': case 'll': case 'dir':
        ORDER.forEach((k) => print('  <span style="color:var(--blue)">' + FILES[k].file + '</span>'));
        break;
      case 'open': case 'cat': case 'cd': case 'vim': case 'nano': {
        const key = resolve(arg);
        if (key) { openFile(key); print('<span style="color:var(--fg-mute)">opened ' + FILES[key].file + '</span>'); }
        else print('<span style="color:var(--red)">no such file: ' + esc(arg || '?') + '</span> — try <span style="color:var(--amber)">ls</span>');
        break;
      }
      case 'whoami':
        print('<span style="color:var(--fg-dim)">harsh_shah — full-stack software engineer · Associate SWE @ Atlas SP · New York City</span>');
        break;
      case 'pwd': print('/home/harsh/portfolio'); break;
      case 'echo': print(esc(arg)); break;
      case 'resume': case 'cv': print('<span style="color:var(--fg-mute)">downloading résumé…</span>'); openLink(LINKS.resume); break;
      case 'github': case 'gh': print('<span style="color:var(--fg-mute)">→ github.com/Harsh-Shah012001</span>'); openLink(LINKS.github); break;
      case 'linkedin': case 'li': print('<span style="color:var(--fg-mute)">→ linkedin.com/in/harshshah012001</span>'); openLink(LINKS.linkedin); break;
      case 'contact': openFile('contact'); print('<span style="color:var(--fg-mute)">→ opening contact.sh</span>'); break;
      case 'email': case 'mail': print('<span style="color:var(--fg-mute)">→ hshah012001@gmail.com</span>'); openLink(LINKS.email); break;
      case 'date': print(new Date().toString()); break;
      case 'clear': case 'cls': out.innerHTML = ''; break;
      case 'sudo': print('<span style="color:var(--green)">nice try 😏 — you already have root here.</span>'); break;
      case 'exit': case 'q': print('<span style="color:var(--fg-mute)">there is no escape. (thanks for visiting!)</span>'); break;
      default:
        print('<span style="color:var(--red)">command not found: ' + esc(cmd) + '</span> — type <span style="color:var(--amber)">help</span>');
    }
  }

  const cmdHistory = [];
  let histIdx = 0;
  const COMPLETIONS = ['help', 'ls', 'open', 'cat', 'cd', 'whoami', 'resume', 'github', 'linkedin', 'email', 'contact', 'clear', 'pwd', 'echo', 'date'];
  const FILE_NAMES = ORDER.map((k) => FILES[k].file);

  const setCaretEnd = (el) => { const v = el.value; el.value = ''; el.value = v; };

  function complete() {
    const parts = input.value.split(/\s+/);
    const frag = (parts[parts.length - 1] || '').toLowerCase();
    const fileCtx = parts.length > 1 && /^(open|cat|cd|vim|nano)$/.test(parts[0]);
    const pool = fileCtx ? FILE_NAMES : COMPLETIONS;
    const matches = pool.filter((c) => c.toLowerCase().startsWith(frag));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + (fileCtx ? '' : ' ');
    } else if (matches.length > 1) {
      print('  ' + matches.map((m) => '<span style="color:var(--blue)">' + m + '</span>').join('&nbsp;&nbsp;&nbsp;'));
    }
  }

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      if (v.trim()) cmdHistory.push(v.trim());
      histIdx = cmdHistory.length;
      run(v);
      input.value = '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (!cmdHistory.length) return;
        e.preventDefault();
        histIdx = Math.max(0, histIdx - 1);
        input.value = cmdHistory[histIdx] || '';
        setCaretEnd(input);
      } else if (e.key === 'ArrowDown') {
        if (!cmdHistory.length) return;
        e.preventDefault();
        histIdx = Math.min(cmdHistory.length, histIdx + 1);
        input.value = cmdHistory[histIdx] || '';
        setCaretEnd(input);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        complete();
      }
    });
  }

  // click anywhere in the terminal (except a button) to focus the prompt
  const term = $('.term');
  if (term && input) {
    term.addEventListener('click', (e) => {
      if (!e.target.closest('button, a') && !String(window.getSelection())) input.focus();
    });
  }

  const termClear = $('#term-clear');
  if (termClear) termClear.addEventListener('click', () => { if (out) out.innerHTML = ''; });

  /* ---------- boot sequence ---------- */
  function boot() {
    const lines = [
      '<span style="color:var(--fg-mute)">harsh@dev — portfolio v2.0 · ' + ORDER.length + ' files loaded</span>',
      'type <span style="color:var(--amber)">help</span> for commands, or click a file in the explorer.',
    ];
    if (reduced) { lines.forEach((l) => print(l)); return; }
    let i = 0;
    const next = () => { if (i < lines.length) { print(lines[i++]); setTimeout(next, 260); } };
    next();
  }

  /* ---------- command palette ---------- */
  const pWrap = $('#palette-wrap');
  const pInput = $('#palette-input');
  const pList = $('#palette-list');

  const PALETTE = [
    ...ORDER.map((k) => ({ label: 'Open ' + FILES[k].file, ico: '▸', hint: k, run: () => openFile(k) })),
    { label: 'Download résumé', ico: '⤓', hint: 'pdf', run: () => openLink(LINKS.resume) },
    { label: 'GitHub', ico: '↗', hint: 'link', run: () => openLink(LINKS.github) },
    { label: 'LinkedIn', ico: '↗', hint: 'link', run: () => openLink(LINKS.linkedin) },
    { label: 'Email me', ico: '✉', hint: 'mailto', run: () => openLink(LINKS.email) },
    { label: 'Clear terminal', ico: '⌫', hint: 'clear', run: () => { if (out) out.innerHTML = ''; } },
  ];
  let pSel = 0, pFiltered = PALETTE;

  function renderPalette() {
    if (!pList) return;
    pList.innerHTML = '';
    pFiltered.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'pcmd' + (i === pSel ? ' sel' : '');
      el.innerHTML = '<span class="ico">' + c.ico + '</span><span>' + c.label + '</span><span class="hint">' + c.hint + '</span>';
      el.addEventListener('click', () => { c.run(); closePalette(); });
      el.addEventListener('mousemove', () => { pSel = i; markSel(); });
      pList.appendChild(el);
    });
  }
  function markSel() {
    $$('.pcmd', pList).forEach((el, i) => el.classList.toggle('sel', i === pSel));
  }
  function filterPalette(q) {
    q = q.toLowerCase();
    pFiltered = PALETTE.filter((c) => (c.label + ' ' + c.hint).toLowerCase().includes(q));
    pSel = 0; renderPalette();
  }
  function openPalette() {
    if (!pWrap) return;
    pWrap.classList.add('open'); pFiltered = PALETTE; pSel = 0;
    renderPalette();
    if (pInput) { pInput.value = ''; pInput.focus(); }
  }
  function closePalette() { if (pWrap) pWrap.classList.remove('open'); }

  if (pInput) {
    pInput.addEventListener('input', () => filterPalette(pInput.value));
    pInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); pSel = Math.min(pSel + 1, pFiltered.length - 1); markSel(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pSel = Math.max(pSel - 1, 0); markSel(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (pFiltered[pSel]) { pFiltered[pSel].run(); closePalette(); } }
      else if (e.key === 'Escape') closePalette();
    });
  }
  if (pWrap) pWrap.addEventListener('click', (e) => { if (e.target === pWrap) closePalette(); });
  const cmdkBtn = $('#cmdk-btn');
  if (cmdkBtn) {
    cmdkBtn.addEventListener('click', openPalette);
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
    cmdkBtn.innerHTML = 'press <b>' + (isMac ? '⌘K' : 'Ctrl K') + '</b> for commands';
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape') closePalette();
  });

  /* ---------- init ---------- */
  const start = resolve(location.hash.replace('#', '')) || 'about';
  openFile(start, { silent: true });
  // guard against late scroll restoration after first paint
  requestAnimationFrame(() => { if (editor) editor.scrollTop = 0; });
  window.addEventListener('load', () => { if (editor) editor.scrollTop = 0; });
  boot();
})();
