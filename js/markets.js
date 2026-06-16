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

  let _current = SYMBOLS[0].value;

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
        </div>
        <div class="stat-card p-0 overflow-hidden">
          <div id="marketsChart" style="height:600px"></div>
        </div>
        <p class="text-xs" style="color:var(--text-faint)">Données et graphiques fournis par TradingView.</p>
      </div>`;

    document.getElementById('marketsSymbol').onchange = e => {
      _current = e.target.value;
      _drawWidget();
    };

    _drawWidget();
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
      hide_legend: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
    });
    el.appendChild(script);
  }

  return { render };
})();
