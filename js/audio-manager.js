// Audio Manager per beep e Text-to-Speech
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.synth = window.speechSynthesis;
    this.volume = 0.7;
    this.ttsEnabled = true;
    this.ttsRate = 1.0;
    this.ttsVoice = null;
    
    this.initAudioContext();
    this.initVoices();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  initVoices() {
    // Carica le voci disponibili
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Cerca una voce italiana
      this.ttsVoice = voices.find(voice => voice.lang.startsWith('it')) || voices[0];
    };

    loadVoices();
    // Alcune browser richiedono questo evento
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Genera e riproduce un beep
  playBeep(type = 'default') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Frequenze diverse per beep diversi
    const frequencies = {
      start: 880,    // Beep alto per inizio
      end: 440,      // Beep medio per fine
      countdown: 660, // Beep medio-alto per countdown
      default: 550
    };

    oscillator.frequency.value = frequencies[type] || frequencies.default;
    oscillator.type = 'sine';

    // Volume con fade in/out
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Double beep per eventi importanti
  playDoubleBeep() {
    this.playBeep('start');
    setTimeout(() => this.playBeep('start'), 150);
  }

  // Countdown beeps (3, 2, 1)
  playCountdownBeeps(callback) {
    this.playBeep('countdown');
    setTimeout(() => {
      this.playBeep('countdown');
      setTimeout(() => {
        this.playBeep('countdown');
        setTimeout(() => {
          this.playDoubleBeep();
          if (callback) callback();
        }, 1000);
      }, 1000);
    }, 1000);
  }

  // Text-to-Speech
  speak(text, options = {}) {
    if (!this.ttsEnabled || !this.synth) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Cancella eventuali speech in corso
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.ttsVoice;
      utterance.rate = options.rate || this.ttsRate;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || this.volume;
      utterance.lang = 'it-IT';

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error('TTS error:', e);
        reject(e);
      };

      this.synth.speak(utterance);
    });
  }

  // Annuncia esercizio completo
  async announceExercise(exercise) {
    const text = `${exercise.nameTTS}. ${exercise.description}`;
    await this.speak(text);
  }

  // Annuncia prossimo esercizio
  async announceNextExercise(exercise) {
    const text = `Prossimo esercizio: ${exercise.nameTTS}`;
    await this.speak(text);
  }

  // Annuncia recupero
  async announceRest(seconds) {
    const text = `${seconds} secondi di riposo`;
    await this.speak(text);
  }

  // Annuncia set
  async announceSet(currentSet, totalSets) {
    const text = `Set ${currentSet} di ${totalSets}`;
    await this.speak(text);
  }

  // Countdown vocale 3, 2, 1
  async announceCountdown() {
    await this.speak('3');
    await new Promise(resolve => setTimeout(resolve, 800));
    await this.speak('2');
    await new Promise(resolve => setTimeout(resolve, 800));
    await this.speak('1');
    await new Promise(resolve => setTimeout(resolve, 800));
    await this.speak('Inizia!');
  }

  // Stop all audio
  stopAll() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Setters per configurazione
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setTTSEnabled(enabled) {
    this.ttsEnabled = enabled;
  }

  setTTSRate(rate) {
    this.ttsRate = Math.max(0.5, Math.min(2, rate));
  }

  // Vibrazione (se disponibile)
  vibrate(pattern = 200) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  vibratePattern(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
