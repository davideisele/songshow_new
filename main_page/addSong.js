// Has function to create Song in Schedule

// Song Hinzufügen
const addSongButton = document.getElementById('song-add');
const songListContainer = document.getElementById('song-schedule');

var playlist = [];
var selectedSong = null;
let placeholder = null;

async function createAndAppendSongButton(songData) {
  console.log('Erstelle Button für:', songData.title);
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