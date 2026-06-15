// ============================================================
// app.js — Routeur principal & initialisation
// ============================================================
const App = (() => {
  let _currentPage = 'dashboard';

  const PAGES = {
    dashboard:  { render: c => Dashboard.render(c),       label: 'Dashboard' },
    journal:    { render: c => JournalPage.render(c),     label: 'Journal' },
    strategies: { render: c => Strategies.render(c),      label: 'Stratégies' },
    calendar:   { render: c => MarketCalendar.render(c),  label: 'Sessions' },
    notebook:   { render: c => Notebook.render(c),        label: 'Bloc-notes' },
  };

  function init() {
    // Créer un journal par défaut si vide
    if (Store.journals.all().length === 0) {
      const j = { id: Store.uid(), name: 'Mon Journal', type: 'real', createdAt: new Date().toISOString() };
      Store.journals.add(j);
      Store.activeJournal.set(j.id);
    }
    if (!Store.activeJournal.get()) {
      Store.activeJournal.set(Store.journals.all()[0].id);
    }

    refreshJournalSelector();
    setupNav();
    setupJournalModal();

    // Route via hash ou défaut
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigate(PAGES[hash] ? hash : 'dashboard');

    // Actualiser les sessions toutes les minutes
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
    const typeSelect = document.getElementById('jType');
    const propSection = document.getElementById('propSection');
    typeSelect?.addEventListener('change', () => {
      propSection.classList.toggle('hidden', typeSelect.value !== 'prop');
    });

    // Journal selector change
    document.getElementById('journalSelector')?.addEventListener('change', e => {
      Store.activeJournal.set(e.target.value);
      render(_currentPage);
    });
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

    // Active nav
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

  function openModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  // Close modal on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.add('hidden');
    }
  });

  // Keyboard shortcut: Escape = close modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });

  // Public API
  return {
    init,
    render,
    navigate,
    openModal,
    closeModal,
    refreshJournalSelector,
    get currentPage() { return _currentPage; },
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
