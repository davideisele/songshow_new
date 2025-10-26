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
        onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (event, value) => callback(value)),

        // Beispiel 3: Eine Funktion, die direkt eine Node.js-API kapselt (Achtung: Nur für vertrauenswürdigen Code)
        // Besser: Lassen Sie den Main Process die FS-Operationen durchführen
        // readConfig: (path) => require('fs').readFileSync(path, 'utf-8')

        openAddSongWindow: () => ipcRenderer.send('open-add-song-window'),
        addNewSong: (songData) => ipcRenderer.invoke('add-new-song', songData),

        getAllSongs: () => ipcRenderer.invoke('get-all-songs'),
        getSongDetails: (songId) => ipcRenderer.invoke('get-song-details', songId),
        deleteSong: (songId) => ipcRenderer.invoke('delete-song', songId),
        updateSong: (songData) => ipcRenderer.invoke('update-song', songData),
    }
);