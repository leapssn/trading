// ============================================================
// dashboard.js — Page Dashboard
// ============================================================
const Dashboard = (() => {
  let pnlChart = null;
  let winChart  = null;

  function render(container) {
    const journals = Store.journals.all();
    const allTrades = Store.trades.all();
    const globalStats = Trades.stats(allTrades);

    // Stats par journal
    const journalCards = journals.map(j => {
      const jTrades = allTrades.filter(t => t.journalId === j.id);
      const s = Trades.stats(jTrades);
      const typeBadge = { real:'badge-real', prop:'badge-prop', demo:'badge-demo' }[j.type] || 'badge-demo';
      const typeLabel = { real:'Réel', prop:'Prop Firm', demo:'Démo' }[j.type] || j.type;

      let propInfo = '';
      if (j.type === 'prop' && j.capital) {
        const ddPct = j.capital ? (Math.abs(Math.min(0, s.total)) / j.capital * 100).toFixed(1) : 0;
        const profPct = j.capital ? (s.total / j.capital * 100).toFixed(1) : 0;
        propInfo = `
          <div class="mt-3 pt-3 border-t border-[#2e3256] grid grid-cols-3 gap-2 text-center text-xs">
            <div><div class="text-slate-400">Capital</div><div class="text-white font-semibold">$${j.capital.toLocaleString()}</div></div>
            <div><div class="text-slate-400">DD actuel</div><div class="${parseFloat(ddPct) > (j.drawdown * 0.8) ? 'text-red-400' : 'text-white'} font-semibold">${ddPct}% / ${j.drawdown}%</div></div>
            <div><div class="text-slate-400">Objectif</div><div class="${parseFloat(profPct) >= j.target ? 'text-green-400' : 'text-white'} font-semibold">${profPct}% / ${j.target}%</div></div>
          </div>`;
      }

      return `
        <div class="stat-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-white">${j.name}</h3>
            <span class="badge ${typeBadge}">${typeLabel}</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="text-xs text-slate-400 mb-1">P&L Total</div>
              <div class="text-xl font-bold ${s.total >= 0 ? 'pnl-pos' : 'pnl-neg'}">${s.total >= 0 ? '+' : ''}$${s.total.toFixed(2)}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-slate-400 mb-1">Win Rate</div>
              <div class="text-xl font-bold text-white">${s.winRate.toFixed(1)}%</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-slate-400 mb-1">Trades</div>
              <div class="text-xl font-bold text-white">${s.count}</div>
            </div>
          </div>
          ${propInfo}
        </div>`;
    }).join('');

    // PnL cumulé dans le temps (tous journals)
    const sorted = [...allTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const cumulLabels = sorted.map(t => t.date.slice(0, 10));
    let cumul = 0;
    const cumulData = sorted.map(t => { cumul += t.pnl; return cumul.toFixed(2); });

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Dashboard</h2>
        <span class="text-slate-400 text-sm">${new Date().toLocaleDateString('fr-FR', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</span>
      </div>
      <div class="content-area space-y-6">

        <!-- Global KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${kpiCard('P&L Global', `${globalStats.total >= 0 ? '+' : ''}$${globalStats.total.toFixed(2)}`, globalStats.total >= 0 ? 'pnl-pos' : 'pnl-neg', '💰')}
          ${kpiCard('Win Rate', `${globalStats.winRate.toFixed(1)}%`, 'text-white', '🎯')}
          ${kpiCard('Trades totaux', globalStats.count, 'text-white', '📊')}
          ${kpiCard('Gain moyen', `$${globalStats.avgWin.toFixed(2)}`, 'pnl-pos', '⬆️')}
        </div>

        <!-- Charts row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="stat-card lg:col-span-2">
            <h3 class="text-sm font-semibold text-slate-300 mb-4">P&L Cumulé (tous comptes)</h3>
            <canvas id="pnlChart" height="90"></canvas>
          </div>
          <div class="stat-card">
            <h3 class="text-sm font-semibold text-slate-300 mb-4">Wins vs Losses</h3>
            <canvas id="winChart" height="160"></canvas>
            <div class="flex justify-center gap-6 mt-3 text-xs">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Gagnants: ${globalStats.wins}</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Perdants: ${globalStats.losses}</span>
            </div>
          </div>
        </div>

        <!-- Par journal -->
        ${journals.length > 0 ? `
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-3" style="color:var(--text-faint)">Performance par journal</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${journalCards}</div>
        </div>` : `
        <div class="text-center py-16" style="color:var(--text-faint)">
          <div class="text-4xl mb-3">📒</div>
          <p>Créez votre premier journal pour commencer !</p>
          <button onclick="App.openModal('journalModal')" class="btn-primary mt-4">Créer un journal</button>
        </div>`}

      </div>`;

    // Charts
    requestAnimationFrame(() => {
      const pnlCtx = document.getElementById('pnlChart');
      if (pnlCtx) {
        if (pnlChart) pnlChart.destroy();
        pnlChart = new Chart(pnlCtx, {
          type: 'line',
          data: {
            labels: cumulLabels,
            datasets: [{
              label: 'P&L cumulé ($)',
              data: cumulData,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: cumulData.length < 30 ? 4 : 0,
              pointBackgroundColor: '#6366f1',
            }]
          },
          options: chartOptions('$'),
        });
      }
      const winCtx = document.getElementById('winChart');
      if (winCtx) {
        if (winChart) winChart.destroy();
        winChart = new Chart(winCtx, {
          type: 'doughnut',
          data: {
            labels: ['Gagnants', 'Perdants'],
            datasets: [{ data: [globalStats.wins, globalStats.losses], backgroundColor: ['#22c55e','#ef4444'], borderWidth: 0 }]
          },
          options: { plugins: { legend: { display: false } }, cutout: '65%' },
        });
      }
    });
  }

  function kpiCard(label, value, cls, icon) {
    return `<div class="stat-card flex items-center gap-4">
      <span class="text-3xl">${icon}</span>
      <div>
        <div class="text-xs text-slate-400 uppercase tracking-wider">${label}</div>
        <div class="text-2xl font-bold ${cls}">${value}</div>
      </div>
    </div>`;
  }

  function chartOptions(unit) {
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2e3256';
    const tickColor = getComputedStyle(document.documentElement).getPropertyValue('--text-faint').trim() || '#64748b';
    return {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} ${unit}` } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 8 } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor } },
      },
    };
  }

  return { render };
})();
