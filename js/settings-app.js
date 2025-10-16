// Settings App - Gestione impostazioni e esercizi
import { exercises as defaultExercises, exerciseEmojis } from './exercises.js';
import { StorageService } from './storage-service.js';
import { FirebaseService } from './firebase-service.js';

class SettingsApp {
  constructor() {
    this.storage = new StorageService();
    this.firebase = new FirebaseService(this.storage);
    this.exercises = [];
    this.editingExerciseId = null;
    this.MAX_EXERCISES = 20;
    
    this.init();
  }

  async init() {
    await this.firebase.init();
    this.loadExercises();
    this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  loadExercises() {
    // Carica esercizi custom o usa quelli di default
    const customExercises = this.storage.getExercises();
    
    if (customExercises) {
      this.exercises = customExercises;
    } else {
      // Prima volta: copia esercizi di default e aggiungi emoji
      this.exercises = defaultExercises.map((ex, index) => ({
        ...ex,
        emoji: exerciseEmojis[ex.id] || '🏋️',
        order: index,
        custom: false
      }));
      this.saveExercises();
    }
  }

  loadSettings() {
    const settings = this.storage.getSettings();
    
    // Applica settings ai controlli
    document.getElementById('autoRunToggle').checked = settings.autoRun;
    document.getElementById('ttsToggle').checked = settings.ttsEnabled;
    document.getElementById('vibrationToggle').checked = settings.vibrationEnabled;
    document.getElementById('volumeSlider').value = Math.round(settings.volume * 100);
    document.getElementById('volumeValue').textContent = Math.round(settings.volume * 100) + '%';
    document.getElementById('ttsRateSlider').value = Math.round(settings.ttsRate * 100);
    document.getElementById('ttsRateValue').textContent = settings.ttsRate.toFixed(1) + 'x';
  }

  setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Settings toggles
    document.getElementById('autoRunToggle').addEventListener('change', (e) => {
      this.updateSetting('autoRun', e.target.checked);
    });

    document.getElementById('ttsToggle').addEventListener('change', (e) => {
      this.updateSetting('ttsEnabled', e.target.checked);
    });

    document.getElementById('vibrationToggle').addEventListener('change', (e) => {
      this.updateSetting('vibrationEnabled', e.target.checked);
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      document.getElementById('volumeValue').textContent = value + '%';
      this.updateSetting('volume', value / 100);
    });

    // TTS rate slider
    document.getElementById('ttsRateSlider').addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const rate = value / 100;
      document.getElementById('ttsRateValue').textContent = rate.toFixed(1) + 'x';
      this.updateSetting('ttsRate', rate);
    });

    // Add exercise
    document.getElementById('addExerciseBtn').addEventListener('click', () => {
      if (this.exercises.length >= this.MAX_EXERCISES) {
        alert(`Limite massimo di ${this.MAX_EXERCISES} esercizi raggiunto`);
        return;
      }
      this.openExerciseModal();
    });

    // Modal
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
    document.getElementById('exerciseForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Exercise type radio
    document.querySelectorAll('input[name="exerciseType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleExerciseTypeFields(e.target.value);
      });
    });

    // Account
    document.getElementById('accountBtn').addEventListener('click', async () => {
      const user = this.firebase.getCurrentUser();
      if (user) {
        if (confirm('Vuoi effettuare il logout?')) {
          await this.firebase.logout();
          this.updateUI();
        }
      } else {
        try {
          await this.firebase.loginWithGoogle();
          this.updateUI();
        } catch (error) {
          alert('Errore durante il login: ' + error.message);
        }
      }
    });

    // Reset stats
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
      if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione è irreversibile!')) {
        if (confirm('Confermi definitivamente la cancellazione?')) {
          this.storage.clearUserData();
          this.storage.updateStats({
            totalSessions: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastWorkoutDate: null,
            totalTime: 0,
            badges: {}
          });
          alert('Dati cancellati con successo');
        }
      }
    });
  }

  updateSetting(key, value) {
    const settings = this.storage.getSettings();
    settings[key] = value;
    this.storage.updateSettings(settings);
    this.firebase.updateSettings(settings);
  }

  updateUI() {
    this.renderExercises();
    this.updateAccountInfo();
    this.updateExerciseLimitWarning();
  }

  updateAccountInfo() {
    const user = this.firebase.getCurrentUser();
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountBtn = document.getElementById('accountBtn');

    if (user) {
      accountName.textContent = user.displayName || user.email;
      accountEmail.textContent = user.email;
      accountEmail.classList.remove('hidden');
      accountBtn.textContent = 'Logout';
    } else {
      accountName.textContent = 'Ospite';
      accountEmail.classList.add('hidden');
      accountBtn.textContent = 'Accedi';
    }
  }

  updateExerciseLimitWarning() {
    const warning = document.getElementById('exerciseLimitWarning');
    const addBtn = document.getElementById('addExerciseBtn');
    
    if (this.exercises.length >= this.MAX_EXERCISES) {
      warning.classList.remove('hidden');
      addBtn.disabled = true;
      addBtn.style.opacity = '0.5';
    } else {
      warning.classList.add('hidden');
      addBtn.disabled = false;
      addBtn.style.opacity = '1';
    }
  }

  renderExercises() {
    const list = document.getElementById('exercisesList');
    
    list.innerHTML = this.exercises.map((ex, index) => `
      <div class="exercise-item" data-id="${ex.id}" draggable="true">
        <span class="material-symbols-outlined exercise-drag-handle">drag_indicator</span>
        <div class="exercise-emoji">${ex.emoji || '🏋️'}</div>
        <div class="exercise-info">
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-details">
            ${ex.type === 'HOLD' ? `${ex.sets}×${ex.duration}sec` : `${ex.sets}×${ex.reps}rip`} • Recupero: ${ex.rest}sec
          </div>
        </div>
        <div class="exercise-actions">
          <button class="btn btn-icon btn-outlined" onclick="settingsApp.editExercise('${ex.id}')">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="btn btn-icon btn-outlined" style="color: var(--md-sys-color-error);" onclick="settingsApp.deleteExercise('${ex.id}')">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `).join('');

    // Setup drag and drop
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const items = document.querySelectorAll('.exercise-item');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(e.clientY);
        const list = document.getElementById('exercisesList');
        
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      });

      item.addEventListener('drop', () => {
        this.reorderExercises();
      });
    });
  }

  getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.exercise-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  reorderExercises() {
    const items = document.querySelectorAll('.exercise-item');
    const newOrder = [];
    
    items.forEach((item, index) => {
      const id = item.dataset.id;
      const exercise = this.exercises.find(ex => ex.id === id);
      if (exercise) {
        exercise.order = index;
        newOrder.push(exercise);
      }
    });

    this.exercises = newOrder;
    this.saveExercises();
  }

  openExerciseModal(exercise = null) {
    this.editingExerciseId = exercise ? exercise.id : null;
    const modal = document.getElementById('exerciseModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('exerciseForm');

    if (exercise) {
      title.textContent = 'Modifica Esercizio';
      document.getElementById('exerciseName').value = exercise.name;
      document.getElementById('exerciseNameTTS').value = exercise.nameTTS;
      document.getElementById('exerciseDescription').value = exercise.description;
      document.getElementById('exerciseSets').value = exercise.sets;
      document.getElementById('exerciseRest').value = exercise.rest;
      document.getElementById('exerciseEmoji').value = exercise.emoji || '';
      
      // Set type
      const typeRadio = document.querySelector(`input[name="exerciseType"][value="${exercise.type}"]`);
      if (typeRadio) typeRadio.checked = true;
      
      if (exercise.type === 'HOLD') {
        document.getElementById('exerciseDuration').value = exercise.duration;
      } else {
        document.getElementById('exerciseReps').value = exercise.reps;
      }
      
      this.toggleExerciseTypeFields(exercise.type);
    } else {
      title.textContent = 'Aggiungi Esercizio';
      form.reset();
      this.toggleExerciseTypeFields('REPS');
    }

    modal.classList.remove('hidden');
  }

  closeModal() {
    document.getElementById('exerciseModal').classList.add('hidden');
    document.getElementById('exerciseForm').reset();
    this.editingExerciseId = null;
  }

  toggleExerciseTypeFields(type) {
    const repsGroup = document.getElementById('repsGroup');
    const durationGroup = document.getElementById('durationGroup');
    
    if (type === 'HOLD') {
      repsGroup.classList.add('hidden');
      durationGroup.classList.remove('hidden');
      document.getElementById('exerciseReps').removeAttribute('required');
      document.getElementById('exerciseDuration').setAttribute('required', 'required');
    } else {
      repsGroup.classList.remove('hidden');
      durationGroup.classList.add('hidden');
      document.getElementById('exerciseReps').setAttribute('required', 'required');
      document.getElementById('exerciseDuration').removeAttribute('required');
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const type = document.querySelector('input[name="exerciseType"]:checked').value;
    const exerciseData = {
      name: document.getElementById('exerciseName').value.trim(),
      nameTTS: document.getElementById('exerciseNameTTS').value.trim(),
      description: document.getElementById('exerciseDescription').value.trim(),
      type: type,
      sets: parseInt(document.getElementById('exerciseSets').value),
      rest: parseInt(document.getElementById('exerciseRest').value),
      emoji: document.getElementById('exerciseEmoji').value.trim() || '🏋️'
    };

    if (type === 'HOLD') {
      exerciseData.duration = parseInt(document.getElementById('exerciseDuration').value);
    } else {
      exerciseData.reps = parseInt(document.getElementById('exerciseReps').value);
    }

    if (this.editingExerciseId) {
      // Modifica esercizio esistente
      const index = this.exercises.findIndex(ex => ex.id === this.editingExerciseId);
      if (index !== -1) {
        this.exercises[index] = {
          ...this.exercises[index],
          ...exerciseData
        };
      }
    } else {
      // Nuovo esercizio
      const newExercise = {
        id: 'custom-' + Date.now(),
        ...exerciseData,
        order: this.exercises.length,
        custom: true
      };
      this.exercises.push(newExercise);
    }

    this.saveExercises();
    this.closeModal();
    this.updateUI();
  }

  editExercise(id) {
    const exercise = this.exercises.find(ex => ex.id === id);
    if (exercise) {
      this.openExerciseModal(exercise);
    }
  }

  deleteExercise(id) {
    const exercise = this.exercises.find(ex => ex.id === id);
    if (!exercise) return;

    if (confirm(`Vuoi eliminare "${exercise.name}"?`)) {
      this.exercises = this.exercises.filter(ex => ex.id !== id);
      this.saveExercises();
      this.updateUI();
    }
  }

  saveExercises() {
    this.storage.saveExercises(this.exercises);
    // Sync con Firebase se loggato
    this.syncExercisesWithFirebase();
  }

  async syncExercisesWithFirebase() {
    if (!this.firebase.isAuthenticated()) return;
    
    // TODO: Implementare sync Firebase per esercizi
    // Per ora salva solo in locale
  }
}

// Export globale per onclick handlers
window.settingsApp = new SettingsApp();
