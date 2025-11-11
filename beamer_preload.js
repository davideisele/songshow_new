const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('beamerAPI', {
    // Methode zum Empfangen von Inhalts-Updates
    onUpdateContent: (callback) => {
        // Achtung: Wir entfernen Listener erst beim nächsten Aufruf, 
        // um Memory Leaks zu verhindern.
        ipcRenderer.removeAllListeners('update-slide-content'); 
        ipcRenderer.on('update-slide-content', (event, content) => callback(content));
    },
    // Methode zum Empfangen von Modus-Befehlen
    onSetDisplayMode: (callback) => {
        ipcRenderer.removeAllListeners('set-display-mode'); 
        ipcRenderer.on('set-display-mode', (event, mode) => callback(mode));
    }
});