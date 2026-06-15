// ============================================================
// trades.js — CRUD des trades
// ============================================================
const Trades = (() => {

  let _imageData = null; // base64 de l'image courante

  function openNew() {
    _imageData = null;
    document.getElementById('tradeId').value = '';
    document.getElementById('tradeModalTitle').textContent = 'Nouveau Trade';
    document.getElementById('tDate').value = new Date().toISOString().slice(0, 16);
    ['tAsset','tSize','tEntry','tExit','tPnl','tNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('tSide').value = 'buy';
    document.getElementById('tEmotion').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    App.openModal('tradeModal');
  }

  function openEdit(id) {
    const t = Store.trades.getById(id);
    if (!t) return;
    _imageData = t.image || null;
    document.getElementById('tradeId').value = t.id;
    document.getElementById('tradeModalTitle').textContent = 'Modifier le Trade';
    document.getElementById('tDate').value   = t.date;
    document.getElementById('tAsset').value  = t.asset;
    document.getElementById('tSide').value   = t.side;
    document.getElementById('tSize').value   = t.size;
    document.getElementById('tEntry').value  = t.entry;
    document.getElementById('tExit').value   = t.exit;
    document.getElementById('tPnl').value    = t.pnl;
    document.getElementById('tEmotion').value= t.emotion;
    document.getElementById('tNotes').value  = t.notes;
    const prev = document.getElementById('imagePreview');
    if (t.image) { prev.src = t.image; prev.classList.remove('hidden'); }
    else { prev.classList.add('hidden'); }
    App.openModal('tradeModal');
  }

  function save() {
    const id      = document.getElementById('tradeId').value;
    const journalId = Journals.activeId();
    if (!journalId) { alert('Aucun journal sélectionné.'); return; }

    const trade = {
      id:        id || Store.uid(),
      journalId,
      date:      document.getElementById('tDate').value,
      asset:     document.getElementById('tAsset').value.trim(),
      side:      document.getElementById('tSide').value,
      size:      parseFloat(document.getElementById('tSize').value) || 0,
      entry:     parseFloat(document.getElementById('tEntry').value) || 0,
      exit:      parseFloat(document.getElementById('tExit').value) || 0,
      pnl:       parseFloat(document.getElementById('tPnl').value) || 0,
      emotion:   document.getElementById('tEmotion').value,
      notes:     document.getElementById('tNotes').value.trim(),
      image:     _imageData,
    };

    if (!trade.asset) { alert('Veuillez renseigner l\'actif.'); return; }

    if (id) Store.trades.update(trade);
    else    Store.trades.add(trade);

    App.closeModal('tradeModal');
    App.render('journal');
    if (App.currentPage === 'dashboard') App.render('dashboard');
  }

  function remove(id) {
    if (!confirm('Supprimer ce trade ?')) return;
    Store.trades.delete(id);
    App.render('journal');
    if (App.currentPage === 'dashboard') App.render('dashboard');
  }

  function handleImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      _imageData = e.target.result;
      const prev = document.getElementById('imagePreview');
      prev.src = _imageData;
      prev.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function setupDropzone() {
    const dz = document.getElementById('dropzone');
    if (!dz) return;
    dz.addEventListener('click', () => document.getElementById('tImage').click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-brand'); });
    dz.addEventListener('dragleave', ()  => dz.classList.remove('border-brand'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('border-brand');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        _imageData = ev.target.result;
        const prev = document.getElementById('imagePreview');
        prev.src = _imageData;
        prev.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // Calcul stats pour un tableau de trades
  function stats(tradeList) {
    const total  = tradeList.reduce((s, t) => s + t.pnl, 0);
    const wins   = tradeList.filter(t => t.pnl > 0);
    const losses = tradeList.filter(t => t.pnl < 0);
    const winRate = tradeList.length ? (wins.length / tradeList.length * 100) : 0;
    const avgWin  = wins.length   ? wins.reduce((s,t) => s + t.pnl, 0) / wins.length   : 0;
    const avgLoss = losses.length ? losses.reduce((s,t) => s + t.pnl, 0) / losses.length : 0;
    return { total, wins: wins.length, losses: losses.length, count: tradeList.length, winRate, avgWin, avgLoss };
  }

  return { openNew, openEdit, save, remove, handleImage, setupDropzone, stats };
})();
