// ============================================================
// notebook.js — Bloc-notes / journal de trading psychologique
// ============================================================
const Notebook = (() => {
  let _currentDate = todayStr();
  let _mode = 'edit'; // 'edit' | 'preview'
  let _saveTimer = null;

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function render(container) {
    _currentDate = todayStr();
    const saved = Store.notes.get(_currentDate);
    const allDates = Object.keys(Store.notes.all()).sort().reverse();

    const dateItems = allDates.map(d => {
      const text = Store.notes.get(d);
      const preview = text.replace(/[#*`_\[\]]/g,'').slice(0, 60) + '...';
      return `
        <button onclick="Notebook.loadDate('${d}')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-[#252840] transition ${d === _currentDate ? 'bg-[#252840] border border-[#2e3256]' : ''}">
          <div class="text-sm font-medium text-white">${new Date(d+'T12:00:00').toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short'})}</div>
          <div class="text-xs text-slate-500 truncate">${preview}</div>
        </button>`;
    }).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Bloc-notes</h2>
        <div class="flex items-center gap-3">
          <span class="text-slate-400 text-sm">${new Date(_currentDate+'T12:00:00').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</span>
          <button onclick="Notebook.toggleMode()" id="toggleModeBtn" class="btn-secondary text-sm">👁 Aperçu</button>
        </div>
      </div>
      <div class="flex h-[calc(100vh-73px)]">

        <!-- Sidebar dates -->
        <aside class="w-56 border-r border-[#2e3256] p-3 overflow-y-auto shrink-0">
          <p class="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">Entrées</p>
          ${dateItems || '<p class="text-xs text-slate-600 px-2">Aucune note</p>'}
        </aside>

        <!-- Editor -->
        <div class="flex-1 flex flex-col">
          <!-- Toolbar -->
          <div class="px-4 py-2 border-b border-[#2e3256] flex gap-2 flex-wrap">
            ${toolbarBtn('**Gras**', 'B', 'font-bold')}
            ${toolbarBtn('*Italique*', 'I', 'italic')}
            ${toolbarBtn('## Titre', 'H', '')}
            ${toolbarBtn('- Liste', '≡', '')}
            ${toolbarBtn('> Citation', '❝', '')}
            ${toolbarBtn('\`code\`', '<>', 'font-mono text-xs')}
            <span class="border-l border-[#2e3256] mx-1"></span>
            <button onclick="Notebook.insertTemplate('routine')"   class="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#252840]">📋 Routine</button>
            <button onclick="Notebook.insertTemplate('psychology')" class="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#252840]">🧠 Psychologie</button>
            <span class="ml-auto text-xs text-slate-600" id="saveStatus">Sauvegardé</span>
          </div>

          <!-- Textarea / Preview -->
          <div class="flex-1 relative">
            <textarea id="noteEditor"
              class="absolute inset-0 w-full h-full bg-transparent text-slate-200 resize-none p-6 font-mono text-sm outline-none"
              placeholder="Écris tes réflexions du jour en Markdown...

## Analyse pré-marché
## Trades du jour
## Bilan émotionnel"
              oninput="Notebook.onInput()">${saved}</textarea>
            <div id="notePreview" class="absolute inset-0 overflow-y-auto p-6 prose-dark hidden"></div>
          </div>
        </div>
      </div>`;
  }

  function toolbarBtn(insert, label, cls) {
    return `<button onclick="Notebook.insert('${insert.replace(/'/g,"\\'")}', ${insert.includes('**') || insert.includes('*I')})"
      class="text-xs ${cls} text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#252840] border border-[#2e3256]">${label}</button>`;
  }

  function insert(text, isWrap) {
    const ta = document.getElementById('noteEditor');
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    let newText;
    if (isWrap && selected) {
      const marker = text.split('text')[0]; // e.g. **
      newText = ta.value.slice(0, start) + text.replace('text', selected) + ta.value.slice(end);
    } else {
      newText = ta.value.slice(0, start) + text + ta.value.slice(end);
    }
    ta.value = newText;
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
      preview.classList.remove('hidden');
      editor.classList.add('hidden');
      btn.textContent = '✏️ Éditer';
    } else {
      preview.classList.add('hidden');
      editor.classList.remove('hidden');
      btn.textContent = '👁 Aperçu';
    }
  }

  function loadDate(date) {
    const ta = document.getElementById('noteEditor');
    if (ta) { ta.value = Store.notes.get(date); }
    _currentDate = date;
    // Re-render sidebar highlights
    document.querySelectorAll('[onclick^="Notebook.loadDate"]').forEach(el => {
      const d = el.getAttribute('onclick').match(/'([^']+)'/)[1];
      el.classList.toggle('bg-[#252840]', d === date);
      el.classList.toggle('border', d === date);
      el.classList.toggle('border-[#2e3256]', d === date);
    });
  }

  function onInput() {
    const ta = document.getElementById('noteEditor');
    if (!ta) return;
    const status = document.getElementById('saveStatus');
    if (status) status.textContent = 'Modification...';
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      Store.notes.set(_currentDate, ta.value);
      if (status) status.textContent = '✓ Sauvegardé';
    }, 800);
  }

  const TEMPLATES = {
    routine: `## 📋 Routine Pré-marché — ${new Date().toLocaleDateString('fr-FR')}

### Analyse macro
- Actualités du jour :
- Sentiment général du marché :

### Plan de trade
- Actifs surveillés :
- Niveaux clés :
- Biais directionnel :

### Objectifs du jour
- [ ] Objectif 1 :
- [ ] Objectif 2 :
`,
    psychology: `## 🧠 Bilan Psychologique — ${new Date().toLocaleDateString('fr-FR')}

### État mental avant la session
- Niveau d'énergie (1-10) :
- Niveau de stress (1-10) :
- Raison :

### Revue émotionnelle
- Respect du plan ? (Oui / Non) :
- Moments de FOMO / Revenge trading ? :
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
