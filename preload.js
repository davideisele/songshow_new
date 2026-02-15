// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// 1. Definition der API, die dem Renderer-Prozess zur Verfügung gestellt wird
contextBridge.exposeInMainWorld(
  // Globaler Name, unter dem die API im Renderer verfügbar ist (z.B. window.electronAPI)
  'electronAPI',
  {
    // Beispiel 1: Eine Funktion, die Daten zum Main Process sendet (z.B. Dialog öffnen)
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

    // Beispiel 2: Eine Funktion, die dem Renderer erlaubt, auf Nachrichten vom Main Process zu reagieren
    onUpdateCounter: (callback) =>
      ipcRenderer.on('update-counter', (event, value) => callback(value)),

    // Beispiel 3: Eine Funktion, die direkt eine Node.js-API kapselt (Achtung: Nur für vertrauenswürdigen Code)
    // Besser: Lassen Sie den Main Process die FS-Operationen durchführen
    // readConfig: (path) => require('fs').readFileSync(path, 'utf-8')

    openAddSongWindow: () => ipcRenderer.send('open-add-song-window'),
    addNewSong: (songData) => ipcRenderer.invoke('add-new-song', songData),

    getAllSongs: () => ipcRenderer.invoke('get-all-songs'),
    getSongDetails: (songId) => ipcRenderer.invoke('get-song-details', songId),
    deleteSong: (songId) => ipcRenderer.invoke('delete-song', songId),
    updateSong: (songData) => ipcRenderer.invoke('update-song', songData),
    getSongLyrics: (songId) => ipcRenderer.invoke('get-song-lyrics', songId),
    getSongOrder: (songId) => ipcRenderer.invoke('get-song-order', songId),

    openSongSelectWindow: () => ipcRenderer.send('open-song-select-window'), // Hauptfenster öffnet Modal
    sendSelectedSong: (songData) =>
      ipcRenderer.send('send-selected-song', songData), // Modal sendet Auswahl zurück

    onSongSelected: (callback) =>
      ipcRenderer.on('song-selected', (event, songData) => callback(songData)),

    openSongOnBeamer: (content) =>
      ipcRenderer.send('open-song-on-beamer', content),

    showBlackscreen: () => ipcRenderer.invoke('show-blackscreen'),
    showBackgroundOnly: () => ipcRenderer.invoke('show-background-only'),
    showDesktop: () => ipcRenderer.invoke('show-desktop'),
    showSlide: () => ipcRenderer.invoke('show-slide'),

    onContentReceived: (callback) => {
      // Nutzt ipcRenderer.on, um auf jede Nachricht auf dem Kanal 'load-song-content' zu hören.
      ipcRenderer.on('load-song-content', (event, content) =>
        callback(content),
      );
    },
    // für Beamer Theme Styles
    sendThemeToMain: (themeData) =>
      ipcRenderer.send('apply-theme-styles-to-beamer', themeData),
    receiveThemeFromMain: (channel, callback) => {
      // Nur Kanäle erlauben, die vom Hauptprozess kommen (Sicherheit)
      let validChannels = ['update-beamer-theme'];
      if (validChannels.includes(channel)) {
        // Der Callback wird ausgeführt, wenn Daten auf diesem Kanal empfangen werden
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
      }
    },

    // Dropdownliste mit Themes
    getThemes: () => ipcRenderer.invoke('get-theme-list'),
    getThemeDetails: (themeName) =>
      ipcRenderer.invoke('get-theme-details', themeName),
    saveTheme: (themeData) => ipcRenderer.invoke('save-theme', themeData),
    deleteThemeFile: (themeName) =>
      ipcRenderer.invoke('delete-theme-file', themeName),

    // Theme-Dropdown im Hauptfenster aktualisieren, wenn im Theme Manager Änderungen vorgenommen wurden
    // Nachricht vom Editor senden: "Ich bin fertig mit Speichern!"
    notifyThemeChanged: (themeName) =>
      ipcRenderer.send('theme-updated', themeName),

    // Im Hauptfenster auf diese Nachricht warten
    onThemeUpdated: (callback) =>
      ipcRenderer.on('theme-updated-signal', (event, themeName) =>
        callback(themeName),
      ),

    // Beamer Blackscreen/Background/Desktop Modi
    // Methode zum Empfangen von Inhalts-Updates
    onUpdateContent: (callback) => {
      // Achtung: Wir entfernen Listener erst beim nächsten Aufruf,
      // um Memory Leaks zu verhindern.
      ipcRenderer.removeAllListeners('update-slide-content');
      ipcRenderer.on('update-slide-content', (event, content) =>
        callback(content),
      );
    },
    // Methode zum Empfangen von Modus-Befehlen
    onSetDisplayMode: (callback) => {
      ipcRenderer.removeAllListeners('set-display-mode');
      ipcRenderer.on('set-display-mode', (event, mode) => callback(mode));
    },

    // PDF, Audio, Video hinzufügen
    onPDFSelected: (callback) =>
      ipcRenderer.on('selected-pdf', (event, filePaths) => callback(filePaths)),

    // Hotkey Funktionen
    loadHotkeys: () => {
      // Ruft den Main Process auf, um die Datei zu lesen und die Daten zurückzugeben
      return ipcRenderer.invoke('load-hotkeys-config');
    },
    openFileDialog: (type) => ipcRenderer.invoke('dialog:openFile', type),
  },
);
