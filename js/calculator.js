// ============================================================
// calculator.js — Calculateur de taille de position
// ============================================================
const Calculator = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Calculateur de position</h2>
      </div>
      <div class="content-area space-y-6">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Formulaire -->
          <div class="stat-card space-y-4">
            <h3 class="text-sm font-semibold" style="color:var(--text-muted)">Paramètres</h3>
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="form-label">Capital</label>
                <input id="calcCapital" type="number" step="any" min="0" placeholder="10000" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Devise</label>
                <select id="calcCurrency" class="form-input" onchange="Calculator.calculate()">
                  <option value="$">🇺🇸 USD $</option>
                  <option value="€">🇪🇺 EUR €</option>
                  <option value="£">🇬🇧 GBP £</option>
                  <option value="CHF ">🇨🇭 CHF</option>
                  <option value="CA$">🇨🇦 CAD</option>
                  <option value="A$">🇦🇺 AUD</option>
                  <option value="¥">🇯🇵 JPY ¥</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Risque par trade (%)</label>
                <input id="calcRisk" type="number" step="0.1" min="0.1" max="100" placeholder="1" class="form-input" oninput="Calculator.calculate()" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Prix d'entrée</label>
                <input id="calcEntry" type="number" step="any" placeholder="1.08500" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Stop Loss</label>
                <input id="calcSL" type="number" step="any" placeholder="1.08000" class="form-input" oninput="Calculator.calculate()" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Take Profit (optionnel)</label>
                <input id="calcTP" type="number" step="any" placeholder="1.09500" class="form-input" oninput="Calculator.calculate()" />
              </div>
              <div>
                <label class="form-label">Valeur pip/point par lot</label>
                <input id="calcPipVal" type="number" step="any" placeholder="10" class="form-input" oninput="Calculator.calculate()" />
              </div>
            </div>
            <p class="text-xs" style="color:var(--text-faint)">
              Valeur du pip selon le broker. Exemples : EURUSD lot standard ≈ 10 $, XAUUSD ≈ 10 $, indices ≈ variable.
              Si vous ne la connaissez pas, laissez vide pour obtenir le résultat en unités.
            </p>
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
  }

  function calculate() {
    const capital  = parseFloat(document.getElementById('calcCapital')?.value);
    const riskPct  = parseFloat(document.getElementById('calcRisk')?.value);
    const entry    = parseFloat(document.getElementById('calcEntry')?.value);
    const sl       = parseFloat(document.getElementById('calcSL')?.value);
    const tp       = parseFloat(document.getElementById('calcTP')?.value);
    const pipVal   = parseFloat(document.getElementById('calcPipVal')?.value);
    const sym      = document.getElementById('calcCurrency')?.value || '$';
    const results  = document.getElementById('calcResults');
    if (!results) return;

    if (!capital || !riskPct || !entry || !sl) {
      results.innerHTML = `<h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Résultats</h3>
        <p class="text-sm" style="color:var(--text-faint)">Remplissez les champs pour calculer.</p>`;
      return;
    }

    const riskAmount = capital * riskPct / 100;
    const distance   = Math.abs(entry - sl);
    if (!distance) return;

    // Detect pips (4-decimal pairs like EURUSD) vs points
    const isPips   = distance < 0.1;
    const distPips = isPips ? +(distance * 10000).toFixed(1) : +distance.toFixed(5);
    const distLabel = isPips ? `${distPips} pips` : `${distPips} points`;

    let lotsStr = '—', gainStr = '—', rrStr = '—';

    if (pipVal > 0) {
      const lots = riskAmount / (distPips * pipVal);
      lotsStr = lots.toFixed(2) + ' lots';
      if (tp && !isNaN(tp)) {
        const gainDist = Math.abs(tp - entry);
        const gainPips = isPips ? gainDist * 10000 : gainDist;
        const gain     = lots * gainPips * pipVal;
        gainStr = gain.toFixed(2);
        rrStr   = (gainDist / distance).toFixed(2);
      }
    } else {
      lotsStr = (riskAmount / distance).toFixed(2) + ' unités';
      if (tp && !isNaN(tp)) rrStr = (Math.abs(tp - entry) / distance).toFixed(2);
    }

    const riskColor = riskPct <= 1 ? '#22c55e' : riskPct <= 2 ? '#f59e0b' : '#ef4444';
    const rrNum     = parseFloat(rrStr);
    const rrColor   = rrNum >= 2 ? '#22c55e' : rrNum >= 1 ? '#f59e0b' : '#ef4444';

    results.innerHTML = `
      <h3 class="text-sm font-semibold mb-4" style="color:var(--text-muted)">Résultats</h3>
      <div class="space-y-0">
        ${row('Montant risqué',     sym + riskAmount.toFixed(2), riskColor)}
        ${row('Distance au SL',     distLabel)}
        ${row('Taille de position', lotsStr, '#6366f1')}
        ${rrStr !== '—' ? row('Ratio R:R',         '1 : ' + rrStr, rrColor) : ''}
        ${gainStr !== '—' ? row('Gain potentiel',  sym + gainStr, '#22c55e') : ''}
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

  return { render, calculate };
})();
