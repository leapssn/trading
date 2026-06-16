// ============================================================
// dashboard.js — Dashboard : compte actif en haut, global en bas
// ============================================================
const Dashboard = (() => {
  let pnlChartActive = null;
  let winChartActive = null;
  let pnlChartGlobal = null;
  let winChartGlobal = null;

  function render(container) {
    const journal    = Journals.active();
    const allTrades  = Store.trades.all();
    const journals   = Store.journals.all();

    // Stats compte actif
    const activeTrades = journal ? Store.trades.forJournal(journal.id) : [];
    const as           = Trades.stats(activeTrades);
    const capital      = journal?.capital || 0;

    // Stats globales
    const gs = Trades.stats(allTrades);

    // Graphe compte actif
    const sortedActive = [...activeTrades].sort((a,b) => new Date(a.date)-new Date(b.date));
    let cA = 0;
    const activeLabels = sortedActive.map(t => (t.date||'').slice(0,10));
    const activeData   = sortedActive.map(t => { cA += t.pnl||0; return cA.toFixed(2); });

    // Graphe global
    const sortedAll = [...allTrades].sort((a,b) => new Date(a.date)-new Date(b.date));
    let cG = 0;
    const globalLabels = sortedAll.map(t => (t.date||'').slice(0,10));
    const globalData   = sortedAll.map(t => { cG += t.pnl||0; return cG.toFixed(2); });

    // Bannière Prop Firm / Réel / Démo
    const typeBadge = { real:'badge-real', prop:'badge-prop', demo:'badge-demo' }[journal?.type] || '';
    const typeLabel = { real:'Compte Réel', prop:'Prop Firm', demo:'Démo' }[journal?.type] || '';
    const sym = Journals.symbol(journal);

    let accountBanner = '';
    if (journal?.type === 'prop' && capital) {
      const ddPct    = (Math.abs(Math.min(0,as.total)) / capital * 100).toFixed(1);
      const profPct  = (as.total / capital * 100).toFixed(1);
      const ddOver   = parseFloat(ddPct) >= (journal.drawdown||Infinity);
      const goalHit  = parseFloat(profPct) >= (journal.target||Infinity);

      // Perte du jour
      const today      = new Date().toISOString().slice(0,10);
      const todayLoss  = Math.abs(Math.min(0, activeTrades
        .filter(t => (t.date||'').slice(0,10) === today)
        .reduce((s,t) => s+(t.pnl||0), 0)));
      const dlPct      = (todayLoss / capital * 100).toFixed(1);
      const dlOver     = journal.dailyLoss && parseFloat(dlPct) >= journal.dailyLoss;

      const border = ddOver||dlOver ? 'border-red-500/60' : goalHit ? 'border-green-500/60' : 'border-yellow-500/30';
      const bg     = ddOver||dlOver ? 'bg-red-500/5'     : goalHit ? 'bg-green-500/5'      : 'bg-yellow-500/5';

      accountBanner = `
        <div class="rounded-xl border p-4 ${border} ${bg} flex flex-wrap items-center gap-4">
          <span style="color:${ddOver||dlOver ? '#ef4444' : goalHit ? '#22c55e' : 'var(--text-faint)'}">${ddOver||dlOver ? Icons.ban : goalHit ? Icons.trophy : Icons.clipboard}</span>
          <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            ${propKpi('Capital', sym+capital.toLocaleString())}
            ${propKpi('Drawdown', ddPct+'% / '+(journal.drawdown||'—')+'%', ddOver?'#ef4444':null)}
            ${journal.dailyLoss ? propKpi('Perte/jour', dlPct+'% / '+journal.dailyLoss+'%', dlOver?'#ef4444':null) : ''}
            ${propKpi('Objectif', profPct+'% / '+(journal.target||'—')+'%', goalHit?'#22c55e':null)}
          </div>
          ${ddOver  ? '<span class="text-red-400 font-bold text-xs animate-pulse">DRAWDOWN ATTEINT</span>' : ''}
          ${dlOver  ? '<span class="text-red-400 font-bold text-xs animate-pulse">LIMITE JOUR ATTEINTE</span>' : ''}
          ${goalHit ? `<span class="text-green-400 font-bold text-xs flex items-center gap-1">${Icons.checkCircle} OBJECTIF</span>` : ''}
        </div>`;
    } else if (capital) {
      const balance  = (capital + as.total).toFixed(2);
      const perfPct  = (as.total / capital * 100).toFixed(2);
      accountBanner = `
        <div class="rounded-xl border p-4" style="border-color:var(--border)">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${propKpi('Capital initial', sym+capital.toLocaleString())}
            ${propKpi('Solde actuel', sym+parseFloat(balance).toLocaleString(), as.total>=0?'#22c55e':'#ef4444')}
            ${propKpi('Performance', (as.total>=0?'+':'')+perfPct+'%', as.total>=0?'#22c55e':'#ef4444')}
            ${propKpi('P&L net', (as.total>=0?'+':'-')+sym+Math.abs(as.total).toFixed(2), as.total>=0?'#22c55e':'#ef4444')}
          </div>
        </div>`;
    }

    // Derniers trades du compte actif
    const recentTrades = [...activeTrades]
      .sort((a,b) => new Date(b.date)-new Date(a.date))
      .slice(0, 5);

    const recentRows = recentTrades.map(t => `
      <tr>
        <td style="color:var(--text-faint)">${(t.date||'').slice(0,10)}</td>
        <td class="font-medium" style="color:var(--text-primary)">${t.asset}</td>
        <td><span class="badge badge-${t.side}">${t.side==='buy'?'▲ Long':'▼ Short'}</span></td>
        <td class="${t.pnl>=0?'pnl-pos':'pnl-neg'}">${t.pnl>=0?'+':'-'}${sym}${Math.abs(t.pnl||0).toFixed(2)}</td>
        ${t.pnlPct!=null ? `<td class="${t.pnl>=0?'pnl-pos':'pnl-neg'} text-xs">${t.pnl>=0?'+':''}${t.pnlPct.toFixed(2)}%</td>` : '<td>—</td>'}
      </tr>`).join('');

    // Cartes des autres journaux (résumé global bas de page)
    const otherCards = journals.map(j => {
      const jt  = allTrades.filter(t => t.journalId === j.id);
      const s   = Trades.stats(jt);
      const tb  = { real:'badge-real', prop:'badge-prop', demo:'badge-demo' }[j.type]||'';
      const tl  = { real:'Réel', prop:'Prop Firm', demo:'Démo' }[j.type]||j.type;
      const js  = Journals.symbol(j);
      const isActive = j.id === journal?.id;
      return `
        <div class="stat-card ${isActive ? 'border-brand/50' : ''} cursor-pointer hover:border-brand/50 transition"
          onclick="Store.activeJournal.set('${j.id}');App.refreshJournalSelector();App.render('dashboard')">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              ${isActive ? '<span class="w-2 h-2 rounded-full bg-brand inline-block"></span>' : ''}
              <h3 class="font-semibold" style="color:var(--text-primary)">${j.name}</h3>
            </div>
            <span class="badge ${tb}">${tl}</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div><div class="form-label">P&L</div><div class="text-lg font-bold ${s.total>=0?'pnl-pos':'pnl-neg'}">${s.total>=0?'+':'-'}${js}${Math.abs(s.total).toFixed(2)}</div></div>
            <div><div class="form-label">Win Rate</div><div class="text-lg font-bold" style="color:var(--text-primary)">${s.winRate.toFixed(1)}%</div></div>
            <div><div class="form-label">Trades</div><div class="text-lg font-bold" style="color:var(--text-primary)">${s.count}</div></div>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="page-header">
        <div class="flex items-center gap-3">
          <h2 class="page-title">${journal?.name || 'Dashboard'}</h2>
          ${journal ? `<span class="badge ${typeBadge}">${typeLabel}</span>` : ''}
        </div>
        <span class="text-sm" style="color:var(--text-faint)">${new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
      </div>

      <div class="content-area space-y-6">

        <!-- ── COMPTE ACTIF ── -->
        ${accountBanner}

        <!-- KPIs compte actif -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${kpi('P&L Total',      (as.total>=0?'+':'-')+sym+Math.abs(as.total).toFixed(2), as.total>=0?'pnl-pos':'pnl-neg', Icons.dollar)}
          ${kpi('Win Rate',       as.winRate.toFixed(1)+'%', '', Icons.target)}
          ${kpi('Trades',         as.count, '', Icons.barChart)}
          ${kpi('Gain moyen',     '+'+sym+as.avgWin.toFixed(2), 'pnl-pos', Icons.trendUp)}
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${kpi('Profit Factor',  as.profitFactor === Infinity ? '∞' : as.profitFactor.toFixed(2), as.profitFactor >= 1.5 ? 'pnl-pos' : as.profitFactor >= 1 ? '' : 'pnl-neg', Icons.scale)}
          ${kpi('R:R moyen',      as.avgRR != null ? '1:'+as.avgRR : '—', as.avgRR != null && as.avgRR >= 1 ? 'pnl-pos' : '', Icons.ruler)}
          ${kpi('Drawdown max',   as.maxDrawdown.toFixed(1)+'%', 'pnl-neg', Icons.trendDown)}
          ${kpi('Série',          as.streak === 0 ? '—' : (as.streak > 0 ? '+'+as.streak+' wins' : as.streak+' losses'), as.streak > 0 ? 'pnl-pos' : as.streak < 0 ? 'pnl-neg' : '', Icons.flame)}
        </div>

        <!-- Graphes compte actif -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="stat-card lg:col-span-2">
            <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">P&L Cumulé — ${journal?.name||'Compte actif'}</h3>
            <canvas id="pnlChartActive" height="90"></canvas>
          </div>
          <div class="stat-card">
            <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Wins vs Losses</h3>
            <canvas id="winChartActive" height="150"></canvas>
            <div class="flex justify-center gap-5 mt-3 text-xs" style="color:var(--text-faint)">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> ${as.wins}</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> ${as.losses}</span>
            </div>
          </div>
        </div>

        <!-- Derniers trades -->
        ${recentTrades.length ? `
        <div class="stat-card overflow-x-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold" style="color:var(--text-muted)">Derniers trades — ${journal?.name}</h3>
            <a href="#journal" onclick="App.navigate('journal')" class="text-xs hover:underline" style="color:var(--brand)">Voir tout →</a>
          </div>
          <table class="data-table">
            <thead><tr><th>Date</th><th>Actif</th><th>Sens</th><th>P&L $</th><th>P&L %</th></tr></thead>
            <tbody>${recentRows}</tbody>
          </table>
        </div>` : ''}

        <!-- ── PERFORMANCES GLOBALES ── -->
        <div class="pt-2">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-px flex-1" style="background:var(--border)"></div>
            <h3 class="text-xs font-semibold uppercase tracking-widest px-2" style="color:var(--text-faint)">Performances globales — tous comptes</h3>
            <div class="h-px flex-1" style="background:var(--border)"></div>
          </div>

          <!-- KPIs globaux -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            ${kpi('P&L Total',  (gs.total>=0?'+':'')+'$'+gs.total.toFixed(2), gs.total>=0?'pnl-pos':'pnl-neg', Icons.globe)}
            ${kpi('Win Rate',   gs.winRate.toFixed(1)+'%', '', Icons.target)}
            ${kpi('Trades',     gs.count, '', Icons.barChart)}
            ${kpi('Gain moyen', '+$'+gs.avgWin.toFixed(2), 'pnl-pos', Icons.trendUp)}
          </div>

          <!-- Graphe global + cartes journaux -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="stat-card lg:col-span-2">
              <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">P&L Cumulé — tous comptes</h3>
              <canvas id="pnlChartGlobal" height="90"></canvas>
            </div>
            <div class="stat-card">
              <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Wins vs Losses</h3>
              <canvas id="winChartGlobal" height="150"></canvas>
              <div class="flex justify-center gap-5 mt-3 text-xs" style="color:var(--text-faint)">
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> ${gs.wins}</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> ${gs.losses}</span>
              </div>
            </div>
          </div>

          <!-- Cartes par journal -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            ${otherCards || `<div class="col-span-3 text-center py-8" style="color:var(--text-faint)">Aucun journal</div>`}
          </div>
        </div>

      </div>`;

    // Dessiner les graphiques
    requestAnimationFrame(() => {
      drawLine('pnlChartActive', activeLabels, activeData, '#6366f1', pnlChartActive, c => pnlChartActive = c);
      drawLine('pnlChartGlobal', globalLabels, globalData, '#22c55e', pnlChartGlobal, c => pnlChartGlobal = c);
      drawDonut('winChartActive', as.wins, as.losses, winChartActive, c => winChartActive = c);
      drawDonut('winChartGlobal', gs.wins, gs.losses, winChartGlobal, c => winChartGlobal = c);
    });
  }

  // ── Helpers UI ────────────────────────────────────────────
  function kpi(label, value, cls, icon) {
    return `<div class="stat-card flex items-center gap-4">
      <span style="color:var(--brand)">${icon}</span>
      <div>
        <div class="form-label">${label}</div>
        <div class="text-2xl font-bold ${cls}" style="${!cls?'color:var(--text-primary)':''}">${value}</div>
      </div>
    </div>`;
  }

  function propKpi(label, value, color) {
    return `<div class="rounded-lg p-3" style="background:var(--bg-input)">
      <div class="form-label">${label}</div>
      <div class="font-bold text-sm mt-0.5" style="color:${color||'var(--text-primary)'}">${value}</div>
    </div>`;
  }

  // ── Charts ────────────────────────────────────────────────
  function chartOpts() {
    const grid = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()||'#2e3256';
    const tick = getComputedStyle(document.documentElement).getPropertyValue('--text-faint').trim()||'#64748b';
    return {
      responsive: true,
      plugins: { legend: { display:false }, tooltip: { callbacks: { label: c => ` $${c.parsed.y}` } } },
      scales: {
        x: { grid:{color:grid}, ticks:{color:tick,maxTicksLimit:8} },
        y: { grid:{color:grid}, ticks:{color:tick} },
      },
    };
  }

  function drawLine(id, labels, data, color, existing, setter) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (existing) existing.destroy();
    setter(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: color+'18',
          fill: true,
          tension: 0.3,
          pointRadius: data.length < 30 ? 4 : 0,
          pointBackgroundColor: color,
        }]
      },
      options: chartOpts(),
    }));
  }

  function drawDonut(id, wins, losses, existing, setter) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (existing) existing.destroy();
    setter(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Gagnants','Perdants'],
        datasets: [{ data:[wins,losses], backgroundColor:['#22c55e','#ef4444'], borderWidth:0 }]
      },
      options: { plugins:{ legend:{display:false} }, cutout:'65%' },
    }));
  }

  return { render };
})();
