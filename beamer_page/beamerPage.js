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
function applyThemeStylesToLocal(themeData, targetElement) {
  const slideContentStyles = themeData['.slide-content'];

  if (slideContentStyles) {
    for (const [property, value] of Object.entries(slideContentStyles)) {
      console.log(
        `Beamer Page: Setting CSS variable --slide-${property} to ${value}`,
      );
      const cssVariable = `--slide-${property}`;
      targetElement.style.setProperty(cssVariable, value);
    }
  }else {
    console.log('Beamer Page: No .slide-content styles found in theme data.');}
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
