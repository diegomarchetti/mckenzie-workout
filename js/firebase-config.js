// Firebase Configuration
// ISTRUZIONI: Sostituisci questi valori con quelli del tuo progetto Firebase
// Vai su: https://console.firebase.google.com
// 1. Crea un nuovo progetto (o usa uno esistente)
// 2. Vai su Project Settings > General > Your apps
// 3. Aggiungi una Web App
// 4. Copia la configurazione qui sotto

export const firebaseConfig = {
  apiKey: "AIzaSyC6Wm68RrQ_JO_PmXEUwUbcQUFm5FmpI0A",
  authDomain: "mckenzie-workout.firebaseapp.com",
  projectId: "mckenzie-workout",
  storageBucket: "mckenzie-workout.firebasestorage.app",
  messagingSenderId: "332755193291",
  appId: "1:332755193291:web:4bff0947d113283b39fa4e"
};

// Firebase non è ancora configurato
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "AIzaSyC6Wm68RrQ_JO_PmXEUwUbcQUFm5FmpI0A";
};
