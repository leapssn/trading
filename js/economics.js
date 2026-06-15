// ============================================================
// economics.js — Annonces économiques + Spreads de référence
// ============================================================
const Economics = (() => {

  const FF_URL  = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  const PROXIES = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  let _filterCurrency = null;
  let _filterImpact   = null;
  let _cachedEvents   = null;
  let _openDetail     = null;
  let _selectedDate   = new Date().toISOString().slice(0, 10);

  // ── Dictionnaire des indicateurs ──────────────────────────
  const INDICATORS = {
    // ── États-Unis ─────────────────────────────────────────
    'Non-Farm Employment Change': {
      fr: 'NFP — Emplois non-agricoles',
      desc: "Nombre de nouveaux emplois créés hors secteur agricole en un mois. C'est l'un des indicateurs les plus surveillés au monde.",
      impact: "Impact massif sur l'USD, l'or et les indices US. Un NFP supérieur aux attentes → USD fort, or en baisse. Inférieur → USD faible.",
      paires: ['USD/JPY','EUR/USD','GBP/USD','XAUUSD'],
      freq: 'Mensuel (1er vendredi)',
    },
    'CPI m/m': {
      fr: 'CPI — Inflation mensuelle',
      desc: "Consumer Price Index : variation mensuelle du coût d'un panier de biens. Mesure principale de l'inflation aux USA.",
      impact: "CPI élevé → Fed hawkish → USD fort, actions en baisse. CPI faible → Fed dovish → USD faible, actions en hausse.",
      paires: ['EUR/USD','USD/JPY','US500','XAUUSD'],
      freq: 'Mensuel',
    },
    'Core CPI m/m': {
      fr: 'Core CPI — Inflation hors énergie/alimentaire',
      desc: "Même chose que le CPI mais sans l'énergie et l'alimentaire, plus volatile. Indicateur préféré de la Fed.",
      impact: "Identique au CPI, souvent encore plus surveillé car c'est la référence de la Fed pour la politique monétaire.",
      paires: ['EUR/USD','USD/JPY','US500'],
      freq: 'Mensuel',
    },
    'Federal Funds Rate': {
      fr: 'FOMC — Taux directeur Fed',
      desc: "Décision de taux de la Réserve Fédérale américaine. Détermine le coût de l'argent dans l'économie US.",
      impact: "Hausse de taux → USD fort, obligations en baisse. Baisse de taux → USD faible, actions en hausse. Le plus gros event du calendrier.",
      paires: ['EUR/USD','USD/JPY','US500','NAS100','XAUUSD'],
      freq: '8x par an',
    },
    'FOMC Statement': {
      fr: 'FOMC — Communiqué de la Fed',
      desc: "Déclaration publiée après chaque réunion du FOMC expliquant la décision de taux et les perspectives économiques.",
      impact: "Extrêmement volatile. Le ton (hawkish/dovish) détermine la direction. À lire mot pour mot : chaque nuance compte.",
      paires: ['EUR/USD','USD/JPY','US500','XAUUSD'],
      freq: '8x par an',
    },
    'GDP q/q': {
      fr: 'PIB — Croissance économique trimestrielle',
      desc: "Gross Domestic Product : mesure la croissance de l'économie sur un trimestre. Indicateur de santé économique globale.",
      impact: "PIB supérieur aux attentes → USD fort, optimisme sur les marchés. PIB en baisse ou négatif → risque de récession, volatilité.",
      paires: ['EUR/USD','USD/JPY','US500'],
      freq: 'Trimestriel',
    },
    'Retail Sales m/m': {
      fr: 'Ventes au détail mensuelles',
      desc: "Variation mensuelle des ventes de biens dans les commerces. Mesure la consommation des ménages (70% du PIB US).",
      impact: "Chiffre élevé → consommation forte → USD fort. Chiffre faible → crainte de ralentissement → USD sous pression.",
      paires: ['EUR/USD','USD/JPY','US500'],
      freq: 'Mensuel',
    },
    'Unemployment Claims': {
      fr: 'Inscriptions chômage hebdomadaires',
      desc: "Nombre de nouvelles demandes d'allocations chômage. Indicateur avancé du marché de l'emploi.",
      impact: "Hausse des inscriptions → marché de l'emploi qui se détériore → USD faible. Baisse → emploi solide → USD fort.",
      paires: ['EUR/USD','USD/JPY'],
      freq: 'Hebdomadaire (jeudi)',
    },
    'ISM Manufacturing PMI': {
      fr: 'ISM Manufacturier — PMI',
      desc: "Purchasing Managers Index pour le secteur industriel. Indice > 50 = expansion, < 50 = contraction.",
      impact: "PMI > 50 et supérieur aux attentes → USD fort. PMI < 50 → secteur en contraction, USD sous pression.",
      paires: ['USD/JPY','EUR/USD','US500'],
      freq: 'Mensuel (1er jour ouvré)',
    },
    'ISM Services PMI': {
      fr: 'ISM Services — PMI',
      desc: "PMI du secteur des services (80% de l'économie US). Même logique que le PMI manufacturier.",
      impact: "Impact important car les services dominent l'économie américaine. > 50 = expansion favorable à l'USD.",
      paires: ['EUR/USD','USD/JPY','US500'],
      freq: 'Mensuel',
    },
    'PPI m/m': {
      fr: 'PPI — Prix à la production',
      desc: "Producer Price Index : variation des prix à la sortie des usines. Précède souvent l'inflation à la consommation (CPI).",
      impact: "PPI élevé → inflation future probable → Fed hawkish → USD fort. Indicateur avancé du CPI.",
      paires: ['EUR/USD','USD/JPY'],
      freq: 'Mensuel',
    },
    'ADP Non-Farm Employment Change': {
      fr: 'ADP Emploi privé',
      desc: "Estimation de l'emploi privé par la société ADP. Publié 2 jours avant le NFP officiel, utilisé comme préview.",
      impact: "Corrélation modérée avec le NFP. Peut causer de la volatilité sur l'USD mais moins que le NFP officiel.",
      paires: ['EUR/USD','USD/JPY','XAUUSD'],
      freq: 'Mensuel (mercredi)',
    },
    'Trade Balance': {
      fr: 'Balance commerciale',
      desc: "Différence entre exportations et importations. Un déficit signifie que le pays importe plus qu'il n'exporte.",
      impact: "Surplus commercial → demande de la devise locale. Déficit → pression baissière sur la devise.",
      paires: ['USD/JPY','EUR/USD'],
      freq: 'Mensuel',
    },
    'Average Hourly Earnings m/m': {
      fr: 'Salaires horaires moyens',
      desc: "Variation mensuelle des salaires. Mesure la pression salariale, indicateur d'inflation future.",
      impact: "Publié en même temps que le NFP. Salaires en hausse → inflation possible → USD fort. Très surveillé par la Fed.",
      paires: ['EUR/USD','USD/JPY','XAUUSD'],
      freq: 'Mensuel (avec NFP)',
    },
    'CB Consumer Confidence': {
      fr: 'Confiance des consommateurs (Conference Board)',
      desc: "Sondage mensuel sur la perception économique des ménages américains. Précède les dépenses de consommation.",
      impact: "Confiance élevée → consommation anticipée → USD fort. Confiance faible → crainte de récession.",
      paires: ['EUR/USD','US500'],
      freq: 'Mensuel (dernier mardi)',
    },
    'Existing Home Sales': {
      fr: 'Ventes de logements existants',
      desc: "Nombre de maisons/appartements anciens vendus. Mesure la santé du marché immobilier.",
      impact: "Impact modéré. Bon chiffre → économie saine → léger soutien à l'USD.",
      paires: ['USD/JPY','EUR/USD'],
      freq: 'Mensuel',
    },
    // ── Europe / BCE ────────────────────────────────────────
    'Main Refinancing Rate': {
      fr: 'BCE — Taux directeur européen',
      desc: "Décision de taux de la Banque Centrale Européenne. Détermine le coût du crédit en zone euro.",
      impact: "Hausse → EUR fort. Baisse → EUR faible. La conférence de presse de Lagarde après la décision est tout aussi importante.",
      paires: ['EUR/USD','EUR/GBP','EUR/JPY'],
      freq: '8x par an',
    },
    'CPI Flash Estimate y/y': {
      fr: 'Inflation eurozone (estimation rapide)',
      desc: "Estimation préliminaire de l'inflation en zone euro. Publiée avant la version finale.",
      impact: "Inflation haute → BCE hawkish → EUR fort. Inflation basse → BCE dovish → EUR sous pression.",
      paires: ['EUR/USD','EUR/GBP'],
      freq: 'Mensuel',
    },
    'German Ifo Business Climate': {
      fr: 'Ifo — Climat des affaires allemand',
      desc: "Sondage auprès de 9 000 entreprises allemandes sur leurs perspectives. L'Allemagne est le moteur économique de l'Europe.",
      impact: "Ifo élevé → optimisme économique européen → EUR fort. Ifo en baisse → inquiétude sur l'Europe.",
      paires: ['EUR/USD','EUR/GBP'],
      freq: 'Mensuel',
    },
    'German ZEW Economic Sentiment': {
      fr: 'ZEW — Sentiment économique allemand',
      desc: "Sondage auprès d'experts financiers sur leurs anticipations pour l'économie allemande à 6 mois.",
      impact: "Sentiment positif → EUR fort. Sentiment négatif → EUR faible. Indicateur avancé.",
      paires: ['EUR/USD','EUR/GBP'],
      freq: 'Mensuel (mardi)',
    },
    'Flash Manufacturing PMI': {
      fr: 'PMI Manufacturier (estimation rapide)',
      desc: "Estimation préliminaire du PMI industriel européen ou britannique. Publié avant la version finale.",
      impact: "> 50 = expansion → monnaie locale forte. < 50 = contraction → pression à la baisse.",
      paires: ['EUR/USD','GBP/USD'],
      freq: 'Mensuel',
    },
    'Flash Services PMI': {
      fr: 'PMI Services (estimation rapide)',
      desc: "Estimation préliminaire du PMI services. Secteur dominant en Europe, indicateur clé.",
      impact: "> 50 favorable à EUR ou GBP selon la publication (Eurozone ou UK).",
      paires: ['EUR/USD','GBP/USD'],
      freq: 'Mensuel',
    },
    // ── Royaume-Uni ─────────────────────────────────────────
    'Official Bank Rate': {
      fr: 'BoE — Taux directeur britannique',
      desc: "Décision de taux de la Banque d'Angleterre. Impact direct sur la livre sterling.",
      impact: "Hausse → GBP fort. Baisse → GBP faible. La conférence de presse du gouverneur Bailey est très suivie.",
      paires: ['GBP/USD','EUR/GBP','GBP/JPY'],
      freq: '8x par an',
    },
    'Claimant Count Change': {
      fr: 'Demandeurs d\'emploi UK',
      desc: "Variation du nombre de personnes demandant des allocations chômage au Royaume-Uni.",
      impact: "Hausse → marché de l'emploi UK qui se détériore → GBP faible. Baisse → GBP fort.",
      paires: ['GBP/USD','EUR/GBP'],
      freq: 'Mensuel',
    },
    // ── Japon ────────────────────────────────────────────────
    'BOJ Policy Rate': {
      fr: 'BoJ — Taux directeur japonais',
      desc: "Décision de taux de la Banque du Japon. Le Japon a maintenu des taux ultra-bas pendant des décennies (politique ZIRP).",
      impact: "Toute surprise hawkish de la BoJ provoque une forte appréciation du JPY (carry trade dénouement).",
      paires: ['USD/JPY','EUR/JPY','GBP/JPY'],
      freq: '8x par an',
    },
    'Tankan Large Manufacturers Index': {
      fr: 'Tankan — Confiance des grandes entreprises',
      desc: "Sondage trimestriel de la BoJ auprès des grandes entreprises japonaises. L'indicateur économique le plus important du Japon.",
      impact: "Indice positif → confiance des entreprises → JPY fort. Négatif → économie fragile.",
      paires: ['USD/JPY','EUR/JPY'],
      freq: 'Trimestriel',
    },
    // ── Canada ────────────────────────────────────────────────
    'Overnight Rate': {
      fr: 'BoC — Taux directeur canadien',
      desc: "Décision de taux de la Banque du Canada. Fortement corrélé aux décisions de la Fed.",
      impact: "Hausse → CAD fort. Le Canada étant lié aux USA, les écarts de taux Fed/BoC influencent USD/CAD.",
      paires: ['USD/CAD','CAD/JPY'],
      freq: '8x par an',
    },
    'Employment Change': {
      fr: 'Emploi canadien',
      desc: "Variation du nombre d'emplois au Canada. Équivalent canadien du NFP américain.",
      impact: "Publié le même jour que le NFP US. Chiffre fort → CAD fort → USD/CAD en baisse.",
      paires: ['USD/CAD'],
      freq: 'Mensuel (1er vendredi)',
    },
    // ── Australie / NZ ────────────────────────────────────────
    'Cash Rate': {
      fr: 'RBA — Taux directeur australien',
      desc: "Décision de taux de la Reserve Bank of Australia.",
      impact: "Hausse → AUD fort. L'Australie étant exportatrice de matières premières, le contexte Chine est aussi important.",
      paires: ['AUD/USD','AUD/JPY'],
      freq: '11x par an',
    },
    'Official Cash Rate': {
      fr: 'RBNZ — Taux directeur néo-zélandais',
      desc: "Décision de taux de la Reserve Bank of New Zealand.",
      impact: "Hausse → NZD fort. La RBNZ est souvent l'une des premières banques centrales à agir sur les taux.",
      paires: ['NZD/USD','NZD/JPY'],
      freq: '7x par an',
    },
  };

  // Cherche un indicateur dans le dictionnaire (correspondance partielle)
  function findIndicator(title) {
    if (!title) return null;
    const t = title.toLowerCase();
    for (const [key, val] of Object.entries(INDICATORS)) {
      if (t.includes(key.toLowerCase()) || key.toLowerCase().includes(t.split(' ').slice(0,2).join(' '))) {
        return { key, ...val };
      }
    }
    return null;
  }

  // ── Spreads ────────────────────────────────────────────────
  const SPREADS = {
    forex: [
      { pair:'EUR/USD', ecn:0.1,  std:1.3,  pip:0.0001 },
      { pair:'GBP/USD', ecn:0.3,  std:1.8,  pip:0.0001 },
      { pair:'USD/JPY', ecn:0.2,  std:1.2,  pip:0.01   },
      { pair:'USD/CHF', ecn:0.3,  std:1.7,  pip:0.0001 },
      { pair:'AUD/USD', ecn:0.2,  std:1.5,  pip:0.0001 },
      { pair:'USD/CAD', ecn:0.3,  std:1.8,  pip:0.0001 },
      { pair:'NZD/USD', ecn:0.4,  std:2.0,  pip:0.0001 },
      { pair:'EUR/GBP', ecn:0.5,  std:2.2,  pip:0.0001 },
      { pair:'EUR/JPY', ecn:0.5,  std:2.5,  pip:0.01   },
      { pair:'GBP/JPY', ecn:0.8,  std:3.5,  pip:0.01   },
      { pair:'EUR/CHF', ecn:0.7,  std:2.8,  pip:0.0001 },
      { pair:'AUD/JPY', ecn:0.8,  std:3.2,  pip:0.01   },
    ],
    indices: [
      { pair:'US500 (S&P500)',   ecn:0.4,  std:0.8,  pip:1 },
      { pair:'US30 (Dow Jones)', ecn:1.5,  std:3.0,  pip:1 },
      { pair:'NAS100 (Nasdaq)',  ecn:0.8,  std:1.5,  pip:1 },
      { pair:'GER40 (DAX)',      ecn:1.0,  std:1.8,  pip:1 },
      { pair:'UK100 (FTSE)',     ecn:1.0,  std:2.0,  pip:1 },
      { pair:'FRA40 (CAC 40)',   ecn:1.0,  std:2.0,  pip:1 },
      { pair:'JPN225 (Nikkei)',  ecn:5.0,  std:10.0, pip:1 },
    ],
    commodities: [
      { pair:'XAUUSD (Or)',      ecn:0.15, std:0.35, pip:0.01  },
      { pair:'XAGUSD (Argent)',  ecn:0.02, std:0.05, pip:0.001 },
      { pair:'USOIL (WTI)',      ecn:0.03, std:0.05, pip:0.01  },
      { pair:'UKOIL (Brent)',    ecn:0.04, std:0.06, pip:0.01  },
    ],
    crypto: [
      { pair:'BTC/USD', ecn:50,   std:80,  pip:1    },
      { pair:'ETH/USD', ecn:2.5,  std:5.0, pip:0.01 },
      { pair:'SOL/USD', ecn:0.05, std:0.2, pip:0.01 },
    ],
  };

  const FLAGS = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CHF:'🇨🇭',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CNY:'🇨🇳' };

  // ── Render principal ──────────────────────────────────────
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Économie & Spreads</h2>
      </div>
      <div class="content-area space-y-6">
        <div class="flex gap-2 border-b" style="border-color:var(--border)">
          <button id="tab-eco"     onclick="Economics.switchTab('eco')"     class="tab-btn px-5 py-3 text-sm font-semibold border-b-2 border-brand -mb-px" style="color:var(--text-primary)">📅 Annonces éco.</button>
          <button id="tab-spreads" onclick="Economics.switchTab('spreads')" class="tab-btn px-5 py-3 text-sm font-semibold border-b-2 border-transparent -mb-px transition" style="color:var(--text-faint)">📊 Spreads</button>
        </div>

        <div id="tab-eco-content">
          <!-- Sélecteur de jour -->
          <div id="daySelector" class="flex gap-1.5 overflow-x-auto pb-1 mb-4"></div>

          <div class="flex flex-wrap gap-3 mb-4">
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
              <span style="color:var(--text-faint)">Chargement des annonces…</span>
            </div>
          </div>
        </div>

        <div id="tab-spreads-content" class="hidden space-y-6">${renderSpreads()}</div>
      </div>`;

    await loadEvents();
  }

  // ── Chargement des events ──────────────────────────────────
  async function loadEvents() {
    if (_cachedEvents) { renderEvents(_cachedEvents); return; }
    let data = null;
    for (const proxyFn of PROXIES) {
      try {
        const res = await fetch(proxyFn(FF_URL), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const text = await res.text();
        data = JSON.parse(text);
        if (data?.contents) data = JSON.parse(data.contents);
        if (Array.isArray(data)) break;
      } catch { /* essaie le proxy suivant */ }
    }
    if (!data) {
      document.getElementById('ecoList').innerHTML = `
        <div class="stat-card text-center py-10">
          <p class="text-3xl mb-3">🌐</p>
          <p class="font-medium mb-2" style="color:var(--text-primary)">Impossible de charger les annonces</p>
          <p class="text-sm mb-4" style="color:var(--text-faint)">Vérifiez votre connexion ou réessayez.</p>
          <button onclick="Economics.reload()" class="btn-primary text-sm">Réessayer</button>
        </div>`;
      return;
    }
    _cachedEvents = data;
    renderEvents(data);
  }

  function buildDaySelector(rawData) {
    const sel = document.getElementById('daySelector');
    if (!sel) return;
    const today = new Date().toISOString().slice(0, 10);
    // Dates uniques présentes dans les données
    const dates = [...new Set(rawData.map(e => (e.date||'').slice(0,10)).filter(Boolean))].sort();
    const DAY_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    sel.innerHTML = dates.map(d => {
      const label    = new Date(d + 'T12:00:00');
      const dayName  = DAY_FR[label.getDay()];
      const dayNum   = label.getDate();
      const isToday  = d === today;
      const isActive = d === _selectedDate;
      return `<button onclick="Economics.setDate('${d}')"
        class="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-semibold transition"
        style="${isActive
          ? 'background:var(--brand);color:#fff;border-color:var(--brand)'
          : 'background:var(--bg-card);color:var(--text-muted);border-color:var(--border)'}">
        <span style="font-size:0.65rem;opacity:.8">${dayName}</span>
        <span class="text-sm font-bold">${dayNum}</span>
        ${isToday ? '<span style="font-size:0.55rem;opacity:.7">auj.</span>' : ''}
      </button>`;
    }).join('');
  }

  function setDate(date) {
    _selectedDate = date;
    if (_cachedEvents) renderEvents(_cachedEvents);
  }

  function renderEvents(rawData) {
    buildDaySelector(rawData);
    let events = rawData.filter(e => {
      const d = (e.date || '').slice(0, 10);
      if (d !== _selectedDate) return false;
      if (_filterCurrency && e.country !== _filterCurrency) return false;
      if (_filterImpact   && e.impact?.toLowerCase() !== _filterImpact) return false;
      return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const list = document.getElementById('ecoList');
    if (!list) return;

    if (!events.length) {
      list.innerHTML = `<div class="stat-card text-center py-10"><p class="text-3xl mb-3">📭</p><p style="color:var(--text-faint)">Aucune annonce pour cette journée.</p></div>`;
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
      <div class="mb-5">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs font-bold px-3 py-1 rounded-full" style="background:rgba(99,102,241,0.1);color:var(--brand)">${time}</span>
          <div class="flex-1 h-px" style="background:var(--border)"></div>
        </div>
        ${evts.map(e => eventRow(e)).join('')}
      </div>`).join('');
  }

  function eventRow(e) {
    const impact = (e.impact || '').toLowerCase();
    const impMap = {
      high:   { dot:'bg-red-500',    label:'Fort',   cls:'text-red-400'    },
      medium: { dot:'bg-orange-400', label:'Moyen',  cls:'text-orange-400' },
      low:    { dot:'bg-yellow-400', label:'Faible', cls:'text-yellow-400' },
    };
    const imp    = impMap[impact] || { dot:'bg-slate-500', label:'—', cls:'text-slate-400' };
    const flag   = FLAGS[e.country] || '🏳';
    const info   = findIndicator(e.title || e.name || '');
    const eventId= `evt_${Math.random().toString(36).slice(2)}`;
    const hasInfo= !!info;

    const actual = e.actual || '';
    const actualColor = actual
      ? (parseImpact(actual, e.forecast) > 0 ? 'pnl-pos' : parseImpact(actual, e.forecast) < 0 ? 'pnl-neg' : '')
      : '';

    return `
      <div class="stat-card mb-2 hover:border-brand/50 transition" style="padding:14px 18px">
        <div class="flex items-center gap-4">
          <!-- Flag + devise -->
          <div class="shrink-0 w-10 text-center">
            <div class="text-xl">${flag}</div>
            <div class="text-xs font-semibold" style="color:var(--text-faint)">${e.country||''}</div>
          </div>

          <!-- Titre + impact -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="w-2 h-2 rounded-full ${imp.dot} shrink-0"></span>
              <p class="font-semibold text-sm truncate" style="color:var(--text-primary)">${e.title || e.name || 'Événement'}</p>
              ${hasInfo ? `<span class="text-xs px-2 py-0.5 rounded-full ml-1 cursor-pointer shrink-0" style="background:rgba(99,102,241,0.1);color:var(--brand)" onclick="Economics.toggleDetail('${eventId}')">ℹ️ En savoir plus</span>` : ''}
            </div>
            ${info?.fr ? `<p class="text-xs" style="color:var(--text-faint)">${info.fr}</p>` : `<p class="text-xs ${imp.cls}">${imp.label} impact</p>`}
          </div>

          <!-- Valeurs -->
          <div class="shrink-0 grid grid-cols-3 gap-5 text-center text-xs">
            <div><div class="form-label">Précédent</div><div style="color:var(--text-muted)">${e.previous||'—'}</div></div>
            <div><div class="form-label">Prévision</div><div style="color:var(--text-muted)">${e.forecast||'—'}</div></div>
            <div><div class="form-label">Actuel</div><div class="font-bold ${actualColor}" style="${!actualColor?'color:var(--text-muted)':''}">${actual||'—'}</div></div>
          </div>
        </div>

        <!-- Panneau de détail (caché par défaut) -->
        ${hasInfo ? `
        <div id="${eventId}" class="hidden mt-4 pt-4 border-t" style="border-color:var(--border)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="form-label mb-1">📖 Description</p>
              <p class="text-sm" style="color:var(--text-muted)">${info.desc}</p>
            </div>
            <div>
              <p class="form-label mb-1">⚡ Impact sur les marchés</p>
              <p class="text-sm" style="color:var(--text-muted)">${info.impact}</p>
            </div>
            <div>
              <p class="form-label mb-1">📊 Paires / actifs concernés</p>
              <div class="flex flex-wrap gap-1">
                ${(info.paires||[]).map(p => `<span class="text-xs px-2 py-0.5 rounded" style="background:var(--bg-input);color:var(--text-muted)">${p}</span>`).join('')}
              </div>
            </div>
            <div>
              <p class="form-label mb-1">📅 Fréquence</p>
              <p class="text-sm" style="color:var(--text-muted)">${info.freq||'—'}</p>
            </div>
          </div>
        </div>` : ''}
      </div>`;
  }

  function toggleDetail(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (_openDetail && _openDetail !== id) {
      const prev = document.getElementById(_openDetail);
      if (prev) prev.classList.add('hidden');
    }
    el.classList.toggle('hidden');
    _openDetail = el.classList.contains('hidden') ? null : id;
  }

  // ── Spreads ────────────────────────────────────────────────
  function renderSpreads() {
    const sections = [
      { key:'forex',       label:'💱 Forex — Majeurs & Croisées', unit:'pips'   },
      { key:'indices',     label:'📈 Indices Boursiers',           unit:'points' },
      { key:'commodities', label:'🛢️ Matières Premières',          unit:'points' },
      { key:'crypto',      label:'₿ Cryptomonnaies',               unit:'points' },
    ];
    return sections.map(sec => `
      <div class="stat-card overflow-x-auto">
        <h3 class="text-sm font-semibold mb-4" style="color:var(--text-primary)">${sec.label}</h3>
        <table class="data-table">
          <thead><tr><th>Instrument</th><th>ECN (${sec.unit})</th><th>Standard (${sec.unit})</th><th>Pip / Tick</th><th>Liquidité</th></tr></thead>
          <tbody>${SPREADS[sec.key].map(r => spreadRow(r, sec.unit)).join('')}</tbody>
        </table>
      </div>`).join('') + `
      <div class="stat-card border-brand/30" style="background:rgba(99,102,241,0.03)">
        <h4 class="text-sm font-semibold mb-3" style="color:var(--text-primary)">💡 Quand les spreads s'élargissent ?</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style="color:var(--text-faint)">
          <div class="flex gap-2"><span class="text-red-400 text-lg">⚠️</span><div><b style="color:var(--text-muted)">Avant les news majeures</b><br>Spreads x2 à x5 dans les 5 min avant NFP, CPI, FOMC.</div></div>
          <div class="flex gap-2"><span class="text-orange-400 text-lg">🌙</span><div><b style="color:var(--text-muted)">Hors sessions actives</b><br>La nuit et hors chevauchements, liquidité faible = spreads larges.</div></div>
          <div class="flex gap-2"><span class="text-yellow-400 text-lg">📅</span><div><b style="color:var(--text-muted)">Vendredi soir / lundi</b><br>Weekend gap — risque de spread élevé à l'ouverture.</div></div>
        </div>
      </div>`;
  }

  function spreadRow(r, unit) {
    const liq = r.ecn < 0.3 ? { l:'Très haute', c:'text-green-400' }
              : r.ecn < 1   ? { l:'Haute',      c:'text-green-300' }
              : r.ecn < 3   ? { l:'Moyenne',    c:'text-yellow-400'}
              :                { l:'Faible',     c:'text-red-400'   };
    return `<tr>
      <td class="font-semibold" style="color:var(--text-primary)">${r.pair}</td>
      <td><span class="badge" style="background:rgba(34,197,94,0.12);color:#22c55e">${r.ecn} ${unit}</span></td>
      <td><span class="badge" style="background:rgba(249,115,22,0.12);color:#f97316">${r.std} ${unit}</span></td>
      <td class="font-mono text-xs" style="color:var(--text-faint)">${r.pip}</td>
      <td class="${liq.c} font-medium">${liq.l}</td>
    </tr>`;
  }

  // ── Helpers ────────────────────────────────────────────────
  function formatLocalTime(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    return isNaN(d) ? (isoDate.slice(11,16)||'—') : d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  }

  function parseImpact(actual, forecast) {
    const a = parseFloat((actual  ||'').replace(/[^0-9.\-]/g,''));
    const f = parseFloat((forecast||'').replace(/[^0-9.\-]/g,''));
    if (isNaN(a)||isNaN(f)) return 0;
    return a > f ? 1 : a < f ? -1 : 0;
  }

  function switchTab(tab) {
    ['eco','spreads'].forEach(t => {
      document.getElementById(`tab-${t}-content`)?.classList.toggle('hidden', t !== tab);
      const btn = document.getElementById(`tab-${t}`);
      if (btn) {
        btn.style.color = t === tab ? 'var(--text-primary)' : 'var(--text-faint)';
        btn.classList.toggle('border-brand',       t === tab);
        btn.classList.toggle('border-transparent', t !== tab);
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
      document.getElementById(`imp-${k}`)?.classList.toggle('impact-active', (k==='all'?null:k)===level||(k==='all'&&!level));
    });
    if (_cachedEvents) renderEvents(_cachedEvents);
  }

  function reload() {
    _cachedEvents = null;
    _openDetail   = null;
    const icon = document.getElementById('reloadIcon');
    if (icon) { icon.classList.add('animate-spin'); setTimeout(()=>icon.classList.remove('animate-spin'),2000); }
    const list = document.getElementById('ecoList');
    if (list) list.innerHTML = `<div class="flex items-center justify-center py-16 gap-3"><div class="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full"></div><span style="color:var(--text-faint)">Chargement…</span></div>`;
    loadEvents();
  }

  return { render, switchTab, applyFilter, setImpact, setDate, reload, toggleDetail };
})();
