// ============================================================
// analytics.js — Page Analytiques avancées
// ============================================================
const Analytics = (() => {
  const _ch = {};

  function render(container) {
    const journal = Journals.active();
    const trades  = journal ? Store.trades.forJournal(journal.id) : [];
    const sorted  = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const sym     = Journals.symbol(journal);
    const s       = Trades.stats(trades);

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Analytiques — ${journal?.name || 'Journal'}</h2>
      </div>
      <div class="content-area space-y-6">

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${kpi('Profit Factor', s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2), s.profitFactor >= 1.5 ? 'pnl-pos' : s.profitFactor >= 1 ? '' : 'pnl-neg')}
          ${kpi('R:R moyen', s.avgRR != null ? '1 : ' + s.avgRR.toFixed(2) : '—', s.avgRR != null && s.avgRR >= 1 ? 'pnl-pos' : '')}
          ${kpi('Drawdown max', s.maxDrawdown.toFixed(1) + '%', 'pnl-neg')}
          ${kpi('Série en cours', s.streak === 0 ? '—' : (s.streak > 0 ? '+' + s.streak + ' wins' : s.streak + ' losses'), s.streak > 0 ? 'pnl-pos' : s.streak < 0 ? 'pnl-neg' : '')}
        </div>

        <div class="stat-card">
          <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Courbe de drawdown</h3>
          <canvas id="anlDrawdownChart" height="80"></canvas>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="stat-card">
            <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">P&L par heure d'entrée</h3>
            <canvas id="anlHourChart" height="160"></canvas>
          </div>
          <div class="stat-card">
            <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">P&L par actif (top 8)</h3>
            <canvas id="anlAssetChart" height="160"></canvas>
          </div>
        </div>

        <div class="stat-card">
          <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Heatmap de performance — 26 dernières semaines</h3>
          <div id="anlHeatmap" class="overflow-x-auto"></div>
        </div>

      </div>`;

    requestAnimationFrame(() => {
      _drawDD(sorted, s);
      _drawHour(trades, sym);
      _drawAsset(trades, sym);
      _drawHeatmap(trades);
    });
  }

  function kpi(label, value, cls) {
    return `<div class="stat-card text-center">
      <div class="form-label">${label}</div>
      <div class="text-2xl font-bold ${cls}" style="${!cls ? 'color:var(--text-primary)' : ''}">${value}</div>
    </div>`;
  }

  function _css() {
    const s = getComputedStyle(document.documentElement);
    return {
      grid: s.getPropertyValue('--border').trim() || '#2e3256',
      tick: s.getPropertyValue('--text-faint').trim() || '#64748b',
    };
  }

  function _kill(key) { if (_ch[key]) { _ch[key].destroy(); delete _ch[key]; } }

  function _drawDD(sorted, s) {
    _kill('dd');
    const ctx = document.getElementById('anlDrawdownChart');
    if (!ctx || !sorted.length) return;
    const { grid, tick } = _css();
    _ch.dd = new Chart(ctx, {
      type: 'line',
      data: {
        labels: s.drawdownLabels,
        datasets: [{ data: s.drawdownSeries, borderColor: '#ef4444', backgroundColor: '#ef444420', fill: true, tension: 0.2, pointRadius: 0 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(2)}%` } } },
        scales: {
          x: { grid: { color: grid }, ticks: { color: tick, maxTicksLimit: 8 } },
          y: { grid: { color: grid }, ticks: { color: tick, callback: v => v.toFixed(1) + '%' }, max: 0 },
        },
      }
    });
  }

  function _drawHour(trades, sym) {
    _kill('hour');
    const ctx = document.getElementById('anlHourChart');
    if (!ctx) return;
    const { grid, tick } = _css();
    const byH = {};
    trades.forEach(t => {
      const h = parseInt((t.date || '').slice(11, 13));
      if (!isNaN(h)) byH[h] = (byH[h] || 0) + (t.pnl || 0);
    });
    const hours  = Array.from({ length: 24 }, (_, i) => i).filter(h => byH[h] != null);
    const data   = hours.map(h => +byH[h].toFixed(2));
    _ch.hour = new Chart(ctx, {
      type: 'bar',
      data: { labels: hours.map(h => h + 'h'), datasets: [{ data, backgroundColor: data.map(v => v >= 0 ? '#22c55e' : '#ef4444'), borderRadius: 4 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${sym}${c.parsed.y.toFixed(2)}` } } },
        scales: { x: { grid: { color: grid }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick } } },
      }
    });
  }

  function _drawAsset(trades, sym) {
    _kill('asset');
    const ctx = document.getElementById('anlAssetChart');
    if (!ctx) return;
    const { grid, tick } = _css();
    const byA = {};
    trades.forEach(t => { byA[t.asset || '?'] = (byA[t.asset || '?'] || 0) + (t.pnl || 0); });
    const entries = Object.entries(byA).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
    const data    = entries.map(([, v]) => +v.toFixed(2));
    _ch.asset = new Chart(ctx, {
      type: 'bar',
      data: { labels: entries.map(([a]) => a), datasets: [{ data, backgroundColor: data.map(v => v >= 0 ? '#22c55e' : '#ef4444'), borderRadius: 4 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${sym}${c.parsed.x.toFixed(2)}` } } },
        scales: { x: { grid: { color: grid }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick } } },
      }
    });
  }

  function _drawGrades(trades) {
    _kill('grade'); _kill('gradeWr');
    const gCtx  = document.getElementById('anlGradeChart');
    const wrCtx = document.getElementById('anlGradeWrChart');
    const { grid, tick } = _css();
    const colors = { A: '#22c55e', B: '#6366f1', C: '#f59e0b', '—': '#64748b' };
    const gd = { A: { n: 0, w: 0 }, B: { n: 0, w: 0 }, C: { n: 0, w: 0 }, '—': { n: 0, w: 0 } };
    trades.forEach(t => {
      const g = t.grade || '—';
      if (!gd[g]) gd[g] = { n: 0, w: 0 };
      gd[g].n++;
      if (t.pnl > 0) gd[g].w++;
    });
    const used = ['A', 'B', 'C', '—'].filter(g => gd[g].n > 0);
    if (!used.length) return;
    if (gCtx) {
      _ch.grade = new Chart(gCtx, {
        type: 'doughnut',
        data: { labels: used, datasets: [{ data: used.map(g => gd[g].n), backgroundColor: used.map(g => colors[g]), borderWidth: 0 }] },
        options: { plugins: { legend: { display: true, position: 'right', labels: { color: tick, boxWidth: 12 } } }, cutout: '60%' }
      });
    }
    if (wrCtx) {
      _ch.gradeWr = new Chart(wrCtx, {
        type: 'bar',
        data: {
          labels: used,
          datasets: [{ data: used.map(g => gd[g].n ? +(gd[g].w / gd[g].n * 100).toFixed(1) : 0), backgroundColor: used.map(g => colors[g]), borderRadius: 4 }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(1)}%` } } },
          scales: { x: { grid: { color: grid }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick, callback: v => v + '%' }, min: 0, max: 100 } },
        }
      });
    }
  }

  function _drawHeatmap(trades) {
    const container = document.getElementById('anlHeatmap');
    if (!container) return;
    const byDate = {};
    trades.forEach(t => {
      const d = (t.date || '').slice(0, 10);
      if (d) byDate[d] = (byDate[d] || 0) + (t.pnl || 0);
    });
    const S = 18; // taille d'une cellule en px
    const G = 3;  // gap entre cellules
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 25 * 7);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);
    const weeks = [];
    const cur = new Date(start);
    while (cur <= today) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const y = cur.getFullYear(), m = String(cur.getMonth() + 1).padStart(2, '0'), dd = String(cur.getDate()).padStart(2, '0');
        const ds = `${y}-${m}-${dd}`;
        week.push({ date: ds, pnl: byDate[ds] ?? null, future: new Date(ds) > today });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
    const maxPnl = Math.max(1, ...Object.values(byDate).map(Math.abs));
    const monthMap = {};
    weeks.forEach((w, wi) => { const m = w[0].date.slice(0, 7); if (!monthMap[m]) monthMap[m] = wi; });
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const cell = (day) => {
      if (day.future) return `<div style="width:${S}px;height:${S}px"></div>`;
      let bg = 'var(--bg-input)';
      if (day.pnl !== null) {
        const alpha = Math.round(55 + Math.min(1, Math.abs(day.pnl) / maxPnl) * 185).toString(16).padStart(2, '0');
        bg = day.pnl >= 0 ? `#22c55e${alpha}` : `#ef4444${alpha}`;
      }
      const tip = day.pnl !== null ? `${day.date}: ${day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}` : day.date;
      return `<div title="${tip}" style="width:${S}px;height:${S}px;border-radius:4px;background:${bg};cursor:default"></div>`;
    };
    const cells = weeks.map(week => `
      <div style="display:flex;flex-direction:column;gap:${G}px">
        ${week.map(day => cell(day)).join('')}
      </div>`).join('');
    container.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:6px">
        <div style="display:flex;flex-direction:column;gap:${G}px;padding-top:${S+6}px;flex-shrink:0">
          ${dayLabels.map(l => `<div style="width:${S}px;height:${S}px;font-size:10px;color:var(--text-faint);text-align:center;line-height:${S}px">${l}</div>`).join('')}
        </div>
        <div>
          <div style="display:flex;gap:0;margin-bottom:6px">
            ${weeks.map((w, wi) => {
              const m = w[0].date.slice(0, 7);
              const label = monthMap[m] === wi ? new Date(w[0].date + 'T12:00').toLocaleDateString('fr-FR', { month: 'short' }) : '';
              return `<div style="width:${S + G}px;font-size:10px;color:var(--text-faint);text-align:center">${label}</div>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:${G}px">${cells}</div>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 text-xs flex-wrap" style="color:var(--text-faint)">
        <span>Profit :</span>
        <div style="width:12px;height:12px;border-radius:2px;background:#22c55e50"></div>
        <div style="width:12px;height:12px;border-radius:2px;background:#22c55ecc"></div>
        <span class="ml-2">Perte :</span>
        <div style="width:12px;height:12px;border-radius:2px;background:#ef444450"></div>
        <div style="width:12px;height:12px;border-radius:2px;background:#ef4444cc"></div>
        <span class="ml-2">Sans trade :</span>
        <div style="width:12px;height:12px;border-radius:2px;background:var(--bg-input)"></div>
      </div>`;
  }

  return { render };
})();
