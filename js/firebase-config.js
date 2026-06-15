// ============================================================
// firebase-config.js — Initialisation Firebase
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyCNmMGN5w7bs5jGD0IcBZcjes88p3pBKcY",
  authDomain:        "trading-cd231.firebaseapp.com",
  projectId:         "trading-cd231",
  storageBucket:     "trading-cd231.firebasestorage.app",
  messagingSenderId: "669176736334",
  appId:             "1:669176736334:web:2923f088afb3c1c7e4311f",
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();

// Persistance locale (reste connecté même après fermeture du navigateur)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
