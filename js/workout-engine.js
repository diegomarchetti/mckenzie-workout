// Workout Engine - State Machine per gestire il workout
import { AudioManager } from './audio-manager.js';

export class WorkoutEngine {
  constructor(exercises, settings = {}) {
    this.exercises = exercises;
    this.settings = {
      autoRun: settings.autoRun ?? true,
      vibrationEnabled: settings.vibrationEnabled ?? true,
      ...settings
    };
    
    // Audio Manager
    this.audio = new AudioManager();
    if (settings.volume !== undefined) this.audio.setVolume(settings.volume);
    if (settings.ttsEnabled !== undefined) this.audio.setTTSEnabled(settings.ttsEnabled);
    
    // State
    this.state = 'IDLE'; // IDLE, READY, EXERCISE_ACTIVE, REST, PAUSED, COMPLETED
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.timer = null;
    this.remainingTime = 0;
    this.startTime = null;
    this.totalElapsedTime = 0;
    this.wakeLock = null;
    
    // Callbacks
    this.onStateChange = null;
    this.onTimerUpdate = null;
    this.onWorkoutComplete = null;
  }

  // Getters
  get currentExercise() {
    return this.exercises[this.currentExerciseIndex];
  }

  get totalExercises() {
    return this.exercises.length;
  }

  get progressPercentage() {
    const totalSets = this.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const completedSets = this.exercises
      .slice(0, this.currentExerciseIndex)
      .reduce((sum, ex) => sum + ex.sets, 0) + (this.currentSet - 1);
    return Math.round((completedSets / totalSets) * 100);
  }

  get nextExercise() {
    const nextIndex = this.currentExerciseIndex + (this.currentSet >= this.currentExercise.sets ? 1 : 0);
    return this.exercises[nextIndex] || null;
  }

  get isLastSet() {
    return this.currentSet >= this.currentExercise.sets;
  }

  get isLastExercise() {
    return this.currentExerciseIndex >= this.exercises.length - 1;
  }

  // Inizia workout
  async startWorkout() {
    this.state = 'READY';
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.startTime = Date.now();
    this.totalElapsedTime = 0;
    
    await this.requestWakeLock();
    this.emitStateChange();
    
    // Se auto-run è attivo, inizia subito
    if (this.settings.autoRun) {
      await this.startExercise();
    }
  }

  // Inizia esercizio/set
  async startExercise() {
    const exercise = this.currentExercise;
    this.state = 'EXERCISE_ACTIVE';
    
    // Vibrazione
    if (this.settings.vibrationEnabled) {
      this.audio.vibrate(200);
    }
    
    // Beep inizio
    this.audio.playBeep('start');
    
    // Aggiorna UI immediatamente (fix delay)
    this.emitStateChange();
    
    // Annuncio TTS in background (senza await)
    this.audio.announceExercise(exercise);
    this.audio.announceSet(this.currentSet, exercise.sets);
    
    // Se è un esercizio HOLD, avvia il timer
    if (exercise.type === 'HOLD') {
      this.startTimer(exercise.duration);
    }
    // Per REPS, aspetta conferma utente
  }

  // Timer per esercizi HOLD
  startTimer(seconds) {
    this.remainingTime = seconds;
    this.emitTimerUpdate();
    
    this.timer = setInterval(() => {
      this.remainingTime--;
      this.emitTimerUpdate();
      
      // Beep ultimi 3 secondi
      if (this.remainingTime <= 3 && this.remainingTime > 0) {
        this.audio.playBeep('countdown');
      }
      
      if (this.remainingTime <= 0) {
        this.completeSet();
      }
    }, 1000);
  }

  // Ferma timer
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Completa set
  async completeSet() {
    this.stopTimer();
    
    // Beep fine
    this.audio.playBeep('end');
    
    // Vibrazione
    if (this.settings.vibrationEnabled) {
      this.audio.vibratePattern([100, 50, 100]);
    }
    
    const exercise = this.currentExercise;
    
    // Controlla se ci sono altri set
    if (this.currentSet < exercise.sets) {
      // Passa al resto
      await this.startRest();
    } else {
      // Esercizio completato, passa al prossimo
      await this.moveToNextExercise();
    }
  }

  // Inizia recupero
  async startRest() {
    this.state = 'REST';
    const exercise = this.currentExercise;
    const nextEx = this.nextExercise;
    
    // Determina se il prossimo esercizio è diverso
    const isChangingExercise = this.currentSet >= exercise.sets;
    const restTime = exercise.rest;
    
    this.emitStateChange();
    
    // Annuncio recupero
    await this.audio.announceRest(restTime);
    
    // Se cambia esercizio, annuncia il prossimo
    if (isChangingExercise && nextEx) {
      await this.audio.announceNextExercise(nextEx);
    }
    
    // Timer recupero
    this.remainingTime = restTime;
    this.emitTimerUpdate();
    
    this.timer = setInterval(() => {
      this.remainingTime--;
      this.emitTimerUpdate();
      
      // Beep ultimi 3 secondi
      if (this.remainingTime <= 3 && this.remainingTime > 0) {
        this.audio.playBeep('countdown');
      }
      
      if (this.remainingTime <= 0) {
        this.endRest();
      }
    }, 1000);
  }

  // Fine recupero
  async endRest() {
    this.stopTimer();
    
    const exercise = this.currentExercise;
    
    if (this.currentSet < exercise.sets) {
      // Prossimo set stesso esercizio
      this.currentSet++;
      this.state = 'READY';
      this.emitStateChange();
      
      if (this.settings.autoRun && exercise.type === 'HOLD') {
        // Auto-start per esercizi HOLD
        await this.startExercise();
      }
    } else {
      // Prossimo esercizio
      this.currentExerciseIndex++;
      this.currentSet = 1;
      
      if (this.currentExerciseIndex >= this.exercises.length) {
        // Workout completato!
        this.completeWorkout();
      } else {
        this.state = 'READY';
        this.emitStateChange();
        
        if (this.settings.autoRun) {
          await this.startExercise();
        }
      }
    }
  }

  // Passa al prossimo esercizio
  async moveToNextExercise() {
    this.currentExerciseIndex++;
    this.currentSet = 1;
    
    if (this.currentExerciseIndex >= this.exercises.length) {
      this.completeWorkout();
      return;
    }
    
    // Passa al resto
    await this.startRest();
  }

  // Completa workout
  completeWorkout() {
    this.state = 'COMPLETED';
    this.stopTimer();
    this.releaseWakeLock();
    
    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.totalElapsedTime = totalTime;
    
    // Celebrazione!
    this.audio.playDoubleBeep();
    if (this.settings.vibrationEnabled) {
      this.audio.vibratePattern([100, 50, 100, 50, 200]);
    }
    
    this.audio.speak('Complimenti! Hai completato il workout!');
    
    this.emitStateChange();
    
    if (this.onWorkoutComplete) {
      this.onWorkoutComplete({
        exercises: this.exercises,
        duration: totalTime,
        completedAt: new Date()
      });
    }
  }

  // Pausa
  pause() {
    if (this.state !== 'EXERCISE_ACTIVE' && this.state !== 'REST') return;
    
    this.state = 'PAUSED';
    this.stopTimer();
    this.audio.stopAll();
    this.emitStateChange();
  }

  // Riprendi
  resume() {
    if (this.state !== 'PAUSED') return;
    
    const wasPaused = this.state;
    this.state = 'EXERCISE_ACTIVE'; // o REST, dobbiamo ricordarlo
    
    // Riavvia timer se c'era tempo rimanente
    if (this.remainingTime > 0) {
      this.startTimer(this.remainingTime);
    }
    
    this.emitStateChange();
  }

  // Salta esercizio
  async skipExercise() {
    this.stopTimer();
    this.audio.stopAll();
    await this.moveToNextExercise();
  }

  // Screen Wake Lock
  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
        console.log('Wake Lock attivo');
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // Events
  emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        state: this.state,
        exercise: this.currentExercise,
        exerciseIndex: this.currentExerciseIndex,
        totalExercises: this.totalExercises,
        currentSet: this.currentSet,
        progress: this.progressPercentage,
        nextExercise: this.nextExercise
      });
    }
  }

  emitTimerUpdate() {
    if (this.onTimerUpdate) {
      this.onTimerUpdate({
        remainingTime: this.remainingTime,
        totalTime: this.currentExercise.type === 'HOLD' ? 
          this.currentExercise.duration : 
          this.currentExercise.rest
      });
    }
  }

  // Settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    if (newSettings.volume !== undefined) {
      this.audio.setVolume(newSettings.volume);
    }
    if (newSettings.ttsEnabled !== undefined) {
      this.audio.setTTSEnabled(newSettings.ttsEnabled);
    }
  }

  // Cleanup
  destroy() {
    this.stopTimer();
    this.audio.stopAll();
    this.releaseWakeLock();
  }
}
