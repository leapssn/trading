// ============================================================
// calendar.js — Sessions de marché & horaires
// ============================================================
const MarketCalendar = (() => {

  const SESSIONS = [
    {
      name: 'Tokyo',
      flag: '🇯🇵',
      color: '#f59e0b',
      openUTC: 0,   // 00:00 UTC
      closeUTC: 9,  // 09:00 UTC
      pairs: ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY'],
      desc: 'Session asiatique — volatilité modérée. Forte sur les paires JPY.',
    },
    {
      name: 'Londres',
      flag: '🇬🇧',
      color: '#6366f1',
      openUTC: 8,   // 08:00 UTC (heure standard, +1h en BST)
      closeUTC: 17, // 17:00 UTC
      pairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'USD/CHF'],
      desc: 'Session européenne — plus haute volatilité. Représente ~30% du volume forex mondial.',
    },
    {
      name: 'New York',
      flag: '🇺🇸',
      color: '#22c55e',
      openUTC: 13,  // 13:00 UTC (heure standard)
      closeUTC: 22, // 22:00 UTC
      pairs: ['EUR/USD', 'USD/CAD', 'USD/JPY', 'GBP/USD'],
      desc: 'Session américaine — forte volatilité surtout à l\'ouverture et aux news US.',
    },
    {
      name: 'Sydney',
      flag: '🇦🇺',
      color: '#06b6d4',
      openUTC: 22,  // 22:00 UTC (veille)
      closeUTC: 7,  // 07:00 UTC
      pairs: ['AUD/USD', 'NZD/USD', 'AUD/JPY'],
      desc: 'Début du cycle quotidien — faible volatilité, spreads plus larges.',
    },
  ];

  function isOpen(session, hourUTC) {
    if (session.openUTC < session.closeUTC) {
      return hourUTC >= session.openUTC && hourUTC < session.closeUTC;
    } else {
      // Overnight session (ex: Sydney 22h → 7h)
      return hourUTC >= session.openUTC || hourUTC < session.closeUTC;
    }
  }

  function toLocalTime(utcHour, utcMin = 0) {
    const d = new Date();
    d.setUTCHours(utcHour, utcMin, 0, 0);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function render(container) {
    const now     = new Date();
    const hourUTC = now.getUTCHours();
    const minUTC  = now.getUTCMinutes();

    const sessionCards = SESSIONS.map(s => {
      const open   = isOpen(s, hourUTC);
      const localOpen  = toLocalTime(s.openUTC);
      const localClose = toLocalTime(s.closeUTC);

      // Progress bar (temps restant ou temps écoulé)
      let progress = 0, timeInfo = '';
      if (s.openUTC < s.closeUTC) {
        const totalMin = (s.closeUTC - s.openUTC) * 60;
        const elapsed  = open ? (hourUTC - s.openUTC) * 60 + minUTC : 0;
        progress = open ? Math.min(100, elapsed / totalMin * 100) : 0;
        if (open) {
          const remaining = totalMin - elapsed;
          timeInfo = `Ferme dans ${Math.floor(remaining/60)}h${remaining%60 ? String(remaining%60).padStart(2,'0')+'m' : ''}`;
        } else {
          const toOpen = (s.openUTC - hourUTC) * 60 - minUTC;
          const adjusted = toOpen < 0 ? toOpen + 24*60 : toOpen;
          timeInfo = `Ouvre dans ${Math.floor(adjusted/60)}h${adjusted%60 ? String(adjusted%60).padStart(2,'0')+'m' : ''}`;
        }
      }

      return `
        <div class="session-pill ${open ? 'session-active' : ''}" style="background: rgba(${hexToRgb(s.color)}, 0.05)">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${s.flag}</span>
              <div>
                <h3 class="font-bold text-white text-lg">${s.name}</h3>
                <p class="text-xs text-slate-400">${localOpen} → ${localClose} (heure locale)</p>
              </div>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${open ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'}">
                <span class="w-2 h-2 rounded-full ${open ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}"></span>
                ${open ? 'OUVERTE' : 'Fermée'}
              </span>
            </div>
          </div>

          ${progress > 0 ? `
          <div class="mb-3">
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>${timeInfo}</span>
              <span>${Math.round(progress)}%</span>
            </div>
            <div class="h-1.5 bg-[#2e3256] rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" style="width:${progress}%; background:${s.color}"></div>
            </div>
          </div>` : `<p class="text-xs text-slate-500 mb-3">${timeInfo}</p>`}

          <p class="text-xs text-slate-400 mb-2">${s.desc}</p>
          <div class="flex flex-wrap gap-2">
            ${s.pairs.map(p => `<span class="text-xs bg-[#252840] px-2 py-1 rounded text-slate-300">${p}</span>`).join('')}
          </div>
        </div>`;
    }).join('');

    // Overlap detection
    const londonOpen = isOpen(SESSIONS[1], hourUTC);
    const nyOpen     = isOpen(SESSIONS[2], hourUTC);
    const tokyoOpen  = isOpen(SESSIONS[0], hourUTC);
    const overlapBanner = (londonOpen && nyOpen)
      ? `<div class="mb-6 p-4 rounded-xl border border-brand bg-brand/10 flex items-center gap-3">
           <span class="text-2xl">⚡</span>
           <div>
             <p class="font-semibold text-white">Chevauchement Londres / New York actif</p>
             <p class="text-sm text-slate-400">Période de plus forte volatilité — idéale pour trader EUR/USD, GBP/USD</p>
           </div>
         </div>`
      : (tokyoOpen && londonOpen)
      ? `<div class="mb-6 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/5 flex items-center gap-3">
           <span class="text-2xl">🌅</span>
           <div>
             <p class="font-semibold text-white">Chevauchement Tokyo / Londres actif</p>
             <p class="text-sm text-slate-400">Volatilité modérée sur EUR/JPY, GBP/JPY</p>
           </div>
         </div>`
      : '';

    const utcStr = now.toUTCString().slice(17, 22);

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Sessions de Marché</h2>
        <span class="text-slate-400 text-sm">Heure UTC : <b class="text-white">${utcStr}</b></span>
      </div>
      <div class="content-area">
        ${overlapBanner}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          ${sessionCards}
        </div>

        <!-- Tableau horaires -->
        <div class="stat-card overflow-x-auto">
          <h3 class="text-sm font-semibold text-slate-300 mb-4">Horaires des sessions (heure de Paris)</h3>
          <table class="data-table">
            <thead><tr><th>Session</th><th>Ouverture locale</th><th>Fermeture locale</th><th>Heure d'été (été)</th><th>Heure standard (hiver)</th></tr></thead>
            <tbody>
              <tr><td>🇦🇺 Sydney</td> <td>${toLocalTime(22)}</td><td>${toLocalTime(7)}</td> <td>23h → 08h</td><td>00h → 09h</td></tr>
              <tr><td>🇯🇵 Tokyo</td>  <td>${toLocalTime(0)}</td> <td>${toLocalTime(9)}</td> <td>01h → 10h</td><td>02h → 11h</td></tr>
              <tr><td>🇬🇧 Londres</td><td>${toLocalTime(8)}</td> <td>${toLocalTime(17)}</td><td>09h → 18h</td><td>08h → 17h</td></tr>
              <tr><td>🇺🇸 New York</td><td>${toLocalTime(13)}</td><td>${toLocalTime(22)}</td><td>14h → 23h</td><td>13h → 22h</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  return { render };
})();
