// ============================================================
// profile.js — Gestion du profil utilisateur
// ============================================================
const Profile = (() => {

  function render(container) {
    const user     = auth.currentUser;
    if (!user) return;
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    const name     = user.displayName || '';
    const email    = user.email || '';
    const initials = (name || email)[0]?.toUpperCase() || '?';

    container.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Mon Profil</h2>
      </div>

      <div class="content-area max-w-xl space-y-5">

        <!-- Avatar + info -->
        <div class="stat-card flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white font-bold text-2xl shrink-0">${initials}</div>
          <div>
            <p class="text-lg font-bold" style="color:var(--text-primary)">${escHtml(name || 'Sans nom')}</p>
            <p class="text-sm" style="color:var(--text-faint)">${escHtml(email)}</p>
            <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full" style="background:var(--bg-hover);color:var(--text-muted)">
              ${isGoogle ? 'Compte Google' : 'Email / Mot de passe'}
            </span>
          </div>
        </div>

        <!-- Changer le nom -->
        <div class="stat-card space-y-3">
          <h3 class="text-sm font-semibold" style="color:var(--text-primary)">Nom d'affichage</h3>
          <div class="flex gap-3">
            <input id="profileName" type="text" class="form-input flex-1" value="${escHtml(name)}" placeholder="Votre nom" />
            <button onclick="Profile.updateName()" class="btn-primary px-4">Enregistrer</button>
          </div>
          <p id="profileNameMsg" class="text-xs hidden"></p>
        </div>

        <!-- Changer le mot de passe (email uniquement) -->
        ${!isGoogle ? `
        <div class="stat-card space-y-3">
          <h3 class="text-sm font-semibold" style="color:var(--text-primary)">Changer le mot de passe</h3>
          <div class="space-y-2">
            <input id="profileCurrentPwd" type="password" class="form-input w-full" placeholder="Mot de passe actuel" />
            <input id="profileNewPwd"     type="password" class="form-input w-full" placeholder="Nouveau mot de passe (min. 6 caractères)" />
            <input id="profileNewPwd2"    type="password" class="form-input w-full" placeholder="Confirmer le nouveau mot de passe" />
          </div>
          <button onclick="Profile.updatePassword()" class="btn-secondary w-full">Mettre à jour le mot de passe</button>
          <p id="profilePwdMsg" class="text-xs hidden"></p>
        </div>` : ''}

        <!-- Données -->
        <div class="stat-card space-y-2">
          <h3 class="text-sm font-semibold" style="color:var(--text-primary)">Mes données</h3>
          <p class="text-xs" style="color:var(--text-faint)">
            Toutes tes données (journals, trades, stratégies, notes) sont stockées dans le cloud Firebase associé à ce compte.
          </p>
          <div class="flex gap-3 pt-1">
            <button onclick="Auth.logout()" class="btn-secondary flex-1">Se déconnecter</button>
          </div>
        </div>

        <!-- Zone danger -->
        <div class="stat-card border border-red-500/30 space-y-3" style="background:rgba(239,68,68,0.03)">
          <h3 class="text-sm font-semibold text-red-400">Zone dangereuse</h3>
          <p class="text-xs" style="color:var(--text-faint)">
            La suppression du compte est <strong style="color:var(--text-muted)">irréversible</strong>.
            Toutes tes données (trades, journals, notes, stratégies) seront définitivement effacées.
          </p>
          ${isGoogle
            ? `<button onclick="Profile.deleteAccount()" class="w-full text-sm py-2 px-4 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition font-semibold">
                 Supprimer mon compte
               </button>`
            : `<div class="space-y-2">
                 <input id="profileDeletePwd" type="password" class="form-input w-full" placeholder="Confirme ton mot de passe pour supprimer" />
                 <button onclick="Profile.deleteAccount()" class="w-full text-sm py-2 px-4 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition font-semibold">
                   Supprimer définitivement mon compte
                 </button>
               </div>`
          }
          <p id="profileDeleteMsg" class="text-xs hidden text-red-400"></p>
        </div>

      </div>`;
  }

  // ── Changer le nom ────────────────────────────────────────
  async function updateName() {
    const user = auth.currentUser;
    const name = document.getElementById('profileName')?.value.trim();
    const msg  = document.getElementById('profileNameMsg');
    if (!name) { showMsg(msg, 'Veuillez saisir un nom.', false); return; }
    try {
      await user.updateProfile({ displayName: name });
      // Mettre à jour l'affichage dans la sidebar
      document.getElementById('userDisplayName').textContent = name;
      document.getElementById('userAvatar').textContent      = name[0].toUpperCase();
      showMsg(msg, 'Nom mis à jour.', true);
    } catch (e) {
      showMsg(msg, 'Erreur : ' + e.message, false);
    }
  }

  // ── Changer le mot de passe ───────────────────────────────
  async function updatePassword() {
    const user    = auth.currentUser;
    const current = document.getElementById('profileCurrentPwd')?.value;
    const next    = document.getElementById('profileNewPwd')?.value;
    const next2   = document.getElementById('profileNewPwd2')?.value;
    const msg     = document.getElementById('profilePwdMsg');

    if (!current || !next) { showMsg(msg, 'Remplis tous les champs.', false); return; }
    if (next.length < 6)   { showMsg(msg, 'Le nouveau mot de passe doit faire au moins 6 caractères.', false); return; }
    if (next !== next2)    { showMsg(msg, 'Les mots de passe ne correspondent pas.', false); return; }

    try {
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(next);
      document.getElementById('profileCurrentPwd').value = '';
      document.getElementById('profileNewPwd').value     = '';
      document.getElementById('profileNewPwd2').value    = '';
      showMsg(msg, 'Mot de passe mis à jour.', true);
    } catch (e) {
      const map = {
        'auth/wrong-password':           'Mot de passe actuel incorrect.',
        'auth/invalid-credential':       'Mot de passe actuel incorrect.',
        'auth/requires-recent-login':    'Session expirée — reconnecte-toi puis réessaie.',
        'auth/too-many-requests':        'Trop de tentatives. Réessaie plus tard.',
      };
      showMsg(msg, map[e.code] || ('Erreur : ' + e.message), false);
    }
  }

  // ── Supprimer le compte ───────────────────────────────────
  async function deleteAccount() {
    const user     = auth.currentUser;
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    const msg      = document.getElementById('profileDeleteMsg');

    if (!confirm('Supprimer définitivement ton compte et toutes tes données ? Cette action est irréversible.')) return;

    try {
      // Ré-authentification
      if (isGoogle) {
        const provider = new firebase.auth.GoogleAuthProvider();
        await user.reauthenticateWithPopup(provider);
      } else {
        const pwd = document.getElementById('profileDeletePwd')?.value;
        if (!pwd) { showMsg(msg, 'Saisis ton mot de passe pour confirmer.', false); return; }
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, pwd);
        await user.reauthenticateWithCredential(cred);
      }

      // Supprimer toutes les données Firestore
      await _deleteAllData(user.uid);

      // Supprimer le compte Firebase Auth
      await user.delete();
      // onAuthStateChanged va rediriger vers l'écran de connexion automatiquement

    } catch (e) {
      const map = {
        'auth/wrong-password':        'Mot de passe incorrect.',
        'auth/invalid-credential':    'Mot de passe incorrect.',
        'auth/requires-recent-login': 'Session expirée — reconnecte-toi puis réessaie.',
        'auth/popup-closed-by-user':  'Fenêtre Google fermée. Réessaie.',
      };
      showMsg(msg, map[e.code] || ('Erreur : ' + e.message), false);
    }
  }

  async function _deleteAllData(uid) {
    const userRef = db.collection('users').doc(uid);
    const cols    = ['journals', 'trades', 'strategies', 'notes'];
    await Promise.all(cols.map(async c => {
      const snap = await userRef.collection(c).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      if (snap.docs.length) await batch.commit();
    }));
    await userRef.delete().catch(() => {});
  }

  // ── Helper ────────────────────────────────────────────────
  function showMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.style.color = ok ? '#22c55e' : '#ef4444';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, updateName, updatePassword, deleteAccount };
})();
