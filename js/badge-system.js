// Badge System - Gestione badge e streak
export class BadgeSystem {
  constructor(storageService) {
    this.storage = storageService;
    this.badges = {
      first: {
        id: 'first',
        name: 'Prima volta',
        description: 'Hai completato il tuo primo workout!',
        icon: '🎯',
        requirement: 1
      },
      consistent: {
        id: 'consistent',
        name: 'Costanza',
        description: '3 giorni consecutivi',
        icon: '💪',
        requirement: 3
      },
      week: {
        id: 'week',
        name: 'Settimana perfetta',
        description: '7 giorni consecutivi',
        icon: '⭐',
        requirement: 7
      },
      twoWeeks: {
        id: 'twoWeeks',
        name: 'Due settimane',
        description: '14 giorni consecutivi',
        icon: '🔥',
        requirement: 14
      },
      month: {
        id: 'month',
        name: "Mese d'acciaio",
        description: '30 giorni consecutivi',
        icon: '🏆',
        requirement: 30
      },
      warrior: {
        id: 'warrior',
        name: 'Guerriero',
        description: '50 sessioni completate',
        icon: '⚔️',
        requirement: 50
      },
      dedicated: {
        id: 'dedicated',
        name: 'Dedicato',
        description: '100 sessioni completate',
        icon: '🎖️',
        requirement: 100
      }
    };
  }

  // Calcola la streak corrente
  calculateStreak(sessions) {
    if (sessions.length === 0) return 0;

    // Ordina sessioni per data (più recenti prima)
    const sorted = [...sessions].sort((a, b) => 
      new Date(b.completedAt) - new Date(a.completedAt)
    );

    // Ottieni date uniche (un workout per giorno)
    const uniqueDates = [...new Set(sorted.map(s => 
      new Date(s.completedAt).toDateString()
    ))];

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Verifica se l'ultimo workout è stato oggi o ieri
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0; // Streak interrotta
    }

    // Conta giorni consecutivi
    let currentDate = new Date(uniqueDates[0]);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = new Date(uniqueDates[i]);
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Aggiorna statistiche dopo una sessione completata
  updateStats(sessionData) {
    const stats = this.storage.getStats();
    const sessions = this.storage.getSessions();

    // Incrementa sessioni totali
    stats.totalSessions = sessions.length;

    // Calcola streak
    const currentStreak = this.calculateStreak(sessions);
    stats.currentStreak = currentStreak;

    // Aggiorna longest streak
    if (currentStreak > stats.longestStreak) {
      stats.longestStreak = currentStreak;
    }

    // Aggiorna ultima data workout
    stats.lastWorkoutDate = new Date().toISOString();

    // Aggiungi tempo totale
    stats.totalTime = (stats.totalTime || 0) + (sessionData.duration || 0);

    // Controlla badge da sbloccare
    const newBadges = this.checkBadges(stats);

    // Salva statistiche
    this.storage.updateStats(stats);

    return {
      stats,
      newBadges
    };
  }

  // Controlla quali badge sono stati sbloccati
  checkBadges(stats) {
    const currentBadges = stats.badges || {};
    const newBadges = [];

    Object.values(this.badges).forEach(badge => {
      // Se già sbloccato, skip
      if (currentBadges[badge.id]) return;

      let unlocked = false;

      // Logica di sblocco basata su tipo badge
      if (['first', 'consistent', 'week', 'twoWeeks', 'month'].includes(badge.id)) {
        // Badge basati su streak
        unlocked = stats.currentStreak >= badge.requirement;
      } else if (['warrior', 'dedicated'].includes(badge.id)) {
        // Badge basati su numero totale sessioni
        unlocked = stats.totalSessions >= badge.requirement;
      }

      if (unlocked) {
        currentBadges[badge.id] = new Date().toISOString();
        newBadges.push(badge);
      }
    });

    stats.badges = currentBadges;
    return newBadges;
  }

  // Ottieni tutti i badge sbloccati
  getUnlockedBadges() {
    const stats = this.storage.getStats();
    const unlockedBadges = [];

    Object.entries(stats.badges || {}).forEach(([badgeId, unlockedAt]) => {
      if (this.badges[badgeId]) {
        unlockedBadges.push({
          ...this.badges[badgeId],
          unlockedAt
        });
      }
    });

    return unlockedBadges.sort((a, b) => 
      new Date(b.unlockedAt) - new Date(a.unlockedAt)
    );
  }

  // Ottieni badge ancora da sbloccare
  getLockedBadges() {
    const stats = this.storage.getStats();
    const unlockedIds = Object.keys(stats.badges || {});

    return Object.values(this.badges)
      .filter(badge => !unlockedIds.includes(badge.id))
      .map(badge => {
        let progress = 0;
        
        if (['first', 'consistent', 'week', 'twoWeeks', 'month'].includes(badge.id)) {
          progress = Math.min(100, (stats.currentStreak / badge.requirement) * 100);
        } else if (['warrior', 'dedicated'].includes(badge.id)) {
          progress = Math.min(100, (stats.totalSessions / badge.requirement) * 100);
        }

        return {
          ...badge,
          progress: Math.round(progress)
        };
      });
  }

  // Ottieni prossimo badge da sbloccare
  getNextBadge() {
    const locked = this.getLockedBadges();
    if (locked.length === 0) return null;

    // Ordina per progresso (più vicino allo sblocco)
    return locked.sort((a, b) => b.progress - a.progress)[0];
  }

  // Ottieni calendario ultimi 30 giorni
  getCalendar(days = 30) {
    const sessions = this.storage.getSessions();
    const calendar = [];
    const today = new Date();

    // Crea array di date con flag completato
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();

      const completed = sessions.some(s => 
        new Date(s.completedAt).toDateString() === dateString
      );

      calendar.push({
        date: new Date(date),
        dateString,
        completed,
        isToday: i === 0
      });
    }

    return calendar;
  }

  // Esporta statistiche come CSV
  exportToCSV() {
    const sessions = this.storage.getSessions();
    
    let csv = 'Data,Durata (min),Esercizi Completati\n';
    
    sessions.forEach(session => {
      const date = new Date(session.completedAt).toLocaleDateString('it-IT');
      const duration = Math.round(session.duration / 60);
      const exercises = session.exercises?.length || 0;
      
      csv += `${date},${duration},${exercises}\n`;
    });

    return csv;
  }

  // Reset statistiche (con conferma)
  resetStats() {
    this.storage.updateStats({
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
      totalTime: 0,
      badges: {}
    });
    this.storage.set('workout_sessions', []);
  }
}
