// Storage Service - localStorage wrapper con fallback
export class StorageService {
  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
  }

  checkStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Salva dati
  set(key, value) {
    if (!this.storageAvailable) return false;
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  // Recupera dati
  get(key, defaultValue = null) {
    if (!this.storageAvailable) return defaultValue;
    
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) return defaultValue;
      return JSON.parse(serialized);
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  }

  // Rimuovi dato
  remove(key) {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  }

  // Pulisci tutto
  clear() {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }

  // Sessioni workout
  getSessions() {
    return this.get('workout_sessions', []);
  }

  addSession(session) {
    const sessions = this.getSessions();
    sessions.push({
      id: Date.now().toString(),
      ...session,
      completedAt: session.completedAt || new Date().toISOString()
    });
    this.set('workout_sessions', sessions);
    return sessions;
  }

  // Statistiche
  getStats() {
    return this.get('workout_stats', {
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
      totalTime: 0,
      badges: {}
    });
  }

  updateStats(stats) {
    this.set('workout_stats', stats);
  }

  // Settings
  getSettings() {
    return this.get('workout_settings', {
      autoRun: true,
      volume: 0.7,
      ttsEnabled: true,
      vibrationEnabled: true,
      theme: 'light',
      ttsRate: 1.0
    });
  }

  updateSettings(settings) {
    const current = this.getSettings();
    this.set('workout_settings', { ...current, ...settings });
  }

  // User profile (per Firebase sync)
  getUserProfile() {
    return this.get('user_profile', null);
  }

  setUserProfile(profile) {
    this.set('user_profile', profile);
  }

  clearUserData() {
    this.remove('user_profile');
    this.remove('workout_sessions');
    this.remove('workout_stats');
  }

  // Exercises management
  getExercises() {
    return this.get('custom_exercises', null);
  }

  saveExercises(exercises) {
    this.set('custom_exercises', exercises);
  }

  hasCustomExercises() {
    return this.get('custom_exercises', null) !== null;
  }
}
