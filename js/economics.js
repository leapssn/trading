// ============================================================
// economics.js — Annonces économiques + Spreads de référence
// ============================================================
const Economics = (() => {

  // Proxy CORS public pour contourner la restriction du navigateur
  const FF_URL  = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  const PROXIES = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  // Filtre actif (null = tout afficher)
  let _filterCurrency = null;
  let _filterImpact   = null; // 'high' | 'medium' | 'low' | null
  let _cachedEvents   = null;

  // ─── Spreads de référence ──────────────────────────────────
  const SPREADS = {
    forex: [
      { pair: 'EUR/USD', ecn: 0.1,  std: 1.3,  pip: 0.0001 },
      { pair: 'GBP/USD', ecn: 0.3,  std: 1.8,  pip: 0.0001 },
      { pair: 'USD/JPY', ecn: 0.2,  std: 1.2,  pip: 0.01   },
      { pair: 'USD/CHF', ecn: 0.3,  std: 1.7,  pip: 0.0001 },
      { pair: 'AUD/USD', ecn: 0.2,  std: 1.5,  pip: 0.0001 },
      { pair: 'USD/CAD', ecn: 0.3,  std: 1.8,  pip: 0.0001 },
      { pair: 'NZD/USD', ecn: 0.4,  std: 2.0,  pip: 0.0001 },
      { pair: 'EUR/GBP', ecn: 0.5,  std: 2.2,  pip: 0.0001 },
      { pair: 'EUR/JPY', ecn: 0.5,  std: 2.5,  pip: 0.01   },
      { pair: 'GBP/JPY', ecn: 0.8,  std: 3.5,  pip: 0.01   },
      { pair: 'EUR/CHF', ecn: 0.7,  std: 2.8,  pip: 0.0001 },
      { pair: 'AUD/JPY', ecn: 0.8,  std: 3.2,  pip: 0.01   },
    ],
    indices: [
      { pair: 'US500 (S&P500)',    ecn: 0.4,  std: 0.8,  pip: 1    },
      { pair: 'US30 (Dow Jones)',  ecn: 1.5,  std: 3.0,  pip: 1    },
      { pair: 'NAS100 (Nasdaq)',   ecn: 0.8,  std: 1.5,  pip: 1    },
      { pair: 'GER40 (DAX)',       ecn: 1.0,  std: 1.8,  pip: 1    },
      { pair: 'UK100 (FTSE)',      ecn: 1.0,  std: 2.0,  pip: 1    },
      { pair: 'FRA40 (CAC 40)',    ecn: 1.0,  std: 2.0,  pip: 1    },
      { pair: 'JPN225 (Nikkei)',   ecn: 5.0,  std: 10.0, pip: 1    },
    ],
    commodities: [
      { pair: 'XAUUSD (Or)',       ecn: 0.15, std: 0.35, pip: 0.01 },
      { pair: 'XAGUSD (Argent)',   ecn: 0.02, std: 0.05, pip: 0.001},
      { pair: 'USOIL (WTI)',       ecn: 0.03, std: 0.05, pip: 0.01 },
      { pair: 'UKOIL (Brent)',     ecn: 0.04, std: 0.06, pip: 0.01 },
      { pair: 'XTIUSD (Pétrole)',  ecn: 0.03, std: 0.05, pip: 0.01 },
    ],
    crypto: [
      { pair: 'BTC/USD',  ecn: 50,   std: 80,   pip: 1    },
      { pair: 'ETH/USD',  ecn: 2.5,  std: 5.0,  pip: 0.01 },
      { pair: 'LTC/USD',  ecn: 0.3,  std: 0.8,  pip: 0.01 },
      { pair: 'XRP/USD',  ecn: 0.002,std: 0.005,pip: 0.0001},
    ],
  };

  // Drapeaux des devises
  const FLAGS = {
    USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵',
    CHF:'🇨🇭', CAD:'🇨🇦', AUD:'🇦🇺', NZD:'🇳🇿',
    CNY:'🇨🇳', CNH:'🇨🇳', ALL:'🌐',
  };

  // ─── Render principal ───────────────────────────────────────
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Économie & Spreads</h2>
      </div>
      <div class="content-area space-y-8">

        <!-- Tabs -->
        <div class="flex gap-2 border-b border-[#2e3256] pb-0">
          <button id="tab-eco"     onclick="Economics.switchTab('eco')"     class="tab-btn tab-active px-5 py-3 text-sm font-semibold border-b-2 border-brand text-white -mb-px">📅 Annonces éco.</button>
          <button id="tab-spreads" onclick="Economics.switchTab('spreads')" class="tab-btn px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white -mb-px transition">📊 Spreads de référence</button>
        </div>

        <!-- Tab: Annonces -->
        <div id="tab-eco-content">
          <!-- Filtres -->
          <div class="flex flex-wrap gap-3 mb-5">
            <div>
              <label class="form-label">Devise</label>
              <select id="filterCurrency" onchange="Economics.applyFilter()" class="form-input w-36">
                <option value="">Toutes</option>
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
                <option value="GBP">🇬🇧 GBP</option>
                <option value="JPY">🇯🇵 JPY</option>
                <option value="CHF">🇨🇭 CHF</option>
                <option value="CAD">🇨🇦 CAD</option>
                <option value="AUD">🇦🇺 AUD</option>
                <option value="NZD">🇳🇿 NZD</option>
              </select>
            </div>
            <div>
              <label class="form-label">Impact</label>
              <div class="flex gap-2">
                <button onclick="Economics.setImpact(null)"     id="imp-all"    class="impact-btn impact-active">Tout</button>
                <button onclick="Economics.setImpact('high')"   id="imp-high"   class="impact-btn">🔴 Fort</button>
                <button onclick="Economics.setImpact('medium')" id="imp-medium" class="impact-btn">🟠 Moyen</button>
                <button onclick="Economics.setImpact('low')"    id="imp-low"    class="impact-btn">🟡 Faible</button>
              </div>
            </div>
            <div class="ml-auto self-end">
              <button onclick="Economics.reload()" class="btn-secondary text-sm flex items-center gap-2">
                <span id="reloadIcon">🔄</span> Actualiser
              </button>
            </div>
          </div>

          <div id="ecoList">
            <div class="flex items-center justify-center py-16 gap-3">
              <div class="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div>
              <span class="text-slate-400">Chargement des annonces...</span>
            </div>
          </div>
        </div>

        <!-- Tab: Spreads -->
        <div id="tab-spreads-content" class="hidden space-y-6">
          ${renderSpreads()}
        </div>

      </div>`;

    await loadEvents();
  }

  // ─── Chargement des events via proxy ───────────────────────
  async function loadEvents() {
    if (_cachedEvents) { renderEvents(_cachedEvents); return; }

    let data = null;
    for (const proxyFn of PROXIES) {
      try {
        const res = await fetch(proxyFn(FF_URL), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const text = await res.text();
        data = JSON.parse(text);
        if (Array.isArray(data)) break;
        // allorigins wraps in { contents }
        if (data?.contents) { data = JSON.parse(data.contents); break; }
      } catch { /* try next proxy */ }
    }

    if (!data) {
      document.getElementById('ecoList').innerHTML = `
        <div class="stat-card text-center py-10">
          <p class="text-3xl mb-3">🌐</p>
          <p class="text-slate-300 font-medium mb-2">Impossible de charger les annonces</p>
          <p class="text-slate-500 text-sm mb-4">Vérifiez votre connexion ou les proxies CORS sont temporairement indisponibles.</p>
          <button onclick="Economics.reload()" class="btn-primary text-sm">Réessayer</button>
        </div>`;
      return;
    }

    _cachedEvents = data;
    renderEvents(data);
  }

  function renderEvents(rawData) {
    const today = new Date().toISOString().slice(0, 10);

    // Filtrage
    let events = rawData.filter(e => {
      const d = (e.date || '').slice(0, 10);
      if (d !== today) return false;
      if (_filterCurrency && e.country !== _filterCurrency) return false;
      if (_filterImpact   && e.impact?.toLowerCase() !== _filterImpact) return false;
      return true;
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    const list = document.getElementById('ecoList');
    if (!list) return;

    if (!events.length) {
      const tomorrow = rawData.filter(e => {
        const d = new Date(e.date);
        const t = new Date(); t.setDate(t.getDate() + 1);
        return d.toISOString().slice(0,10) === t.toISOString().slice(0,10);
      });
      list.innerHTML = `
        <div class="stat-card text-center py-10">
          <p class="text-3xl mb-3">📭</p>
          <p class="text-slate-300 font-medium">Aucune annonce correspondante aujourd'hui</p>
          ${tomorrow.length ? `<p class="text-slate-500 text-sm mt-2">Demain : ${tomorrow.length} événements prévus</p>` : ''}
        </div>`;
      return;
    }

    // Grouper par heure
    const grouped = {};
    events.forEach(e => {
      const h = formatLocalTime(e.date);
      if (!grouped[h]) grouped[h] = [];
      grouped[h].push(e);
    });

    list.innerHTML = Object.entries(grouped).map(([time, evts]) => `
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full">${time}</span>
          <div class="flex-1 h-px bg-[#2e3256]"></div>
        </div>
        ${evts.map(e => eventRow(e)).join('')}
      </div>
    `).join('');
  }

  function eventRow(e) {
    const impact = (e.impact || '').toLowerCase();
    const impactMap = {
      high:   { dot: 'bg-red-500',    label: 'Fort',   text: 'text-red-400'    },
      medium: { dot: 'bg-orange-400', label: 'Moyen',  text: 'text-orange-400' },
      low:    { dot: 'bg-yellow-400', label: 'Faible', text: 'text-yellow-400' },
    };
    const imp  = impactMap[impact] || { dot: 'bg-slate-500', label: '—', text: 'text-slate-400' };
    const flag = FLAGS[e.country] || '🏳';

    const prev    = e.previous || '—';
    const forecast= e.forecast || '—';
    const actual  = e.actual   || '—';

    const actualColor = e.actual
      ? (parseImpact(e.actual, e.forecast) > 0 ? 'pnl-pos' : parseImpact(e.actual, e.forecast) < 0 ? 'pnl-neg' : 'text-white')
      : 'text-slate-400';

    return `
      <div class="stat-card flex items-center gap-4 py-3 mb-2 hover:border-[#3e4276] transition">
        <div class="shrink-0 w-10 text-center">
          <span class="text-xl">${flag}</span>
          <div class="text-xs text-slate-500 font-semibold mt-0.5">${e.country || ''}</div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="w-2 h-2 rounded-full ${imp.dot} shrink-0"></span>
            <p class="font-medium text-white text-sm truncate">${e.title || e.name || 'Événement'}</p>
          </div>
          <span class="text-xs ${imp.text}">${imp.label} impact</span>
        </div>

        <div class="shrink-0 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div class="text-slate-500 mb-1">Précédent</div>
            <div class="text-slate-300">${prev}</div>
          </div>
          <div>
            <div class="text-slate-500 mb-1">Prévision</div>
            <div class="text-slate-300">${forecast}</div>
          </div>
          <div>
            <div class="text-slate-500 mb-1">Actuel</div>
            <div class="${actualColor} font-semibold">${actual}</div>
          </div>
        </div>
      </div>`;
  }

  // ─── Spreads ────────────────────────────────────────────────
  function renderSpreads() {
    const sections = [
      { key: 'forex',       label: '💱 Forex — Paires Majeures & Croisées', unit: 'pips' },
      { key: 'indices',     label: '📈 Indices Boursiers',                   unit: 'points' },
      { key: 'commodities', label: '🛢️ Matières Premières',                  unit: 'points' },
      { key: 'crypto',      label: '₿ Cryptomonnaies',                       unit: 'points' },
    ];

    return sections.map(sec => `
      <div class="stat-card overflow-x-auto">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">${sec.label}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Spread ECN (${sec.unit})</th>
              <th>Spread Standard (${sec.unit})</th>
              <th>Pip / Tick</th>
              <th>Liquidité</th>
            </tr>
          </thead>
          <tbody>
            ${SPREADS[sec.key].map(r => spreadRow(r, sec.unit)).join('')}
          </tbody>
        </table>
      </div>`).join('') + `
      <div class="stat-card bg-brand/5 border-brand/30">
        <h4 class="text-sm font-semibold text-white mb-3">💡 Quand les spreads s'élargissent ?</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div class="flex gap-2"><span class="text-red-400 text-lg">⚠️</span><div><b class="text-slate-300">Avant les news majeures</b><br>Les spreads peuvent tripler dans les 5 min avant une annonce NFP, CPI, FOMC.</div></div>
          <div class="flex gap-2"><span class="text-orange-400 text-lg">🌙</span><div><b class="text-slate-300">Hors sessions actives</b><br>La nuit et en dehors des chevauchements, la liquidité baisse et les spreads augmentent.</div></div>
          <div class="flex gap-2"><span class="text-yellow-400 text-lg">📅</span><div><b class="text-slate-300">Vendredi soir / lundi matin</b><br>Réouverture du marché et weekend gap — risque de spread gap élevé.</div></div>
        </div>
      </div>`;
  }

  function spreadRow(r, unit) {
    const liquidity = r.ecn < 0.3 ? { label: 'Très haute', cls: 'text-green-400' }
                    : r.ecn < 1   ? { label: 'Haute',      cls: 'text-green-300' }
                    : r.ecn < 3   ? { label: 'Moyenne',    cls: 'text-yellow-400' }
                    :               { label: 'Faible',      cls: 'text-red-400'   };
    return `
      <tr>
        <td class="font-semibold text-white">${r.pair}</td>
        <td><span class="badge bg-green-500/10 text-green-400">${r.ecn} ${unit}</span></td>
        <td><span class="badge bg-orange-500/10 text-orange-400">${r.std} ${unit}</span></td>
        <td class="text-slate-400 font-mono text-xs">${r.pip}</td>
        <td class="${liquidity.cls} font-medium">${liquidity.label}</td>
      </tr>`;
  }

  // ─── Helpers ────────────────────────────────────────────────
  function formatLocalTime(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    if (isNaN(d)) return isoDate.slice(11, 16) || '—';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function parseImpact(actual, forecast) {
    const a = parseFloat((actual  || '').replace(/[^0-9.\-]/g, ''));
    const f = parseFloat((forecast|| '').replace(/[^0-9.\-]/g, ''));
    if (isNaN(a) || isNaN(f)) return 0;
    return a > f ? 1 : a < f ? -1 : 0;
  }

  function switchTab(tab) {
    const tabs    = ['eco', 'spreads'];
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => {
      const content = document.getElementById(`tab-${t}-content`);
      const btn     = document.getElementById(`tab-${t}`);
      if (content) content.classList.toggle('hidden', t !== tab);
      if (btn) {
        btn.classList.toggle('border-brand',       t === tab);
        btn.classList.toggle('text-white',         t === tab);
        btn.classList.toggle('border-transparent', t !== tab);
        btn.classList.toggle('text-slate-400',     t !== tab);
      }
    });
  }

  function applyFilter() {
    _filterCurrency = document.getElementById('filterCurrency')?.value || null;
    if (_cachedEvents) renderEvents(_cachedEvents);
  }

  function setImpact(level) {
    _filterImpact = level;
    ['all','high','medium','low'].forEach(k => {
      document.getElementById(`imp-${k}`)?.classList.toggle('impact-active', (k === 'all' ? null : k) === level || (k === 'all' && level === null));
    });
    if (_cachedEvents) renderEvents(_cachedEvents);
  }

  function reload() {
    _cachedEvents = null;
    const icon = document.getElementById('reloadIcon');
    if (icon) { icon.classList.add('animate-spin'); setTimeout(() => icon.classList.remove('animate-spin'), 2000); }
    const list = document.getElementById('ecoList');
    if (list) list.innerHTML = `<div class="flex items-center justify-center py-16 gap-3"><div class="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div><span class="text-slate-400">Chargement...</span></div>`;
    loadEvents();
  }

  return { render, switchTab, applyFilter, setImpact, reload };
})();
