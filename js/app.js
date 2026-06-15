// ============================================================
// app.js — Routeur principal (appelé par Auth après connexion)
// ============================================================
const App = (() => {
  let _currentPage = 'dashboard';

  const PAGES = {
    dashboard:  { render: c => Dashboard.render(c)      },
    journal:    { render: c => JournalPage.render(c)    },
    strategies: { render: c => Strategies.render(c)     },
    calendar:   { render: c => MarketCalendar.render(c) },
    economics:  { render: c => Economics.render(c)      },
    notebook:   { render: c => Notebook.render(c)       },
  };

  function init() {
    // Créer un journal par défaut si l'utilisateur n'en a aucun
    if (Store.journals.all().length === 0) {
      const j = {
        id: Store.uid(), name: 'Mon Journal',
        type: 'real', capital: 0,
        createdAt: new Date().toISOString(),
      };
      Store.journals.add(j);
      Store.activeJournal.set(j.id);
    }
    if (!Store.activeJournal.get()) {
      Store.activeJournal.set(Store.journals.all()[0].id);
    }

    refreshJournalSelector();
    setupNav();
    setupJournalSelector();
    populateAssetSelect();

    const hash = location.hash.replace('#', '');
    navigate(PAGES[hash] ? hash : 'dashboard');

    // Rafraîchir les sessions toutes les minutes
    setInterval(() => { if (_currentPage === 'calendar') render('calendar'); }, 60000);
  }

  function setupNav() {
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      newLink.addEventListener('click', e => { e.preventDefault(); navigate(newLink.dataset.page); });
    });
  }

  function setupJournalSelector() {
    const sel = document.getElementById('journalSelector');
    if (!sel) return;
    sel.onchange = e => {
      Store.activeJournal.set(e.target.value);
      render(_currentPage);
    };
  }

  function populateAssetSelect() {
    const sel = document.getElementById('tAsset');
    if (sel) sel.innerHTML = '<option value="">— Sélectionner un instrument —</option>' + Assets.buildSelectHTML();
  }

  function refreshJournalSelector() {
    const journals = Store.journals.all();
    const active   = Store.activeJournal.get();
    const opts = journals.map(j =>
      `<option value="${j.id}" ${j.id === active ? 'selected' : ''}>${j.name}</option>`
    ).join('');
    ['journalSelector', 'journalSelectorMobile'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.innerHTML = opts;
    });
  }

  function navigate(page) {
    if (!PAGES[page]) return;
    _currentPage = page;
    location.hash = page;
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });
    render(page);
  }

  function render(page) {
    Object.keys(PAGES).forEach(p => document.getElementById(`page-${p}`)?.classList.add('hidden'));
    const container = document.getElementById(`page-${page}`);
    if (!container) return;
    container.classList.remove('hidden');
    PAGES[page].render(container);
  }

  function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

  // Fermer les modals en cliquant sur le fond
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) e.target.classList.add('hidden');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
  });

  return {
    init, render, navigate, openModal, closeModal, refreshJournalSelector,
    get currentPage() { return _currentPage; },
  };
})();
