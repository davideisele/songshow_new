document.addEventListener('DOMContentLoaded', () => {
  // Überprüfen, ob die API vorhanden ist
  if (window.electronAPI && window.electronAPI.onContentReceived) {
    console.log('Beamer Page: Electron API ist verfügbar.');

    // Listener registrieren
    window.electronAPI.onContentReceived((content) => {
      const contentDiv = document.querySelector('.slide-content'); // Ersetzen Sie 'song-content' durch die ID Ihres Elements

      // Text in das Element einfügen (ggf. Zeilenumbrüche für HTML formatieren)
      contentDiv.innerHTML = content.replace(/\n/g, '<br>');
    });
  } else {
    console.error('Beamer Page: Electron API ist nicht verfügbar.');
  }
});

// Funktion zum Anwenden der Theme-Styles lokal
// function applyThemeStylesToLocal(themeData, targetElement) {
//   const slideContentStyles = themeData['.slide-content'];

//   if (slideContentStyles) {
//     for (const [property, value] of Object.entries(slideContentStyles)) {
//       console.log(
//         `Beamer Page: Setting CSS variable --slide-${property} to ${value}`,
//       );
//       const cssVariable = `--slide-${property}`;
//       targetElement.style.setProperty(cssVariable, value);
//     }
//   }else {
//     console.log('Beamer Page: No .slide-content styles found in theme data.');}
// }


function applyThemeStylesToLocal(themeData, targetElement) {
  // Gehen Sie alle Selektoren (Schlüssel) in der themeData durch
  for (const selector in themeData) {
    if (themeData.hasOwnProperty(selector)) {
      const styles = themeData[selector];
      
      // Entfernen Sie das führende '.' (falls vorhanden) und bereinigen Sie den Selektor
      // um ihn als Basis für die CSS-Variable zu verwenden.
      // Beispiel: '.slide-content' wird zu 'slide-content'
      //          '.translation-line' wird zu 'translation-line'
      const baseName = selector.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

      // Gehen Sie die einzelnen CSS-Eigenschaften für diesen Selektor durch
      if (styles) {
        for (const [property, value] of Object.entries(styles)) {
          // Erstellen Sie eine eindeutige CSS-Variable.
          // Beispiel: --slide-content-text-align
          // Beispiel: --translation-line-color
          const cssVariable = `--${baseName}-${property}`;
          
          targetElement.style.setProperty(cssVariable, value);
        }
      }
    }
  }
}

// -------------------------------------------------------------
// NEU: IPC-Empfänger im Beamer-Renderer-Prozess
// -------------------------------------------------------------
if (window.electronAPI) {
  // Hören Sie auf den Kanal 'update-beamer-theme', der vom Hauptprozess gesendet wird
  window.electronAPI.receiveThemeFromMain(
    'update-beamer-theme',
    (themeData) => {
      // Wenden Sie die Styles auf das eigene Dokument an
      applyThemeStylesToLocal(themeData, document.documentElement);

      // Optional: Bestätigung in der Konsole
      console.log('Beamer-Theme aktualisiert:', themeData);
    },
  );
}else {
  console.error('Beamer Page: Electron API ist nicht verfügbar für Theme-Updates.');
}

// beamerPage.js

// Wir gehen davon aus, dass 'electronAPI' in der preload.js des Beamer-Fensters exponiert wird
const body = document.getElementById('beamer-body');
const textContainer = document.getElementById('slide-text-container');
const specialClasses = ['black-mode', 'background-mode', 'desktop-mode'];

/**
 * Setzt alle Spezialklassen zurück und stellt die Textanzeige wieder her.
 */
function resetDisplayModes() {
    body.classList.remove(...specialClasses);
    // Stelle sicher, dass der Text sichtbar ist
    textContainer.style.display = 'block'; 
}


// --- 1. Listener für den Modus-Wechsel (vom Main-Prozess) ---

// Wir empfangen den Befehl über die electronAPI, die in der preload.js definiert ist
if (window.electronAPI && window.electronAPI.onSetDisplayMode) {
    window.electronAPI.onSetDisplayMode((mode) => {
        
        console.log(`BeamerPage: Empfange Modus-Wechsel zu: ${mode}`);
        
        // Immer alle Klassen entfernen, bevor der neue Modus gesetzt wird
        resetDisplayModes(); 

        switch (mode) {
            case 'black':
                body.classList.add('black-mode');
                break;
            case 'background':
                body.classList.add('background-mode');
                break;
            case 'desktop':
                body.classList.add('desktop-mode');
                break;
            case 'slide':
                // resetDisplayModes() hat bereits alles auf den Standard zurückgesetzt
                break;
        }
    });
} else {
    console.error("electronAPI.onSetDisplayMode wurde nicht gefunden. preload.js möglicherweise fehlerhaft.");
}


// --- 2. Listener für den Folien-Inhalt (vom Main-Prozess) ---

// Wir müssen noch die Funktion implementieren, die den Text aktualisiert
if (window.electronAPI && window.electronAPI.onUpdateContent) {
    window.electronAPI.onUpdateContent((content) => {
        textContainer.innerHTML = content;
        // Wenn neuer Inhalt geladen wird, soll der Modus auf 'slide' zurückgesetzt werden
        resetDisplayModes(); 
    });
}