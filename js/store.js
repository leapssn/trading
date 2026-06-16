// ============================================================
// store.js — Couche de données Firestore + cache mémoire
//
// Principe : toutes les lectures se font depuis le cache local
// (synchrone, rapide). Les écritures mettent à jour le cache
// ET écrivent dans Firestore en arrière-plan.
// ============================================================
const Store = (() => {

  // ── Cache local ──────────────────────────────────────────
  let _uid     = null;   // userId Firebase
  let _premium = false;
  let _cache = { journals: [], trades: [], strategies: [], notes: {} };

  // ── Helpers Firestore ─────────────────────────────────────
  function col(name) { return db.collection('users').doc(_uid).collection(name); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ── Init : charge toutes les données de l'utilisateur ────
  async function init(userId) {
    _uid = userId;
    await Promise.all([
      _load('journals'),
      _load('trades'),
      _load('strategies'),
      _loadNotes(),
      _loadProfile(),
    ]);
  }

  async function _loadProfile() {
    const doc = await db.collection('users').doc(_uid).get();
    _premium = !!(doc.exists && doc.data().premium);
  }

  async function _load(collName) {
    const snap = await col(collName).orderBy('createdAt', 'asc').get().catch(() =>
      col(collName).get()  // fallback sans orderBy si pas d'index
    );
    _cache[collName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function _loadNotes() {
    const snap = await col('notes').get();
    _cache.notes = {};
    snap.docs.forEach(d => { _cache.notes[d.id] = d.data().text || ''; });
  }

  // Réinitialise le cache (déconnexion)
  function reset() {
    _uid     = null;
    _premium = false;
    _cache = { journals: [], trades: [], strategies: [], notes: {} };
  }

  // ── Compression d'image (évite de dépasser 1 Mo Firestore) ─
  function compressImage(base64, maxW = 800) {
    return new Promise(resolve => {
      if (!base64) { resolve(null); return; }
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(base64); // pas une image → on garde
      img.src = base64;
    });
  }

  // ── JOURNALS ──────────────────────────────────────────────
  const journals = {
    all:      ()  => [..._cache.journals],
    getById:  (id)=> _cache.journals.find(j => j.id === id),

    add: async (j) => {
      j.createdAt = j.createdAt || new Date().toISOString();
      _cache.journals.push(j);
      await col('journals').doc(j.id).set(j);
    },

    update: async (j) => {
      _cache.journals = _cache.journals.map(x => x.id === j.id ? j : x);
      await col('journals').doc(j.id).set(j, { merge: true });
    },

    delete: async (id) => {
      _cache.journals = _cache.journals.filter(j => j.id !== id);
      await col('journals').doc(id).delete();
    },
  };

  // ── TRADES ────────────────────────────────────────────────
  const trades = {
    all:         ()    => [..._cache.trades],
    getById:     (id)  => _cache.trades.find(t => t.id === id),
    forJournal:  (jid) => _cache.trades.filter(t => t.journalId === jid),

    add: async (t) => {
      t.createdAt = t.createdAt || new Date().toISOString();
      t.image     = await compressImage(t.image);
      _cache.trades.push(t);
      await col('trades').doc(t.id).set(t);
    },

    update: async (t) => {
      t.image = await compressImage(t.image);
      _cache.trades = _cache.trades.map(x => x.id === t.id ? t : x);
      await col('trades').doc(t.id).set(t, { merge: true });
    },

    delete: async (id) => {
      _cache.trades = _cache.trades.filter(t => t.id !== id);
      await col('trades').doc(id).delete();
    },

    // Compatibilité : certains modules font trades.save(list)
    save: async (list) => {
      _cache.trades = list;
      // pas de sync bulk ici — utilisé seulement pour la suppression par journalId
    },
  };

  // ── STRATEGIES (fiches personnalisées) ────────────────────
  const strategies = {
    all:    ()  => [..._cache.strategies],

    add: async (s) => {
      s.createdAt = s.createdAt || new Date().toISOString();
      _cache.strategies.push(s);
      await col('strategies').doc(s.id).set(s);
    },

    update: async (s) => {
      _cache.strategies = _cache.strategies.map(x => x.id === s.id ? s : x);
      await col('strategies').doc(s.id).set(s, { merge: true });
    },

    delete: async (id) => {
      _cache.strategies = _cache.strategies.filter(s => s.id !== id);
      await col('strategies').doc(id).delete();
    },
  };

  // ── NOTES (bloc-notes) ────────────────────────────────────
  const notes = {
    all:  ()           => ({ ..._cache.notes }),
    get:  (date)       => _cache.notes[date] || '',
    set:  async (date, text) => {
      _cache.notes[date] = text;
      await col('notes').doc(date).set({ text, updatedAt: new Date().toISOString() });
    },
  };

  // ── JOURNAL ACTIF (localStorage par user) ─────────────────
  const activeJournal = {
    get:  ()   => localStorage.getItem(`tl_active_${_uid}`),
    set:  (id) => { if (id) localStorage.setItem(`tl_active_${_uid}`, id); },
  };

  // ── ABONNEMENT (placeholder en attendant Stripe) ──────────
  const subscription = {
    isPremium: () => _premium,
    setPremium: async (value) => {
      _premium = !!value;
      await db.collection('users').doc(_uid).set({ premium: _premium }, { merge: true });
    },
  };

  return { init, reset, uid, journals, trades, strategies, notes, activeJournal, subscription, compressImage };
})();
