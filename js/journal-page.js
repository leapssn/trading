// ============================================================
// journal-page.js — Page Journal de trading
// ============================================================
const JournalPage = (() => {

  const EMOTIONS = {
    calm: '😌 Calme', fear: '😰 Peur', greed: '🤑 Cupidité',
    revenge: '😤 Revenge', fomo: '😱 FOMO', disciplined: '💪 Discipliné', bored: '😑 Ennui',
  };

  function render(container) {
    const journal = Journals.active();
    const trades  = journal ? Store.trades.forJournal(journal.id) : [];
    const s       = Trades.stats(trades);
    const sorted  = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));

    const typeLabel = { real:'Réel', prop:'Prop Firm', demo:'Démo' }[journal?.type] || '';
    const typeBadge = { real:'badge-real', prop:'badge-prop', demo:'badge-demo' }[journal?.type] || '';

    let propBanner = '';
    if (journal?.type === 'prop' && journal.capital) {
      const ddPct   = (Math.abs(Math.min(0, s.total)) / journal.capital * 100).toFixed(1);
      const profPct = (s.total / journal.capital * 100).toFixed(1);
      const ddOver  = parseFloat(ddPct) >= journal.drawdown;
      const goalHit = parseFloat(profPct) >= journal.target;
      propBanner = `
        <div class="mb-4 p-4 rounded-xl border ${ddOver ? 'border-red-500 bg-red-500/10' : goalHit ? 'border-green-500 bg-green-500/10' : 'border-yellow-500/40 bg-yellow-500/5'} flex items-center gap-4 flex-wrap">
          <span class="text-2xl">${ddOver ? '⛔' : goalHit ? '🏆' : '📋'}</span>
          <div class="flex-1 text-sm">
            <span class="font-semibold text-white mr-3">Règles Prop Firm</span>
            <span class="mr-4">Drawdown: <b class="${ddOver ? 'text-red-400' : 'text-white'}">${ddPct}%</b> / max ${journal.drawdown}%</span>
            <span>Objectif: <b class="${goalHit ? 'text-green-400' : 'text-white'}">${profPct}%</b> / ${journal.target}%</span>
          </div>
          ${ddOver ? '<span class="text-red-400 font-bold text-sm">DRAWDOWN MAX ATTEINT</span>' : ''}
          ${goalHit ? '<span class="text-green-400 font-bold text-sm">OBJECTIF ATTEINT 🎉</span>' : ''}
        </div>`;
    }

    const rows = sorted.map(t => {
      const pnlClass = t.pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
      const imgBtn = t.image
        ? `<button onclick="JournalPage.showImage('${t.id}')" class="text-brand underline text-xs">Voir</button>`
        : '<span class="text-slate-600 text-xs">—</span>';
      return `
        <tr>
          <td class="text-slate-400">${t.date ? t.date.replace('T',' ').slice(0,16) : '—'}</td>
          <td class="font-semibold text-white">${t.asset}</td>
          <td><span class="badge badge-${t.side}">${t.side === 'buy' ? '▲ Long' : '▼ Short'}</span></td>
          <td>${t.size}</td>
          <td>${t.entry}</td>
          <td>${t.exit}</td>
          <td class="${pnlClass}">${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}</td>
          <td class="text-xs text-slate-400">${EMOTIONS[t.emotion] || '—'}</td>
          <td>${imgBtn}</td>
          <td>
            <button onclick="Trades.openEdit('${t.id}')" class="text-slate-400 hover:text-white text-xs mr-2">✏️</button>
            <button onclick="Trades.remove('${t.id}')" class="text-slate-400 hover:text-red-400 text-xs">🗑️</button>
          </td>
        </tr>`;
    }).join('');

    const emptyState = `
      <tr><td colspan="10" class="text-center py-16 text-slate-500">
        <div class="text-4xl mb-2">📭</div>
        <p>Aucun trade dans ce journal.</p>
        <button onclick="Trades.openNew()" class="btn-primary mt-3 text-sm">Ajouter un trade</button>
      </td></tr>`;

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center gap-3">
          <h2 class="page-title">${journal ? journal.name : 'Aucun journal'}</h2>
          ${journal ? `<span class="badge ${typeBadge}">${typeLabel}</span>` : ''}
        </div>
        <button onclick="Trades.openNew()" class="btn-primary flex items-center gap-2">
          <span class="text-lg">+</span> Nouveau Trade
        </button>
      </div>
      <div class="content-area">
        ${propBanner}

        <!-- KPIs rapides -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="stat-card text-center">
            <div class="text-xs text-slate-400 mb-1">P&L Total</div>
            <div class="text-2xl font-bold ${s.total >= 0 ? 'pnl-pos' : 'pnl-neg'}">${s.total >= 0 ? '+' : ''}$${s.total.toFixed(2)}</div>
          </div>
          <div class="stat-card text-center">
            <div class="text-xs text-slate-400 mb-1">Win Rate</div>
            <div class="text-2xl font-bold text-white">${s.winRate.toFixed(1)}%</div>
          </div>
          <div class="stat-card text-center">
            <div class="text-xs text-slate-400 mb-1">Gain moyen</div>
            <div class="text-2xl font-bold pnl-pos">+$${s.avgWin.toFixed(2)}</div>
          </div>
          <div class="stat-card text-center">
            <div class="text-xs text-slate-400 mb-1">Perte moyenne</div>
            <div class="text-2xl font-bold pnl-neg">$${s.avgLoss.toFixed(2)}</div>
          </div>
        </div>

        <!-- Table -->
        <div class="stat-card overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Actif</th><th>Sens</th><th>Lots</th>
                <th>Entrée</th><th>Sortie</th><th>P&L</th><th>Émotion</th><th>Graphe</th><th></th>
              </tr>
            </thead>
            <tbody>${rows || emptyState}</tbody>
          </table>
        </div>
      </div>

      <!-- Image viewer modal (inline) -->
      <div id="imgViewer" class="modal-backdrop hidden" onclick="this.classList.add('hidden')">
        <div class="modal-box max-w-3xl" onclick="event.stopPropagation()">
          <img id="imgViewerSrc" class="w-full rounded-lg" />
          <button onclick="document.getElementById('imgViewer').classList.add('hidden')" class="btn-secondary mt-4 w-full">Fermer</button>
        </div>
      </div>`;

    // Setup dropzone after DOM is ready
    requestAnimationFrame(() => Trades.setupDropzone());
  }

  function showImage(tradeId) {
    const t = Store.trades.getById(tradeId);
    if (!t?.image) return;
    document.getElementById('imgViewerSrc').src = t.image;
    document.getElementById('imgViewer').classList.remove('hidden');
  }

  return { render, showImage };
})();
