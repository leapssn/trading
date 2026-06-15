// ============================================================
// journals.js — Gestion des journaux (création, suppression)
// ============================================================
const Journals = (() => {

  function create() {
    const name     = document.getElementById('jName').value.trim();
    const type     = document.getElementById('jType').value;
    const capital  = parseFloat(document.getElementById('jCapital').value)   || 0;

    if (!name) { alert('Veuillez entrer un nom pour le journal.'); return; }

    const journal = {
      id:        Store.uid(),
      name,
      type,
      capital,
      createdAt: new Date().toISOString(),
    };

    // Champs spécifiques Prop Firm
    if (type === 'prop') {
      journal.drawdown    = parseFloat(document.getElementById('jDrawdown').value)    || 0;
      journal.target      = parseFloat(document.getElementById('jTarget').value)      || 0;
      journal.dailyLoss   = parseFloat(document.getElementById('jDailyLoss').value)   || 0;
    }

    Store.journals.add(journal);
    Store.activeJournal.set(journal.id);
    App.closeModal('journalModal');
    App.refreshJournalSelector();
    App.render(App.currentPage);
  }

  function remove(id) {
    const list = Store.journals.all();
    if (list.length <= 1) { alert('Vous devez garder au moins un journal.'); return; }
    if (!confirm('Supprimer ce journal et tous ses trades ? Cette action est irréversible.')) return;
    Store.journals.delete(id);
    Store.trades.save(Store.trades.all().filter(t => t.journalId !== id));
    const remaining = Store.journals.all();
    Store.activeJournal.set(remaining[0].id);
    App.refreshJournalSelector();
    App.render(App.currentPage);
  }

  function activeId() { return Store.activeJournal.get(); }
  function active()   { return Store.journals.getById(activeId()); }

  return { create, remove, activeId, active };
})();
