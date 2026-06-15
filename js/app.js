// ============================================================
// app.js — Routeur principal & initialisation
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
    // Thème
    Theme.init();

    // Journal par défaut
    if (Store.journals.all().length === 0) {
      const j = { id: Store.uid(), name: 'Mon Journal', type: 'real', capital: 0, createdAt: new Date().toISOString() };
      Store.journals.add(j);
      Store.activeJournal.set(j.id);
    }
    if (!Store.activeJournal.get()) {
      Store.activeJournal.set(Store.journals.all()[0].id);
    }

    refreshJournalSelector();
    setupNav();
    setupJournalModal();
    populateAssetSelect();

    const hash = location.hash.replace('#', '') || 'dashboard';
    navigate(PAGES[hash] ? hash : 'dashboard');

    setInterval(() => { if (_currentPage === 'calendar') render('calendar'); }, 60000);
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });
  }

  function setupJournalModal() {
    document.getElementById('journalSelector')?.addEventListener('change', e => {
      Store.activeJournal.set(e.target.value);
      render(_currentPage);
    });
  }

  // Remplit le <select> des actifs dans la modal Trade
  function populateAssetSelect() {
    const sel = document.getElementById('tAsset');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Sélectionner un instrument —</option>' + Assets.buildSelectHTML();
  }

  function refreshJournalSelector() {
    const sel = document.getElementById('journalSelector');
    if (!sel) return;
    const journals = Store.journals.all();
    const active   = Store.activeJournal.get();
    sel.innerHTML = journals.map(j =>
      `<option value="${j.id}" ${j.id === active ? 'selected' : ''}>${j.name}</option>`
    ).join('');
  }

  function navigate(page) {
    if (!PAGES[page]) return;
    _currentPage = page;
    location.hash = page;
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });
    render(page);
  }

  function render(page) {
    Object.keys(PAGES).forEach(p => {
      document.getElementById(`page-${p}`)?.classList.add('hidden');
    });
    const container = document.getElementById(`page-${page}`);
    if (!container) return;
    container.classList.remove('hidden');
    PAGES[page].render(container);
  }

  function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

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

document.addEventListener('DOMContentLoaded', () => App.init());
