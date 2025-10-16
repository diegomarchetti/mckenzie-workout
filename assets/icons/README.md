# Icone PWA

Questa directory deve contenere le icone per la Progressive Web App.

## Icone Necessarie

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Come Generare le Icone

### Opzione 1: Generatore Online

1. Vai su [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Carica un'immagine 512x512px con il logo/icona dell'app
3. Scarica tutte le dimensioni generate
4. Posiziona i file in questa directory

### Opzione 2: Usa uno strumento come ImageMagick

Se hai un'immagine base `icon.png` (512x512px):

```bash
# Installa ImageMagick
# Su macOS: brew install imagemagick
# Su Ubuntu: sudo apt-get install imagemagick

# Genera tutte le dimensioni
convert icon.png -resize 72x72 icon-72x72.png
convert icon.png -resize 96x96 icon-96x96.png
convert icon.png -resize 128x128 icon-128x128.png
convert icon.png -resize 144x144 icon-144x144.png
convert icon.png -resize 152x152 icon-152x152.png
convert icon.png -resize 192x192 icon-192x192.png
convert icon.png -resize 384x384 icon-384x384.png
convert icon.png -resize 512x512 icon-512x512.png
```

### Opzione 3: Design Suggerito

Crea un'icona semplice con:
- Sfondo: colore primario (#1976d2)
- Emoji o simbolo: 🏋️ o 💪 o un'icona stilizzata
- Testo: "McKenzie" (opzionale)

## Placeholder Temporaneo

Per testare l'app senza icone, puoi usare un'immagine SVG convertita in PNG.

Crea un file SVG semplice e convertilo nelle varie dimensioni.
