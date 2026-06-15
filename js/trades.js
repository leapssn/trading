// ============================================================
// trades.js — CRUD des trades + auto-calcul P&L
// ============================================================
const Trades = (() => {

  let _imageData = null;

  function openNew() {
    _imageData = null;
    document.getElementById('tradeId').value       = '';
    document.getElementById('tradeModalTitle').textContent = 'Nouveau Trade';
    document.getElementById('tDate').value         = new Date().toISOString().slice(0, 16);
    document.getElementById('tAsset').value        = '';
    document.getElementById('tAssetCustom').value  = '';
    document.getElementById('tSide').value         = 'buy';
    document.getElementById('tEmotion').value      = '';
    document.getElementById('tGrade').value        = '';
    ['tSize','tEntry','tExit','tSL','tNotes','tTags'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('imagePreview').classList.add('hidden');
    resetPnlDisplay();
    App.openModal('tradeModal');
  }

  function openEdit(id) {
    const t = Store.trades.getById(id);
    if (!t) return;
    _imageData = t.image || null;
    document.getElementById('tradeId').value       = t.id;
    document.getElementById('tradeModalTitle').textContent = 'Modifier le Trade';
    document.getElementById('tDate').value         = t.date;
    document.getElementById('tSide').value         = t.side;
    document.getElementById('tSize').value         = t.size;
    document.getElementById('tEntry').value        = t.entry;
    document.getElementById('tExit').value         = t.exit;
    document.getElementById('tEmotion').value      = t.emotion;
    document.getElementById('tSL').value           = t.sl || '';
    document.getElementById('tGrade').value        = t.grade || '';
    document.getElementById('tTags').value         = t.tags || '';
    document.getElementById('tNotes').value        = t.notes;

    const inCatalog = Assets.getBySymbol(t.asset);
    document.getElementById('tAsset').value       = inCatalog ? t.asset : '';
    document.getElementById('tAssetCustom').value = inCatalog ? '' : (t.asset || '');

    const prev = document.getElementById('imagePreview');
    if (t.image) { prev.src = t.image; prev.classList.remove('hidden'); }
    else { prev.classList.add('hidden'); }

    updatePnlDisplay(t.pnlUSD ?? t.pnl, t.pnlPct ?? null, t.pips ?? null, t.quoteSymbol);
    App.openModal('tradeModal');
  }

  function recalcPnL() {
    const symbol = activeSymbol();
    const side   = document.getElementById('tSide')?.value;
    const entry  = parseFloat(document.getElementById('tEntry')?.value);
    const exit   = parseFloat(document.getElementById('tExit')?.value);
    const sl     = parseFloat(document.getElementById('tSL')?.value) || null;
    const size   = parseFloat(document.getElementById('tSize')?.value);
    if (!entry || !exit || !size) { resetPnlDisplay(); return; }
    const result = Assets.calcPnL(symbol, side, entry, exit, size);
    let rr = null;
    if (sl && Math.abs(entry - sl) > 0) {
      rr = +(Math.abs(exit - entry) / Math.abs(entry - sl)).toFixed(2);
    }
    updatePnlDisplay(result.pnlUSD, result.pnlPct, result.pips, result.quoteSymbol, rr);
  }

  function updatePnlDisplay(pnlUSD, pnlPct, pips, quoteSymbol, rr) {
    const box = document.getElementById('pnlPreview');
    if (!box || pnlUSD == null) { resetPnlDisplay(); return; }
    const sign  = pnlUSD >= 0 ? '+' : '';
    const color = pnlUSD >= 0 ? '#22c55e' : '#ef4444';
    const qs    = (quoteSymbol && quoteSymbol !== 'USD') ? quoteSymbol : '$';
    box.innerHTML = `
      <div class="flex items-center gap-6 flex-wrap">
        <div>
          <div class="form-label">P&L estimé</div>
          <div class="text-2xl font-bold" style="color:${color}">${sign}${qs === '$' ? '$' : ''}${Math.abs(pnlUSD).toFixed(2)}${qs !== '$' ? ' '+qs : ''}</div>
        </div>
        ${pnlPct != null ? `<div><div class="form-label">Variation</div><div class="text-xl font-bold" style="color:${color}">${sign}${pnlPct.toFixed(3)}%</div></div>` : ''}
        ${pips ? `<div><div class="form-label">Pips / Points</div><div class="text-xl font-bold" style="color:${color}">${sign}${pips}</div></div>` : ''}
        ${rr != null ? `<div><div class="form-label">R:R</div><div class="text-xl font-bold" style="color:${rr >= 1 ? '#22c55e' : '#f59e0b'}">1 : ${rr}</div></div>` : ''}
      </div>`;
    box.classList.remove('hidden');
  }

  function resetPnlDisplay() {
    const box = document.getElementById('pnlPreview');
    if (box) { box.innerHTML = ''; box.classList.add('hidden'); }
  }

  async function save() {
    const id        = document.getElementById('tradeId').value;
    const journalId = Journals.activeId();
    if (!journalId) { alert('Aucun journal sélectionné.'); return; }

    const symbol = activeSymbol();
    const side   = document.getElementById('tSide').value;
    const entry  = parseFloat(document.getElementById('tEntry').value) || 0;
    const exit   = parseFloat(document.getElementById('tExit').value)  || 0;
    const size   = parseFloat(document.getElementById('tSize').value)  || 0;
    const calc   = Assets.calcPnL(symbol, side, entry, exit, size);
    const sl     = parseFloat(document.getElementById('tSL').value) || null;
    let rr = null;
    if (sl && Math.abs(entry - sl) > 0) rr = +(Math.abs(exit - entry) / Math.abs(entry - sl)).toFixed(2);

    if (!symbol) { alert('Veuillez sélectionner un actif.'); return; }

    // Désactiver le bouton pendant la sauvegarde
    const btn = document.querySelector('#tradeModal .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

    const trade = {
      id:          id || Store.uid(),
      journalId,
      date:        document.getElementById('tDate').value,
      asset:       symbol,
      side, size, entry, exit, sl, rr,
      pnl:         calc.pnlUSD,
      pnlUSD:      calc.pnlUSD,
      pnlPct:      calc.pnlPct,
      pips:        calc.pips,
      quoteSymbol: calc.quoteSymbol,
      emotion:     document.getElementById('tEmotion').value,
      grade:       document.getElementById('tGrade').value || null,
      tags:        document.getElementById('tTags').value.trim() || null,
      notes:       document.getElementById('tNotes').value.trim(),
      image:       _imageData,
      createdAt:   new Date().toISOString(),
    };

    try {
      if (id) await Store.trades.update(trade);
      else    await Store.trades.add(trade);
      App.closeModal('tradeModal');
      App.render('journal');
      if (App.currentPage === 'dashboard') App.render('dashboard');
    } catch (e) {
      alert('Erreur lors de la sauvegarde : ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer ce trade ?')) return;
    await Store.trades.delete(id);
    App.render('journal');
    if (App.currentPage === 'dashboard') App.render('dashboard');
  }

  function handleImage(event) { readFile(event.target.files[0]); }

  function readFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      _imageData = e.target.result;
      const prev = document.getElementById('imagePreview');
      prev.src = _imageData; prev.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function setupDropzone() {
    const dz = document.getElementById('dropzone');
    if (!dz) return;
    dz.addEventListener('click',    () => document.getElementById('tImage').click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('border-brand'); });
    dz.addEventListener('dragleave',() => dz.classList.remove('border-brand'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('border-brand');
      readFile(e.dataTransfer.files[0]);
    });
  }

  function onCustomAsset(input) {
    if (input.value.trim()) document.getElementById('tAsset').value = '';
    recalcPnL();
  }

  function activeSymbol() {
    return document.getElementById('tAsset')?.value ||
           document.getElementById('tAssetCustom')?.value.trim() || '';
  }

  function stats(tradeList) {
    const total   = tradeList.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins    = tradeList.filter(t => t.pnl > 0);
    const losses  = tradeList.filter(t => t.pnl < 0);
    const winRate = tradeList.length ? (wins.length / tradeList.length * 100) : 0;
    const avgWin  = wins.length   ? wins.reduce((s,t)  => s + t.pnl, 0) / wins.length   : 0;
    const avgLoss = losses.length ? losses.reduce((s,t) => s + t.pnl, 0) / losses.length : 0;

    const grossProfit  = wins.reduce((s,t) => s + t.pnl, 0);
    const grossLoss    = Math.abs(losses.reduce((s,t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? Infinity : 0);

    const rrTrades = tradeList.filter(t => t.rr != null && t.rr > 0);
    const avgRR    = rrTrades.length ? +(rrTrades.reduce((s,t) => s + t.rr, 0) / rrTrades.length).toFixed(2) : null;

    const sorted = [...tradeList].sort((a,b) => new Date(a.date) - new Date(b.date));
    let streak = 0;
    if (sorted.length) {
      const lastDir = sorted[sorted.length-1].pnl >= 0 ? 1 : -1;
      for (let i = sorted.length-1; i >= 0; i--) {
        if ((sorted[i].pnl >= 0 ? 1 : -1) === lastDir) streak += lastDir;
        else break;
      }
    }

    let peak = 0, cumPnl = 0;
    const drawdownSeries  = sorted.map(t => { cumPnl += t.pnl || 0; if (cumPnl > peak) peak = cumPnl; return peak > 0 ? +((cumPnl - peak) / peak * 100).toFixed(2) : 0; });
    const drawdownLabels  = sorted.map(t => (t.date || '').slice(0, 10));
    const maxDrawdown     = drawdownSeries.length ? Math.min(0, ...drawdownSeries) : 0;

    return { total, wins: wins.length, losses: losses.length, count: tradeList.length, winRate, avgWin, avgLoss, profitFactor, avgRR, streak, drawdownSeries, drawdownLabels, maxDrawdown };
  }

  return { openNew, openEdit, save, remove, handleImage, setupDropzone, stats, recalcPnL, onCustomAsset };
})();
