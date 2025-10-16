# McKenzie Workout Tracker

Web app PWA per tracciare esercizi McKenzie per il benessere della schiena.

## 🎯 Caratteristiche

- ✅ 8 esercizi McKenzie predefiniti (HOLD e REPS)
- ⏱️ Timer automatico per esercizi a tempo
- 🔊 Segnali acustici e Text-to-Speech in italiano
- 📱 Progressive Web App (installabile su smartphone)
- 🔥 Sistema di streak e badge
- 📊 Storico sessioni e statistiche
- 🔄 Sincronizzazione Firebase (opzionale)
- 🌙 Dark mode
- 📴 Funziona offline
- 🔒 Screen Wake Lock (schermo sempre acceso durante workout)

## 📋 Esercizi Inclusi

1. **Standing extension** - 2×10 rip - Estensioni in piedi
2. **Prone on elbows** - 3×30 sec - Prono sui gomiti
3. **Press up** - 5×10 rip - Estensioni a terra
4. **Plank elbow** - 3×30 sec - Plank su gomiti
5. **Bird-Dog** - 3×16 rip - Bird-dog alternato
6. **Knee pushup** - 3×10 rip - Push-up da ginocchia
7. **Wall squat** - 3×10 rip - Squat al muro
8. **Sit to stand** - 3×10 rip - Alzarsi-Sedersi

## 🚀 Setup Locale

1. Clona il repository
2. Apri `index.html` con un server locale (es. Live Server di VS Code)
3. L'app funzionerà in modalità offline senza Firebase

## 🔥 Configurazione Firebase (Opzionale)

Firebase permette di sincronizzare i dati tra dispositivi. Segui questi passaggi:

### Passo 1: Crea un Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su "Aggiungi progetto" o "Create a project"
3. Inserisci il nome del progetto (es. "McKenzie Workout")
4. Disabilita Google Analytics (opzionale per questo progetto)
5. Clicca su "Crea progetto"

### Passo 2: Aggiungi una Web App

1. Nella console Firebase, clicca sull'icona **Web** (`</>`)
2. Registra l'app con un nickname (es. "McKenzie Web App")
3. **NON** selezionare "Set up Firebase Hosting" (useremo GitHub Pages)
4. Clicca su "Registra app"
5. **Copia le configurazioni** che ti vengono mostrate

### Passo 3: Configura il file firebase-config.js

1. Apri il file `js/firebase-config.js`
2. Sostituisci i placeholder con i tuoi valori:

```javascript
export const firebaseConfig = {
  apiKey: "TUA_API_KEY",
  authDomain: "tuo-progetto.firebaseapp.com",
  projectId: "tuo-progetto",
  storageBucket: "tuo-progetto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Passo 4: Attiva Authentication

1. Nella console Firebase, vai su **Authentication**
2. Clicca su "Get started"
3. Nella tab "Sign-in method", clicca su "Google"
4. Abilita il provider Google
5. Seleziona un indirizzo email di supporto
6. Clicca su "Salva"

### Passo 5: Crea Database Firestore

1. Nella console Firebase, vai su **Firestore Database**
2. Clicca su "Crea database"
3. Seleziona "Avvia in modalità produzione"
4. Scegli una location (es. `europe-west3` per Europa)
5. Clicca su "Attiva"

### Passo 6: Configura Regole di Sicurezza Firestore

1. Vai alla tab "Regole"
2. Sostituisci le regole con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clicca su "Pubblica"

### Passo 7: Autorizza Domini

1. Vai su **Authentication** > **Settings** > **Authorized domains**
2. Aggiungi il dominio di GitHub Pages: `tuousername.github.io`
3. Clicca su "Aggiungi dominio"

## 📦 Deploy su GitHub Pages

### Metodo 1: Via GitHub Web Interface

1. Crea un nuovo repository su GitHub
2. Carica tutti i file del progetto
3. Vai su **Settings** > **Pages**
4. In "Source", seleziona il branch `main` (o `master`)
5. Clicca su "Save"
6. Il sito sarà disponibile su: `https://tuousername.github.io/nome-repo/`

### Metodo 2: Via Git Command Line

```bash
# Inizializza git repository
git init

# Aggiungi tutti i file
git add .

# Commit
git commit -m "Initial commit - McKenzie Workout Tracker"

# Aggiungi remote repository
git remote add origin https://github.com/tuousername/nome-repo.git

# Push su GitHub
git branch -M main
git push -u origin main

# Abilita GitHub Pages dalle impostazioni del repository
```

## 🎨 Icone PWA

Per generare le icone PWA, puoi usare questi strumenti:

1. Crea un'icona base 512x512px
2. Usa [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) per generare tutte le dimensioni
3. Posiziona le icone nella cartella `assets/icons/`

Icone necessarie:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## 🛠️ Tecnologie Utilizzate

- **HTML5** + **CSS3** (CSS Custom Properties)
- **Vanilla JavaScript** (ES6 Modules)
- **Material Design 3** theme
- **Web APIs**:
  - Web Speech API (TTS)
  - Web Audio API (beep sounds)
  - Screen Wake Lock API
  - Vibration API
  - Service Worker (PWA)
- **Firebase** (Authentication + Firestore)
- **LocalStorage** (fallback offline)

## 📱 Installazione come App

### Android (Chrome)
1. Apri il sito su Chrome
2. Tocca il menu (⋮)
3. Seleziona "Aggiungi a schermata Home"
4. Conferma

### iOS (Safari)
1. Apri il sito su Safari
2. Tocca l'icona "Condividi"
3. Seleziona "Aggiungi a Home"
4. Conferma

### Desktop (Chrome/Edge)
1. Clicca sull'icona di installazione nella barra degli indirizzi
2. Conferma l'installazione

## 🎮 Come Usare

1. **Home**: Visualizza streak, badge e statistiche
2. **Inizia Workout**: Avvia la routine di esercizi
3. **Durante il workout**:
   - Segui le istruzioni vocali
   - Conferma completamento set per esercizi REPS
   - Gli esercizi HOLD si completano automaticamente
   - Usa pausa/skip se necessario
4. **Completamento**: Visualizza statistiche e badge sbloccati

## ⚙️ Impostazioni Auto-Run

L'opzione **Auto-Run** (attiva di default) permette di:
- Avviare automaticamente gli esercizi HOLD dopo il recupero
- Per gli esercizi REPS, richiede sempre conferma manuale

Disabilitando Auto-Run:
- Ogni esercizio richiede conferma manuale per iniziare

## 🏆 Sistema Badge

- 🎯 **Prima volta** - 1 sessione completata
- 💪 **Costanza** - 3 giorni consecutivi
- ⭐ **Settimana perfetta** - 7 giorni consecutivi
- 🔥 **Due settimane** - 14 giorni consecutivi
- 🏆 **Mese d'acciaio** - 30 giorni consecutivi
- ⚔️ **Guerriero** - 50 sessioni completate
- 🎖️ **Dedicato** - 100 sessioni completate

## 📊 Dati Salvati

**LocalStorage** (sempre):
- Sessioni completate
- Statistiche e streak
- Badge sbloccati
- Impostazioni utente

**Firebase** (se configurato):
- Sincronizzazione tra dispositivi
- Backup cloud automatico
- Login con Google Account

## 🔐 Privacy

- Nessun dato viene inviato a server esterni (eccetto Firebase se configurato)
- L'autenticazione Firebase è opzionale
- LocalStorage funziona completamente offline

## 📝 Note

- Raccomandato usare cuffie/auricolari per il TTS durante gli esercizi
- Testato su Chrome/Edge (Android/Desktop), Safari (iOS)
- La Screen Wake Lock API funziona solo su Android Chrome/Edge

## 🐛 Troubleshooting

**TTS non funziona?**
- Verifica che il volume sia attivo
- Alcune browser richiedono interazione utente prima di usare TTS

**Wake Lock non funziona?**
- Funziona solo su Chrome/Edge Android
- Non disponibile su iOS Safari

**Firebase non si connette?**
- Verifica le credenziali in `firebase-config.js`
- Controlla che il dominio sia autorizzato in Firebase Console
- Controlla le regole di sicurezza Firestore

## 📄 Licenza

MIT License - Uso personale

## 👤 Autore

Creato per uso personale - Programma McKenzie per il benessere della schiena

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Gennaio 2025
