// Firebase Configuration
// ISTRUZIONI: Sostituisci questi valori con quelli del tuo progetto Firebase
// Vai su: https://console.firebase.google.com
// 1. Crea un nuovo progetto (o usa uno esistente)
// 2. Vai su Project Settings > General > Your apps
// 3. Aggiungi una Web App
// 4. Copia la configurazione qui sotto

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase non è ancora configurato
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};
