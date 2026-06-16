// ============================================================
// paywall.js — Écran d'abonnement pour les pages premium
// ============================================================
const Paywall = (() => {
  const GATED_PAGES = {
    dashboard: 'Dashboard',
    analytics: 'Analytiques',
    journal:   'Journal',
  };

  function isGated(page) {
    return !!GATED_PAGES[page];
  }

  function render(container, page) {
    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">${GATED_PAGES[page] || ''}</h2>
      </div>
      <div class="content-area flex items-center justify-center" style="min-height:60vh">
        <div class="stat-card max-w-md w-full text-center p-8">
          <div class="mb-3 flex justify-center" style="color:var(--brand)"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
          <h3 class="text-lg font-bold mb-2" style="color:var(--text-primary)">Fonctionnalité Premium</h3>
          <p class="text-sm mb-6" style="color:var(--text-faint)">
            Le ${GATED_PAGES[page] || 'contenu'} fait partie de l'abonnement TradingLog Premium.
            Débloque le Dashboard, les Analytiques avancées et ton Journal de trading complet.
          </p>
          <button onclick="Paywall.subscribe()" class="btn-primary w-full mb-3">S'abonner</button>
          <p class="text-xs" style="color:var(--text-faint)">Les Marchés, l'Économie et le Calculateur restent gratuits.</p>
        </div>
      </div>`;
  }

  async function subscribe() {
    // TODO: remplacer par le checkout Stripe une fois la facturation en place.
    await Store.subscription.setPremium(true);
    App.refreshNavLocks();
    App.render(App.currentPage);
  }

  return { isGated, render, subscribe, GATED_PAGES };
})();
