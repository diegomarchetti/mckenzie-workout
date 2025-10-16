// Configurazione esercizi McKenzie
export const exercises = [
  {
    id: 'standing-extension',
    name: 'Standing extension',
    nameTTS: 'Estensioni in piedi',
    description: 'Mani sui fianchi, estendi lentamente il tronco',
    type: 'REPS',
    sets: 2,
    reps: 10,
    rest: 20
  },
  {
    id: 'prone-elbows',
    name: 'Prone on elbows',
    nameTTS: 'Prono sui gomiti',
    description: "Mantieni l'estensione lombare neutra",
    type: 'HOLD',
    sets: 3,
    duration: 30,
    rest: 20
  },
  {
    id: 'press-up',
    name: 'Press up',
    nameTTS: 'Estensioni a terra',
    description: 'Premi sulle braccia, bacino rilassato',
    type: 'REPS',
    sets: 5,
    reps: 10,
    rest: 20
  },
  {
    id: 'plank-elbow',
    name: 'Plank elbow',
    nameTTS: 'Plank su gomiti',
    description: 'Core attivo, linea dritta spalle-piedi',
    type: 'HOLD',
    sets: 3,
    duration: 30,
    rest: 20
  },
  {
    id: 'bird-dog',
    name: 'Bird-Dog',
    nameTTS: 'Bird-dog alternato',
    description: 'Braccio-gamba opposti, movimenti controllati',
    type: 'REPS',
    sets: 3,
    reps: 16,
    rest: 20
  },
  {
    id: 'knee-pushup',
    name: 'Knee pushup',
    nameTTS: 'Push-up da ginocchia',
    description: 'Mantieni allineamento busto-cosce',
    type: 'REPS',
    sets: 3,
    reps: 10,
    rest: 20
  },
  {
    id: 'wall-squat',
    name: 'Wall squat',
    nameTTS: 'Squat al muro',
    description: 'Scendi fino a 90°, mantieni e risali',
    type: 'REPS',
    sets: 3,
    reps: 10,
    rest: 20
  },
  {
    id: 'sit-to-stand',
    name: 'Sit to stand',
    nameTTS: 'Alzarsi-Sedersi',
    description: 'Dalla sedia, controlla la discesa',
    type: 'REPS',
    sets: 3,
    reps: 10,
    rest: 20
  }
];

// Emoji per gli esercizi (opzionale, per UI)
export const exerciseEmojis = {
  'standing-extension': '🧍',
  'prone-elbows': '🛏️',
  'press-up': '⬆️',
  'plank-elbow': '🏋️',
  'bird-dog': '🦅',
  'knee-pushup': '💪',
  'wall-squat': '🧱',
  'sit-to-stand': '🪑'
};
