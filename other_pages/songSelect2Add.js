const songSelect = document.getElementById('song-select');
const addButton = document.getElementById('add-button');
const cancelButton = document.getElementById('cancel-button');
const loadingMessage = document.getElementById('loading-message');

let allSongs = [];

// 1. Dropdown mit allen Songs füllen
async function loadSongs() {
    loadingMessage.textContent = 'Lade Songs...';
    songSelect.innerHTML = '<option value="">--- Bitte Song auswählen ---</option>';
    
    try {
        allSongs = await window.electronAPI.getAllSongs();
        
        if (allSongs.length === 0) {
            loadingMessage.textContent = 'Es sind keine Songs in der Datenbank vorhanden.';
            return;
        }

        loadingMessage.style.display = 'none';

        allSongs.forEach(song => {
            const option = document.createElement('option');
            option.value = song.id;
            option.textContent = `${song.title} (${song.author || 'Unbekannt'})`;
            songSelect.appendChild(option);
        });

    } catch (error) {
        loadingMessage.textContent = 'Fehler beim Laden der Songs.';
        console.error('Fehler beim Laden der Songs:', error);
    }
}

// 2. Event-Handler für die Auswahl
function handleSongSelectChange(event) {
    const selectedId = event.target.value;
    addButton.disabled = !selectedId;
}

// 3. Event-Handler für Hinzufügen (sendet Daten zurück)
function handleAddClick() {
    const selectedId = songSelect.value;
    if (!selectedId) return;

    const selectedSong = allSongs.find(s => String(s.id) === selectedId);

    if (selectedSong) {
        // Sende nur die notwendigen Daten zurück
        const songData = {
            id: selectedSong.id,
            title: selectedSong.title,
            theme: selectedSong.theme
        };
        // IPC-Aufruf zum Senden der Daten an das Hauptfenster und Schließen des Modals
        window.electronAPI.sendSelectedSong(songData);
    }
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
