const { app, Menu, BrowserWindow } = require('electron');
const path = require('path');

// 1. Funktion zum Erstellen des Hauptfensters
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1388,
    height: 991,
    webPreferences: {
      // Wichtig für Sicherheit: ermöglicht die Nutzung von Node.js-APIs im Renderer-Prozess
      // über ein Preload-Skript
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 2. Lädt die HTML-Datei, die die Benutzeroberfläche darstellt
  mainWindow.loadFile('./main_page/mainPage.html');

  // Optional: Öffnet die Entwickler-Tools
  mainWindow.webContents.openDevTools();
};

// 3. App-Lebenszyklus-Ereignisse (Steuerung des App-Verhaltens)

// Erstellt das Fenster, wenn die Electron-App initialisiert wurde
app.whenReady().then(() => {
  createWindow();
  createMenu();

  // Wichtig für macOS: Wenn keine Fenster geöffnet sind, soll ein neues erstellt werden,
  // wenn das Dock-Icon angeklickt wird (nachdem das letzte Fenster geschlossen wurde).
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Schließt die Anwendung, wenn alle Fenster geschlossen werden (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 'darwin' ist macOS
    app.quit();
  }
});

// Menüleiste
const menuBar = [
  //Allgemeine Menüs
    ...(process.platform === 'darwin' ? [{
    label: app.name, // Verwendet den Namen deiner App (standardmäßig "Electron")
    submenu: [
      { role: 'about' }, // Über die App
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' }, // Ausblenden der App
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' } // Beenden der App
    ]
  }] : []),
  // Individuelle Menüs
  {
    label: 'Import',
    submenu: [
      {
        label: 'Form txt',
        // accelerator: 'CmdOrCtrl+I', // Kann später hinzugefügt werden
        click: (menuItem, browserWindow, event) => {
          console.log('Import form txt clicked');
          // Hier IPC-Kommunikation zum Renderer-Prozess, falls nötig
        },
      },
      {
        label: 'Form CCLI',
        click: () => {
          console.log('Import form CCLI clicked');
        },
      },
      {
        label: 'Form Genius',
        click: () => {
          console.log('Import form Genius clicked');
        },
      },
    ],
  },
  // Standard Menüs
  { role: 'editMenu' },
  { role: 'viewMenu' }, // Enthält Toggle DevTools, Reload, etc.
  { role: 'windowMenu' },
];


function createMenu() {
  const menu = Menu.buildFromTemplate(menuBar);
  Menu.setApplicationMenu(menu);
}
