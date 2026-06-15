// ============================================================
// notebook.js — Bloc-notes style Notion (WYSIWYG + onglets)
// Stockage : Store.notes keyed par pageId
// Format page : { id, title, content (HTML), createdAt }
// ============================================================
const Notebook = (() => {

  let _pages       = [];   // liste des pages
  let _activeId    = null; // id de la page ouverte
  let _saveTimer   = null;
  let _renaming    = null; // id de l'onglet en cours de renommage

  // ── Chargement des pages depuis le store ──────────────────
  function loadPages() {
    const raw = Store.notes.all();
    // Pages stockées comme notes avec clé "__pages__" pour la liste
    // et "__page_<id>__" pour le contenu
    const meta = raw['__pages__'];
    if (meta) {
      try { _pages = JSON.parse(meta); } catch { _pages = []; }
    }
    if (!_pages.length) {
      // Créer la page de bienvenue
      const id = Store.uid();
      _pages = [{ id, title: 'Ma première page', createdAt: new Date().toISOString() }];
      saveMeta();
    }
    _activeId = _activeId && _pages.find(p => p.id === _activeId) ? _activeId : _pages[0].id;
  }

  function saveMeta() {
    Store.notes.set('__pages__', JSON.stringify(_pages));
  }

  function pageContent(id) {
    return Store.notes.get('__page_' + id + '__') || '';
  }

  async function saveContent(id, html) {
    await Store.notes.set('__page_' + id + '__', html);
  }

  // ── Render principal ──────────────────────────────────────
  function render(container) {
    loadPages();
    // Le container doit remplir exactement la zone disponible
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    container.innerHTML = `
      <div class="flex flex-col" style="flex:1;min-height:0;overflow:hidden">

        <!-- Barre d'onglets -->
        <div class="flex items-center border-b overflow-x-auto shrink-0" style="border-color:var(--border);background:var(--bg-sidebar)">
          <div id="tabBar" class="flex items-center gap-0.5 px-3 py-2 flex-1 min-w-0 overflow-x-auto">
            ${_pages.map(p => tabHTML(p)).join('')}
          </div>
          <button onclick="Notebook.newPage()" title="Nouvelle page"
            class="shrink-0 mx-3 w-7 h-7 rounded-lg flex items-center justify-center text-lg font-light transition hover:bg-brand/20"
            style="color:var(--text-faint)">+</button>
        </div>

        <!-- Toolbar de formatage -->
        <div id="editorToolbar" class="flex items-center gap-1 px-4 py-2 border-b flex-wrap shrink-0" style="border-color:var(--border);background:var(--bg-sidebar)">
          ${tbBtn('bold',        '<b>B</b>',          'Gras')}
          ${tbBtn('italic',      '<i>I</i>',          'Italique')}
          ${tbBtn('underline',   '<u>U</u>',          'Souligné')}
          ${tbBtn('strikeThrough','<s>S</s>',         'Barré')}
          <div class="w-px h-5 mx-1" style="background:var(--border)"></div>
          ${tbBtnCustom("Notebook.formatBlock('h1')", 'H1', 'Titre 1')}
          ${tbBtnCustom("Notebook.formatBlock('h2')", 'H2', 'Titre 2')}
          ${tbBtnCustom("Notebook.formatBlock('h3')", 'H3', 'Titre 3')}
          ${tbBtnCustom("Notebook.formatBlock('p')",  '¶',  'Paragraphe')}
          <div class="w-px h-5 mx-1" style="background:var(--border)"></div>
          ${tbBtn('insertUnorderedList', '≡', 'Liste à puces')}
          ${tbBtn('insertOrderedList',   '№', 'Liste numérotée')}
          ${tbBtnCustom("Notebook.insertCheck()", '☑', 'Case à cocher')}
          <div class="w-px h-5 mx-1" style="background:var(--border)"></div>
          ${tbBtnCustom("Notebook.formatBlock('blockquote')", '❝', 'Citation')}
          ${tbBtnCustom("Notebook.insertHr()",               '—', 'Séparateur')}
          <div class="w-px h-5 mx-1" style="background:var(--border)"></div>
          <input type="color" id="fontColorPicker" class="w-6 h-6 rounded cursor-pointer border-0 p-0" style="background:none"
            onchange="Notebook.applyColor(this.value)" title="Couleur du texte" value="#6366f1" />
          <div class="ml-auto flex items-center gap-2">
            <span id="saveStatus" class="text-xs" style="color:var(--text-faint)">✓</span>
            <button onclick="Notebook.deletePage('${_activeId}')" title="Supprimer cette page"
              class="text-xs px-2 py-1 rounded hover:text-red-400 transition" style="color:var(--text-faint)">🗑️ Supprimer</button>
          </div>
        </div>

        <!-- Zone d'édition -->
        <div class="flex-1 overflow-y-auto" style="background:var(--bg-main)">
          <div class="max-w-3xl mx-auto px-8 py-10">
            <!-- Titre de la page -->
            <div id="pageTitle"
              contenteditable="true"
              spellcheck="false"
              class="text-4xl font-bold outline-none mb-6 empty:before:content-['Sans_titre'] empty:before:opacity-30"
              style="color:var(--text-primary)"
              onblur="Notebook.saveTitle()"
              onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('editor').focus()}"
            >${escHtml(_pages.find(p=>p.id===_activeId)?.title || '')}</div>

            <!-- Éditeur WYSIWYG -->
            <div id="editor"
              contenteditable="true"
              spellcheck="true"
              class="outline-none min-h-[60vh] notion-editor"
              style="color:var(--text-primary);font-size:1rem;line-height:1.75"
              oninput="Notebook.onInput()"
              onkeydown="Notebook.onKeyDown(event)"
              onpaste="Notebook.onPaste(event)"
            >${pageContent(_activeId)}</div>
          </div>
        </div>
      </div>`;

    // Focus éditeur
    requestAnimationFrame(() => {
      const ed = document.getElementById('editor');
      if (ed && !ed.textContent.trim()) ed.focus();
    });
  }

  // ── HTML d'un onglet ──────────────────────────────────────
  function tabHTML(page) {
    const active = page.id === _activeId;
    return `
      <div id="tab_${page.id}"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-sm shrink-0 group transition"
        style="${active ? 'background:var(--bg-hover);color:var(--text-primary)' : 'color:var(--text-faint)'}"
        onclick="Notebook.switchPage('${page.id}')">
        <span>📄</span>
        <span id="tabLabel_${page.id}" class="max-w-[120px] truncate">${escHtml(page.title)}</span>
        <button onclick="event.stopPropagation();Notebook.startRename('${page.id}')"
          class="opacity-0 group-hover:opacity-100 transition text-xs ml-0.5 hover:text-white" title="Renommer">✏️</button>
      </div>`;
  }

  // ── Toolbar helpers ───────────────────────────────────────
  function tbBtn(cmd, label, title) {
    return `<button onmousedown="event.preventDefault();document.execCommand('${cmd}')"
      title="${title}" class="toolbar-btn">${label}</button>`;
  }
  function tbBtnCustom(fn, label, title) {
    return `<button onmousedown="event.preventDefault();${fn}"
      title="${title}" class="toolbar-btn">${label}</button>`;
  }

  function formatBlock(tag) {
    document.execCommand('formatBlock', false, tag);
    document.getElementById('editor')?.focus();
  }

  function insertCheck() {
    const id = 'chk_' + Date.now();
    document.execCommand('insertHTML', false,
      `<div class="flex items-start gap-2 my-1"><input type="checkbox" id="${id}" class="mt-1 accent-brand" onchange="this.parentElement.querySelector('label').style.textDecoration=this.checked?'line-through':''"><label for="${id}" style="cursor:pointer;color:var(--text-muted)">Tâche…</label></div>`
    );
  }

  function insertHr() {
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"><p><br></p>');
  }

  function applyColor(color) {
    document.execCommand('foreColor', false, color);
    document.getElementById('editor')?.focus();
  }

  // ── Saisie & sauvegarde ───────────────────────────────────
  function onInput() {
    const status = document.getElementById('saveStatus');
    if (status) status.textContent = '…';
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      const ed = document.getElementById('editor');
      if (ed && _activeId) {
        await saveContent(_activeId, ed.innerHTML);
        if (status) status.textContent = '✓ Sauvegardé';
      }
    }, 600);
  }

  function saveTitle() {
    const el    = document.getElementById('pageTitle');
    const title = el?.textContent.trim() || 'Sans titre';
    const page  = _pages.find(p => p.id === _activeId);
    if (page && page.title !== title) {
      page.title = title;
      saveMeta();
      const label = document.getElementById('tabLabel_' + _activeId);
      if (label) label.textContent = title;
    }
  }

  function onKeyDown(e) {
    // Tab → insérer 2 espaces au lieu de changer le focus
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;');
    }
    // Entrée dans une liste vide → quitter la liste
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel?.anchorNode) {
        const li = sel.anchorNode.parentElement?.closest('li');
        if (li && li.textContent.trim() === '') {
          e.preventDefault();
          document.execCommand('outdent');
          document.execCommand('formatBlock', false, 'p');
        }
      }
    }
  }

  // Coller en texte brut (évite d'injecter des styles externes)
  function onPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  // ── Gestion des pages ─────────────────────────────────────
  function switchPage(id) {
    // Sauvegarder la page courante
    const ed = document.getElementById('editor');
    if (ed && _activeId) saveContent(_activeId, ed.innerHTML);

    saveTitle();
    _activeId = id;
    App.render('notebook');
  }

  function newPage() {
    const id    = Store.uid();
    const page  = { id, title: 'Nouvelle page', createdAt: new Date().toISOString() };
    _pages.push(page);
    saveMeta();
    _activeId = id;
    App.render('notebook');
    // Focus titre après render
    requestAnimationFrame(() => {
      const t = document.getElementById('pageTitle');
      if (t) { t.focus(); document.execCommand('selectAll'); }
    });
  }

  async function deletePage(id) {
    if (_pages.length <= 1) { alert('Impossible de supprimer la dernière page.'); return; }
    if (!confirm('Supprimer cette page ?')) return;
    await Store.notes.set('__page_' + id + '__', '');
    _pages = _pages.filter(p => p.id !== id);
    saveMeta();
    _activeId = _pages[0].id;
    App.render('notebook');
  }

  function startRename(id) {
    const label = document.getElementById('tabLabel_' + id);
    if (!label) return;
    label.contentEditable = 'true';
    label.focus();
    document.execCommand('selectAll');
    label.onblur = () => {
      const newTitle = label.textContent.trim() || 'Sans titre';
      label.contentEditable = 'false';
      const page = _pages.find(p => p.id === id);
      if (page) { page.title = newTitle; saveMeta(); }
      if (id === _activeId) {
        const pt = document.getElementById('pageTitle');
        if (pt) pt.textContent = newTitle;
      }
    };
    label.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); label.blur(); } };
  }

  function escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, newPage, switchPage, deletePage, startRename, saveTitle, onInput, onKeyDown, onPaste, formatBlock, insertCheck, insertHr, applyColor };
})();
