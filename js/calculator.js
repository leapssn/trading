// ============================================================
// calculator.js — Calculateur de taille de position
// ============================================================
const Calculator = (() => {

  // pipSize  = valeur d'1 pip en unités de prix
  // pipVal   = valeur d'1 pip en USD par lot standard (approximation)
  // lot      = description d'1 lot standard
  const INSTRUMENTS = {
    'Forex': {
      'EURUSD':  { pipSize: 0.0001, pipVal: 10,   lot: '100 000 €' },
      'GBPUSD':  { pipSize: 0.0001, pipVal: 10,   lot: '100 000 £' },
      'AUDUSD':  { pipSize: 0.0001, pipVal: 10,   lot: '100 000 A$' },
      'NZDUSD':  { pipSize: 0.0001, pipVal: 10,   lot: '100 000 NZ$' },
      'USDCHF':  { pipSize: 0.0001, pipVal: 11,   lot: '100 000 $' },
      'USDCAD':  { pipSize: 0.0001, pipVal: 7.5,  lot: '100 000 $' },
      'USDJPY':  { pipSize: 0.01,   pipVal: 9.1,  lot: '100 000 $' },
      'EURGBP':  { pipSize: 0.0001, pipVal: 12.5, lot: '100 000 €' },
      'EURCHF':  { pipSize: 0.0001, pipVal: 11,   lot: '100 000 €' },
      'EURJPY':  { pipSize: 0.01,   pipVal: 6.8,  lot: '100 000 €' },
      'GBPJPY':  { pipSize: 0.01,   pipVal: 6.8,  lot: '100 000 £' },
      'CADJPY':  { pipSize: 0.01,   pipVal: 6.8,  lot: '100 000 CA$' },
      'AUDCAD':  { pipSize: 0.0001, pipVal: 7.5,  lot: '100 000 A$' },
      'GBPCHF':  { pipSize: 0.0001, pipVal: 11,   lot: '100 000 £' },
    },
    'Métaux': {
      'XAUUSD (Or)':     { pipSize: 0.01,  pipVal: 1,  lot: '100 oz' },
      'XAGUSD (Argent)': { pipSize: 0.001, pipVal: 50, lot: '5 000 oz' },
      'XPTUSD (Platine)':{ pipSize: 0.01,  pipVal: 1,  lot: '50 oz' },
    },
    'Pétrole': {
      'WTI Crude Oil': { pipSize: 0.01, pipVal: 10, lot: '1 000 barils' },
      'Brent Crude':   { pipSize: 0.01, pipVal: 10, lot: '1 000 barils' },
      'Natural Gas':   { pipSize: 0.001,pipVal: 10, lot: '10 000 MMBtu' },
    },
    'Indices': {
      'US30 / Dow Jones': { pipSize: 1,   pipVal: 1, lot: '1 contrat' },
      'NAS100 / Nasdaq':  { pipSize: 0.1, pipVal: 1, lot: '1 contrat' },
      'SPX500 / S&P 500': { pipSize: 0.1, pipVal: 1, lot: '1 contrat' },
      'GER40 / DAX':      { pipSize: 0.1, pipVal: 1, lot: '1 contrat' },
      'UK100 / FTSE':     { pipSize: 0.1, pipVal: 1, lot: '1 contrat' },
      'FRA40 / CAC40':    { pipSize: 0.1, pipVal: 1, lot: '1 contrat' },
      'JPN225 / Nikkei':  { pipSize: 1,   pipVal: 1, lot: '1 contrat' },
    },
    'Crypto': {
      'BTCUSD': { pipSize: 1,    pipVal: 1, lot: '1 BTC' },
      'ETHUSD': { pipSize: 0.01, pipVal: 1, lot: '1 ETH' },
      'XRPUSD': { pipSize: 0.0001, pipVal: 1, lot: '1 000 XRP' },
      'LTCUSD': { pipSize: 0.01, pipVal: 1, lot: '1 LTC' },
    },
    'Personnalisé': {
      '—': { pipSize: null, pipVal: null, lot: null },
    },
  };

  function render(container) {
    const categoryOpts = Object.keys(INSTRUMENTS)
      .map(c => `<option value="${c}">${c}</option>`).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Calculateur de position</h2>
      </div>
      <div class="content-area space-y-6">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Formulaire -->
          <div class="stat-card space-y-4">
            <h3 class="text-sm font-semibold" style="color:var(--text-muted)">Paramètres</h3>

            <!-- Capital + devise -->
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="form-label">Capital</label>
                <input id="calcCapital" type="number" step="any" min="0" placeholder="10000" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Devise</label>
                <select id="calcCurrency" class="form-input" onchange="Calculator.calculate()">
                  <option value="$">🇺🇸 USD</option>
                  <option value="€">🇪🇺 EUR</option>
                  <option value="£">🇬🇧 GBP</option>
                  <option value="CHF ">🇨🇭 CHF</option>
                  <option value="CA$">🇨🇦 CAD</option>
                  <option value="A$">🇦🇺 AUD</option>
                  <option value="¥">🇯🇵 JPY</option>
                </select>
              </div>
            </div>

            <!-- Risque -->
            <div>
              <label class="form-label">Risque par trade (%)</label>
              <input id="calcRisk" type="number" step="0.1" min="0.1" max="100" placeholder="1" class="form-input" oninput="Calculator.calculate()" />
            </div>

            <!-- Catégorie + instrument -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Catégorie</label>
                <select id="calcCategory" class="form-input" onchange="Calculator.onCategoryChange()">
                  ${categoryOpts}
                </select>
              </div>
              <div>
                <label class="form-label">Instrument</label>
                <select id="calcInstrument" class="form-input" onchange="Calculator.onInstrumentChange()"></select>
              </div>
            </div>

            <!-- Info lot -->
            <div id="calcLotInfo" class="hidden text-xs px-3 py-2 rounded-lg" style="background:var(--bg-input);color:var(--text-muted)"></div>

            <!-- Prix -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="form-label">Prix d'entrée</label>
                <input id="calcEntry" type="number" step="any" placeholder="1.08500" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Stop Loss</label>
                <input id="calcSL" type="number" step="any" placeholder="1.08000" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Take Profit (opt.)</label>
                <input id="calcTP" type="number" step="any" placeholder="1.09500" class="form-input" oninput="Calculator.calculate()" />
              </div>
            </div>

            <!-- Pip value (auto-rempli, modifiable) -->
            <div>
              <label class="form-label">Valeur du pip/point par lot <span id="calcPipNote" style="color:var(--text-faint);font-weight:normal"></span></label>
              <input id="calcPipVal" type="number" step="any" placeholder="10" class="form-input" oninput="Calculator.calculate()" />
            </div>
          </div>

          <!-- Résultats -->
          <div class="stat-card" id="calcResults">
            <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Résultats</h3>
            <p class="text-sm" style="color:var(--text-faint)">Remplissez les champs pour calculer.</p>
          </div>

        </div>

        <!-- Tableau R:R -->
        <div class="stat-card">
          <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Win rate minimal selon le R:R</h3>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ratio R:R</th>
                  ${[0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(r => `<th>1 : ${r}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-semibold text-sm" style="color:var(--text-muted)">Win rate min.</td>
                  ${[0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(rr => {
                    const wr = 1 / (1 + rr) * 100;
                    const c  = wr <= 34 ? '#22c55e' : wr <= 50 ? '#f59e0b' : '#ef4444';
                    return `<td class="text-center font-bold text-sm" style="color:${c}">${wr.toFixed(1)}%</td>`;
                  }).join('')}
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs mt-2" style="color:var(--text-faint)">
            Avec un R:R de 1:2, il suffit de gagner 33% des trades pour être rentable.
          </p>
        </div>

      </div>`;

    // Init instrument dropdown
    onCategoryChange();
  }

  function onCategoryChange() {
    const cat    = document.getElementById('calcCategory')?.value;
    const items  = INSTRUMENTS[cat] || {};
    const sel    = document.getElementById('calcInstrument');
    if (!sel) return;
    sel.innerHTML = Object.keys(items).map(k => `<option value="${k}">${k}</option>`).join('');
    onInstrumentChange();
  }

  function onInstrumentChange() {
    const cat    = document.getElementById('calcCategory')?.value;
    const name   = document.getElementById('calcInstrument')?.value;
    const inst   = INSTRUMENTS[cat]?.[name];
    const pipEl  = document.getElementById('calcPipVal');
    const noteEl = document.getElementById('calcPipNote');
    const infoEl = document.getElementById('calcLotInfo');

    if (inst?.pipVal != null && pipEl) {
      pipEl.value = inst.pipVal;
      if (noteEl) noteEl.textContent = `(valeur indicative — vérifier avec votre broker)`;
    } else {
      if (pipEl) pipEl.value = '';
      if (noteEl) noteEl.textContent = '';
    }

    if (infoEl) {
      if (inst?.lot) {
        infoEl.textContent = `1 lot standard = ${inst.lot}  ·  1 pip = ${inst.pipSize} pts de prix`;
        infoEl.classList.remove('hidden');
      } else {
        infoEl.classList.add('hidden');
      }
    }

    calculate();
  }

  function calculate() {
    const capital = parseFloat(document.getElementById('calcCapital')?.value);
    const riskPct = parseFloat(document.getElementById('calcRisk')?.value);
    const entry   = parseFloat(document.getElementById('calcEntry')?.value);
    const sl      = parseFloat(document.getElementById('calcSL')?.value);
    const tp      = parseFloat(document.getElementById('calcTP')?.value);
    const pipVal  = parseFloat(document.getElementById('calcPipVal')?.value);
    const sym     = document.getElementById('calcCurrency')?.value || '$';
    const cat     = document.getElementById('calcCategory')?.value;
    const name    = document.getElementById('calcInstrument')?.value;
    const inst    = INSTRUMENTS[cat]?.[name];
    const results = document.getElementById('calcResults');
    if (!results) return;

    if (!capital || !riskPct || !entry || !sl) {
      results.innerHTML = `<h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Résultats</h3>
        <p class="text-sm" style="color:var(--text-faint)">Remplissez les champs pour calculer.</p>`;
      return;
    }

    const riskAmount = capital * riskPct / 100;
    const distance   = Math.abs(entry - sl);
    if (!distance) return;

    // Pip count: use instrument pipSize if known, else auto-detect
    const pipSize   = inst?.pipSize || (distance < 0.1 ? 0.0001 : distance < 2 ? 0.001 : 1);
    const distPips  = +(distance / pipSize).toFixed(1);
    const distLabel = `${distPips} pips / points (${distance} en prix)`;

    let lotsStr = '—', lotDetail = '', gainStr = '—', rrStr = '—';

    if (pipVal > 0) {
      const lots = riskAmount / (distPips * pipVal);
      lotsStr   = lots.toFixed(2) + ' lots';
      if (inst?.lot) lotDetail = `= ${inst.lot} × ${lots.toFixed(2)}`;

      if (tp && !isNaN(tp)) {
        const gainDist = Math.abs(tp - entry);
        const gainPips = gainDist / pipSize;
        const gain     = lots * gainPips * pipVal;
        gainStr = gain.toFixed(2);
        rrStr   = (gainDist / distance).toFixed(2);
      }
    } else {
      // Without pip value: express in units
      const units = riskAmount / distance;
      lotsStr = units.toFixed(2) + ' unités';
      if (tp && !isNaN(tp)) rrStr = (Math.abs(tp - entry) / distance).toFixed(2);
    }

    const riskColor = riskPct <= 1 ? '#22c55e' : riskPct <= 2 ? '#f59e0b' : '#ef4444';
    const rrNum     = parseFloat(rrStr);
    const rrColor   = rrNum >= 2 ? '#22c55e' : rrNum >= 1 ? '#f59e0b' : '#ef4444';

    results.innerHTML = `
      <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Résultats${name && name !== '—' ? ` — ${name}` : ''}</h3>
      <div class="space-y-0">
        ${row('Montant risqué',     sym + riskAmount.toFixed(2), riskColor)}
        ${row('Distance au SL',     distLabel)}
        ${row('Taille de position', lotsStr, '#6366f1')}
        ${lotDetail ? `<div class="text-xs pb-2 pt-0.5 border-b" style="color:var(--text-faint);border-color:var(--border)">${lotDetail}</div>` : ''}
        ${rrStr !== '—' ? row('Ratio R:R',        '1 : ' + rrStr, rrColor) : ''}
        ${gainStr !== '—' ? row('Gain potentiel', sym + gainStr, '#22c55e') : ''}
      </div>
      <div class="mt-4 p-3 rounded-lg text-xs" style="background:var(--bg-input);color:var(--text-faint)">
        Risque : <span style="color:${riskColor};font-weight:600">${riskPct}% du capital</span>
        ${riskPct > 2 ? ' — ⚠️ Risque élevé' : riskPct > 1 ? ' — Risque modéré' : ' — Risque prudent'}
      </div>`;
  }

  function row(label, value, color) {
    return `<div class="flex items-center justify-between py-2.5 border-b" style="border-color:var(--border)">
      <span class="text-sm" style="color:var(--text-muted)">${label}</span>
      <span class="font-bold text-sm" style="color:${color || 'var(--text-primary)'}">${value}</span>
    </div>`;
  }

  return { render, calculate, onCategoryChange, onInstrumentChange };
})();
