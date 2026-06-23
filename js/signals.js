// ============================================================
// signals.js — Assistant de signaux de trading (H1 / H4)
// Données : TwelveData REST API (clé gratuite)
// Indicateurs : EMA(20/50), RSI(14), MACD(12-26-9), ATR(14)
// ============================================================
const Signals = (() => {

  const KEY_STORE     = 'tl_td_apikey';
  const SYM_STORE     = 'tl_signals_symbols';
  const BASE          = 'https://api.twelvedata.com';
  const CANDLES       = 250; // 200 nécessaires pour EMA200 + marge
  const SCAN_INTERVAL = 60 * 60 * 1000; // auto-scan toutes les heures

  // Correspondance ticker app → format TwelveData
  const TD_SYM = {
    EURUSD:'EUR/USD', GBPUSD:'GBP/USD', USDJPY:'USD/JPY', USDCHF:'USD/CHF',
    AUDUSD:'AUD/USD', USDCAD:'USD/CAD', NZDUSD:'NZD/USD', EURGBP:'EUR/GBP',
    EURJPY:'EUR/JPY', GBPJPY:'GBP/JPY', EURCHF:'EUR/CHF', AUDJPY:'AUD/JPY',
    XAUUSD:'XAU/USD', XAGUSD:'XAG/USD',
    BTCUSD:'BTC/USD', ETHUSD:'ETH/USD', SOLUSD:'SOL/USD',
    NAS100:'NDX', US500:'SPX', US30:'DJI',
    USOIL:'WTI', UKOIL:'BRENT',
  };

  const DEFAULTS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'BTCUSD', 'NAS100'];

  let _apiKey   = localStorage.getItem(KEY_STORE) || '';
  let _scanning = false;
  let _timer    = null;
  let _signals  = [];
  let _lastScan = null;
  let _tfFilter = null;

  // ── RENDER PRINCIPAL ──────────────────────────────────────
  async function render(container) {
    // Charger la clé depuis Firestore si absente du localStorage
    if (!_apiKey) await _loadKeyFromCloud();
    if (!_apiKey) { renderSetup(container); return; }
    renderMain(container);
    if (!_timer) startAutoScan();
    if (_signals.length === 0 && !_scanning) scan();
  }

  async function _loadKeyFromCloud() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const doc = await db.collection('users').doc(uid).get();
      const key = doc.exists && doc.data().tdApiKey;
      if (key) {
        _apiKey = key;
        localStorage.setItem(KEY_STORE, key);
      }
    } catch { /* silencieux — réseau ou droits */ }
  }

  async function _saveKeyToCloud(key) {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await db.collection('users').doc(uid).set({ tdApiKey: key }, { merge: true });
    } catch { /* silencieux */ }
  }

  // ── ÉCRAN DE CONFIGURATION ────────────────────────────────
  function renderSetup(container) {
    container.innerHTML = `
      <div class="page-header"><h2 class="page-title">Signaux</h2></div>
      <div class="content-area flex items-center justify-center" style="min-height:60vh">
        <div class="stat-card max-w-md w-full p-8">
          <div class="mb-4 flex justify-center" style="color:var(--brand)">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16s-1.5 1.5-1 5c3.5.5 5-1 5-1"/><path d="M9 14c-3-3-2-9 4-13 6 4 7 10 4 13l-2 2H11Z"/><circle cx="13" cy="8" r="1.5"/></svg>
          </div>
          <h3 class="text-lg font-bold mb-2 text-center" style="color:var(--text-primary)">Activation des signaux</h3>
          <p class="text-sm mb-6 text-center" style="color:var(--text-faint)">
            Entre ta clé API <strong style="color:var(--text-muted)">TwelveData</strong> pour activer l'analyse en temps réel sur les timeframes H1 et H4.
          </p>
          <div class="mb-3">
            <label class="form-label">Clé API TwelveData</label>
            <input id="tdApiKeyInput" type="text" class="form-input w-full" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              onkeydown="if(event.key==='Enter') Signals.saveKey()" />
          </div>
          <button onclick="Signals.saveKey()" class="btn-primary w-full mb-4">Activer</button>
          <p class="text-xs text-center" style="color:var(--text-faint)">
            Compte gratuit suffisant (800 appels/jour) →
            <a href="https://twelvedata.com" target="_blank" rel="noopener" class="hover:underline" style="color:var(--brand)">twelvedata.com</a>
          </p>
          <p class="text-xs text-center mt-1" style="color:var(--text-faint)">La clé est stockée uniquement sur cet appareil.</p>
        </div>
      </div>`;
  }

  // ── DASHBOARD PRINCIPAL ───────────────────────────────────
  function renderMain(container) {
    const symbols   = getWatchSymbols();
    const now       = _lastScan
      ? _lastScan.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
      : '—';
    const high = _signals.filter(s => s.score === 'HIGH').length;

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Signaux</h2>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs" style="color:var(--text-faint)">Scan : ${now}</span>
          <button onclick="Signals.scan()" id="scanBtn" class="btn-secondary text-sm flex items-center gap-2"${_scanning ? ' disabled' : ''}>
            <span id="scanIcon" class="${_scanning ? 'animate-spin' : ''}">${Icons.refresh}</span>
            ${_scanning ? 'Analyse…' : 'Scanner'}
          </button>
          <button onclick="Signals.openSettings()" class="btn-secondary text-sm flex items-center gap-1">${Icons.target} Clé API</button>
        </div>
      </div>

      <div class="content-area space-y-5">

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${kpiBox('Symboles', symbols.length, Icons.globe, null)}
          ${kpiBox('Signaux', _signals.length, Icons.flag, null)}
          ${kpiBox('Haute confiance', high, Icons.trophy, high > 0 ? '#22c55e' : null)}
          ${kpiBox('Prochain scan', 'auto 1h', Icons.calendarIcon, null)}
        </div>

        <!-- Sélecteur de symboles -->
        ${renderSymbolPicker(symbols)}

        <!-- Filtres -->
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="Signals.setTf(null)"    id="tf-all"   class="tf-btn tf-active">Tous</button>
          <button onclick="Signals.setTf('1h')"  id="tf-1h"  class="tf-btn">H1</button>
          <button onclick="Signals.setTf('4h')" id="tf-4h" class="tf-btn">H4</button>
        </div>

        <!-- Liste des signaux -->
        <div id="signalsContainer">${renderSignalsList()}</div>

        <!-- Footer -->
        <div class="text-right text-xs pt-1" style="color:var(--text-faint)">
          <button onclick="Signals.openSettings()" class="hover:underline transition">Changer la clé API</button>
        </div>
      </div>

      <!-- Modal config -->
      <div id="signalsSettingsModal" class="modal-backdrop hidden">
        <div class="modal-box w-[440px]">
          <h3 class="text-lg font-semibold modal-title mb-4">Clé API TwelveData</h3>
          <div class="space-y-4">
            <div>
              <label class="form-label">Clé API</label>
              <input id="tdKeyInSettings" type="text" class="form-input w-full" value="${_apiKey}" />
            </div>
            <p class="text-xs" style="color:var(--text-faint)">
              Plan gratuit TwelveData : 800 appels/jour. Scan auto toutes les heures = ~100 appels/jour pour 8 symboles.
            </p>
          </div>
          <div class="flex gap-3 justify-end mt-5">
            <button onclick="App.closeModal('signalsSettingsModal')" class="btn-secondary">Annuler</button>
            <button onclick="Signals.saveKeyFromSettings()" class="btn-primary">Enregistrer</button>
          </div>
        </div>
      </div>`;
  }

  // ── RENDU DE LA LISTE ─────────────────────────────────────
  function renderSignalsList() {
    const list = _tfFilter ? _signals.filter(s => s.tf === _tfFilter) : _signals;

    if (_scanning && list.length === 0) {
      return `<div class="flex items-center justify-center py-16 gap-3">
        <div class="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div>
        <span style="color:var(--text-faint)">Analyse des marchés en cours…</span>
      </div>`;
    }

    if (list.length === 0) {
      return `<div class="stat-card text-center py-12">
        <div class="mb-3 flex justify-center" style="color:var(--text-faint)">${Icons.inbox}</div>
        <p class="font-medium mb-1" style="color:var(--text-primary)">Aucun signal détecté</p>
        <p class="text-sm" style="color:var(--text-faint)">
          Pas de setup qualifié sur les symboles surveillés.<br>Lance un nouveau scan ou attends le prochain scan automatique.
        </p>
      </div>`;
    }

    const sorted = [...list].sort((a, b) => {
      const o = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return o[a.score] !== o[b.score] ? o[a.score] - o[b.score] : b.time - a.time;
    });

    return sorted.map(signalCard).join('');
  }

  function signalCard(s) {
    const isLong     = s.direction === 'LONG';
    const dirColor   = isLong ? '#22c55e' : '#ef4444';
    const scoreColor = { HIGH: '#22c55e', MEDIUM: '#f59e0b', LOW: '#94a3b8' }[s.score];
    const dirSvg     = isLong
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 7-7 4 4 7-7"/><path d="M16 7h5v5"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 7 7 4-4 7 7"/><path d="M16 9h5v5"/></svg>`;
    const timeStr = new Date(s.time).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    const d = s.decimals;

    return `
      <div class="stat-card mb-3" style="border-left:3px solid ${dirColor}">
        <!-- En-tête -->
        <div class="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="font-bold text-base" style="color:var(--text-primary)">${s.symbol}</span>
              <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background:var(--bg-hover);color:var(--text-muted)">${s.tf.replace('min','M')}</span>
              <span class="text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1" style="background:${dirColor}1a;color:${dirColor}">${dirSvg} ${s.direction}</span>
            </div>
            <p class="text-xs" style="color:var(--text-faint)">${s.setup} · ${timeStr}</p>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-bold px-2 py-1 rounded-full" style="background:${scoreColor}22;color:${scoreColor}">${s.score}</span>
            <p class="text-xs mt-1" style="color:var(--text-faint)">${s.matchCount} confluences</p>
          </div>
        </div>

        <!-- Niveaux de prix -->
        <div class="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          ${pBox('Entrée',    s.entry.toFixed(d), 'var(--text-primary)', true)}
          ${pBox('Stop Loss', s.sl.toFixed(d),    '#ef4444', false)}
          ${pBox('TP1 · 1R',  s.tp1.toFixed(d),  '#f59e0b', false)}
          ${pBox('TP2 · 2R',  s.tp2.toFixed(d),  '#22c55e', false)}
          ${pBox('TP3 · 3R',  s.tp3.toFixed(d),  '#6366f1', false)}
        </div>

        <!-- Conditions alignées -->
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${s.conditions.map(c => `<span class="text-xs px-2 py-0.5 rounded" style="background:rgba(99,102,241,0.12);color:var(--brand)">${c}</span>`).join('')}
        </div>

        <!-- Barre risque/rendement -->
        <div class="flex items-center gap-2 text-xs" style="color:var(--text-faint)">
          <span>Risque</span>
          <div class="flex flex-1 h-1.5 rounded-full overflow-hidden gap-px">
            <div class="bg-red-500/70 flex-1"></div>
            <div class="bg-yellow-400/80 flex-1"></div>
            <div class="bg-green-400/80 flex-1"></div>
            <div class="bg-brand/80 flex-1"></div>
          </div>
          <span>Rendement · 1R / 2R / 3R</span>
        </div>
      </div>`;
  }

  function pBox(label, value, color, bold) {
    return `<div class="rounded-lg p-2 text-center" style="background:var(--bg-input)">
      <div class="form-label mb-0.5" style="font-size:0.65rem">${label}</div>
      <div class="font-mono text-xs ${bold ? 'font-bold' : 'font-semibold'}" style="color:${color}">${value}</div>
    </div>`;
  }

  function kpiBox(label, value, icon, color) {
    return `<div class="stat-card flex items-center gap-3">
      <span style="color:${color || 'var(--brand)'};">${icon}</span>
      <div>
        <div class="form-label">${label}</div>
        <div class="text-xl font-bold" style="color:${color || 'var(--text-primary)'}">${value}</div>
      </div>
    </div>`;
  }

  // ── FILTRE TIMEFRAME ──────────────────────────────────────
  function setTf(tf) {
    _tfFilter = tf;
    ['all', '1h', '4h'].forEach(k => {
      document.getElementById(`tf-${k}`)?.classList.toggle('tf-active',
        (k === 'all' ? null : k) === tf || (k === 'all' && !tf));
    });
    const c = document.getElementById('signalsContainer');
    if (c) c.innerHTML = renderSignalsList();
  }

  // ── GESTION CLÉ API ───────────────────────────────────────
  function saveKey() {
    const k = document.getElementById('tdApiKeyInput')?.value.trim();
    if (!k) return;
    _apiKey = k;
    localStorage.setItem(KEY_STORE, k);
    _saveKeyToCloud(k);
    App.render('signals');
  }

  function saveKeyFromSettings() {
    const k = document.getElementById('tdKeyInSettings')?.value.trim();
    if (!k) return;
    _apiKey = k;
    localStorage.setItem(KEY_STORE, k);
    _saveKeyToCloud(k);
    App.closeModal('signalsSettingsModal');
  }

  function openSettings() { App.openModal('signalsSettingsModal'); }

  function _resetSymbols() {
    localStorage.removeItem(SYM_STORE);
    const container = document.getElementById('page-signals');
    if (container) renderMain(container);
  }

  // ── SÉLECTION DE SYMBOLES ─────────────────────────────────
  function getWatchSymbols() {
    try {
      const saved = JSON.parse(localStorage.getItem(SYM_STORE) || '[]');
      const valid = saved.filter(s => TD_SYM[s]);
      return valid.length ? valid : [...DEFAULTS];
    } catch { return [...DEFAULTS]; }
  }

  function toggleSymbol(sym) {
    const current = getWatchSymbols();
    const idx = current.indexOf(sym);
    let next;
    if (idx >= 0) {
      if (current.length <= 1) return; // garder au moins 1 symbole
      next = current.filter(s => s !== sym);
    } else {
      if (current.length >= 10) return; // max 10
      next = [...current, sym];
    }
    localStorage.setItem(SYM_STORE, JSON.stringify(next));
    // Rafraîchir l'UI sans rescanner
    const container = document.getElementById('page-signals');
    if (container) renderMain(container);
  }

  function renderSymbolPicker(selected) {
    const groups = [
      { label: 'Forex majeurs', syms: ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD'] },
      { label: 'Forex croisés', syms: ['EURGBP','EURJPY','GBPJPY','EURCHF','AUDJPY'] },
      { label: 'Matières premières', syms: ['XAUUSD','XAGUSD','USOIL','UKOIL'] },
      { label: 'Cryptos',       syms: ['BTCUSD','ETHUSD','SOLUSD'] },
      { label: 'Indices',       syms: ['NAS100','US500','US30'] },
    ];
    const sel = new Set(selected);
    const rows = groups.map(g => {
      const chips = g.syms.map(s => {
        const on = sel.has(s);
        return `<button onclick="Signals.toggleSymbol('${s}')" class="text-xs px-2.5 py-1 rounded-full font-semibold transition"
          style="background:${on ? 'var(--brand)' : 'var(--bg-input)'};color:${on ? '#fff' : 'var(--text-faint)'};border:1px solid ${on ? 'var(--brand)' : 'var(--border)'}">
          ${s}
        </button>`;
      }).join('');
      return `<div class="mb-2">
        <p class="text-xs mb-1.5 font-medium" style="color:var(--text-faint)">${g.label}</p>
        <div class="flex flex-wrap gap-1.5">${chips}</div>
      </div>`;
    }).join('');

    return `<div class="stat-card space-y-1">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold" style="color:var(--text-primary)">Symboles analysés <span class="font-normal text-xs" style="color:var(--text-faint)">(${selected.length}/10)</span></h3>
        <button onclick="Signals._resetSymbols()" class="text-xs" style="color:var(--text-faint)">Réinitialiser</button>
      </div>
      ${rows}
    </div>`;
  }

  // ── AUTO-SCAN ─────────────────────────────────────────────
  function startAutoScan() {
    if (_timer) return;
    _timer = setInterval(() => {
      const page = document.getElementById('page-signals');
      if (page && !page.classList.contains('hidden')) scan();
    }, SCAN_INTERVAL);
  }

  // ── SCAN ──────────────────────────────────────────────────
  async function scan() {
    if (_scanning || !_apiKey) return;
    _scanning = true;
    _signals  = [];
    updateScanUI(true);

    const symbols = getWatchSymbols();
    const tasks   = [];
    for (const sym of symbols) {
      for (const tf of ['1h', '4h']) tasks.push({ sym, tf });
    }

    // Fetch par lots de 4 (respect rate limit)
    for (let i = 0; i < tasks.length; i += 4) {
      await Promise.all(tasks.slice(i, i + 4).map(async ({ sym, tf }) => {
        try {
          const candles = await fetchCandles(sym, tf);
          if (candles && candles.length >= 60) {
            const sig = detectSignal(sym, tf, candles);
            if (sig) _signals.push(sig);
          }
        } catch (_) { /* skip symbol on error */ }
      }));
      if (i + 4 < tasks.length) await sleep(250);
    }

    _scanning = false;
    _lastScan = new Date();

    const page = document.getElementById('page-signals');
    if (page && !page.classList.contains('hidden')) {
      renderMain(page);
    }
  }

  function updateScanUI(scanning) {
    const btn  = document.getElementById('scanBtn');
    const icon = document.getElementById('scanIcon');
    if (btn)  { btn.disabled = scanning; btn.innerHTML = `<span id="scanIcon" class="${scanning ? 'animate-spin' : ''}">${Icons.refresh}</span> ${scanning ? 'Analyse…' : 'Scanner'}`; }
    const c = document.getElementById('signalsContainer');
    if (c && scanning) c.innerHTML = renderSignalsList();
  }

  // ── FETCH BOUGIES ─────────────────────────────────────────
  async function fetchCandles(appSym, tf) {
    const tdSym = TD_SYM[appSym];
    if (!tdSym) return null;
    const url = `${BASE}/time_series?symbol=${encodeURIComponent(tdSym)}&interval=${tf}&outputsize=${CANDLES}&apikey=${_apiKey}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
    if (!Array.isArray(data.values) || !data.values.length) return null;
    // TwelveData : plus récent en premier → inverser
    return data.values.reverse().map(v => ({
      t:      new Date(v.datetime).getTime(),
      open:   +v.open, high: +v.high, low: +v.low, close: +v.close,
      volume: +(v.volume || 0),
    }));
  }

  // ── INDICATEURS TECHNIQUES ────────────────────────────────
  function calcEMA(closes, period) {
    const k = 2 / (period + 1);
    let val = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const out = new Array(period - 1).fill(null);
    out.push(val);
    for (let i = period; i < closes.length; i++) {
      val = closes[i] * k + val * (1 - k);
      out.push(val);
    }
    return out;
  }

  function calcRSI(closes, period = 14) {
    const diffs = closes.slice(1).map((c, i) => c - closes[i]);
    let avgG = diffs.slice(0, period).filter(d => d > 0).reduce((a, b) => a + b, 0) / period;
    let avgL = diffs.slice(0, period).filter(d => d < 0).map(Math.abs).reduce((a, b) => a + b, 0) / period;
    const out = new Array(period).fill(null);
    for (let i = period; i < diffs.length; i++) {
      avgG = (avgG * (period - 1) + Math.max(0,  diffs[i])) / period;
      avgL = (avgL * (period - 1) + Math.max(0, -diffs[i])) / period;
      out.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
    }
    return out;
  }

  function calcMACD(closes, fast = 12, slow = 26, sig = 9) {
    const ef  = calcEMA(closes, fast);
    const es  = calcEMA(closes, slow);
    const mac = ef.map((v, i) => (v != null && es[i] != null) ? v - es[i] : null);
    const validMac = mac.filter(v => v != null);
    const sigLine  = calcEMA(validMac, sig);
    const offset    = closes.length - validMac.length;
    const sigOffset = validMac.length - sigLine.length;
    return {
      macd:   mac,
      signal: mac.map((_, i) => {
        const vi = i - offset;
        const si = vi - sigOffset;
        return (vi >= 0 && si >= 0) ? sigLine[si] : null;
      }),
    };
  }

  function calcATR(candles, period = 14) {
    const trs = candles.slice(1).map((c, i) => Math.max(
      c.high - c.low,
      Math.abs(c.high - candles[i].close),
      Math.abs(c.low  - candles[i].close)
    ));
    let val = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const out = new Array(period).fill(null);
    out.push(val);
    for (let i = period; i < trs.length; i++) {
      val = (val * (period - 1) + trs[i]) / period;
      out.push(val);
    }
    return out;
  }

  function calcStoch(candles, kPeriod = 14, dPeriod = 3) {
    const rawK = [];
    for (let i = kPeriod - 1; i < candles.length; i++) {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const lo = Math.min(...slice.map(c => c.low));
      const hi = Math.max(...slice.map(c => c.high));
      rawK.push(hi === lo ? 50 : (candles[i].close - lo) / (hi - lo) * 100);
    }
    // %K = SMA3 du raw K
    const kLine = [];
    for (let i = dPeriod - 1; i < rawK.length; i++) {
      kLine.push(rawK.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod);
    }
    // %D = SMA3 du %K
    const dLine = [];
    for (let i = dPeriod - 1; i < kLine.length; i++) {
      dLine.push(kLine.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod);
    }
    return { k: kLine, d: dLine };
  }

  function calcBB(closes, period = 20, mult = 2) {
    const upper = [], lower = [], mid = [];
    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean  = slice.reduce((a, b) => a + b, 0) / period;
      const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
      mid.push(mean);
      upper.push(mean + mult * std);
      lower.push(mean - mult * std);
    }
    return { upper, lower, mid };
  }

  function calcADX(candles, period = 14) {
    if (candles.length < period * 2 + 1) return null;
    const trArr = [], pDM = [], mDM = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i], p = candles[i - 1];
      trArr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
      const up = c.high - p.high, down = p.low - c.low;
      pDM.push(up > down && up > 0 ? up : 0);
      mDM.push(down > up && down > 0 ? down : 0);
    }
    // Wilder smoothing
    const wilder = (arr, p) => {
      let v = arr.slice(0, p).reduce((a, b) => a + b, 0);
      const out = [v];
      for (let i = p; i < arr.length; i++) { v = v - v / p + arr[i]; out.push(v); }
      return out;
    };
    const sTR = wilder(trArr, period);
    const sPDM = wilder(pDM, period);
    const sMDM = wilder(mDM, period);
    const pDI = sPDM.map((v, i) => sTR[i] ? v / sTR[i] * 100 : 0);
    const mDI = sMDM.map((v, i) => sTR[i] ? v / sTR[i] * 100 : 0);
    const dx  = pDI.map((v, i) => (v + mDI[i]) ? Math.abs(v - mDI[i]) / (v + mDI[i]) * 100 : 0);
    let adxVal = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dx.length; i++) adxVal = (adxVal * (period - 1) + dx[i]) / period;
    return { adx: adxVal, pdi: pDI[pDI.length - 1], mdi: mDI[mDI.length - 1] };
  }

  // ── DÉTECTION DE SIGNAL (13 conditions possibles) ─────────
  function detectSignal(appSym, tf, candles) {
    const closes = candles.map(c => c.close);
    const n      = closes.length;

    const ema20a  = calcEMA(closes, 20);
    const ema50a  = calcEMA(closes, 50);
    const ema200a = calcEMA(closes, 200);
    const rsiA    = calcRSI(closes, 14);
    const macdO   = calcMACD(closes);
    const atrA    = calcATR(candles, 14);
    const stoch   = calcStoch(candles);
    const bb      = calcBB(closes);
    const adxR    = calcADX(candles);

    const last = (arr) => arr[arr.length - 1];
    const prev = (arr) => arr[arr.length - 2];

    const ema20  = last(ema20a);  const ema20p = prev(ema20a);
    const ema50  = last(ema50a);  const ema50p = prev(ema50a);
    const ema200 = last(ema200a);
    const rsiNow = last(rsiA);    const rsiPrv = prev(rsiA);
    const macdN  = last(macdO.macd);   const macdP = prev(macdO.macd);
    const sigN   = last(macdO.signal); const sigP  = prev(macdO.signal);
    const atrNow = last(atrA);
    const kNow   = last(stoch.k);  const kPrv  = prev(stoch.k);
    const dNow   = last(stoch.d);  const dPrv  = prev(stoch.d);
    const bbUpper = last(bb.upper);
    const bbLower = last(bb.lower);

    if (!ema20 || !ema50 || !ema200 || !rsiNow || !macdN || !sigN
        || !atrNow || kNow == null || dNow == null || !bbUpper) return null;

    const price      = closes[n - 1];
    const lastCandle = candles[n - 1];
    const prevCandle = candles[n - 2];

    // Volume spike : bougie courante > 1.3× moyenne 20 bougies
    const vols   = candles.slice(-21, -1).map(c => c.volume || 0);
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    const volSpike = avgVol > 0 && (lastCandle.volume || 0) > avgVol * 1.3;

    // Patterns de bougies
    const body       = Math.abs(lastCandle.close - lastCandle.open);
    const upperWick  = lastCandle.high  - Math.max(lastCandle.open, lastCandle.close);
    const lowerWick  = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    const isHammer   = body > 0 && lowerWick > body * 2 && upperWick < body * 0.5;
    const isStar     = body > 0 && upperWick > body * 2 && lowerWick < body * 0.5;
    const isBullEng  = prevCandle
      && lastCandle.close > lastCandle.open
      && lastCandle.open  < prevCandle.close
      && lastCandle.close > prevCandle.open;
    const isBearEng  = prevCandle
      && lastCandle.close < lastCandle.open
      && lastCandle.open  > prevCandle.close
      && lastCandle.close < prevCandle.open;

    // Croisements MACD
    const macdBull = macdN > sigN && macdP <= sigP;
    const macdBear = macdN < sigN && macdP >= sigP;

    // Croisements Stochastique (en zone oversold/overbought)
    const stochBull = kNow > dNow && kPrv <= dPrv && kNow < 45;
    const stochBear = kNow < dNow && kPrv >= dPrv && kNow > 55;

    // ── Conditions LONG (13 max) ──────────────────────────
    const lc = [];
    if (ema20 > ema50)                                   lc.push('EMA20 > EMA50 (tendance haussière)');
    if (price > ema200)                                  lc.push('Prix au-dessus EMA200');
    if (price > ema20)                                   lc.push('Prix au-dessus EMA20');
    if (ema20 > ema20p && ema50 > ema50p)                lc.push('EMAs en expansion haussière');
    if (rsiNow > 45 && rsiNow < 65)                     lc.push('RSI en zone momentum (45-65)');
    if (rsiPrv != null && rsiPrv <= 32 && rsiNow > 32)  lc.push('RSI : sortie de survente');
    if (macdBull)                                        lc.push('MACD : croisement haussier');
    if (stochBull)                                       lc.push('Stochastique : croisement haussier');
    if (price <= bbLower * 1.002)                        lc.push('Prix sur bande Bollinger basse');
    if (adxR && adxR.adx > 20 && adxR.pdi > adxR.mdi)  lc.push('ADX : force haussière confirmée');
    if (lastCandle.close > lastCandle.open)              lc.push('Bougie de clôture haussière');
    if (isHammer || isBullEng)                           lc.push(isHammer ? 'Pattern : Marteau' : 'Pattern : Engloutissant haussier');
    if (volSpike)                                        lc.push('Volume : pic de confirmation');

    // ── Conditions SHORT (13 max) ─────────────────────────
    const sc = [];
    if (ema20 < ema50)                                   sc.push('EMA20 < EMA50 (tendance baissière)');
    if (price < ema200)                                  sc.push('Prix en-dessous EMA200');
    if (price < ema20)                                   sc.push('Prix en-dessous EMA20');
    if (ema20 < ema20p && ema50 < ema50p)                sc.push('EMAs en expansion baissière');
    if (rsiNow > 35 && rsiNow < 55)                     sc.push('RSI en zone momentum (35-55)');
    if (rsiPrv != null && rsiPrv >= 68 && rsiNow < 68)  sc.push('RSI : sortie de surachat');
    if (macdBear)                                        sc.push('MACD : croisement baissier');
    if (stochBear)                                       sc.push('Stochastique : croisement baissier');
    if (price >= bbUpper * 0.998)                        sc.push('Prix sur bande Bollinger haute');
    if (adxR && adxR.adx > 20 && adxR.mdi > adxR.pdi)  sc.push('ADX : force baissière confirmée');
    if (lastCandle.close < lastCandle.open)              sc.push('Bougie de clôture baissière');
    if (isStar || isBearEng)                             sc.push(isStar ? 'Pattern : Étoile filante' : 'Pattern : Engloutissant baissier');
    if (volSpike)                                        sc.push('Volume : pic de confirmation');

    // Trigger obligatoire : MACD, Stochastique ou RSI extrême
    const hasLongTrigger  = lc.some(c => c.includes('MACD') || c.includes('survente') || c.includes('Stochastique'));
    const hasShortTrigger = sc.some(c => c.includes('MACD') || c.includes('surachat') || c.includes('Stochastique'));

    const MIN = 6;
    let direction = null, conditions = [];
    if (lc.length >= MIN && hasLongTrigger && lc.length >= sc.length) {
      direction = 'LONG';  conditions = lc;
    } else if (sc.length >= MIN && hasShortTrigger && sc.length > lc.length) {
      direction = 'SHORT'; conditions = sc;
    } else {
      return null;
    }

    const matchCount = conditions.length;
    const score = matchCount >= 10 ? 'HIGH' : matchCount >= 8 ? 'MEDIUM' : 'LOW';

    // Nom du setup
    const hasMacd    = conditions.some(c => c.includes('MACD'));
    const hasStoch   = conditions.some(c => c.includes('Stochastique'));
    const hasRSIext  = conditions.some(c => c.includes('survente') || c.includes('surachat'));
    const hasBB      = conditions.some(c => c.includes('Bollinger'));
    const hasPattern = conditions.some(c => c.includes('Pattern'));
    let setup = 'Multi-confluences';
    if (hasMacd && hasStoch)     setup = 'MACD + Stochastique';
    else if (hasMacd)             setup = 'MACD Crossover';
    else if (hasRSIext && hasBB)  setup = 'Rebond RSI + Bollinger';
    else if (hasPattern)          setup = 'Pattern + EMAs';
    else if (hasStoch)            setup = 'Stochastique Crossover';

    const decimals = /JPY/.test(appSym) ? 3
      : /BTC|NAS|US5|US3|XAU|XAG|OIL/.test(appSym) ? 2
      : 5;

    const slDist = atrNow * 1.5;
    const entry  = price;
    const sl  = direction === 'LONG' ? entry - slDist     : entry + slDist;
    const tp1 = direction === 'LONG' ? entry + slDist     : entry - slDist;
    const tp2 = direction === 'LONG' ? entry + slDist * 2 : entry - slDist * 2;
    const tp3 = direction === 'LONG' ? entry + slDist * 3 : entry - slDist * 3;

    return {
      id: `${appSym}_${tf}_${Date.now()}`,
      symbol: appSym, tf, direction, setup,
      entry, sl, tp1, tp2, tp3, decimals,
      score, matchCount,
      conditions: conditions.slice(0, 8),
      time: Date.now(),
    };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { render, scan, saveKey, saveKeyFromSettings, openSettings, setTf, toggleSymbol, _resetSymbols };
})();
