const {
  app,
  Menu,
  BrowserWindow,
  ipcMain,
  screen,
  dialog,
} = require('electron');
const path = require('path');
const fs = require('fs');

// ### Datenbank-Setup mit better-sqlite3 ###

const Database = require('better-sqlite3');
// Pfad zur Datenbankdatei im AppData-Verzeichnis
const dbPath = path.join(app.getPath('userData'), 'songs.db');
const db = new Database(dbPath, { verbose: console.log });

// Tabelle erstellen (bei erstem Start)
db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        lyrics TEXT NOT NULL,
        original_order TEXT,
        last_used_order TEXT,
        theme TEXT,
        last_used INTEGER
    );
`);

// IPC-Handler zum Abrufen aller Songs
ipcMain.handle('get-all-songs', () => {
  // Führe die Datenbankabfrage aus
  const stmt = db.prepare(
    'SELECT id, title, author,lyrics, original_order, last_used_order, theme, last_used FROM songs ORDER BY title',
  );
  return stmt.all();
});

// IPC-Handler zum Abrufen eines bestimmten Songs
ipcMain.handle('get-song-details', (event, songId) => {
  const stmt = db.prepare('SELECT * FROM songs WHERE id = ?');
  return stmt.get(songId);
});

// IPC-Handler zum Löschen eines Songs
ipcMain.handle('delete-song', (event, songId) => {
  try {
    const stmt = db.prepare('DELETE FROM songs WHERE id = ?');
    const info = stmt.run(songId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Database DELETE error:', error);
    return { success: false, message: error.message };
  }
});

// ### Electron App Setup ###

let mainWindow;

// 1. Funktion zum Erstellen des Hauptfensters
const createWindow = () => {
  const workerPath = path.join(__dirname, 'pdf.worker.mjs');
  process.env.PDFJS_WORKER_SRC = workerPath;

  mainWindow = new BrowserWindow({
    width: 1388,
    height: 991,
    webPreferences: {
      // Wichtig für Sicherheit: ermöglicht die Nutzung von Node.js-APIs im Renderer-Prozess
      // über ein Preload-Skript
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Wichtig: Deaktiviert
      contextIsolation: true, // Wichtig: Aktiviert
      // Damit ich HTML-Dateien in HTML einbauen kann als Webview
      webviewTag: true,
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
  // createAddSongWindow();
  // createSongCollectionWindow();
  // createThemeManagerWindow();

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

// ### Menüleiste ###

const menuBar = [
  //Allgemeine Menüs
  ...(process.platform === 'darwin'
    ? [
        {
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
            { role: 'quit' }, // Beenden der App
          ],
        },
      ]
    : []),
  // Individuelle Menüs
  {
    label: 'Songs',
    submenu: [
      {
        label: 'Form txt',
        // accelerator: 'CmdOrCtrl+I', // Kann später hinzugefügt werden
        click: (menuItem, browserWindow, event) => {
          // Hier IPC-Kommunikation zum Renderer-Prozess, falls nötig
        },
      },
      {
        label: 'Form CCLI',
        click: () => {},
      },
      {
        label: 'Form Genius',
        click: () => {},
      },
      {
        label: 'Manually',
        click: () => {
          if (!addSongWindow) {
            createAddSongWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Song-Collection',
        click: () => {
          if (!songCollectionWindow) {
            createSongCollectionWindow();
          }
        },
      },
      {
        label: 'Theme Manager',
        click: () => {
          if (!themeManagerWindow) {
            createThemeManagerWindow();
          }
        },
      },
    ],
  },
  {
    label: 'Add',
    submenu: [
      {
        label: 'PDF',
        click: async () => {
          const pdfPath = await dialog.showOpenDialog({
            title: 'PDF auswählen',
            properties: ['openFile', 'multiSelections'],
            buttonLabel: 'PDF hinzufügen',
            filters: [{ name: 'PDF-Dateien', extensions: ['pdf'] }],
          });
          if (!pdfPath.canceled && pdfPath.filePaths.length > 0) {
            mainWindow.webContents.send('selected-pdf', pdfPath);
          }
        },
      },
      {
        label: 'Audio',
        click: async () => {
          const audioPath = await dialog.showOpenDialog({
            title: 'Audio auswählen',
            properties: ['openFile', 'multiSelections'],
            buttonLabel: 'Audio hinzufügen',
            filters: [
              { name: 'Audio-Dateien', extensions: ['mp3', 'wav', 'flac'] },
            ],
          });
          if (!audioPath.canceled && audioPath.filePaths.length > 0) {
            mainWindow.webContents.send('selected-audio', audioPath);
          }
        },
      },
      {
        label: 'Image',
        click: async () => {
          const imagePath = await dialog.showOpenDialog({
            title: 'Bild auswählen',
            properties: ['openFile', 'multiSelections'],
            buttonLabel: 'Bild hinzufügen',
            filters: [
              { name: 'Bild-Dateien', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
            ],
          });
          if (!imagePath.canceled && imagePath.filePaths.length > 0) {
            mainWindow.webContents.send('selected-image', imagePath);
          }
        },
      },
      {
        label: 'Video',
        click: async () => {
          const videoPath = await dialog.showOpenDialog({
            title: 'Video auswählen',
            properties: ['openFile', 'multiSelections'],
            buttonLabel: 'Video hinzufügen',
            filters: [
              { name: 'Video-Dateien', extensions: ['mp4', 'avi', 'mov'] },
            ],
          });
          if (!videoPath.canceled && videoPath.filePaths.length > 0) {
            mainWindow.webContents.send('selected-video', videoPath);
          }
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

// ### Song Import Functions ###

let addSongWindow;
let songCollectionWindow;

function createAddSongWindow() {
  // Erstellung eines neuen Browserfensters
  addSongWindow = new BrowserWindow({
    width: 600,
    height: 850,
    title: 'Add New Song (manually)',
    modal: true, // Macht das Fenster modal (blockiert Hauptfenster)

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Wichtig für IPC
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Lädt das Formular-HTML
  addSongWindow.loadFile(path.join(__dirname, './other_pages/importSong.html'));

  // Entfernt das Fensterobjekt, wenn es geschlossen wird
  addSongWindow.on('closed', () => {
    addSongWindow = null;
  });
}

// IPC-Handler, um das Fenster vom Hauptfenster aus zu öffnen
ipcMain.on('open-add-song-window', () => {
  if (!addSongWindow) {
    createAddSongWindow();
  }
});

// IPC-Handler zum Speichern eines neuen Songs
ipcMain.handle('add-new-song', (event, songData) => {
  try {
    const stmt = db.prepare(`
            INSERT INTO songs (title, author, lyrics, original_order, theme) 
            VALUES (@title, @author, @lyrics, @originalOrder, @theme)
        `);

    const info = stmt.run({
      title: songData.title,
      author: songData.author || '',
      lyrics: songData.lyrics,
      originalOrder: songData.originalOrder || '',
      theme: songData.theme || 'default',
    });

    return { success: true, id: info.lastInsertRowid };
  } catch (error) {
    console.error('Database INSERT error:', error);
    return { success: false, message: error.message };
  }
});

// Funktion zum Erstellen des Song-Collection-Fensters
function createSongCollectionWindow() {
  songCollectionWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    title: 'Song Collection Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Lädt die Sammlungs-HTML
  songCollectionWindow.loadFile(
    path.join(__dirname, './other_pages/songCollection.html'),
  );

  // Optional: Öffnet die Entwickler-Tools für dieses Fenster
  songCollectionWindow.webContents.openDevTools();

  // Entfernt das Fensterobjekt, wenn es geschlossen wird
  songCollectionWindow.on('closed', () => {
    songCollectionWindow = null;
  });
}

ipcMain.handle('update-song', (event, songData) => {
  try {
    const stmt = db.prepare(`
            UPDATE songs 
            SET title = @title, 
                author = @author, 
                lyrics = @lyrics, 
                original_order = @originalOrder, 
                theme = @theme
            WHERE id = @id
        `);

    const info = stmt.run({
      id: songData.id,
      title: songData.title,
      author: songData.author || '',
      lyrics: songData.lyrics,
      originalOrder: songData.originalOrder || '',
      theme: songData.theme || 'default',
    });

    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Database UPDATE error:', error);
    return { success: false, message: error.message };
  }
});

// IPC-Handler zum Abrufen der Songtexte für die Anzeige rechts
ipcMain.handle('get-song-lyrics', (event, songId) => {
  const stmt = db.prepare('SELECT lyrics FROM songs WHERE id = ?');
  const result = stmt.get(songId);
  return result ? result.lyrics : 'Lyrics not found.';
});

ipcMain.handle('get-song-order', async (event, songId) => {
  const stmt = db.prepare('SELECT original_order FROM songs WHERE id = ?');
  const result = stmt.get(songId);
  return result ? result.original_order : '';
});

let songSelectWindow;

// NEU: Funktion zum Erstellen des Song-Auswahlfensters
function createSongSelectWindow() {
  // Stellen Sie sicher, dass nur ein Fenster offen ist
  if (songSelectWindow) {
    songSelectWindow.focus();
    return;
  }

  songSelectWindow = new BrowserWindow({
    width: 500,
    height: 350,
    title: 'Song auswählen',
    modal: true,
    parent: mainWindow, // Definiert das Hauptfenster als Elternteil
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  songSelectWindow.loadFile(
    path.join(__dirname, './other_pages/songSelect2Add.html'),
  );

  songSelectWindow.on('closed', () => {
    songSelectWindow = null;
  });
}

// NEU: IPC-Handler vom Renderer, um das Auswahlfenster zu öffnen
ipcMain.on('open-song-select-window', () => {
  createSongSelectWindow();
});

// NEU: IPC-Handler vom Auswahlfenster zum Hauptfenster
ipcMain.on('send-selected-song', (event, songData) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Sende die Daten an den Renderer des Hauptfensters
    mainWindow.webContents.send('song-selected', songData);
  }
  // Schließe das Auswahlfenster
  if (songSelectWindow) {
    songSelectWindow.close();
  }
});

// ### IPC-Handler zum Öffnen eines Songs auf dem Beamer-Fenster ###

let songPresentationWindow = null;
var beamerWindow = false;
let lastThemeData = null;

ipcMain.on('open-song-on-beamer', (event, content) => {
  beamerWindow = true;
  songPresentation(content);
});

function songPresentation(content) {
  if (songPresentationWindow && !songPresentationWindow.isDestroyed()) {
    songPresentationWindow.webContents.send('load-song-content', content);
    return;
  }

  const displays = screen.getAllDisplays();
  let targetDisplay = null;
  if (displays.length > 1) {
    // Option 1: Wählen Sie den zweiten Bildschirm
    targetDisplay = displays[1];
  } else {
    // Option 2: Es gibt nur einen Bildschirm (den primären)
    targetDisplay = screen.getPrimaryDisplay();
  }

  // Die Koordinaten des Zielbildschirms
  const { x, y } = targetDisplay.bounds;

  songPresentationWindow = new BrowserWindow({
    x: x,
    y: y,

    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    transparent: true,

    title: 'Song Präsentation',

    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  songPresentationWindow.loadFile(
    path.join(__dirname, './beamer_page/beamerPage.html'),
  );

  songPresentationWindow.webContents.on('did-finish-load', () => {
    // Der Listener in beamerPage.js ist jetzt registriert.
    songPresentationWindow.webContents.send('load-song-content', content);

    if (lastThemeData) {
      // 👈 Prüft, ob mainPage.js bereits Daten gesendet hat
      songPresentationWindow.webContents.send(
        'update-beamer-theme',
        lastThemeData,
      );
    } else {
    }
  });

  songPresentationWindow.on('closed', () => {
    songPresentationWindow = null;
  });
}

// Style für das Beamer-Fenster
ipcMain.on('apply-theme-styles-to-beamer', (event, themeData) => {
  // 1. Speichere die Theme-Daten IMMER, wenn sie vom Hauptfenster kommen
  lastThemeData = themeData;
  console.log('themeData in Main', themeData);

  // 2. Versuche, die Daten sofort zu senden, WENN das Fenster bereits existiert
  if (songPresentationWindow && !songPresentationWindow.isDestroyed()) {
    songPresentationWindow.webContents.send('update-beamer-theme', themeData);
  }
  // Wenn das Fenster nicht existiert, wird nichts gesendet (bis zum Laden).
});

// Dropdownliste für Themes im Hauptfenster
ipcMain.handle('get-theme-list', async () => {
  // Pfad zum 'themes'-Ordner (angenommen, er liegt neben main.js und index.html)
  const themesDir = path.join(__dirname, 'themes');

  try {
    const files = fs.readdirSync(themesDir);

    // Dateinamen filtern und die Dateierweiterung '.json' entfernen
    const themeNames = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.parse(file).name);

    // Rückgabe der Theme-Namen an den Renderer
    return [...themeNames];
  } catch (error) {
    console.error('Fehler beim Lesen des themes-Ordners:', error);
    // Im Fehlerfall eine leere Liste zurückgeben
    return ['default'];
  }
});

//  ### Video on Beamer ###
ipcMain.on('play-video-on-beamer', (event, videoSrc) => {
    // WICHTIG: Wir müssen prüfen, ob songPresentationWindow existiert, 
    // da dies deine Variable für das Beamer-Fenster ist.
    if (songPresentationWindow && !songPresentationWindow.isDestroyed()) {
        songPresentationWindow.webContents.send('beamer-video-load', videoSrc);
    } else {
        console.error("Beamer-Fenster ist nicht offen. Video kann nicht geladen werden.");
        // Optional: Hier songPresentation() aufrufen, falls das Fenster automatisch öffnen soll
    }
});

ipcMain.on('video-is-ready', () => {
    if (mainWindow) {
        mainWindow.webContents.send('start-preview');
    }
});

ipcMain.on('control-video-on-beamer', (event, data) => {
    // data enthält hier { command, time } wie in deiner preload definiert
    if (songPresentationWindow && !songPresentationWindow.isDestroyed()) {
        songPresentationWindow.webContents.send('beamer-video-control', data);
    }
});

// ### Theme Manager Window ###

let themeManagerWindow;

function createThemeManagerWindow() {
  // Stellen Sie sicher, dass nur ein Fenster offen ist
  if (themeManagerWindow) {
    themeManagerWindow.focus();
    return;
  }

  themeManagerWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'Theme Manager',
    modal: false,
    parent: mainWindow, // Definiert das Hauptfenster als Elternteil
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  themeManagerWindow.loadFile(
    path.join(__dirname, './themeManager/themeManager.html'),
  );

  themeManagerWindow.on('closed', () => {
    themeManagerWindow = null;
  });

  // Optional: Öffnet die Entwickler-Tools
  themeManagerWindow.webContents.openDevTools();
}

const themesDir = path.join(__dirname, 'themes');

// --- READ (Details) ---
ipcMain.handle('get-theme-details', async (event, themeName) => {
  const filePath = path.join(themesDir, `${themeName}.json`);

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Fehler beim Laden von Theme ${themeName}:`, error);
    throw new Error(`Theme ${themeName} konnte nicht geladen werden.`);
  }
});

// --- CREATE / UPDATE (SAVE) ---
ipcMain.handle('save-theme', async (event, themeData) => {
  // Der Theme-Name wird als Dateiname verwendet
  const themeName = themeData.name;
  if (!themeName) {
    throw new Error('Theme-Name fehlt in den Daten.');
  }

  const filePath = path.join(themesDir, `${themeName}.json`);

  // Löschen des temporären 'id' Feldes, falls es existiert und nicht gespeichert werden soll
  const dataToSave = { ...themeData };
  if (dataToSave.id && typeof dataToSave.id === 'number') {
    delete dataToSave.id;
  }

  try {
    // JSON formatiert speichern (2 Leerzeichen Einrückung)
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return { success: true, message: `Theme ${themeName} gespeichert.` };
  } catch (error) {
    console.error(`Fehler beim Speichern von Theme ${themeName}:`, error);
    throw new Error(`Theme ${themeName} konnte nicht gespeichert werden.`);
  }
});

// --- DELETE ---
ipcMain.handle('delete-theme-file', async (event, themeName) => {
  const filePath = path.join(themesDir, `${themeName}.json`);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: `Theme ${themeName} gelöscht.` };
    } else {
      throw new Error('Datei existiert nicht.');
    }
  } catch (error) {
    console.error(`Fehler beim Löschen von Theme ${themeName}:`, error);
    throw new Error(`Theme ${themeName} konnte nicht gelöscht werden.`);
  }
});

// Theme-Dropdown im Hauptfenster aktualisieren, wenn im Theme Manager Änderungen vorgenommen wurden
ipcMain.on('theme-updated', (event, themeName) => {
  // Sende das Signal an alle offenen Fenster (Hauptfenster & Beamer)
  // mainWindow ist die Variable deines Hauptfensters
  if (mainWindow && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('theme-updated-signal', themeName);
  }

  // Falls das Beamer-Fenster auch direkt informiert werden soll:
  // if (beamerWindow && !beamerWindow.webContents.isDestroyed()) {
  //   beamerWindow.webContents.send('theme-updated-signal', themeName);
  // }
});

// ### Button Implementation für Blackscreen, Hintergrund und Desktop anzeigen ###
ipcMain.handle('show-blackscreen', () => {
  if (songPresentationWindow) {
    songPresentationWindow.webContents.send('set-display-mode', 'black');
  }
});

ipcMain.handle('show-background-only', () => {
  if (songPresentationWindow) {
    songPresentationWindow.webContents.send('set-display-mode', 'background');
  }
});

ipcMain.handle('show-desktop', () => {
  if (songPresentationWindow) {
    // songPresentationWindow.webContents.send('set-display-mode', 'desktop');
    songPresentationWindow.close();
  }
});

ipcMain.handle('show-slide', () => {
  if (songPresentationWindow) {
    songPresentationWindow.webContents.send('set-display-mode', 'slide');
  }
});

// ### Hotkey Laden ###
const hotkeysPath = path.join(__dirname, 'hotkeys.json');

// Listener für den Aufruf aus dem Renderer-Prozess
ipcMain.handle('load-hotkeys-config', async (event) => {
  try {
    const data = fs.readFileSync(hotkeysPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Laden der Hotkeys-Konfiguration:', error);
    return {}; // Wichtig: Immer ein Fallback zurückgeben
  }
});

// Hanler für File auswahl

ipcMain.handle('dialog:openFile', async (event, type) => {
  const properties = type === 'video' ? ['openFile'] : ['openFile']; // Sie können hier 'openFile', 'multiSelections' usw. hinzufügen

  const filters =
    type === 'video'
      ? [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] }]
      : [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }];

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: properties,
    filters: filters,
  });

  if (canceled) {
    return null;
  } else {
    // Gibt den tatsächlichen Pfad zurück
    return filePaths[0];
  }
});

//  PDF Laden
ipcMain.handle('open-pdf-select-dialog', async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [{ name: 'PDF-Dateien', extensions: ['pdf'] }],
  });

  if (result.canceled) {
    return null; // Nichts ausgewählt
  }

  // Gibt den Pfad der ersten ausgewählten Datei zurück
  return result.filePaths[0];
});
