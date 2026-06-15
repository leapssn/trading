// ============================================================
// journals.js — Gestion des journaux
// ============================================================
const Journals = (() => {

  function create() {
    const name    = document.getElementById('jName').value.trim();
    const type    = document.getElementById('jType').value;
    const capital = parseFloat(document.getElementById('jCapital').value) || 0;
    const drawdown= parseFloat(document.getElementById('jDrawdown').value) || 0;
    const target  = parseFloat(document.getElementById('jTarget').value) || 0;

    if (!name) { alert('Veuillez entrer un nom pour le journal.'); return; }

    const journal = {
      id: Store.uid(),
      name,
      type,
      createdAt: new Date().toISOString(),
      ...(type === 'prop' ? { capital, drawdown, target } : {}),
    };

    Store.journals.add(journal);
    Store.activeJournal.set(journal.id);
    App.closeModal('journalModal');
    App.refreshJournalSelector();
    App.render(App.currentPage);
  }

  function remove(id) {
    if (!confirm('Supprimer ce journal et tous ses trades ?')) return;
    Store.journals.delete(id);
    // delete linked trades
    Store.trades.save(Store.trades.all().filter(t => t.journalId !== id));
    const remaining = Store.journals.all();
    Store.activeJournal.set(remaining.length ? remaining[0].id : null);
    App.refreshJournalSelector();
    App.render(App.currentPage);
  }

  function activeId()   { return Store.activeJournal.get(); }
  function active()     { return Store.journals.getById(activeId()); }

  return { create, remove, activeId, active };
})();
