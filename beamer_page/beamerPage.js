document.addEventListener('DOMContentLoaded', () => {
  // Überprüfen, ob die API vorhanden ist
  if (window.electronAPI && window.electronAPI.onContentReceived) {
    console.log('Beamer Page: Electron API ist verfügbar.');

    // Listener registrieren
    window.electronAPI.onContentReceived((content) => {
      const contentDiv = document.querySelector('.slide-content'); // Ersetzen Sie 'song-content' durch die ID Ihres Elements

      // Text in das Element einfügen (ggf. Zeilenumbrüche für HTML formatieren)
      //   contentDiv.innerHTML = content.replace(/\n/g, '<br>');
      contentDiv.innerHTML = content;
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
  console.log('Beamer Page: Applying theme styles locally.', themeData);
  // WICHTIG: Erstellen Sie eine Kopie von themeData, da wir das Objekt modifizieren.
  const processedThemeData = JSON.parse(JSON.stringify(themeData));
  console.log('Beamer Page: Processed Theme Data:', processedThemeData);

  const hasMediaBackground =
    processedThemeData.hasOwnProperty('background-video') ||
    processedThemeData.hasOwnProperty('background-image');

  // 1. Zuerst die Video-Prüfung durchführen
  if (processedThemeData.hasOwnProperty('background-video')) {
    console.log('Beamer Page: Theme enthält ein Hintergrundvideo.');
    const videoPath = processedThemeData['background-video'];
    // Aufruf der neuen, globalen Funktion
    handleVideoBackground(videoPath, processedThemeData);

    // Das background-video-Objekt aus processedThemeData entfernen
    delete processedThemeData['background-video'];

    // Wir lassen die background-color des .slide-content jetzt unberührt,
    // damit der semi-transparente Overlay über dem globalen Video sichtbar ist.
  } else if (processedThemeData.hasOwnProperty('background-image')) {
    removeVideoBackground(); // Video weg, falls Bild kommt
    const imagePath = processedThemeData['background-image'];
    handleImageBackground(imagePath);
    delete processedThemeData['background-image'];
  } else {
    removeVideoBackground();
    removeImageBackground();
  }

  if (hasMediaBackground) {
    // Wir erzwingen Transparenz für den Container, damit das Bild/Video sichtbar wird
    targetElement.style.setProperty(
      '--slide-content-background-color',
      'transparent',
    );

    // Falls dein Selektor im Theme direkt ".slide-content" heißt, löschen wir dort die Farbe
    if (processedThemeData['.slide-content']) {
      delete processedThemeData['.slide-content']['background-color'];
    }
  }

  // Gehen Sie alle Selektoren (Schlüssel) in der processedThemeData durch
  for (const selector in processedThemeData) {
    if (processedThemeData.hasOwnProperty(selector)) {
      const styles = processedThemeData[selector];

      // Entfernen Sie das führende '.' (falls vorhanden) und bereinigen Sie den Selektor
      const baseName = selector.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

      // Gehen Sie die einzelnen CSS-Eigenschaften für diesen Selektor durch
      if (styles) {
        for (const [property, value] of Object.entries(styles)) {
          const cssVariable = `--${baseName}-${property}`;
          targetElement.style.setProperty(cssVariable, value);
        }
      }
    }
  }
}

/**
 * HILFSFUNKTION: Stellt sicher, dass ein Wrapper-DIV für den reinen Text-Inhalt existiert.
 * Dies ist notwendig, damit die Aktualisierung des Textes (innerHTML) das Video-Element nicht löscht.
 * @param {HTMLElement} slideContentContainer - Das .slide-content Element.
 * @returns {HTMLElement} Der Text-Wrapper.
 */
function ensureTextWrapper(slideContentContainer) {
  let textWrapper = slideContentContainer.querySelector('.slide-text-wrapper');

  if (!textWrapper) {
    textWrapper = document.createElement('div');
    textWrapper.className = 'slide-text-wrapper';
    // Stellt sicher, dass der Text über dem .slide-content Hintergrund liegt (zIndex 1 vom Container)
    textWrapper.style.position = 'relative';
    textWrapper.style.zIndex = '2';
    textWrapper.style.width = '100%';
    textWrapper.style.height = '100%';

    // Verschiebe alle NICHT-Video-Kindelemente in den neuen Wrapper
    const childrenToMove = [];
    Array.from(slideContentContainer.childNodes).forEach((child) => {
      // Wir ignorieren hier bewusst alle statischen <video>-Tags, falls sie noch im HTML sind.
      if (
        child.nodeType !== Node.ELEMENT_NODE ||
        (child.tagName !== 'VIDEO' &&
          !child.classList.contains('background-video'))
      ) {
        childrenToMove.push(child);
      }
    });

    // HINWEIS: Wir müssen die Nodes entfernen und dann wieder hinzufügen.
    childrenToMove.forEach((child) => {
      // Überprüfen, ob das Kindelement noch zum Container gehört, bevor es verschoben wird
      if (child.parentNode === slideContentContainer) {
        textWrapper.appendChild(child); // Verschiebt die Node
      }
    });

    // Füge den Wrapper dem Container hinzu
    slideContentContainer.appendChild(textWrapper);
  }
  return textWrapper;
}

/**
 * Erstellt oder aktualisiert das <video>-Element für den globalen Hintergrund (<body>).
 * @param {string} videoPath - Der Pfad zur Videodatei.
 * @param {object} themeData - Das gesamte Theme-Objekt (für background-poster, etc.).
 */
function handleVideoBackground(videoPath, themeData) {
  const body = document.body;
  const videoId = `theme-background-video-global`;
  let videoElement = document.getElementById(videoId);

  // **WICHTIG:** Stelle sicher, dass der .slide-content Wrapper für den Text existiert.
  // Dies muss für JEDEN .slide-content Container passieren.
  // document.querySelectorAll('.slide-content').forEach(ensureTextWrapper);

  // 2. Video-Erstellung und -Injection (EINMALIG im body)
  if (!videoElement) {
    console.log('videolog does not exist');
    videoElement = document.createElement('video');
    videoElement.id = videoId;
    videoElement.className = 'background-video'; // Klasse für das Styling (in styles.css)
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsinline = true;

    // Füge das Video als erstes Kind in den BODY ein
    body.prepend(videoElement);

    // Sorge dafür, dass der Rest des Body-Inhalts über dem Video liegt
    body.style.position = 'relative';
    body.style.zIndex = '1';
  } else {
    console.log('Video Element does exist');
  }

  // 3. Pfad-Setzung (Source-Element-Management)
  const actualVideoPath = videoPath;

  const source =
    videoElement.querySelector('source') || document.createElement('source');
  if (!source.parentElement) {
    videoElement.appendChild(source);
  }

  // WICHTIGE KORREKTUR: Nur laden, wenn sich der Pfad ändert!
  // Dies verhindert den Neustart bei jedem Folienwechsel.
  if (source.getAttribute('src') !== actualVideoPath) {
    source.setAttribute('src', actualVideoPath);
    source.setAttribute('type', 'video/mp4');
    videoElement.load();
    videoElement.play().catch((e) => console.log('Video Play Error:', e));
  }

  if (themeData && themeData['background-poster']) {
    videoElement.setAttribute('poster', themeData['background-poster']);
  }
}

/**
 * Entfernt das globale <video>-Element.
 */
function removeVideoBackground() {
  const videoId = `theme-background-video-global`;
  const videoElement = document.getElementById(videoId);

  if (videoElement) {
    videoElement.remove();

    // Setze die body-Styles zurück
    const body = document.body;
    body.style.position = '';
    body.style.zIndex = '';
  }

  // Außerdem müssen wir die Text-Wrapper aus allen Containern entfernen, wenn kein Video mehr da ist
  document.querySelectorAll('.slide-content').forEach((parent) => {
    const textWrapper = parent.querySelector('.slide-text-wrapper');
    if (textWrapper) {
      // Verschiebe den Inhalt des Wrappers zurück in den Hauptcontainer, bevor der Wrapper gelöscht wird
      while (textWrapper.firstChild) {
        parent.appendChild(textWrapper.firstChild);
      }
      textWrapper.remove();
    }
  });
}

/**
 * Setzt ein globales Hintergrundbild für den Beamer-Body.
 */

function handleImageBackground(imagePath) {
  const body = document.body;
  const imageId = `theme-background-image-global`;
  let imageElement = document.getElementById(imageId);

  if (!imageElement) {
    imageElement = document.createElement('div');
    imageElement.id = imageId;
    // Wir geben ihm die GLEICHE Klasse wie dem Video,
    // damit die CSS-Regeln für Hintergründe greifen
    imageElement.className = 'background-video';

    Object.assign(imageElement.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '-2', // Dieselbe Ebene wie das Video
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });

    body.prepend(imageElement);
  }

  const actualPath = `url('${imagePath.replace(/\\/g, '/')}')`;
  if (imageElement.style.backgroundImage !== actualPath) {
    imageElement.style.backgroundImage = actualPath;
  }
}

/**
 * Entfernt das globale Hintergrundbild vom Beamer.
 */
function removeImageBackground() {
  const imageElement = document.getElementById('theme-background-image-global');
  if (imageElement) {
    imageElement.remove();
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
} else {
  console.error(
    'Beamer Page: Electron API ist nicht verfügbar für Theme-Updates.',
  );
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
  console.error(
    'electronAPI.onSetDisplayMode wurde nicht gefunden. preload.js möglicherweise fehlerhaft.',
  );
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

// ### Video on Beamer ###
window.electronAPI.onVideoLoad((videoSrc) => {
  const container = document.getElementById('slide-text-container');
  if (container) {
    container.innerHTML = `
            <video id="beamer-video-player" style="width: 100vw; height: 100vh; object-fit: contain; background: black;">
                <source src="${videoSrc}" type="video/mp4">
            </video>
        `;

    const video = document.getElementById('beamer-video-player');
    video.volume = 0;
    // Sobald der Beamer genug gepuffert hat, um zu starten:
    video.oncanplay = () => {
      window.electronAPI.sendVideoReady();
    };
  }
});

window.electronAPI.onVideoControl((data) => {
  const video = document.getElementById('beamer-video-player');
  if (!video) return;

  if (data.command === 'play') video.play();
  if (data.command === 'pause') video.pause();
  if (data.command === 'seek') video.currentTime = data.time;
});
