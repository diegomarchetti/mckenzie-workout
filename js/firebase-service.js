// Firebase Service - Autenticazione e Firestore
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

export class FirebaseService {
  constructor(storageService) {
    this.storage = storageService;
    this.auth = null;
    this.db = null;
    this.user = null;
    this.initialized = false;
  }

  // Inizializza Firebase
  async init() {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase non configurato. Funzionerà solo in modalità offline.');
      return false;
    }

    try {
      // Importa Firebase SDK
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } = 
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, orderBy } = 
        await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

      // Inizializza Firebase
      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);
      this.db = getFirestore(app);

      // Salva funzioni per uso successivo
      this.signInWithPopup = signInWithPopup;
      this.GoogleAuthProvider = GoogleAuthProvider;
      this.onAuthStateChanged = onAuthStateChanged;
      this.signOut = signOut;
      this.doc = doc;
      this.setDoc = setDoc;
      this.getDoc = getDoc;
      this.collection = collection;
      this.addDoc = addDoc;
      this.query = query;
      this.where = where;
      this.getDocs = getDocs;
      this.updateDoc = updateDoc;
      this.orderBy = orderBy;

      this.initialized = true;

      // Listener per cambiamenti autenticazione
      this.onAuthStateChanged(this.auth, async (user) => {
        this.user = user;
        if (user) {
          console.log('User logged in:', user.email);
          this.storage.setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          // Sincronizza dati
          await this.syncData();
        } else {
          console.log('User logged out');
          this.storage.setUserProfile(null);
        }
      });

      return true;
    } catch (error) {
      console.error('Errore inizializzazione Firebase:', error);
      return false;
    }
  }

  // Login con Google
  async loginWithGoogle() {
    if (!this.initialized) {
      throw new Error('Firebase non inizializzato');
    }

    try {
      const provider = new this.GoogleAuthProvider();
      const result = await this.signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Errore login:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    if (!this.initialized) return;

    try {
      await this.signOut(this.auth);
      this.storage.clearUserData();
    } catch (error) {
      console.error('Errore logout:', error);
      throw error;
    }
  }

  // Sincronizza dati locali con Firestore
  async syncData() {
    if (!this.user || !this.initialized) return;

    try {
      // Sincronizza statistiche
      await this.syncStats();
      
      // Sincronizza sessioni
      await this.syncSessions();
      
      // Sincronizza settings
      await this.syncSettings();

      console.log('Dati sincronizzati con successo');
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
    }
  }

  // Sincronizza statistiche
  async syncStats() {
    const statsRef = this.doc(this.db, 'users', this.user.uid, 'data', 'stats');
    
    try {
      // Ottieni stats remote
      const remoteDoc = await this.getDoc(statsRef);
      const localStats = this.storage.getStats();

      if (remoteDoc.exists()) {
        const remoteStats = remoteDoc.data();
        
        // Merge: prendi il meglio da entrambi
        const mergedStats = {
          totalSessions: Math.max(localStats.totalSessions || 0, remoteStats.totalSessions || 0),
          currentStreak: Math.max(localStats.currentStreak || 0, remoteStats.currentStreak || 0),
          longestStreak: Math.max(localStats.longestStreak || 0, remoteStats.longestStreak || 0),
          lastWorkoutDate: this.getLatestDate(localStats.lastWorkoutDate, remoteStats.lastWorkoutDate),
          totalTime: Math.max(localStats.totalTime || 0, remoteStats.totalTime || 0),
          badges: { ...(remoteStats.badges || {}), ...(localStats.badges || {}) }
        };

        // Aggiorna locale e remote
        this.storage.updateStats(mergedStats);
        await this.setDoc(statsRef, mergedStats);
      } else {
        // Prima sincronizzazione, salva locale su remote
        await this.setDoc(statsRef, localStats);
      }
    } catch (error) {
      console.error('Errore sync stats:', error);
    }
  }

  // Sincronizza sessioni
  async syncSessions() {
    const sessionsRef = this.collection(this.db, 'users', this.user.uid, 'sessions');
    
    try {
      // Ottieni sessioni remote
      const q = this.query(sessionsRef, this.orderBy('completedAt', 'desc'));
      const querySnapshot = await this.getDocs(q);
      const remoteSessions = [];
      querySnapshot.forEach((doc) => {
        remoteSessions.push({ id: doc.id, ...doc.data() });
      });

      // Ottieni sessioni locali
      const localSessions = this.storage.getSessions();

      // Merge: aggiungi sessioni locali che non sono remote
      const remoteIds = new Set(remoteSessions.map(s => s.id));
      
      for (const session of localSessions) {
        if (!remoteIds.has(session.id)) {
          // Aggiungi a Firestore
          await this.addDoc(sessionsRef, session);
        }
      }

      // Aggiorna locale con tutte le sessioni (remote + locali)
      const allSessionIds = new Set([...localSessions.map(s => s.id)]);
      const newRemoteSessions = remoteSessions.filter(s => !allSessionIds.has(s.id));
      
      if (newRemoteSessions.length > 0) {
        const mergedSessions = [...localSessions, ...newRemoteSessions];
        this.storage.set('workout_sessions', mergedSessions);
      }
    } catch (error) {
      console.error('Errore sync sessions:', error);
    }
  }

  // Sincronizza settings
  async syncSettings() {
    const settingsRef = this.doc(this.db, 'users', this.user.uid, 'data', 'settings');
    
    try {
      const remoteDoc = await this.getDoc(settingsRef);
      const localSettings = this.storage.getSettings();

      if (remoteDoc.exists()) {
        // Usa settings remote (hanno priorità)
        const remoteSettings = remoteDoc.data();
        this.storage.updateSettings(remoteSettings);
      } else {
        // Salva settings locali su remote
        await this.setDoc(settingsRef, localSettings);
      }
    } catch (error) {
      console.error('Errore sync settings:', error);
    }
  }

  // Salva sessione su Firestore
  async saveSession(sessionData) {
    if (!this.user || !this.initialized) {
      // Solo locale
      this.storage.addSession(sessionData);
      return;
    }

    try {
      const sessionsRef = this.collection(this.db, 'users', this.user.uid, 'sessions');
      await this.addDoc(sessionsRef, sessionData);
      
      // Salva anche locale
      this.storage.addSession(sessionData);
      
      // Aggiorna stats
      await this.syncStats();
    } catch (error) {
      console.error('Errore salvataggio sessione:', error);
      // Fallback: salva solo locale
      this.storage.addSession(sessionData);
    }
  }

  // Aggiorna settings su Firestore
  async updateSettings(settings) {
    if (!this.user || !this.initialized) {
      // Solo locale
      this.storage.updateSettings(settings);
      return;
    }

    try {
      const settingsRef = this.doc(this.db, 'users', this.user.uid, 'data', 'settings');
      await this.setDoc(settingsRef, settings, { merge: true });
      
      // Aggiorna anche locale
      this.storage.updateSettings(settings);
    } catch (error) {
      console.error('Errore aggiornamento settings:', error);
      // Fallback: salva solo locale
      this.storage.updateSettings(settings);
    }
  }

  // Utility: ottieni data più recente
  getLatestDate(date1, date2) {
    if (!date1) return date2;
    if (!date2) return date1;
    return new Date(date1) > new Date(date2) ? date1 : date2;
  }

  // Ottieni stato autenticazione
  isAuthenticated() {
    return this.user !== null;
  }

  getCurrentUser() {
    return this.user;
  }
}
