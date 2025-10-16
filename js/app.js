// Main App Script for Home Page
import { exercises, exerciseEmojis } from './exercises.js';
import { StorageService } from './storage-service.js';
import { BadgeSystem } from './badge-system.js';
import { FirebaseService } from './firebase-service.js';

class App {
  constructor() {
    this.storage = new StorageService();
    this.badgeSystem = new BadgeSystem(this.storage);
    this.firebase = new FirebaseService(this.storage);
    
    this.init();
  }

  async init() {
    // Initialize Firebase
    await this.firebase.init();
    
    // Load data and update UI
    this.updateUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Register Service Worker
    this.registerServiceWorker();
  }

  setupEventListeners() {
    // Settings Button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      window.location.href = 'settings.html';
    });

    // Start Workout
    document.getElementById('startWorkoutBtn').addEventListener('click', () => {
      window.location.href = 'workout.html';
    });

    // Auth Button
    document.getElementById('authBtn').addEventListener('click', async () => {
      const user = this.firebase.getCurrentUser();
      if (user) {
        // Logout
        if (confirm('Vuoi effettuare il logout?')) {
          await this.firebase.logout();
          this.updateUI();
        }
      } else {
        // Login
        try {
          await this.firebase.loginWithGoogle();
          this.updateUI();
        } catch (error) {
          alert('Errore durante il login: ' + error.message);
        }
      }
    });

    // History Button
    document.getElementById('historyBtn').addEventListener('click', () => {
      this.showHistory();
    });
  }

  updateUI() {
    this.updateUserSection();
    this.updateStats();
    this.updateStreak();
    this.updateCalendar();
    this.updateBadges();
    this.updateNextBadge();
  }

  updateUserSection() {
    const user = this.firebase.getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const userPhoto = document.getElementById('userPhoto');

    if (user) {
      userName.textContent = user.displayName || user.email;
      userEmail.textContent = user.email;
      userEmail.classList.remove('hidden');
      
      if (user.photoURL) {
        userPhoto.src = user.photoURL;
        userAvatar.classList.remove('hidden');
      }

      authBtn.innerHTML = `
        <span class="material-symbols-outlined">logout</span>
        Esci
      `;
    } else {
      userName.textContent = 'Ospite';
      userEmail.classList.add('hidden');
      userAvatar.classList.add('hidden');
      
      authBtn.innerHTML = `
        <span class="material-symbols-outlined">login</span>
        Accedi
      `;
    }
  }

  updateStats() {
    const stats = this.storage.getStats();
    
    document.getElementById('totalSessions').textContent = stats.totalSessions || 0;
    
    const totalMinutes = Math.round((stats.totalTime || 0) / 60);
    document.getElementById('totalTime').textContent = totalMinutes > 0 ? `${totalMinutes}m` : '0m';
  }

  updateStreak() {
    const stats = this.storage.getStats();
    const sessions = this.storage.getSessions();
    const currentStreak = this.badgeSystem.calculateStreak(sessions);
    
    document.getElementById('streakCount').textContent = `${currentStreak} 🔥`;
    document.getElementById('longestStreak').textContent = stats.longestStreak || 0;
  }

  updateCalendar() {
    const calendar = this.badgeSystem.getCalendar(7);
    const calendarEl = document.getElementById('calendar');
    
    calendarEl.innerHTML = calendar.map(day => {
      const dayName = day.date.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayNumber = day.date.getDate();
      
      return `
        <div style="text-align: center; padding: var(--spacing-xs);">
          <div style="font-size: var(--md-sys-typescale-label-small); color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--spacing-xs);">
            ${dayName}
          </div>
          <div style="
            width: 32px;
            height: 32px;
            margin: 0 auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--md-sys-typescale-body-small);
            font-weight: 500;
            ${day.completed ? 
              'background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);' : 
              day.isToday ?
              'border: 2px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary);' :
              'color: var(--md-sys-color-on-surface-variant);'
            }
          ">
            ${day.completed ? '✓' : dayNumber}
          </div>
        </div>
      `;
    }).join('');
  }

  updateBadges() {
    const unlockedBadges = this.badgeSystem.getUnlockedBadges();
    const badgesList = document.getElementById('badgesList');
    const noBadges = document.getElementById('noBadges');

    if (unlockedBadges.length > 0) {
      noBadges.classList.add('hidden');
      badgesList.innerHTML = unlockedBadges.map(badge => `
        <div style="
          min-width: 120px;
          text-align: center;
          padding: var(--spacing-md);
          background-color: var(--md-sys-color-surface-container-high);
          border-radius: var(--radius-md);
        ">
          <div style="font-size: 48px; margin-bottom: var(--spacing-xs);">${badge.icon}</div>
          <div style="font-size: var(--md-sys-typescale-label-medium); font-weight: 500; margin-bottom: var(--spacing-xs);">
            ${badge.name}
          </div>
          <div style="font-size: var(--md-sys-typescale-label-small); color: var(--md-sys-color-on-surface-variant);">
            ${badge.description}
          </div>
        </div>
      `).join('');
    } else {
      noBadges.classList.remove('hidden');
      badgesList.innerHTML = '';
    }
  }

  updateNextBadge() {
    const nextBadge = this.badgeSystem.getNextBadge();
    const nextBadgeCard = document.getElementById('nextBadgeCard');

    if (nextBadge && nextBadge.progress > 0) {
      nextBadgeCard.classList.remove('hidden');
      document.getElementById('nextBadgeIcon').textContent = nextBadge.icon;
      document.getElementById('nextBadgeName').textContent = nextBadge.name;
      document.getElementById('nextBadgeDesc').textContent = nextBadge.description;
      document.getElementById('nextBadgeProgress').style.width = `${nextBadge.progress}%`;
    } else {
      nextBadgeCard.classList.add('hidden');
    }
  }

  showHistory() {
    const sessions = this.storage.getSessions();
    
    if (sessions.length === 0) {
      alert('Nessuna sessione completata ancora!');
      return;
    }

    // Create a simple history modal
    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.style.cssText = 'display: flex; align-items: center; justify-content: center; padding: var(--spacing-lg);';
    
    const content = document.createElement('div');
    content.style.cssText = `
      background-color: var(--md-sys-color-surface-container);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.completedAt) - new Date(a.completedAt)
    );

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
        <h3 style="margin: 0;">Storico Sessioni</h3>
        <button class="btn btn-icon" onclick="this.closest('.overlay').remove()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        ${sortedSessions.map(session => {
          const date = new Date(session.completedAt);
          const duration = Math.round(session.duration / 60);
          const exercises = session.exercises?.length || 0;
          
          return `
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <div style="font-weight: 500; margin-bottom: var(--spacing-xs);">
                    ${date.toLocaleDateString('it-IT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div style="font-size: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface-variant);">
                    ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: var(--md-sys-typescale-title-medium); font-weight: 500; color: var(--md-sys-color-primary);">
                    ${duration}m
                  </div>
                  <div style="font-size: var(--md-sys-typescale-body-small); color: var(--md-sys-color-on-surface-variant);">
                    ${exercises} esercizi
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
