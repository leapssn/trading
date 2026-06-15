// ============================================================
// journal-page.js — Page Journal de trading
// ============================================================
const JournalPage = (() => {

  const EMOTIONS = {
    calm:'😌 Calme', fear:'😰 Peur', greed:'🤑 Cupidité',
    revenge:'😤 Revenge', fomo:'😱 FOMO', disciplined:'💪 Discipliné', bored:'😑 Ennui',
  };
  const GRADE_COLORS = { A: '#22c55e', B: '#6366f1', C: '#f59e0b' };

  let _search = '';
  let _month  = '';

  function setSearch(v) { _search = v; render(document.getElementById('page-journal')); }
  function setMonth(v)  { _month  = v; render(document.getElementById('page-journal')); }
  function clearFilters() { _search = ''; _month = ''; render(document.getElementById('page-journal')); }

  function render(container) {
    const journal = Journals.active();
    const trades  = journal ? Store.trades.forJournal(journal.id) : [];
    const s       = Trades.stats(trades);

    let sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (_search) {
      const q = _search.toLowerCase();
      sorted = sorted.filter(t =>
        (t.asset||'').toLowerCase().includes(q) ||
        (t.tags||'').toLowerCase().includes(q) ||
        (t.notes||'').toLowerCase().includes(q)
      );
    }
    if (_month) sorted = sorted.filter(t => (t.date||'').startsWith(_month));

    const typeLabel = { real:'Réel', prop:'Prop Firm', demo:'Démo' }[journal?.type] || '';
    const typeBadge = { real:'badge-real', prop:'badge-prop', demo:'badge-demo' }[journal?.type] || '';
    const capital   = journal?.capital || 0;
    const sym       = Journals.symbol(journal);

    // ── Bannière Prop Firm ───────────────────────────────
    let banner = '';
    if (journal?.type === 'prop' && capital) {
      const loss         = Math.abs(Math.min(0, s.total));
      const ddPct        = (loss / capital * 100).toFixed(1);
      const profPct      = (s.total / capital * 100).toFixed(1);
      const ddOver       = parseFloat(ddPct) >= (journal.drawdown || Infinity);
      const goalHit      = parseFloat(profPct) >= (journal.target  || Infinity);

      // Perte du jour
      const todayStr     = new Date().toISOString().slice(0,10);
      const todayTrades  = trades.filter(t => (t.date||'').slice(0,10) === todayStr);
      const todayLoss    = Math.abs(Math.min(0, todayTrades.reduce((s,t) => s + t.pnl, 0)));
      const dailyLossPct = capital ? (todayLoss / capital * 100).toFixed(1) : 0;
      const dailyOver    = journal.dailyLoss && parseFloat(dailyLossPct) >= journal.dailyLoss;

      const borderCls = ddOver || dailyOver ? 'border-red-500 bg-red-500/10'
                       : goalHit             ? 'border-green-500 bg-green-500/10'
                       :                       'border-yellow-500/40 bg-yellow-500/5';
      banner = `
        <div class="mb-5 p-4 rounded-xl border ${borderCls}">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">${ddOver || dailyOver ? '⛔' : goalHit ? '🏆' : '📋'}</span>
            <span class="font-semibold" style="color:var(--text-primary)">Suivi Prop Firm</span>
            ${ddOver    ? '<span class="ml-auto text-red-400 font-bold text-sm animate-pulse">DRAWDOWN TOTAL ATTEINT</span>'  : ''}
            ${dailyOver ? '<span class="ml-auto text-red-400 font-bold text-sm animate-pulse">PERTE JOURNALIÈRE ATTEINTE</span>' : ''}
            ${goalHit   ? '<span class="ml-auto text-green-400 font-bold text-sm">OBJECTIF ATTEINT 🎉</span>'  : ''}
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${propKpi('Capital', sym+capital.toLocaleString(), 'var(--text-primary)')}
            ${propKpi('Drawdown total', ddPct+'% / '+(journal.drawdown||'—')+'%', ddOver ? '#ef4444' : 'var(--text-primary)')}
            ${journal.dailyLoss ? propKpi('Perte journalière', dailyLossPct+'% / '+journal.dailyLoss+'%', dailyOver ? '#ef4444' : 'var(--text-primary)') : ''}
            ${propKpi('Progression', profPct+'% / '+(journal.target||'—')+'%', goalHit ? '#22c55e' : 'var(--text-primary)')}
          </div>
        </div>`;
    }

    // ── Bannière Réel / Démo avec capital ────────────────
    if ((journal?.type === 'real' || journal?.type === 'demo') && capital) {
      const perfPct = (s.total / capital * 100).toFixed(2);
      const balance = (capital + s.total).toFixed(2);
      banner = `
        <div class="mb-5 p-4 rounded-xl border" style="border-color:var(--border)">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${propKpi('Capital initial', sym+capital.toLocaleString(), 'var(--text-muted)')}
            ${propKpi('Solde actuel',    sym+parseFloat(balance).toLocaleString(), s.total >= 0 ? '#22c55e' : '#ef4444')}
            ${propKpi('Performance',     (s.total>=0?'+':'')+perfPct+'%', s.total >= 0 ? '#22c55e' : '#ef4444')}
            ${propKpi('P&L net',         (s.total>=0?'+':'-')+sym+Math.abs(s.total).toFixed(2), s.total >= 0 ? '#22c55e' : '#ef4444')}
          </div>
        </div>`;
    }

    // ── Lignes du tableau ────────────────────────────────
    const rows = sorted.map(t => {
      const pnlClass = t.pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
      const pnlVal   = `${t.pnl>=0?'+':'-'}${sym}${Math.abs(t.pnl||0).toFixed(2)}`;
      const pct      = t.pnlPct != null ? `<span class="${pnlClass} text-xs">(${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(2)}%)</span>` : '';
      const imgBtn   = t.image
        ? `<button onclick="JournalPage.showImage('${t.id}')" class="text-brand underline text-xs">Voir</button>`
        : '<span class="text-xs" style="color:var(--text-faint)">—</span>';
      const gradeEl  = t.grade
        ? `<span class="inline-block px-1.5 py-0.5 rounded text-xs font-bold" style="color:${GRADE_COLORS[t.grade]||'var(--text-muted)'};background:${GRADE_COLORS[t.grade]||'#888'}22">${t.grade}</span>`
        : '<span style="color:var(--text-faint)">—</span>';
      const tagsEl   = t.tags
        ? t.tags.split(',').map(tag => `<span class="inline-block px-1.5 py-0.5 mr-1 rounded text-xs" style="background:var(--bg-hover);color:var(--text-muted)">${tag.trim()}</span>`).join('')
        : '<span style="color:var(--text-faint)">—</span>';

      return `
        <tr>
          <td style="color:var(--text-faint)">${(t.date||'').replace('T',' ').slice(0,16)}</td>
          <td class="font-semibold" style="color:var(--text-primary)">${t.asset}</td>
          <td><span class="badge badge-${t.side}">${t.side === 'buy' ? '▲ Long' : '▼ Short'}</span></td>
          <td>${t.size}</td>
          <td>${t.entry}</td>
          <td>${t.exit}</td>
          <td class="${pnlClass}">${pnlVal} ${pct}</td>
          <td>${gradeEl}</td>
          <td class="max-w-xs">${tagsEl}</td>
          <td style="color:var(--text-faint);font-size:0.8rem">${EMOTIONS[t.emotion] || '—'}</td>
          <td>${imgBtn}</td>
          <td>
            <button onclick="Trades.openEdit('${t.id}')" class="hover:text-white text-xs mr-2" style="color:var(--text-faint)">✏️</button>
            <button onclick="Trades.remove('${t.id}')" class="hover:text-red-400 text-xs" style="color:var(--text-faint)">🗑️</button>
          </td>
        </tr>`;
    }).join('');

    const emptyState = `
      <tr><td colspan="10" class="text-center py-14">
        <div class="text-4xl mb-2">📭</div>
        <p style="color:var(--text-faint)">Aucun trade dans ce journal.</p>
        <button onclick="Trades.openNew()" class="btn-primary mt-4 text-sm">Ajouter un trade</button>
      </td></tr>`;

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center gap-3">
          <h2 class="page-title">${journal ? journal.name : 'Aucun journal'}</h2>
          ${journal ? `<span class="badge ${typeBadge}">${typeLabel}</span>` : ''}
        </div>
        <button onclick="Trades.openNew()" class="btn-primary flex items-center gap-2">
          <span class="text-lg font-light">+</span> Nouveau Trade
        </button>
      </div>
      <div class="content-area">
        ${banner}

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          ${kpi('P&L Total',     (s.total>=0?'+':'-')+sym+Math.abs(s.total).toFixed(2), s.total >= 0 ? 'pnl-pos' : 'pnl-neg')}
          ${kpi('Win Rate',      s.winRate.toFixed(1)+'%', '')}
          ${kpi('Profit Factor', s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2), s.profitFactor >= 1.5 ? 'pnl-pos' : s.profitFactor >= 1 ? '' : 'pnl-neg')}
          ${kpi('Perte moyenne', '-'+sym+Math.abs(s.avgLoss).toFixed(2), 'pnl-neg')}
        </div>

        <!-- Barre de filtres -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input id="tradeSearch" type="text" placeholder="Rechercher actif, tag, note…"
            class="form-input flex-1 min-w-[160px] text-sm" value="${_search.replace(/"/g,'&quot;')}"
            oninput="JournalPage.setSearch(this.value)" />
          <input id="tradeMonthFilter" type="month"
            class="form-input text-sm" value="${_month}"
            onchange="JournalPage.setMonth(this.value)" />
          ${(_search || _month) ? `<button onclick="JournalPage.clearFilters()" class="btn-secondary text-xs px-3 py-2">✕ Effacer</button>` : ''}
          <span class="text-xs ml-auto" style="color:var(--text-faint)">${sorted.length} / ${trades.length} trades</span>
        </div>

        <!-- Tableau -->
        <div class="stat-card overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Actif</th><th>Sens</th><th>Taille</th>
                <th>Entrée</th><th>Sortie</th><th>P&L</th><th>Note</th><th>Tags</th><th>Émotion</th><th>Chart</th><th></th>
              </tr>
            </thead>
            <tbody>${rows || emptyState}</tbody>
          </table>
        </div>
      </div>

      <!-- Visionneuse image -->
      <div id="imgViewer" class="modal-backdrop hidden" onclick="this.classList.add('hidden')">
        <div class="modal-box max-w-3xl" onclick="event.stopPropagation()">
          <img id="imgViewerSrc" class="w-full rounded-lg" />
          <button onclick="document.getElementById('imgViewer').classList.add('hidden')" class="btn-secondary mt-4 w-full">Fermer</button>
        </div>
      </div>`;

    requestAnimationFrame(() => Trades.setupDropzone());
  }

  function kpi(label, value, cls) {
    return `<div class="stat-card text-center">
      <div class="form-label">${label}</div>
      <div class="text-2xl font-bold ${cls}" style="${!cls ? 'color:var(--text-primary)' : ''}">${value}</div>
    </div>`;
  }

  function propKpi(label, value, color) {
    return `<div class="rounded-lg p-3" style="background:var(--bg-input)">
      <div class="form-label">${label}</div>
      <div class="font-bold text-sm mt-0.5" style="color:${color}">${value}</div>
    </div>`;
  }

  function showImage(tradeId) {
    const t = Store.trades.getById(tradeId);
    if (!t?.image) return;
    document.getElementById('imgViewerSrc').src = t.image;
    document.getElementById('imgViewer').classList.remove('hidden');
  }

  return { render, showImage, setSearch, setMonth, clearFilters };
})();
