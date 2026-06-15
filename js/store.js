// ============================================================
// store.js — Couche de persistance LocalStorage
// ============================================================
const Store = (() => {
  const KEYS = {
    journals:   'tl_journals',
    trades:     'tl_trades',
    strategies: 'tl_strategies',
    notes:      'tl_notes',
    activeJournal: 'tl_activeJournal',
  };

  function get(key)       { try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return []; } }
  function set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); }
  function getObj(key)    { try { return JSON.parse(localStorage.getItem(key)) ?? {}; } catch { return {}; } }

  // Journals
  const journals = {
    all: ()           => get(KEYS.journals),
    save: (list)      => set(KEYS.journals, list),
    add: (journal)    => { const l = journals.all(); l.push(journal); journals.save(l); },
    delete: (id)      => journals.save(journals.all().filter(j => j.id !== id)),
    getById: (id)     => journals.all().find(j => j.id === id),
  };

  // Trades
  const trades = {
    all: ()           => get(KEYS.trades),
    save: (list)      => set(KEYS.trades, list),
    forJournal: (jid) => trades.all().filter(t => t.journalId === jid),
    add: (trade)      => { const l = trades.all(); l.push(trade); trades.save(l); },
    update: (trade)   => { const l = trades.all().map(t => t.id === trade.id ? trade : t); trades.save(l); },
    delete: (id)      => trades.save(trades.all().filter(t => t.id !== id)),
    getById: (id)     => trades.all().find(t => t.id === id),
  };

  // Strategies (custom)
  const strategies = {
    all: ()           => get(KEYS.strategies),
    save: (list)      => set(KEYS.strategies, list),
    add: (s)          => { const l = strategies.all(); l.push(s); strategies.save(l); },
    update: (s)       => strategies.save(strategies.all().map(x => x.id === s.id ? s : x)),
    delete: (id)      => strategies.save(strategies.all().filter(s => s.id !== id)),
  };

  // Notes (keyed by date YYYY-MM-DD)
  const notes = {
    all: ()           => getObj(KEYS.notes),
    get: (date)       => notes.all()[date] ?? '',
    set: (date, text) => { const n = notes.all(); n[date] = text; set(KEYS.notes, n); },
  };

  // Active journal
  const activeJournal = {
    get: ()   => localStorage.getItem(KEYS.activeJournal),
    set: (id) => localStorage.setItem(KEYS.activeJournal, id),
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  return { journals, trades, strategies, notes, activeJournal, uid };
})();
