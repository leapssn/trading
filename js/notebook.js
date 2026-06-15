// ============================================================
// notebook.js — Bloc-notes (async store)
// ============================================================
const Notebook = (() => {
  let _currentDate = todayStr();
  let _mode        = 'edit';
  let _saveTimer   = null;

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function render(container) {
    _currentDate = todayStr();
    const saved    = Store.notes.get(_currentDate);
    const allNotes = Store.notes.all();
    const allDates = Object.keys(allNotes).sort().reverse();

    const dateItems = allDates.map(d => {
      const text    = Store.notes.get(d);
      const preview = text.replace(/[#*`_\[\]]/g,'').slice(0, 60) + '…';
      const active  = d === _currentDate;
      return `
        <button onclick="Notebook.loadDate('${d}')"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition ${active ? 'border' : ''}"
          style="${active ? 'background:var(--bg-hover);border-color:var(--border)' : ''}">
          <div class="text-sm font-medium" style="color:var(--text-primary)">${new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>
          <div class="text-xs truncate" style="color:var(--text-faint)">${preview}</div>
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Bloc-notes</h2>
        <div class="flex items-center gap-3">
          <span class="text-sm" style="color:var(--text-muted)">${new Date(_currentDate+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
          <button onclick="Notebook.toggleMode()" id="toggleModeBtn" class="btn-secondary text-sm">👁 Aperçu</button>
        </div>
      </div>

      <div class="flex" style="height:calc(100vh - 73px)">
        <!-- Sidebar dates -->
        <aside class="w-56 p-3 overflow-y-auto shrink-0 border-r" style="border-color:var(--border)">
          <p class="form-label px-2 mb-2">Entrées</p>
          ${dateItems || `<p class="text-xs px-2" style="color:var(--text-faint)">Aucune note</p>`}
        </aside>

        <!-- Éditeur -->
        <div class="flex-1 flex flex-col">
          <!-- Toolbar -->
          <div class="px-4 py-2 flex gap-2 flex-wrap border-b" style="border-color:var(--border);background:var(--bg-sidebar)">
            ${toolbarBtn('**gras**',   'B',  'font-bold')}
            ${toolbarBtn('*italique*', 'I',  'italic')}
            ${toolbarBtn('## Titre',   'H',  '')}
            ${toolbarBtn('- item',     '≡',  '')}
            ${toolbarBtn('> citation', '❝',  '')}
            ${toolbarBtn('\`code\`',   '<>', 'font-mono text-xs')}
            <span class="border-l mx-1" style="border-color:var(--border)"></span>
            <button onclick="Notebook.insertTemplate('routine')"    class="text-xs px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition" style="color:var(--text-muted)">📋 Routine</button>
            <button onclick="Notebook.insertTemplate('psychology')" class="text-xs px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition" style="color:var(--text-muted)">🧠 Psychologie</button>
            <span class="ml-auto text-xs" style="color:var(--text-faint)" id="saveStatus">Sauvegardé ✓</span>
          </div>

          <div class="flex-1 relative">
            <textarea id="noteEditor"
              class="absolute inset-0 w-full h-full resize-none p-6 font-mono text-sm outline-none"
              style="background:var(--bg-main);color:var(--text-primary)"
              placeholder="Écris tes réflexions en Markdown…"
              oninput="Notebook.onInput()">${saved}</textarea>
            <div id="notePreview" class="absolute inset-0 overflow-y-auto p-6 prose-dark hidden" style="background:var(--bg-main)"></div>
          </div>
        </div>
      </div>`;
  }

  function toolbarBtn(insert, label, cls) {
    const esc = insert.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<button onclick="Notebook.insert('${esc}')"
      class="text-xs ${cls} px-2 py-1 rounded border transition hover:bg-[var(--bg-hover)]"
      style="border-color:var(--border);color:var(--text-muted)">${label}</button>`;
  }

  function insert(text) {
    const ta = document.getElementById('noteEditor');
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    onInput();
    ta.focus();
  }

  function toggleMode() {
    _mode = _mode === 'edit' ? 'preview' : 'edit';
    const editor  = document.getElementById('noteEditor');
    const preview = document.getElementById('notePreview');
    const btn     = document.getElementById('toggleModeBtn');
    if (_mode === 'preview') {
      preview.innerHTML = marked.parse(editor.value || '*Aucun contenu*');
      preview.classList.remove('hidden'); editor.classList.add('hidden');
      btn.textContent = '✏️ Éditer';
    } else {
      preview.classList.add('hidden'); editor.classList.remove('hidden');
      btn.textContent = '👁 Aperçu';
    }
  }

  function loadDate(date) {
    const ta = document.getElementById('noteEditor');
    if (ta) ta.value = Store.notes.get(date);
    _currentDate = date;
    document.querySelectorAll('[onclick^="Notebook.loadDate"]').forEach(el => {
      const d = el.getAttribute('onclick').match(/'([^']+)'/)?.[1];
      el.style.background = d === date ? 'var(--bg-hover)' : '';
    });
  }

  function onInput() {
    const ta     = document.getElementById('noteEditor');
    const status = document.getElementById('saveStatus');
    if (!ta) return;
    if (status) status.textContent = '…';
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      await Store.notes.set(_currentDate, ta.value);
      if (status) status.textContent = 'Sauvegardé ✓';
    }, 800);
  }

  const TEMPLATES = {
    routine: `## 📋 Routine Pré-marché — ${new Date().toLocaleDateString('fr-FR')}

### Analyse macro
- Actualités du jour :
- Sentiment général :

### Plan de trade
- Actifs surveillés :
- Niveaux clés :
- Biais directionnel :

### Objectifs
- [ ] Objectif 1 :
- [ ] Objectif 2 :
`,
    psychology: `## 🧠 Bilan Psychologique — ${new Date().toLocaleDateString('fr-FR')}

### État mental avant session
- Niveau d'énergie (1-10) :
- Niveau de stress (1-10) :

### Revue émotionnelle
- Respect du plan ? :
- FOMO / Revenge trading ? :
- Ce qui s'est bien passé :
- Ce qui doit s'améliorer :

### Leçon du jour
>
`,
  };

  function insertTemplate(type) {
    const ta = document.getElementById('noteEditor');
    if (!ta) return;
    ta.value = (ta.value ? ta.value + '\n\n' : '') + TEMPLATES[type];
    onInput();
  }

  return { render, insert, toggleMode, loadDate, onInput, insertTemplate };
})();
