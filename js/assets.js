// ============================================================
// assets.js — Catalogue complet des instruments tradables
// Chaque asset définit : label, category, contractSize, pipSize,
// quoteInUSD (true = P&L directement en $), multiplier (pour les indices/commodités)
// ============================================================
const Assets = (() => {

  // Contrat standard = 1 lot
  const CATALOG = [
    // ── FOREX Majeurs ──────────────────────────────────────
    { symbol:'EUR/USD', label:'EUR/USD — Euro / Dollar US',            cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:true  },
    { symbol:'GBP/USD', label:'GBP/USD — Livre Sterling / Dollar US',  cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:true  },
    { symbol:'AUD/USD', label:'AUD/USD — Dollar Australien / Dollar',  cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:true  },
    { symbol:'NZD/USD', label:'NZD/USD — Dollar NZ / Dollar US',       cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:true  },
    { symbol:'USD/JPY', label:'USD/JPY — Dollar US / Yen Japonais',    cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'USD/CHF', label:'USD/CHF — Dollar US / Franc Suisse',    cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CHF' },
    { symbol:'USD/CAD', label:'USD/CAD — Dollar US / Dollar Canadien', cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CAD' },
    // ── FOREX Croisées EUR ────────────────────────────────
    { symbol:'EUR/GBP', label:'EUR/GBP — Euro / Livre Sterling',       cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'GBP' },
    { symbol:'EUR/JPY', label:'EUR/JPY — Euro / Yen Japonais',         cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'EUR/CHF', label:'EUR/CHF — Euro / Franc Suisse',         cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CHF' },
    { symbol:'EUR/CAD', label:'EUR/CAD — Euro / Dollar Canadien',      cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CAD' },
    { symbol:'EUR/AUD', label:'EUR/AUD — Euro / Dollar Australien',    cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'AUD' },
    { symbol:'EUR/NZD', label:'EUR/NZD — Euro / Dollar NZ',            cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'NZD' },
    // ── FOREX Croisées GBP ────────────────────────────────
    { symbol:'GBP/JPY', label:'GBP/JPY — Livre Sterling / Yen',        cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'GBP/CHF', label:'GBP/CHF — Livre Sterling / Franc CH',   cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CHF' },
    { symbol:'GBP/CAD', label:'GBP/CAD — Livre Sterling / CAD',        cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CAD' },
    { symbol:'GBP/AUD', label:'GBP/AUD — Livre Sterling / AUD',        cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'AUD' },
    // ── FOREX Croisées AUD/NZD ───────────────────────────
    { symbol:'AUD/JPY', label:'AUD/JPY — Dollar AUS / Yen',            cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'AUD/CAD', label:'AUD/CAD — Dollar AUS / Dollar CAD',     cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CAD' },
    { symbol:'AUD/CHF', label:'AUD/CHF — Dollar AUS / Franc CH',       cat:'forex',     contractSize:100000, pipSize:0.0001, quoteUSD:false, quoteSymbol:'CHF' },
    { symbol:'NZD/JPY', label:'NZD/JPY — Dollar NZ / Yen',             cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'CAD/JPY', label:'CAD/JPY — Dollar CAD / Yen',            cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'CHF/JPY', label:'CHF/JPY — Franc CH / Yen',              cat:'forex',     contractSize:100000, pipSize:0.01,   quoteUSD:false, quoteSymbol:'JPY' },
    // ── Matières Premières ────────────────────────────────
    { symbol:'XAUUSD',  label:'XAUUSD — Or (Gold)',                    cat:'commodity', contractSize:100,    pipSize:0.01,   quoteUSD:true  },
    { symbol:'XAGUSD',  label:'XAGUSD — Argent (Silver)',              cat:'commodity', contractSize:5000,   pipSize:0.001,  quoteUSD:true  },
    { symbol:'USOIL',   label:'USOIL — Pétrole WTI',                   cat:'commodity', contractSize:1000,   pipSize:0.01,   quoteUSD:true  },
    { symbol:'UKOIL',   label:'UKOIL — Pétrole Brent',                 cat:'commodity', contractSize:1000,   pipSize:0.01,   quoteUSD:true  },
    { symbol:'NATGAS',  label:'NATGAS — Gaz Naturel',                  cat:'commodity', contractSize:10000,  pipSize:0.001,  quoteUSD:true  },
    { symbol:'COPPER',  label:'COPPER — Cuivre',                       cat:'commodity', contractSize:25000,  pipSize:0.0001, quoteUSD:true  },
    { symbol:'WHEAT',   label:'WHEAT — Blé',                           cat:'commodity', contractSize:5000,   pipSize:0.01,   quoteUSD:true  },
    // ── Indices ───────────────────────────────────────────
    { symbol:'US500',   label:'US500 — S&P 500',                       cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:true  },
    { symbol:'NAS100',  label:'NAS100 — Nasdaq 100',                   cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:true  },
    { symbol:'US30',    label:'US30 — Dow Jones',                      cat:'index',     contractSize:1,      pipSize:1,      quoteUSD:true  },
    { symbol:'GER40',   label:'GER40 — DAX 40',                        cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:false, quoteSymbol:'EUR' },
    { symbol:'UK100',   label:'UK100 — FTSE 100',                      cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:false, quoteSymbol:'GBP' },
    { symbol:'FRA40',   label:'FRA40 — CAC 40',                        cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:false, quoteSymbol:'EUR' },
    { symbol:'JPN225',  label:'JPN225 — Nikkei 225',                   cat:'index',     contractSize:1,      pipSize:1,      quoteUSD:false, quoteSymbol:'JPY' },
    { symbol:'AUS200',  label:'AUS200 — ASX 200',                      cat:'index',     contractSize:1,      pipSize:0.1,    quoteUSD:false, quoteSymbol:'AUD' },
    { symbol:'HK50',    label:'HK50 — Hang Seng',                      cat:'index',     contractSize:1,      pipSize:1,      quoteUSD:false, quoteSymbol:'HKD' },
    { symbol:'VIX',     label:'VIX — Indice de Volatilité',            cat:'index',     contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    // ── Crypto ────────────────────────────────────────────
    { symbol:'BTC/USD', label:'BTC/USD — Bitcoin',                     cat:'crypto',    contractSize:1,      pipSize:1,      quoteUSD:true  },
    { symbol:'ETH/USD', label:'ETH/USD — Ethereum',                    cat:'crypto',    contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    { symbol:'SOL/USD', label:'SOL/USD — Solana',                      cat:'crypto',    contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    { symbol:'BNB/USD', label:'BNB/USD — Binance Coin',                cat:'crypto',    contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    { symbol:'XRP/USD', label:'XRP/USD — Ripple',                      cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'ADA/USD', label:'ADA/USD — Cardano',                     cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'DOGE/USD',label:'DOGE/USD — Dogecoin',                   cat:'crypto',    contractSize:1,      pipSize:0.00001,quoteUSD:true  },
    { symbol:'DOT/USD', label:'DOT/USD — Polkadot',                    cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'AVAX/USD',label:'AVAX/USD — Avalanche',                  cat:'crypto',    contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    { symbol:'LINK/USD',label:'LINK/USD — Chainlink',                  cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'LTC/USD', label:'LTC/USD — Litecoin',                    cat:'crypto',    contractSize:1,      pipSize:0.01,   quoteUSD:true  },
    { symbol:'MATIC/USD',label:'MATIC/USD — Polygon',                  cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'UNI/USD', label:'UNI/USD — Uniswap',                     cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'ATOM/USD',label:'ATOM/USD — Cosmos',                     cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'SUI/USD', label:'SUI/USD — Sui',                         cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'ARB/USD', label:'ARB/USD — Arbitrum',                    cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'OP/USD',  label:'OP/USD — Optimism',                     cat:'crypto',    contractSize:1,      pipSize:0.0001, quoteUSD:true  },
    { symbol:'NEAR/USD',label:'NEAR/USD — Near Protocol',              cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'INJ/USD', label:'INJ/USD — Injective',                   cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
    { symbol:'TIA/USD', label:'TIA/USD — Celestia',                    cat:'crypto',    contractSize:1,      pipSize:0.001,  quoteUSD:true  },
  ];

  const CAT_LABELS = {
    forex:     '💱 Forex',
    commodity: '🛢️ Matières Premières',
    index:     '📈 Indices',
    crypto:    '₿ Cryptos',
  };

  function getAll()    { return CATALOG; }
  function getBySymbol(sym) { return CATALOG.find(a => a.symbol === sym); }

  /**
   * Calcule le P&L pour un trade.
   * @returns { pnlUSD: number, pnlPct: number, pips: number }
   */
  function calcPnL(symbol, side, entry, exit, size) {
    const asset = getBySymbol(symbol);
    if (!entry || !exit || !size) return { pnlUSD: 0, pnlPct: 0, pips: 0 };

    const direction = side === 'buy' ? 1 : -1;
    const delta     = (exit - entry) * direction;
    const pnlPct    = (delta / entry) * 100;

    let pnlUSD;
    if (asset) {
      if (asset.cat === 'forex') {
        // P&L en devise cotée = delta × contractSize × lots
        const rawPnL = delta * asset.contractSize * size;
        if (asset.quoteUSD) {
          pnlUSD = rawPnL;
        } else {
          // Pour les paires comme USD/JPY, GBP/JPY, etc. :
          // P&L est en JPY → convertir via le prix de sortie ou un taux approximatif
          // Approche simple : P&L ≈ rawPnL / exit (donne une valeur approchée en devise base)
          // On l'affiche en devise cotée avec une note
          pnlUSD = rawPnL; // affiché dans la devise cotée
        }
      } else {
        // Crypto, indices, commodités : P&L = delta × contractSize × taille
        pnlUSD = delta * asset.contractSize * size;
      }
    } else {
      // Actif personnalisé : P&L = delta × taille
      pnlUSD = delta * size;
    }

    const pips = asset ? Math.round(delta / asset.pipSize) : 0;

    return { pnlUSD, pnlPct, pips, quoteSymbol: asset?.quoteSymbol || 'USD' };
  }

  /** Construit le HTML du <select> groupé */
  function buildSelectHTML(selectedSymbol = '') {
    const byCategory = {};
    CATALOG.forEach(a => {
      if (!byCategory[a.cat]) byCategory[a.cat] = [];
      byCategory[a.cat].push(a);
    });

    return Object.entries(byCategory).map(([cat, assets]) =>
      `<optgroup label="${CAT_LABELS[cat] || cat}">
        ${assets.map(a =>
          `<option value="${a.symbol}" ${a.symbol === selectedSymbol ? 'selected' : ''}>${a.symbol} — ${a.label.split('—')[1]?.trim() || ''}</option>`
        ).join('')}
      </optgroup>`
    ).join('');
  }

  return { getAll, getBySymbol, calcPnL, buildSelectHTML, CAT_LABELS };
})();
