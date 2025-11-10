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

// addSongButton.addEventListener('click', () => {
//   console.log('Add song button clicked');
//   const newSongItem = document.createElement('button');
//   newSongItem.classList.add('song-item');
//   newSongItem.innerHTML = 'song ' + (playlist.length + 1);

//   // Drag-and-Drop-Funktionalität hinzufügen (Start)
//   newSongItem.setAttribute('draggable', 'true');
//   newSongItem.addEventListener('dragstart', () => {
//     // Eine Klasse hinzufügen, um das gezogene Element visuell zu kennzeichnen (z. B. mit geringerer Opazität)
//     newSongItem.classList.add('dragging');
//     draggedItem = newSongItem;

//     // Erstelle den Platzhalter (erhält die visuelle Höhe vom CSS)
//     placeholder = document.createElement('div');
//     placeholder.classList.add('drag-placeholder');

//     // Füge eine kurze Verzögerung hinzu, um sicherzustellen, dass die Klasse gesetzt ist
//     setTimeout(() => newSongItem.classList.add('hide'), 0);
//   });

//   newSongItem.addEventListener('dragend', () => {
//     // Klasse wieder entfernen, wenn der Ziehvorgang beendet ist
//     newSongItem.classList.remove('dragging');
//     newSongItem.classList.remove('hide');
//     draggedItem = null;

//     if (placeholder && placeholder.parentNode) {
//       placeholder.parentNode.removeChild(placeholder);
//     }
//     placeholder = null;

//     updatePlaylistArray();
//   });
//   // Drag-and-Drop-Funktionalität hinzufügen (End)

//   songListContainer.appendChild(newSongItem);
//   playlist.push(newSongItem);
// });

// songListContainer.addEventListener('click', (event) => {
//   if (event.target && event.target.classList.contains('song-item')) {
//     // Ruft die neue Funktion auf, um die Auswahl zu verwalten
//     selectSong(event.target);
//     console.log('Song item clicked:', event.target.innerHTML);
//   }
// });

async function createAndAppendSongButton(songData) {
  const newSongItem = document.createElement('button');
  newSongItem.textContent = songData.title;
  newSongItem.classList.add('song-item');
  newSongItem.setAttribute('data-song-id', songData.id); // WICHTIG: Speichere die ID

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

  const themeData = await fetchThemeStyles(songData.theme);
  console.log('Theme data:', themeData);

    if (themeData) {
        applyThemeStyles(themeData, document.documentElement); // Wenden Sie Styles auf den Root an
        sendThemeToMain(themeData); // Senden Sie die Styles an das Beamer-Fenster
      }
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
function applyThemeStyles(themeData, targetElement) {
    // Gehen Sie die Styles für den Selektor durch, den Sie in der JSON-Datei definiert haben
    const slideContentStyles = themeData['.slide-content'];

    if (slideContentStyles) {
        // Setzen Sie jede Eigenschaft als CSS Custom Property auf dem Ziel-Element
        for (const [property, value] of Object.entries(slideContentStyles)) {
            // Beispiel: 'text-align' wird zu '--slide-text-align'
            console.log(`Setting CSS variable --slide-${property} to ${value}`);
            const cssVariable = `--slide-${property}`;
            targetElement.style.setProperty(cssVariable, value);
        }
    }
}

// Funktion zum Anwenden der Theme-Styles auf Beamer-Fenster
function sendThemeToMain(themeData) {
    // Prüfen Sie, ob die API vorhanden ist (Electron-Check)
    if (window.electronAPI && window.electronAPI.sendThemeToMain) {
        window.electronAPI.sendThemeToMain(themeData);
        console.log('Hauptfenster: Theme-Daten gesendet:', themeData);
    }
}

// ** GEÄNDERT: Öffnet jetzt das Song-Auswahl-Modal **
addSongButton.addEventListener('click', () => {
  console.log('Add song button clicked: Opening selection modal');
  // Ruft die Funktion in preload.js auf, um das Auswahlfenster zu öffnen
  window.electronAPI.openSongSelectWindow();
});

// ** GEÄNDERT: Click-Handler wurde auf async geändert und ruft Lyrics ab **
songListContainer.addEventListener('click', async (event) => {
  if (event.target && event.target.classList.contains('song-item')) {
    // Ruft die Funktion auf, um die Auswahl zu verwalten
    selectSong(event.target);

    const songId = event.target.getAttribute('data-song-id');

    if (songId) {
      // Rufe die Lyrics aus der Datenbank ab
      const lyrics = await window.electronAPI.getSongLyrics(songId);
      const rightPanel = document.getElementById('right-panel');
      const slides = lyrics.split('---').map((slide) => slide.trim());
      let slidesHTML = '';
      let lastLabel = '';
      let lastLabelClass = '';

      slides.forEach((slideText, index) => {
        if (slideText) {
          let label = ``; // Standard-Label
          let content = slideText;
          let labelClass = 'default-label'; // Standard-Klasse für CSS
          let labelFound = false;

          const labelMatch = slideText.match(/^\[(.*?)\]\s*[\r\n]/);

          if (labelMatch) {
            labelFound = true;
            label = labelMatch[1].trim();
            content = slideText.substring(labelMatch[0].length).trim();
            const baseLabel = label.split(' ')[0].toLowerCase();

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
          }

          const formattedText = content.replace(/\n/g, '<br>');

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
      } else {
        console.error('Element mit ID "right-panel" nicht gefunden.');
      }
    } else {
      console.log('Song item clicked (no ID found):', event.target.innerHTML);
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
    console.log('Selected:', songItem.innerHTML);
  } else {
    selectedSong = null; // Deselektiert, falls es das gleiche Element war
  }
}

// Entfernen eines ausgewählten Songs
const removeSongButton = document.getElementById('song-remove');

removeSongButton.addEventListener('click', () => {
  console.log('Remove song button clicked');
  if (selectedSong) {
    songListContainer.removeChild(selectedSong);
    console.log('Removed:', selectedSong.innerHTML);
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
  console.log('Move up song button clicked');
  const currentIndex = playlist.indexOf(selectedSong);
  const targetSong = playlist[currentIndex - 1];

  if (currentIndex > 0) {
    songListContainer.insertBefore(selectedSong, targetSong);
    updatePlaylistArray();
    console.log(`Song nach oben verschoben: ${selectedSong.innerHTML}`);
  } else {
    console.log('Der Song ist bereits an erster Position.');
  }
});

moveDownSongButton.addEventListener('click', () => {
  console.log('Move down song button clicked');
  const currentIndex = playlist.indexOf(selectedSong);
  if (currentIndex < playlist.length - 1) {
    const targetIndex = currentIndex + 1;
    const targetSong = playlist[targetIndex];

    songListContainer.insertBefore(selectedSong, targetSong.nextSibling);

    [playlist[currentIndex], playlist[targetIndex]] = [
      playlist[targetIndex],
      playlist[currentIndex],
    ];

    console.log(`Song nach unten verschoben: ${selectedSong.innerHTML}`);
  } else {
    console.log('Der Song ist bereits an letzter Position.');
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

  console.log(
    'Playlist updated:',
    playlist.map((item) => item.innerHTML),
  );
}
// Ende der Drag-and-Drop-Logik

// Ende der Ablaufplan-Funktionen

// ### Datenbank-Funktionen ###

document.addEventListener('DOMContentLoaded', async () => {
  const songs = await window.electronAPI.getAllSongs();
  console.log('All songs from database:', songs);

  if (window.electronAPI && window.electronAPI.onSongSelected) {
    window.electronAPI.onSongSelected((songData) => {
      // songData enthält { id: 1, title: 'Mein Song' }
      console.log('Selected song received:', songData);
      createAndAppendSongButton(songData);
      updatePlaylistArray();
    });
  }
});

// ### Songs auf Beamer Anzeigen Logik
const staticContainer = document.getElementById('right-panel');

if (staticContainer) {
  staticContainer.addEventListener('click', function (event) {
    const clickedSlide = event.target.closest('[class^="song-slide"]');

    if (clickedSlide) {
      const slideContent = clickedSlide.querySelector('.slide-content');
      const content = slideContent.innerHTML;
      window.electronAPI.openSongOnBeamer(content);
      console.log('Inhalt der Slide:', content);
    }
  });
} else {
  console.error(
    'Das statische Element "#right-panel" wurde für die Event Delegation nicht gefunden.',
  );
}
