// ### JavaScript für die Split-View-Funktionalität ###

const splitter = document.getElementById('splitter');
const leftPanel = document.getElementById('left-panel');
const splitView = document.getElementById('split-view');

let isDragging = false;

// 1. Start des Ziehvorgangs (Maus geklickt)
splitter.addEventListener('mousedown', (e) => {
  isDragging = true;
  splitView.classList.add('dragging');
  e.preventDefault();
});

// 2. Ziehen (Maus bewegt)
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const newLeftWidth = e.clientX;
  const containerWidth = splitView.offsetWidth;
  const newWidthPercentage = (newLeftWidth / containerWidth) * 100;

  leftPanel.style.width = `${newWidthPercentage}vw`;
});

// 3. Ende des Ziehvorgangs (Maus losgelassen)
document.addEventListener('mouseup', (e) => {
  if (isDragging) {
    isDragging = false;
    splitView.classList.remove('dragging');
  }
});

// Ende der Split-View-Funktionalität

// ### Ablaufplan-Funktionen ###

// Button zum Hinzufügen, Entfernen und Verschieben von Songs und Container für die Song-Liste

// Song Hinzufügen
const addSongButton = document.getElementById('song-add');
const songListContainer = document.getElementById('song-schedule');

var playlist = [];
var selectedSong = null;

async function createAndAppendSongButton(songData) {
  const newSongItem = document.createElement('button');
  newSongItem.textContent = songData.title;
  newSongItem.classList.add('song-item');
  newSongItem.setAttribute('data-song-id', songData.id); // WICHTIG: Speichere die ID
  newSongItem.setAttribute('data-song-theme', songData.theme); // WICHTIG: Speichere das Theme

  // Drag-and-Drop-Funktionalität hinzufügen (Start)
  newSongItem.setAttribute('draggable', 'true');
  newSongItem.addEventListener('dragstart', () => {
    // Eine Klasse hinzufügen, um das gezogene Element visuell zu kennzeichnen
    newSongItem.classList.add('dragging');
    draggedItem = newSongItem;

    // Erstelle den Platzhalter (erhält die visuelle Höhe vom CSS)
    placeholder = document.createElement('div');
    placeholder.classList.add('drag-placeholder');

    // Füge eine kurze Verzögerung hinzu, um sicherzustellen, dass die Klasse gesetzt ist
    setTimeout(() => newSongItem.classList.add('hide'), 0);
  });

  newSongItem.addEventListener('dragend', () => {
    // Klasse wieder entfernen, wenn der Ziehvorgang beendet ist
    newSongItem.classList.remove('dragging');
    newSongItem.classList.remove('hide');
    draggedItem = null;

    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;

    updatePlaylistArray();
  });
  // Drag-and-Drop-Funktionalität hinzufügen (End)

  songListContainer.appendChild(newSongItem);
  playlist.push(newSongItem); // Zur internen Verfolgung hinzufügen

  // Wende das Theme-Style an

  // const themeData = await fetchThemeStyles(songData.theme);

  // if (themeData) {
  //   applyThemeStyles(themeData, document.documentElement); // Wenden Sie Styles auf den Root an
  //   sendThemeToMain(themeData); // Senden Sie die Styles an das Beamer-Fenster
  // }
}

// Funktion für das Übernehmen des Theme-Styles
async function fetchThemeStyles(themeName) {
  // Erstellen des Pfades zur JSON-Datei, z.B. '/theme/default.json'
  const themePath = `../themes/${themeName}.json`;

  try {
    const response = await fetch(themePath);

    if (!response.ok) {
      throw new Error(`Fehler beim Laden des Themes: ${response.status}`);
    }

    const themeData = await response.json();
    return themeData;
  } catch (error) {
    console.error('Konnte Theme-Daten nicht laden:', error);
    return null;
  }
}

// Funktion zum Anwenden der Theme-Styles
// function applyThemeStyles(themeData, targetElement) {
//   // Gehen Sie die Styles für den Selektor durch, den Sie in der JSON-Datei definiert haben
//   const slideContentStyles = themeData['.slide-content'];

//   if (slideContentStyles) {
//     // Setzen Sie jede Eigenschaft als CSS Custom Property auf dem Ziel-Element
//     for (const [property, value] of Object.entries(slideContentStyles)) {
//       // Beispiel: 'text-align' wird zu '--slide-text-align'
//       const cssVariable = `--slide-${property}`;
//       targetElement.style.setProperty(cssVariable, value);
//     }
//   }
// }
function applyThemeStyles(themeData, targetElement) {
  // 1. Zuerst die Video-Prüfung durchführen
  if (themeData.hasOwnProperty('background-video')) {
    const videoPath = themeData['background-video'];
    handleVideoBackground(videoPath);
    // Das background-video-Objekt aus themeData entfernen, damit es nicht als CSS-Variable gesetzt wird
    // delete themeData['background-video'];
  } else {
    // Sicherstellen, dass ein vorhandenes Video entfernt wird, wenn das Theme es nicht benötigt
    removeVideoBackground();
  }
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
          console.log( "Styles",cssVariable + value)

          targetElement.style.setProperty(cssVariable, value);
        }
      }
    }
  }
}

function handleVideoBackground(videoPath, themeData) {
        // Wähle ALLE .slide-content Elemente
        const slideContentContainers = document.querySelectorAll('.slide-inner-content'); 
        
        if (slideContentContainers.length === 0) {
            console.warn('Kein Element mit der Klasse .slide-content gefunden. Video-Hintergrund kann nicht angewendet werden.');
            removeVideoBackground();
            return;
        }

        // 1. Container-Vorbereitungen und Video-Erstellung/Aktualisierung für JEDEN Container
        slideContentContainers.forEach((slideContentContainer, index) => {
            // Jedes Video erhält eine eindeutige ID
            const videoId = `theme-background-video-${index}`;
            // Suche das Video innerhalb DIESES Containers
            let videoElement = slideContentContainer.querySelector(`#${videoId}`);
            
            // 1a. Container-Vorbereitungen (wichtig für absolute Positionierung des Videos)
            slideContentContainer.style.position = 'relative';
            slideContentContainer.style.zIndex = '1'; // Inhaltsebene
            slideContentContainer.style.overflow = 'hidden'; 

            // 1b. Video-Erstellung und -Injection
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.id = videoId;
                videoElement.className = 'background-video'; // Klasse für das Styling (in styles.css)
                videoElement.autoplay = true;
                videoElement.loop = true;
                videoElement.muted = true;
                videoElement.playsinline = true; 

                // Füge das Video als erstes Kind in den Container ein (unter den Text-Inhalt)
                slideContentContainer.prepend(videoElement);
            }
            
            // 1c. Pfad-Setzung (Source-Element-Management)
            const source = videoElement.querySelector('source') || document.createElement('source');
            if (!source.parentElement) {
                videoElement.appendChild(source);
            }
            
            const actualVideoPath = videoPath; 
            
            if (source.getAttribute('src') !== actualVideoPath) {
                source.setAttribute('src', actualVideoPath);
                source.setAttribute('type', 'video/mp4');
                // Das Video muss neu geladen werden, wenn sich der Pfad ändert
                videoElement.load(); 
            }

            if (themeData && themeData['background-poster']) {
                videoElement.setAttribute('poster', themeData['background-poster']);
            }
        });
        
        // Cleanup: Alte Videos aus vorherigen Läufen entfernen, die keine eindeutige ID haben (falls vorhanden)
        document.querySelectorAll('video.background-video:not([id^="theme-background-video-"])').forEach(oldVideo => oldVideo.remove());
    }

    /**
     * Entfernt das <video>-Element aus dem DOM.
     */
    function removeVideoBackground() {
    // Finde alle Video-Elemente, die wir erstellt haben
    const videoElements = document.querySelectorAll('[id^="theme-background-video-"]');
    
    videoElements.forEach(videoElement => {
        const parent = videoElement.parentElement;
        videoElement.remove();
        
        // Setze die durch JS hinzugefügten Container-Styles ZURÜCK
        if (parent && parent.classList.contains('slide-content')) {
             parent.style.position = '';
             parent.style.zIndex = '';
             parent.style.overflow = '';
        }
    });
}

// Funktion zum Anwenden der Theme-Styles auf Beamer-Fenster
function sendThemeToMain(themeData) {
  // Prüfen Sie, ob die API vorhanden ist (Electron-Check)
  if (window.electronAPI && window.electronAPI.sendThemeToMain) {
    window.electronAPI.sendThemeToMain(themeData);
  }
}

// ** GEÄNDERT: Öffnet jetzt das Song-Auswahl-Modal **
addSongButton.addEventListener('click', () => {
  // Ruft die Funktion in preload.js auf, um das Auswahlfenster zu öffnen
  window.electronAPI.openSongSelectWindow();
});

// ** GEÄNDERT: Click-Handler wurde auf async geändert und ruft Lyrics ab **
songListContainer.addEventListener('click', async (event) => {
  if (event.target && event.target.classList.contains('song-item')) {
    // Ruft die Funktion auf, um die Auswahl zu verwalten
    selectSong(event.target);

    const songId = event.target.getAttribute('data-song-id');
    const songTheme = event.target.getAttribute('data-song-theme');

    if (songId) {
      if (songTheme) {
        const themeData = await fetchThemeStyles(songTheme);

        if (themeData) {
          applyThemeStyles(themeData, document.documentElement); // Wenden Sie Styles auf den Root an
          sendThemeToMain(themeData); // Senden Sie die Styles an das Beamer-Fenster
        }
      }

      // Rufe die Lyrics aus der Datenbank ab
      const fullLyrics = await window.electronAPI.getSongLyrics(songId);
      const rightPanel = document.getElementById('right-panel');

      // 1. Extrahiere Originaltext und Übersetzung
      // Der Originaltext ist alles VOR der geschweiften Klammer
      const originalLyricsMatch = fullLyrics.match(/^(.*)\s*\{/s);
      const originalText = originalLyricsMatch
        ? originalLyricsMatch[1].trim()
        : fullLyrics.trim();

      // Die Übersetzung ist der Inhalt INNERHALB der geschweiften Klammern
      const translationMatch = fullLyrics.match(/\{([\s\S]*)\}/);
      const translationText = translationMatch
        ? translationMatch[1].trim()
        : '';

      // Teile den Originaltext in Slides (basierend auf '---')
      const originalSlides = originalText
        .split('---')
        .map((slide) => slide.trim());

      // Teile den Übersetzungstext in einzelne Zeilen
      // Wichtig: Wir müssen hier die Struktur des Originaltextes ignorieren (Labels wie [Chorus]),
      // da die Übersetzung nur die reinen Zeilen enthält.
      const translationLines = translationText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0); // Leere Zeilen entfernen

      let slidesHTML = '';
      let lastLabel = '';
      let lastLabelClass = '';
      let translationLineIndex = 0; // Zähler für die Zeilen der Übersetzung

      // 2. Verarbeite die Original-Slides und synchronisiere die Übersetzung
      originalSlides.forEach((slideText, index) => {
        if (slideText) {
          let label = ``; // Standard-Label
          let content = slideText;
          let labelClass = 'default-label'; // Standard-Klasse für CSS
          let labelFound = false;

          const labelMatch = slideText.match(/^\[(.*?)\]\s*[\r\n]/);

          // Extrahiere das Label und den reinen Inhalt
          if (labelMatch) {
            labelFound = true;
            label = labelMatch[1].trim();
            content = slideText.substring(labelMatch[0].length).trim();
            const baseLabel = label.split(' ')[0].toLowerCase();

            // Setze die Label-Klasse
            if (baseLabel.includes('verse')) {
              labelClass = 'label-verse';
            } else if (
              baseLabel.includes('chorus') ||
              baseLabel.includes('refrain')
            ) {
              labelClass = 'label-chorus';
            } else if (baseLabel.includes('bridge')) {
              labelClass = 'label-bridge';
            } else if (
              baseLabel.includes('intro') ||
              baseLabel.includes('outro') ||
              baseLabel.includes('tag')
            ) {
              labelClass = 'label-transition';
            }

            lastLabel = label;
            lastLabelClass = labelClass;
          } else if (lastLabel !== '') {
            label = `${lastLabel} (...)`;
            labelClass = lastLabelClass;
          } else {
            // Kein Label im aktuellen Slide und auch kein vorheriges Label gefunden
          }

          // Teile den **bereinigten Inhalt** in Originalzeilen
          const originalLines = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          let mergedContent = [];

          // Führe Original- und Übersetzungszeilen zusammen
          originalLines.forEach((originalLine) => {
            // Füge die Originalzeile hinzu
            mergedContent.push(originalLine);

            // Füge die entsprechende Übersetzungszeile hinzu, falls verfügbar
            if (translationLineIndex < translationLines.length) {
              // Füge die Übersetzungszeile hinzu und setze sie in ein Span mit einer Klasse,
              // um sie bei Bedarf anders stylen zu können (z.B. kursiv, kleiner)
              mergedContent.push(
                `<span class="translation-line">${translationLines[translationLineIndex]}</span>`,
              );
              translationLineIndex++;
            }
          });

          // 3. Erzeuge das endgültige HTML
          // Ersetze \n durch <br> im zusammengeführten Inhalt
          // Da wir das Array `mergedContent` verwenden, fügen wir <br> zwischen den Zeilen ein.
          const formattedText = mergedContent.join('<br>');

          slidesHTML += `
                        <div class="song-slide ${labelClass}" data-slide-index="${index}">
                            <div class="slide-header">
                                <p class="slide-label">${label}</p>
                            </div>
                            <div class="slide-inner-content">
                                <div class="slide-content">${formattedText}</div>
                            </div>
                        </div>
                    `;
        }
      });

      if (rightPanel) {
        rightPanel.innerHTML = `
                    <h2>Songtext: ${event.target.textContent}</h2>
                    <div id="slides-container">
                        ${slidesHTML}
                    </div>
                `;
      }
    }
  }
});

// Funktion zum Auswählen eines Songs
function selectSong(songItem) {
  // 1. Deselektiere das zuvor ausgewählte Element
  if (selectedSong && selectedSong !== songItem) {
    selectedSong.classList.remove('selected');
  }

  // 2. Wähle das neue Element aus (toggle für den Fall, dass man das gleiche Element erneut klickt)
  songItem.classList.toggle('selected');

  // 3. Aktualisiere die Verfolgungsvariable
  if (songItem.classList.contains('selected')) {
    selectedSong = songItem;
  } else {
    selectedSong = null; // Deselektiert, falls es das gleiche Element war
  }
}

// Entfernen eines ausgewählten Songs
const removeSongButton = document.getElementById('song-remove');

removeSongButton.addEventListener('click', () => {
  if (selectedSong) {
    songListContainer.removeChild(selectedSong);
    const index = playlist.indexOf(selectedSong);
    if (index > -1) {
      playlist.splice(index, 1);
    }
  }
});

// Verschieben eines ausgewählten Songs
const moveUpSongButton = document.getElementById('song-up');
const moveDownSongButton = document.getElementById('song-down');

moveUpSongButton.addEventListener('click', () => {
  const currentIndex = playlist.indexOf(selectedSong);
  const targetSong = playlist[currentIndex - 1];

  if (currentIndex > 0) {
    songListContainer.insertBefore(selectedSong, targetSong);
    updatePlaylistArray();
  } else {
  }
});

moveDownSongButton.addEventListener('click', () => {
  const currentIndex = playlist.indexOf(selectedSong);
  if (currentIndex < playlist.length - 1) {
    const targetIndex = currentIndex + 1;
    const targetSong = playlist[targetIndex];

    songListContainer.insertBefore(selectedSong, targetSong.nextSibling);

    [playlist[currentIndex], playlist[targetIndex]] = [
      playlist[targetIndex],
      playlist[currentIndex],
    ];
  }
});

// Button zum Hinzufügen, Entfernen und Verschieben von Songs und Container für die Song-Liste (ENDE)

// # Drag-and-Drop-Logik #

let draggedItem = null;

songListContainer.addEventListener('dragover', (e) => {
  e.preventDefault();

  if (!draggedItem || !placeholder) return;

  const afterElement = getDragAfterElement(songListContainer, e.clientY);

  if (placeholder.parentNode) {
    placeholder.parentNode.removeChild(placeholder);
  }

  //   const currentDraggingElement = document.querySelector('.dragging');
  if (afterElement == null) {
    // Am Ende der Liste einfügen
    songListContainer.appendChild(placeholder);
  } else {
    // Vor dem gefundenen Element einfügen
    songListContainer.insertBefore(placeholder, afterElement);
  }
});

songListContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!draggedItem || !placeholder || !placeholder.parentNode) return;

  // 3. Füge das gezogene Element an der Position des Platzhalters ein
  songListContainer.insertBefore(draggedItem, placeholder);

  // 4. Entferne den Platzhalter nach dem Drop
  placeholder.parentNode.removeChild(placeholder);
  placeholder = null;

  // Die dragend-Logik wird separat ausgelöst, aber wir können hier aufräumen
  draggedItem.classList.remove('dragging');
  draggedItem = null;
  updatePlaylistArray();
});

function getDragAfterElement(container, y) {
  // Alle Elemente außer dem, das gerade gezogen wird
  const draggableElements = [
    ...container.querySelectorAll('.song-item:not(.dragging)'),
  ];
  // Reduziert die Liste auf das Element, das dem y-Wert am nächsten ist
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      // Abstand von der Mausposition zur Mitte des Elements
      const offset = y - box.top - box.height / 2;

      // Wenn der Offset negativ ist (Maus ist über der Mitte des Kind-Elements)
      // und näher am Offset als der bisher gefundene engste Wert ist
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

// Aktualisiert das Playlist-Array wenn die Reihenfolge geändert wurde
function updatePlaylistArray() {
  playlist = [...songListContainer.querySelectorAll('.song-item')];
}
// Ende der Drag-and-Drop-Logik

// Ende der Ablaufplan-Funktionen

// ### Datenbank-Funktionen ###

document.addEventListener('DOMContentLoaded', async () => {
  const songs = await window.electronAPI.getAllSongs();

  if (window.electronAPI && window.electronAPI.onSongSelected) {
    window.electronAPI.onSongSelected((songData) => {
      // songData enthält { id: 1, title: 'Mein Song' }
      createAndAppendSongButton(songData);
      updatePlaylistArray();
    });
  }
});

// ### Songs auf Beamer Anzeigen Logik
const staticContainer = document.getElementById('right-panel');
const highlightClass = 'selected-slide-highlight';

const nextButton = document.getElementById('next-slide');
const prevButton = document.getElementById('prev-slide');

// if (staticContainer) {
//   staticContainer.addEventListener('click', function (event) {
//     const clickedSlide = event.target.closest('[class^="song-slide"]');

//     if (clickedSlide) {
//       const currentlyHighlighted = staticContainer.querySelector(`.${highlightClass}`);
//       if (currentlyHighlighted && currentlyHighlighted !== clickedSlide) {
//         currentlyHighlighted.classList.remove(highlightClass);
//       }

//       // 2. Markierung zur angeklickten Folie hinzufügen
//       clickedSlide.classList.add(highlightClass);

//       const slideContent = clickedSlide.querySelector('.slide-content');
//       const content = slideContent.innerHTML;
//       window.electronAPI.openSongOnBeamer(content);
//     }
//   });
// } else {
//   console.error(
//     'Das statische Element "#right-panel" wurde für die Event Delegation nicht gefunden.',
//   );
// }

function selectSlide(slideElement) {
  if (!slideElement) return;

  // 1. Markierung von der zuvor markierten Folie entfernen
  const currentlyHighlighted = staticContainer.querySelector(
    `.${highlightClass}`,
  );
  if (currentlyHighlighted && currentlyHighlighted !== slideElement) {
    currentlyHighlighted.classList.remove(highlightClass);
  }

  // 2. Markierung zur neuen Folie hinzufügen
  slideElement.classList.add(highlightClass);

  // 3. Logik zum Öffnen des Beamers
  const slideContent = slideElement.querySelector('.slide-content');
  const content = slideContent.innerHTML;
  lastSlideContent = content;
  currentSpecialMode = 'slide';
  window.electronAPI.openSongOnBeamer(content);
  window.electronAPI.showSlide();
}

// --- 1. Bestehender Click-Listener (für manuelle Auswahl) ---

if (staticContainer) {
  staticContainer.addEventListener('click', function (event) {
    const clickedSlide = event.target.closest('[class^="song-slide"]');

    if (clickedSlide) {
      selectSlide(clickedSlide);
    }
  });
} else {
  console.error(
    'Das statische Element "#right-panel" wurde für die Event Delegation nicht gefunden.',
  );
}

// --- 2. Neue Event-Listener für die Navigation-Buttons ---

if (nextButton && prevButton && staticContainer) {
  /** Liefert alle Folien-Elemente im Container zurück */
  const getAllSlides = () => {
    // Wichtig: Array.from nutzen, um die NodeList einfacher zu handhaben
    return Array.from(
      staticContainer.querySelectorAll('[class^="song-slide"]'),
    );
  };

  nextButton.addEventListener('click', () => {
    const slides = getAllSlides();
    const currentSlide = staticContainer.querySelector(`.${highlightClass}`);

    let targetIndex = 0; // Standardmäßig die erste Folie, wenn keine ausgewählt ist

    if (currentSlide) {
      // Aktuellen Index abrufen und +1 für die nächste Folie
      const currentIndex = parseInt(currentSlide.dataset.slideIndex);
      targetIndex = currentIndex + 1;
    }

    // Überprüfen, ob der Ziel-Index innerhalb der Grenzen liegt
    if (targetIndex < slides.length) {
      // Die Folie mit dem passenden data-slide-index finden
      const nextSlide = slides.find(
        (slide) => parseInt(slide.dataset.slideIndex) === targetIndex,
      );
      selectSlide(nextSlide);
    }
  });

  prevButton.addEventListener('click', () => {
    const slides = getAllSlides();
    const currentSlide = staticContainer.querySelector(`.${highlightClass}`);

    if (!currentSlide) {
      // Keine Folie ausgewählt, keine Aktion
      return;
    }

    // Aktuellen Index abrufen und -1 für die vorherige Folie
    const currentIndex = parseInt(currentSlide.dataset.slideIndex);
    const targetIndex = currentIndex - 1;

    // Überprüfen, ob der Ziel-Index größer oder gleich 0 ist (erste Folie)
    if (targetIndex >= 0) {
      // Die Folie mit dem passenden data-slide-index finden
      const prevSlide = slides.find(
        (slide) => parseInt(slide.dataset.slideIndex) === targetIndex,
      );
      selectSlide(prevSlide);
    }
  });
}

// ### Dropdownliste in der Main Page für Theme-Auswahl ###

// Stellen Sie sicher, dass Sie diese Module importieren können.
// Das ist im Main Process oder in einem Preload-Skript/Renderer Process (mit nodeIntegration) möglich.

function getThemeOptions() {
  // Definieren Sie den Pfad zu Ihrem themes-Ordner.
  // __dirname ist der Pfad zum aktuellen Skript.
  // Passen Sie den Pfad relativ zu Ihrem Projekt an.
  const themesDir = path.join(__dirname, 'themes');

  let themeNames = [];

  try {
    // 1. Alle Dateien und Ordner im Verzeichnis auslesen
    const files = fs.readdirSync(themesDir);

    // 2. Nur die Dateien behalten, die auf '.json' enden
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    // 3. Dateinamen ohne die Erweiterung extrahieren
    themeNames = jsonFiles.map((file) => path.parse(file).name);
  } catch (err) {
    console.error('Fehler beim Lesen des themes-Ordners:', err);
    // Fallback oder Fehlerbehandlung
  }

  // Fügt eine Standardoption hinzu, falls diese nicht als Datei existiert
  themeNames.unshift('default');

  return themeNames;
}

document.addEventListener('DOMContentLoaded', async () => {
  const themeSelector = document.getElementById('theme-selector');

  try {
    // 1. Die Anfrage an den Main Process über die exponierte API stellen
    // window.themeAPI.getThemes() ruft den ipcMain.handle('get-theme-list', ...) auf
    const themeNames = await window.electronAPI.getThemes();

    // 2. Bestehende Optionen entfernen (außer die initialen Default-Optionen)
    // Setzen Sie den innerHTML auf einen leeren String oder nur auf die <option value="default">
    themeSelector.innerHTML = '';

    // 3. Dropdown-Liste dynamisch befüllen
    themeNames.forEach((theme) => {
      const option = document.createElement('option');

      // Wert der Option: Dateiname (z.B. "dark")
      option.value = theme;

      // Angezeigter Text: Erster Buchstabe groß (z.B. "Dark")
      option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);

      themeSelector.appendChild(option);
    });
  } catch (error) {
    console.error(
      'Konnte Theme-Liste nicht abrufen oder Dropdown befüllen:',
      error,
    );
    // Fehlerbehandlung in der UI, falls die Kommunikation fehlschlägt
  }
});

// Dropdownliste aktualisiert das Theme des ausgewählten Songs
const themeSelector = document.getElementById('theme-selector');

themeSelector.addEventListener('change', async (event) => {
  // 1. Prüfen, ob ein Song ausgewählt ist
  if (!selectedSong) {
    console.warn(
      'Kein Song ausgewählt. Das Theme kann nicht zugewiesen werden.',
    );
    return; // Vorgang abbrechen, wenn kein Song ausgewählt ist
  }

  // 2. Den neuen Theme-Namen aus der Dropdown-Auswahl ermitteln
  const newThemeName = event.target.value;

  // 3. Den 'data-song-theme' Attributwert des ausgewählten Songs aktualisieren
  selectedSong.setAttribute('data-song-theme', newThemeName);

  // 4. Das neue Theme laden und anwenden (Verwenden der vorhandenen Funktionen)

  const themeData = await fetchThemeStyles(newThemeName);

  if (themeData) {
    // Wende Styles auf den Root an (ändert die Darstellung der Folien rechts)
    applyThemeStyles(themeData, document.documentElement);

    // Sende die Styles an das Beamer-Fenster
    sendThemeToMain(themeData);

    // Optional: Visuelles Feedback im UI
    // Sie könnten hier eine kurze Nachricht anzeigen, dass das Theme angewendet wurde
  }
});

// ### Button Implementation für Blackscreen, Hintergrund und Desktop anzeigen ###
let currentSpecialMode = 'slide'; // Kann 'slide', 'black', 'background', oder 'desktop' sein

// Referenzen zu den neuen Buttons abrufen
const blackScreenButton = document.getElementById('black-screen');
const showBackgroundButton = document.getElementById('show-background');
const showDesktopButton = document.getElementById('show-desktop');

// --- Blackscreen Logik ---
if (blackScreenButton) {
  blackScreenButton.addEventListener('click', () => {
    if (currentSpecialMode === 'black') {
      // Zustand ist bereits Blackscreen -> Zurück zur letzten Folie
      currentSpecialMode = 'slide';
      window.electronAPI.showSlide();
    } else {
      // Zustand ist eine Folie/Hintergrund/Desktop -> Auf Blackscreen wechseln
      currentSpecialMode = 'black';
      // Senden Sie einen speziellen Befehl für Blackscreen an den Beamer
      window.electronAPI.showBlackscreen();
    }
  });
}

// --- Hintergrund Logik ---
if (showBackgroundButton) {
  showBackgroundButton.addEventListener('click', () => {
    if (currentSpecialMode === 'background') {
      // Zustand ist Hintergrund -> Zurück zur letzten Folie
      currentSpecialMode = 'slide';
      window.electronAPI.showSlide();
    } else {
      // Zustand ist eine Folie/Blackscreen/Desktop -> Nur Hintergrund anzeigen
      currentSpecialMode = 'background';
      // Senden Sie einen speziellen Befehl, um nur den Hintergrund anzuzeigen
      window.electronAPI.showBackgroundOnly();
    }
  });
}

// --- Desktop Logik ---
if (showDesktopButton) {
  showDesktopButton.addEventListener('click', () => {
    if (currentSpecialMode === 'desktop') {
      // Zustand ist Desktop -> Zurück zur letzten Folie
      currentSpecialMode = 'slide';
      window.electronAPI.showSlide();
    } else {
      // Zustand ist eine Folie/Blackscreen/Hintergrund -> Desktop anzeigen
      currentSpecialMode = 'desktop';
      // Senden Sie einen speziellen Befehl, um den Desktop anzuzeigen
      window.electronAPI.showDesktop();
    }
  });
}

// ### Hotkey-Logik für die Main Page ###

let hotkeyConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Laden der Hotkeys über die im Preload-Skript definierte API
  // Die 'hotkeyApi' ist durch die Context Bridge im 'window'-Objekt verfügbar
  if (
    window.electronAPI &&
    typeof window.electronAPI.loadHotkeys === 'function'
  ) {
    hotkeyConfig = await window.electronAPI.loadHotkeys();
    // console.log('Geladene Hotkeys:', hotkeyConfig);
  } else {
    console.error(
      'hotkeyApi ist nicht verfügbar. Ist das Preload-Skript korrekt eingerichtet?',
    );
    // Fallback-Logik, falls das Laden fehlschlägt
  }
});

document.addEventListener('keydown', (event) => {
  // ... Überprüfung, ob der Benutzer in ein Textfeld tippt (bleibt gleich)
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  // Verhindert das Standard-Scrollen/Verhalten des Browsers, wenn ein Hotkey erkannt wird
  event.preventDefault();

  // Iterieren über die geladene Konfiguration
  for (const action in hotkeyConfig) {
    if (hotkeyConfig[action].includes(event.key)) {
      let targetButton = null;

      // Mapping von Konfigurations-Aktion zu Button-ID
      switch (action) {
        case 'nextSlide':
          targetButton = nextButton;
          // console.log('Next Slide Hotkey gedrückt' + action);
          break;
        case 'prevSlide':
          targetButton = prevButton;
          break;
        case 'toggleBlackScreen':
          // Stellen Sie sicher, dass Sie hier die richtige ID/Variable für blackScreenButton haben
          // Da Ihr ursprünglicher Code 'blackScreenButton.click()' verwendet,
          // müssen Sie diese Variable in Ihrem Code definieren (z.B. durch getElementById)
          // Hier ein Beispiel für die Verwendung einer ID:
          targetButton = blackScreenButton;
          break;
        case 'toggleBackground':
          targetButton = showBackgroundButton;
          break;
        case 'toggleDesktop':
          targetButton = showDesktopButton;
          break;
        default:
          console.warn(`Unbekannte Hotkey-Aktion in JSON: ${action}`);
          return; // Beendet die Verarbeitung für diesen Hotkey
      }

      if (targetButton) {
        targetButton.click(); // Führt die Aktion aus
        return; // Beendet die Funktion nach dem Auslösen des Hotkeys
      } else {
        console.error(
          `Der Ziel-Button für die Aktion '${action}' wurde nicht gefunden.`,
        );
      }
    }
  }
});
