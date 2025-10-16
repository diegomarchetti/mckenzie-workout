// Workout Page App
import { exercises as defaultExercises, exerciseEmojis } from './exercises.js';
import { WorkoutEngine } from './workout-engine.js';
import { StorageService } from './storage-service.js';
import { BadgeSystem } from './badge-system.js';
import { FirebaseService } from './firebase-service.js';

class WorkoutApp {
  constructor() {
    this.storage = new StorageService();
    this.badgeSystem = new BadgeSystem(this.storage);
    this.firebase = new FirebaseService(this.storage);
    
    // Load custom exercises or use defaults
    const customExercises = this.storage.getExercises();
    const exercises = customExercises || defaultExercises.map((ex, index) => ({
      ...ex,
      emoji: exerciseEmojis[ex.id] || '🏋️',
      order: index,
      custom: false
    }));
    
    const settings = this.storage.getSettings();
    this.engine = new WorkoutEngine(exercises, settings);
    
    // DOM Elements
    this.elements = {
      exerciseCard: document.getElementById('exerciseCard'),
      exerciseEmoji: document.getElementById('exerciseEmoji'),
      exerciseName: document.getElementById('exerciseName'),
      exerciseSubtitle: document.getElementById('exerciseSubtitle'),
      setInfo: document.getElementById('setInfo'),
      exerciseDescription: document.getElementById('exerciseDescription'),
      exerciseCount: document.getElementById('exerciseCount'),
      progressFill: document.getElementById('progressFill'),
      timerContainer: document.getElementById('timerContainer'),
      timerCircle: document.getElementById('timerCircle'),
      timerTime: document.getElementById('timerTime'),
      timerLabel: document.getElementById('timerLabel'),
      timerProgress: document.getElementById('timerProgress'),
      nextExercise: document.getElementById('nextExercise'),
      nextExerciseName: document.getElementById('nextExerciseName'),
      startBtn: document.getElementById('startBtn'),
      startBtnText: document.getElementById('startBtnText'),
      completeBtn: document.getElementById('completeBtn'),
      skipBtn: document.getElementById('skipBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      completionScreen: document.getElementById('completionScreen'),
      badgeUnlockModal: document.getElementById('badgeUnlockModal')
    };
    
    this.init();
  }

  async init() {
    await this.firebase.init();
    this.setupEventListeners();
    this.setupEngine();
    await this.engine.startWorkout();
  }

  setupEventListeners() {
    // Start/Resume button
    this.elements.startBtn.addEventListener('click', async () => {
      await this.engine.startExercise();
    });

    // Complete button (for REPS exercises)
    this.elements.completeBtn.addEventListener('click', async () => {
      await this.engine.completeSet();
    });

    // Skip button
    this.elements.skipBtn.addEventListener('click', async () => {
      if (confirm('Vuoi saltare questo esercizio?')) {
        await this.engine.skipExercise();
      }
    });

    // Pause button
    this.elements.pauseBtn.addEventListener('click', () => {
      if (this.engine.state === 'PAUSED') {
        this.engine.resume();
      } else {
        this.engine.pause();
      }
    });

    // Stop button
    this.elements.stopBtn.addEventListener('click', () => {
      if (confirm('Vuoi interrompere il workout?')) {
        this.engine.destroy();
        window.location.href = 'index.html';
      }
    });

    // Back to home (from completion screen)
    document.getElementById('backHomeBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Close badge modal
    document.getElementById('closeBadgeBtn').addEventListener('click', () => {
      this.elements.badgeUnlockModal.classList.add('hidden');
    });

    document.getElementById('badgeOverlay').addEventListener('click', () => {
      this.elements.badgeUnlockModal.classList.add('hidden');
    });
  }

  setupEngine() {
    // State change callback
    this.engine.onStateChange = (state) => {
      this.updateUI(state);
    };

    // Timer update callback
    this.engine.onTimerUpdate = (timer) => {
      this.updateTimer(timer);
    };

    // Workout complete callback
    this.engine.onWorkoutComplete = async (data) => {
      await this.handleWorkoutComplete(data);
    };
  }

  updateUI(state) {
    const { exercise, exerciseIndex, totalExercises, currentSet, progress, nextExercise } = state;

    // Update header
    this.elements.exerciseCount.textContent = `${exerciseIndex + 1} di ${totalExercises}`;
    this.elements.progressFill.style.width = `${progress}%`;

    // Update exercise info
    this.elements.exerciseEmoji.textContent = exerciseEmojis[exercise.id] || '🏋️';
    this.elements.exerciseName.textContent = exercise.name;
    this.elements.exerciseSubtitle.textContent = exercise.nameTTS;
    this.elements.setInfo.textContent = `Set ${currentSet} di ${exercise.sets}`;
    this.elements.exerciseDescription.textContent = exercise.description;

    // Update card state
    this.elements.exerciseCard.className = 'exercise-card';
    this.elements.timerCircle.className = 'timer-circle';
    
    switch (state.state) {
      case 'READY':
        this.elements.exerciseCard.classList.add('state-ready');
        this.showStartButton();
        break;
      
      case 'EXERCISE_ACTIVE':
        this.elements.exerciseCard.classList.add('state-active');
        if (exercise.type === 'HOLD') {
          this.showTimer();
          this.elements.timerCircle.classList.add('state-active');
          this.elements.timerLabel.textContent = 'MANTIENI';
        } else {
          this.hideTimer();
          this.showCompleteButton();
        }
        break;
      
      case 'REST':
        this.elements.exerciseCard.classList.add('state-rest');
        this.showTimer();
        this.elements.timerCircle.classList.add('state-rest');
        this.elements.timerLabel.textContent = 'RIPOSO';
        this.hideActionButtons();
        break;
      
      case 'PAUSED':
        this.elements.pauseBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        break;
      
      case 'COMPLETED':
        // Handled in handleWorkoutComplete
        break;
    }

    // Update pause button
    if (state.state !== 'PAUSED') {
      this.elements.pauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
    }

    // Update next exercise preview
    if (nextExercise && (state.state === 'REST' || state.state === 'READY')) {
      this.elements.nextExercise.classList.remove('hidden');
      this.elements.nextExerciseName.textContent = nextExercise.nameTTS;
    } else {
      this.elements.nextExercise.classList.add('hidden');
    }

    // Show/hide skip button
    if (state.state === 'EXERCISE_ACTIVE' || state.state === 'REST') {
      this.elements.skipBtn.classList.remove('hidden');
    } else {
      this.elements.skipBtn.classList.add('hidden');
    }
  }

  updateTimer(timer) {
    const { remainingTime, totalTime } = timer;
    
    // Format time
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    this.elements.timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress circle
    const circumference = 2 * Math.PI * 90; // radius = 90
    const progress = (totalTime - remainingTime) / totalTime;
    const offset = circumference * (1 - progress);
    this.elements.timerProgress.style.strokeDashoffset = offset;
  }

  showTimer() {
    this.elements.timerContainer.classList.remove('hidden');
    this.hideActionButtons();
  }

  hideTimer() {
    this.elements.timerContainer.classList.add('hidden');
  }

  showStartButton() {
    this.elements.startBtn.classList.remove('hidden');
    this.elements.completeBtn.classList.add('hidden');
    
    const exercise = this.engine.currentExercise;
    if (exercise.type === 'HOLD') {
      this.elements.startBtnText.textContent = 'Inizia';
    } else {
      this.elements.startBtnText.textContent = 'Inizia Set';
    }
  }

  showCompleteButton() {
    this.elements.startBtn.classList.add('hidden');
    this.elements.completeBtn.classList.remove('hidden');
  }

  hideActionButtons() {
    this.elements.startBtn.classList.add('hidden');
    this.elements.completeBtn.classList.add('hidden');
  }

  async handleWorkoutComplete(data) {
    // Save session
    const sessionData = {
      exercises: data.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        type: ex.type
      })),
      duration: data.duration,
      completedAt: data.completedAt.toISOString()
    };

    // Save to storage and Firebase
    await this.firebase.saveSession(sessionData);

    // Update stats and check for badges
    const result = this.badgeSystem.updateStats(sessionData);

    // Show completion screen
    this.showCompletionScreen(data, result.newBadges);
  }

  showCompletionScreen(data, newBadges) {
    // Hide workout UI
    document.querySelector('.workout-main').classList.add('hidden');
    
    // Show completion screen
    this.elements.completionScreen.classList.remove('hidden');

    // Update stats
    const duration = Math.round(data.duration / 60);
    const totalSets = data.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    
    document.getElementById('statDuration').textContent = `${duration}m`;
    document.getElementById('statExercises').textContent = data.exercises.length;
    document.getElementById('statSets').textContent = totalSets;

    // Show badge unlocks
    if (newBadges && newBadges.length > 0) {
      setTimeout(() => {
        this.showBadgeUnlock(newBadges[0]);
      }, 1000);
    }
  }

  showBadgeUnlock(badge) {
    document.getElementById('badgeUnlockIcon').textContent = badge.icon;
    document.getElementById('badgeUnlockName').textContent = badge.name;
    document.getElementById('badgeUnlockDesc').textContent = badge.description;
    this.elements.badgeUnlockModal.classList.remove('hidden');
  }
}

// Initialize app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WorkoutApp());
} else {
  new WorkoutApp();
}
