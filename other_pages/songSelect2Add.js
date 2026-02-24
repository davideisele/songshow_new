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
    allSongs = result.sort((a, b) =>
      (a.title || '').localeCompare(b.title || ''),
    );

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

  songsToDisplay.forEach((song) => {
    const option = document.createElement('option');
    option.value = song.id;
    option.textContent = `${song.title} (${song.author || 'Unbekannt'})`;
    songSelect.appendChild(option);
  });
  if (songsToDisplay.length > 0) {
    songSelect.selectedIndex = 0;
    handleSongSelectChange();
  }
}

songSearch.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();

  const filteredSongs = allSongs.filter((song) => {
    const title = (song.title || '').toLowerCase();
    const author = (song.author || '').toLowerCase();
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
      console.log('Sende Song an Main:', songData.title);
      window.electronAPI.sendSelectedSong(songData);
    }
    songSearch.focus();
    songSearch.select();
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

window.addEventListener('DOMContentLoaded', () => {
  loadSongs();

  // Fokus direkt auf das Suchfeld legen
  songSearch.focus();

  songSelect.addEventListener('change', handleSongSelectChange);
  addButton.addEventListener('click', handleAddClick);

  // --- NEU: Tastaturnavigation ---

  // Im Suchfeld: Bei Pfeil-nach-unten zur Liste springen
  songSearch.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      songSelect.focus();
      // Erste Option auswählen, falls noch nichts markiert ist
      if (songSelect.options.length > 0 && songSelect.selectedIndex === -1) {
        songSelect.selectedIndex = 0;
        handleSongSelectChange();
      }
    }
  });

  // In der Liste: Bei Enter hinzufügen
  songSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
  });

  cancelButton.addEventListener('click', () => {
    window.close();
  });
});

// Darkmode
function applyTheme() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// 1. Beim Laden der Seite prüfen
document.addEventListener('DOMContentLoaded', applyTheme);

// 2. Auf Änderungen von anderen Fenstern reagieren
window.addEventListener('storage', (e) => {
  if (e.key === 'darkMode') {
    applyTheme();
  }
});
