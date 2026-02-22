const songSelect = document.getElementById('song-select');
const songSearch = document.getElementById('song-search');
const addButton = document.getElementById('add-button');
const cancelButton = document.getElementById('cancel-button');
const loadingMessage = document.getElementById('loading-message');

let allSongs = [];

// 1. Dropdown mit allen Songs füllen
async function loadSongs() {
  loadingMessage.textContent = 'Lade Songs...';

  try {
    const result = await window.electronAPI.getAllSongs();
    allSongs = result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    if (allSongs.length === 0) {
      loadingMessage.textContent =
        'Es sind keine Songs in der Datenbank vorhanden.';
      return;
    }

    loadingMessage.style.display = 'none';
    renderSongs(allSongs);

  } catch (error) {
    loadingMessage.textContent = 'Fehler beim Laden der Songs.';
    console.error('Fehler beim Laden der Songs:', error);
  }
}

function renderSongs(songsToDisplay) {
    songSelect.innerHTML = ''; // Liste leeren
    
    songsToDisplay.forEach(song => {
        const option = document.createElement('option');
        option.value = song.id;
        option.textContent = `${song.title} (${song.author || 'Unbekannt'})`;
        songSelect.appendChild(option);
    });
}

songSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredSongs = allSongs.filter(song => {
        const title = (song.title || "").toLowerCase();
        const author = (song.author || "").toLowerCase();
        return title.includes(searchTerm) || author.includes(searchTerm);
    });
    
    renderSongs(filteredSongs);
});

// 2. Event-Handler für die Auswahl
function handleSongSelectChange() {
  // Überprüfen, ob mindestens eine Option ausgewählt wurde
  const selectedOptions = Array.from(songSelect.selectedOptions);
  addButton.disabled = selectedOptions.length === 0;
}

// 3. Event-Handler für Hinzufügen (sendet Daten zurück)
function handleAddClick() {
  // Array.from macht aus der HTMLCollection ein echtes Array
  const selectedOptions = Array.from(songSelect.selectedOptions);

  if (selectedOptions.length === 0) return;

  // Erstelle ein Array mit den Daten aller ausgewählten Songs
  selectedOptions.forEach((option) => {
    const selectedId = option.value;
    const selectedSong = allSongs.find((s) => String(s.id) === selectedId);

    if (selectedSong) {
      const songData = {
        id: selectedSong.id,
        title: selectedSong.title,
        theme: selectedSong.theme,
      };

      // Sende jeden Song einzeln an das Hauptfenster
      window.electronAPI.sendSelectedSong(songData);
    }
  });
}

// 4. Start beim Laden des Fensters und Hinzufügen der Listener
window.addEventListener('DOMContentLoaded', () => {
  loadSongs();

  songSelect.addEventListener('change', handleSongSelectChange);
  addButton.addEventListener('click', handleAddClick);

  // Abbrechen schließt einfach das Fenster
  cancelButton.addEventListener('click', () => {
    window.close();
  });
});
