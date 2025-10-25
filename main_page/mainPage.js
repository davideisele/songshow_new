// JavaScript für die Split-View-Funktionalität
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

// Ablaufplan-Funktionen
const addSongButton = document.getElementById('song-add');
const songListContainer = document.getElementById('song-schedule');

var playlist = [];

addSongButton.addEventListener('click', () => {
  console.log('Add song button clicked');
  const newSongItem = document.createElement('button');
  newSongItem.classList.add('song-item');
  newSongItem.innerHTML = 'song ' + (playlist.length + 1);

  // Drag-and-Drop-Funktionalität hinzufügen (Start)
  newSongItem.setAttribute('draggable', 'true');
  newSongItem.addEventListener('dragstart', () => {
    // Eine Klasse hinzufügen, um das gezogene Element visuell zu kennzeichnen (z. B. mit geringerer Opazität)
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

    // Optional: Aktualisiere die Playlist-Array-Reihenfolge hier basierend auf der DOM-Reihenfolge
    // Dazu müsstest du alle 'song-item' Elemente im Container neu einlesen und die Playlist aktualisieren.
    updatePlaylistArray();
  });
  // Drag-and-Drop-Funktionalität hinzufügen (End)

  songListContainer.appendChild(newSongItem);
  playlist.push(newSongItem);
});

songListContainer.addEventListener('click', (event) => {
  if (event.target && event.target.classList.contains('song-item')) {
    console.log('Clicked on', event.target.innerHTML);
  }
});

// Aktualisiert das Playlist-Array wenn die Reihenfolge geändert wurde
function updatePlaylistArray() {
  playlist = [...songListContainer.querySelectorAll('.song-item')];

  console.log(
    'Playlist updated:',
    playlist.map((item) => item.innerHTML),
  );
}

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
