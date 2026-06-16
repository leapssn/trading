// ============================================================
// markets.js — Page Marchés (graphiques en direct TradingView)
// ============================================================
const Markets = (() => {
  const SYMBOLS = [
    { label: 'EUR/USD',  value: 'FX:EURUSD' },
    { label: 'GBP/USD',  value: 'FX:GBPUSD' },
    { label: 'USD/JPY',  value: 'FX:USDJPY' },
    { label: 'USD/CHF',  value: 'FX:USDCHF' },
    { label: 'AUD/USD',  value: 'FX:AUDUSD' },
    { label: 'USD/CAD',  value: 'FX:USDCAD' },
    { label: 'NZD/USD',  value: 'FX:NZDUSD' },
    { label: 'Or (XAU/USD)',      value: 'OANDA:XAUUSD' },
    { label: 'Argent (XAG/USD)',  value: 'OANDA:XAGUSD' },
    { label: 'Pétrole WTI',       value: 'TVC:USOIL' },
    { label: 'Pétrole Brent',     value: 'TVC:UKOIL' },
    { label: 'Gaz naturel',       value: 'NYMEX:NG1!' },
    { label: 'Bitcoin',           value: 'BINANCE:BTCUSDT' },
    { label: 'Ethereum',          value: 'BINANCE:ETHUSDT' },
    { label: 'US 30 (Dow Jones)', value: 'TVC:DJI' },
    { label: 'Nasdaq 100',        value: 'TVC:NDX' },
    { label: 'S&P 500',           value: 'TVC:SPX' },
    { label: 'DAX 40',            value: 'XETR:DAX' },
  ];

  const WL_KEY = 'tl_markets_watchlist';
  let _current = SYMBOLS[0].value;

  function _label(value) {
    return SYMBOLS.find(s => s.value === value)?.label || value;
  }

  function _watchlist() {
    try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; }
    catch { return []; }
  }

  function _saveWatchlist(list) {
    localStorage.setItem(WL_KEY, JSON.stringify(list));
  }

  function _toggleFavorite(value) {
    let list = _watchlist();
    if (list.includes(value)) list = list.filter(v => v !== value);
    else list.push(value);
    _saveWatchlist(list);
    _renderWatchlist();
    _renderStar();
  }

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Marchés — Graphiques en direct</h2>
      </div>
      <div class="content-area space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <label class="form-label mb-0">Instrument</label>
          <select id="marketsSymbol" class="form-input" style="max-width:280px">
            ${SYMBOLS.map(s => `<option value="${s.value}" ${s.value === _current ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
          <button id="marketsFavBtn" class="btn-secondary px-3" title="Ajouter / retirer des favoris"></button>
        </div>
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="stat-card shrink-0 w-full lg:w-56">
            <h3 class="text-sm font-semibold mb-3" style="color:var(--text-muted)">⭐ Favoris</h3>
            <div id="marketsWatchlist" class="space-y-1"></div>
          </div>
          <div class="stat-card p-0 overflow-hidden flex-1">
            <div id="marketsChart" style="height:680px"></div>
          </div>
        </div>
        <p class="text-xs" style="color:var(--text-faint)">Données et graphiques fournis par TradingView.</p>
      </div>`;

    document.getElementById('marketsSymbol').onchange = e => {
      _current = e.target.value;
      _drawWidget();
      _renderStar();
      _renderWatchlist();
    };
    document.getElementById('marketsFavBtn').onclick = () => _toggleFavorite(_current);

    _renderStar();
    _renderWatchlist();
    _drawWidget();
  }

  function _renderStar() {
    const btn = document.getElementById('marketsFavBtn');
    if (!btn) return;
    const active = _watchlist().includes(_current);
    btn.textContent = active ? '★ Favori' : '☆ Ajouter';
  }

  function _renderWatchlist() {
    const el = document.getElementById('marketsWatchlist');
    if (!el) return;
    const list = _watchlist();
    if (!list.length) {
      el.innerHTML = `<p class="text-xs" style="color:var(--text-faint)">Aucun favori. Clique sur "☆ Ajouter" pour épingler l'instrument affiché ici.</p>`;
      return;
    }
    el.innerHTML = list.map(value => `
      <div class="flex items-center gap-1">
        <button onclick="Markets.select('${value}')"
          class="flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium transition"
          style="${value === _current ? 'background:var(--brand);color:#fff' : 'background:var(--bg-hover);color:var(--text-muted)'}">
          ${_label(value)}
        </button>
        <button onclick="Markets.remove('${value}')" class="px-1.5 py-1.5 rounded-lg text-xs" style="color:var(--text-faint)" title="Retirer">✕</button>
      </div>`).join('');
  }

  function select(value) {
    _current = value;
    const sel = document.getElementById('marketsSymbol');
    if (sel) sel.value = value;
    _drawWidget();
    _renderStar();
    _renderWatchlist();
  }

  function remove(value) {
    _saveWatchlist(_watchlist().filter(v => v !== value));
    _renderWatchlist();
    _renderStar();
  }

  function _drawWidget() {
    const el = document.getElementById('marketsChart');
    if (!el) return;
    el.innerHTML = '';
    const isDark = document.documentElement.classList.contains('dark');
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: _current,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'fr',
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      allow_symbol_change: true,
      details: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    el.appendChild(script);
  }

  return { render, select, remove };
})();
