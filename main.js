const { app, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// ### Datenbank-Setup mit better-sqlite3 ###

const Database = require('better-sqlite3');
// Pfad zur Datenbankdatei im AppData-Verzeichnis
const dbPath = path.join(app.getPath('userData'), 'songs.db');
console.log('Datenbankpfad:', dbPath);
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
    const stmt = db.prepare('SELECT id, title, author FROM songs ORDER BY title');
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
  mainWindow = new BrowserWindow({
    width: 1388,
    height: 991,
    webPreferences: {
      // Wichtig für Sicherheit: ermöglicht die Nutzung von Node.js-APIs im Renderer-Prozess
      // über ein Preload-Skript
      preload: path.join(__dirname, 'preload.js'),
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
      {
        label: 'Manually',
        click: () => {
          console.log('Import "Manually" clicked');
          if (!addSongWindow) { 
             createAddSongWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Song-Collection',
        click: () => {
          console.log('Import "Song-Collection" clicked');
          if (!songCollectionWindow) { 
              createSongCollectionWindow(); 
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
        }
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
            theme: songData.theme || 'default'
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
        }
    });

    // Lädt die Sammlungs-HTML
    songCollectionWindow.loadFile(path.join(__dirname, './other_pages/songCollection.html'));

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
            theme: songData.theme || 'default'
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
        }
    });

    songSelectWindow.loadFile(path.join(__dirname, './other_pages/songSelect2Add.html'));

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

