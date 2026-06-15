// ============================================================
// auth.js — Authentification Firebase (email + Google)
// ============================================================
const Auth = (() => {

  // ── Affichage / masquage de l'écran d'auth ───────────────
  function showAuth()  { document.getElementById('authScreen').classList.remove('hidden'); }
  function hideAuth()  { document.getElementById('authScreen').classList.add('hidden'); }
  function showApp()   { document.getElementById('appLayout').classList.remove('hidden'); }
  function hideApp()   { document.getElementById('appLayout').classList.add('hidden'); }
  function setError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }
  function setLoading(on) {
    document.getElementById('authSubmitBtn').disabled = on;
    document.getElementById('authSubmitBtn').textContent = on ? 'Chargement…' : _submitLabel();
  }

  let _mode = 'login'; // 'login' | 'register'

  function _submitLabel() {
    return _mode === 'login' ? 'Se connecter' : "Créer le compte";
  }

  function switchMode(mode) {
    _mode = mode;
    setError('');
    document.getElementById('authTitle').textContent     = mode === 'login' ? 'Connexion' : 'Créer un compte';
    document.getElementById('authSubmitBtn').textContent = _submitLabel();
    document.getElementById('authConfirmRow').classList.toggle('hidden', mode === 'login');
    document.getElementById('authNameRow').classList.toggle('hidden', mode === 'login');
    document.getElementById('linkToRegister').classList.toggle('hidden', mode === 'register');
    document.getElementById('linkToLogin').classList.toggle('hidden', mode === 'login');
  }

  // ── Soumission du formulaire ──────────────────────────────
  async function submit() {
    setError('');
    const email    = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const confirm  = document.getElementById('authConfirm').value;
    const name     = document.getElementById('authName').value.trim();

    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }

    if (_mode === 'register') {
      if (password.length < 6)    { setError('Le mot de passe doit faire au moins 6 caractères.'); return; }
      if (password !== confirm)   { setError('Les mots de passe ne correspondent pas.'); return; }
    }

    setLoading(true);
    try {
      if (_mode === 'login') {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (name) await cred.user.updateProfile({ displayName: name });
      }
    } catch (e) {
      setError(_friendlyError(e.code));
      setLoading(false);
    }
  }

  // ── Connexion Google ──────────────────────────────────────
  async function loginGoogle() {
    setError('');
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      setError(_friendlyError(e.code));
    }
  }

  // ── Déconnexion ───────────────────────────────────────────
  async function logout() {
    if (!confirm('Se déconnecter ?')) return;
    await auth.signOut();
  }

  // ── Erreurs lisibles ──────────────────────────────────────
  function _friendlyError(code) {
    const map = {
      'auth/user-not-found':       'Aucun compte avec cet email.',
      'auth/wrong-password':       'Mot de passe incorrect.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/invalid-email':        'Email invalide.',
      'auth/weak-password':        'Mot de passe trop faible (min. 6 caractères).',
      'auth/popup-closed-by-user': 'Fenêtre Google fermée.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'auth/invalid-credential':   'Email ou mot de passe incorrect.',
    };
    return map[code] || `Erreur : ${code}`;
  }

  // ── Observateur de session ────────────────────────────────
  function listen() {
    auth.onAuthStateChanged(async user => {
      if (user) {
        // Affiche un écran de chargement
        document.getElementById('loadingScreen').classList.remove('hidden');
        hideAuth();
        hideApp();

        // Charge les données Firestore
        await Store.init(user.uid);

        document.getElementById('loadingScreen').classList.add('hidden');

        // Met à jour l'interface utilisateur
        const displayName = user.displayName || user.email.split('@')[0];
        document.getElementById('userDisplayName').textContent = displayName;
        document.getElementById('userAvatar').textContent      = displayName[0].toUpperCase();

        showApp();
        App.init();
      } else {
        Store.reset();
        hideApp();
        document.getElementById('loadingScreen').classList.add('hidden');
        showAuth();
        switchMode('login');
      }
    });
  }

  // ── Mot de passe oublié ───────────────────────────────────
  async function resetPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) { setError('Entrez votre email pour réinitialiser le mot de passe.'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      setError('');
      alert(`Email de réinitialisation envoyé à ${email}`);
    } catch (e) {
      setError(_friendlyError(e.code));
    }
  }

  return { listen, submit, loginGoogle, logout, switchMode, resetPassword };
})();
