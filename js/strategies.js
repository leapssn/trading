// ============================================================
// strategies.js — Page Stratégies
// ============================================================
const Strategies = (() => {

  // Stratégies intégrées
  const BUILT_IN = [
    {
      id: 'sr', name: 'Support / Résistance', icon: '📏',
      content: `## Support / Résistance

Les **niveaux de support et résistance** sont les piliers de l'analyse technique.

### Définition
- **Support** : Zone de prix où la demande est suffisamment forte pour stopper une baisse. Le prix "rebondit" vers le haut.
- **Résistance** : Zone de prix où l'offre dépasse la demande. Le prix est repoussé vers le bas.

### Comment les identifier
- Zones de consolidation passées (price action horizontale)
- Anciens hauts / bas significatifs
- Niveaux psychologiques ronds (ex: 1.1000, 30 000$)
- Points pivots calculés sur les données H/L/C

### Setup type
1. Identifier une zone S/R claire sur HTF (H4/Daily)
2. Attendre que le prix revienne tester la zone
3. Chercher une confirmation sur LTF (M15/H1) : pin bar, engulfing, inside bar
4. Entrer avec un stop derrière la zone, TP au niveau S/R suivant

### Règles de gestion
- R:R minimum **1:2**
- Invalider le trade si le prix clôture **au-delà** de la zone (pas juste un wick)
- Les zones qui ont été testées plusieurs fois sont plus fortes`,
    },
    {
      id: 'smc', name: 'Smart Money Concepts (SMC)', icon: '🏦',
      content: `## Smart Money Concepts (SMC)

Approche basée sur le comportement des **institutionnels** (banques, fonds).

### Concepts clés

#### Order Blocks (OB)
Dernière bougie opposée avant un mouvement impulsif. Zone où les institutionnels ont placé leurs ordres.
- **Bullish OB** : Dernière bougie bearish avant une forte montée
- **Bearish OB** : Dernière bougie bullish avant une forte chute

#### Fair Value Gaps (FVG / Imbalance)
Déséquilibre de prix — zone non "remplie" après un mouvement rapide. Le prix a tendance à revenir la combler.

#### Break of Structure (BOS) & Change of Character (ChoCH)
- **BOS** : Continuation de la tendance (nouveau HH ou LL)
- **ChoCH** : Signal de retournement possible

#### Liquidity Zones
- Equal Highs / Lows : zones de stops accumulés → le prix les chasse avant de partir
- BSL (Buy Side Liquidity) au-dessus des highs
- SSL (Sell Side Liquidity) en-dessous des lows

### Processus de trade
1. Analyser la structure (HTF : D1/H4) — tendance ?
2. Identifier la prochaine zone de liquidité
3. Repérer un OB ou FVG en direction de la tendance HTF
4. Sur LTF (M5/M15) : attendre un ChoCH pour confirmer
5. Entrer en retest de l'OB avec stop sous le bas de l'OB`,
    },
    {
      id: 'breakout', name: 'Breakout / Cassure', icon: '🚀',
      content: `## Stratégie Breakout

Trader la **cassure de niveaux clés** avec confirmation.

### Types de breakout
- Cassure de range horizontal
- Cassure de ligne de tendance
- Cassure de pattern chartiste (triangle, wedge, flag)

### Breakout valide vs faux breakout
| Critère | Valide | Faux |
|---------|--------|------|
| Volume | Élevé | Faible |
| Clôture | Au-delà du niveau | Wick seulement |
| Retest | Niveau devient S↔R | Retour dans le range |

### Setup classique
1. Identifier une consolidation / compression
2. Tracer les bornes hautes et basses
3. Attendre la cassure **avec clôture** au-delà
4. Option A : entrée immédiate après la bougie de cassure
5. Option B : attendre le **retest** du niveau cassé (plus sécurisé)
6. Stop en-dessous/au-dessus de la zone de breakout
7. TP : hauteur du pattern reportée depuis le breakout

### Pièges à éviter
- Ne jamais entrer sur un simple wick sans clôture
- Vérifier le contexte macro (news ?) avant d'entrer
- Éviter les breakouts en fin de session (faible liquidité)`,
    },
    {
      id: 'trend', name: 'Trading dans la Tendance', icon: '📈',
      content: `## Trading dans la Tendance

*"The trend is your friend"* — trader dans le sens du mouvement dominant.

### Identification de la tendance
- **Haussière** : série de Higher Highs (HH) + Higher Lows (HL)
- **Baissière** : série de Lower Lows (LL) + Lower Highs (LH)
- **Outils** : EMA 20/50/200, structure de marché

### Setup Pull-back
Le classique : entrer sur un retour vers la moyenne mobile ou le dernier HL/LH.

1. Confirmer la tendance sur HTF
2. Attendre un pull-back vers EMA 21 ou zone de valeur
3. Chercher signal de continuation (bougie d'inversion, RSI survendu en tendance haussière)
4. Entrer dans la direction de la tendance
5. Stop sous le dernier HL (haussier) ou au-dessus du dernier LH (baissier)

### Multi-timeframe
- D1 : direction macro
- H4 : zone d'entrée
- H1/M15 : timing de l'entrée`,
    },
    {
      id: 'rr', name: 'Gestion du Risque & R:R', icon: '⚖️',
      content: `## Gestion du Risque

La règle n°1 : **survivre** pour trader demain.

### Calcul de la taille de position
\`\`\`
Risque $ = Capital × % risqué par trade
Lots = Risque $ / (Stop Loss en pips × Valeur du pip)
\`\`\`

Exemple : Capital 10 000$ — risque 1% — SL 20 pips sur EUR/USD (pip value ≈ 10$ pour 0.1 lot)
→ Risque = 100$ → Lots = 100 / (20 × 10) = 0.5 lots

### Règles fondamentales
- **Ne jamais risquer plus de 1-2%** par trade
- **R:R minimum 1:2** (pour gagner à 40% WR)
- Ne pas augmenter les lots après une série perdante
- Journal obligatoire pour identifier les patterns

### Tableau de survie (WR minimum selon R:R)
| R:R | WR min pour break-even |
|-----|------------------------|
| 1:1 | 50% |
| 1:2 | 33% |
| 1:3 | 25% |
| 1:5 | 17% |`,
    },
  ];

  function render(container) {
    const custom = Store.strategies.all();
    const builtInCards = BUILT_IN.map(s => stratCard(s, false)).join('');
    const customCards  = custom.map(s => stratCard(s, true)).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Stratégies de Trading</h2>
        <button onclick="Strategies.openNew()" class="btn-primary flex items-center gap-2"><span class="text-lg">+</span> Ma fiche</button>
      </div>
      <div class="content-area">
        ${custom.length > 0 ? `
          <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Mes fiches personnelles</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">${customCards}</div>` : ''}

        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Stratégies de référence</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${builtInCards}</div>

        <!-- Detail panel -->
        <div id="stratDetail" class="hidden mt-6 stat-card">
          <div class="flex justify-between items-start mb-4">
            <h3 id="stratDetailTitle" class="text-lg font-bold text-white"></h3>
            <button onclick="document.getElementById('stratDetail').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
          </div>
          <div id="stratDetailContent" class="prose-dark"></div>
        </div>
      </div>`;
  }

  function stratCard(s, isCustom) {
    const actions = isCustom
      ? `<div class="flex gap-2 mt-3">
           <button onclick="Strategies.openEdit('${s.id}')" class="text-xs text-slate-400 hover:text-white">✏️ Modifier</button>
           <button onclick="Strategies.deleteCustom('${s.id}')" class="text-xs text-slate-400 hover:text-red-400">🗑️ Supprimer</button>
         </div>`
      : '';

    return `
      <div class="strat-card" onclick="Strategies.show('${s.id}', ${isCustom})">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">${s.icon || '📄'}</span>
          <h4 class="font-semibold text-white">${s.name}</h4>
        </div>
        <p class="text-xs text-slate-400 line-clamp-2">${s.content.replace(/[#*`]/g,'').slice(0, 100)}...</p>
        ${actions}
      </div>`;
  }

  function show(id, isCustom) {
    const s = isCustom
      ? Store.strategies.all().find(x => x.id === id)
      : BUILT_IN.find(x => x.id === id);
    if (!s) return;
    document.getElementById('stratDetailTitle').textContent = `${s.icon || ''} ${s.name}`;
    document.getElementById('stratDetailContent').innerHTML = marked.parse(s.content);
    const panel = document.getElementById('stratDetail');
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openNew() {
    document.getElementById('stratId').value = '';
    document.getElementById('stratName').value = '';
    document.getElementById('stratContent').value = '';
    App.openModal('strategyModal');
  }

  function openEdit(id) {
    const s = Store.strategies.all().find(x => x.id === id);
    if (!s) return;
    document.getElementById('stratId').value = s.id;
    document.getElementById('stratName').value = s.name;
    document.getElementById('stratContent').value = s.content;
    App.openModal('strategyModal');
  }

  function saveCustom() {
    const id      = document.getElementById('stratId').value;
    const name    = document.getElementById('stratName').value.trim();
    const content = document.getElementById('stratContent').value.trim();
    if (!name) { alert('Nom requis.'); return; }

    const s = { id: id || Store.uid(), name, content, icon: '📄', createdAt: new Date().toISOString() };
    if (id) Store.strategies.update(s);
    else    Store.strategies.add(s);

    App.closeModal('strategyModal');
    App.render('strategies');
  }

  function deleteCustom(id) {
    if (!confirm('Supprimer cette fiche ?')) return;
    Store.strategies.delete(id);
    App.render('strategies');
  }

  return { render, show, openNew, openEdit, saveCustom, deleteCustom };
})();
