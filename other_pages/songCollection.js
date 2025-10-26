const songSelect = document.getElementById('song-select');
const loadingMessage = document.getElementById('loading-message');
const songDetailsContainer = document.getElementById('song-details-container');
const detailsForm = document.getElementById('song-details-form');
const deleteButton = document.getElementById('delete-button');

// Helper-Funktion, um Ladezustände zu setzen
function setLoading(message, isError = false) {
    loadingMessage.textContent = message;
    loadingMessage.style.display = 'block';
    loadingMessage.style.color = isError ? 'red' : '#333';
    songDetailsContainer.style.display = 'none';
}

// 1. Dropdown mit allen Songs füllen
async function loadSongs() {
    setLoading('Loading song titles...');
    songSelect.innerHTML = '<option value="">--- Select Song ---</option>'; // Reset

    try {
        const songs = await window.electronAPI.getAllSongs();
        
        if (songs.length === 0) {
            setLoading('No songs available.');
            return;
        }

        loadingMessage.style.display = 'none';

        songs.forEach(song => {
            const option = document.createElement('option');
            option.value = song.id;
            option.textContent = `${song.title} (${song.author || 'Unknown'})`;
            songSelect.appendChild(option);
        });

    } catch (error) {
        setLoading('Error loading songs: ' + error.message, true);
        console.error(error);
    }
}

// 2. Details des ausgewählten Songs anzeigen
async function displaySongDetails(songId) {
    if (!songId) {
        songDetailsContainer.style.display = 'none';
        return;
    }

    setLoading('Loading song details...');

    try {
        const song = await window.electronAPI.getSongDetails(songId);

        if (!song) {
            setLoading('Song not found', true);
            return;
        }

        // Fülle das Formular mit den Song-Details
        detailsForm.elements['id'].value = song.id;
        detailsForm.elements['title'].value = song.title;
        detailsForm.elements['author'].value = song.author || '';
        detailsForm.elements['lyrics'].value = song.lyrics;
        detailsForm.elements['originalOrder'].value = song.original_order || '';
        detailsForm.elements['theme'].value = song.theme || 'default';
        
        // Lösch-Button ID setzen
        deleteButton.setAttribute('data-id', song.id);

        loadingMessage.style.display = 'none';
        songDetailsContainer.style.display = 'block';

    } catch (error) {
        setLoading('Fehler beim Abrufen der Song-Details: ' + error.message, true);
        console.error(error);
    }
}

// 3. Event-Handler für das Löschen (beibehalten)
async function handleDeleteClick() {
    const songId = deleteButton.getAttribute('data-id');
    const songTitle = detailsForm.elements['title'].value;

    // Verwenden Sie eine einfache, nicht-native Bestätigung
    if (!confirm(`Are you sure you want to delete "${songTitle}" (ID: ${songId})?`)) {
        return;
    }

    try {
        const result = await window.electronAPI.deleteSong(songId);

        if (result.success) {
            console.log(`Song ${songId} deleted.`);
            alert(`"${songTitle}" has been successfully deleted.`);
            // Reload dropdown and clear details view
            loadSongs();
            songDetailsContainer.style.display = 'none';
        } else {
            alert('Error deleting: ' + result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('An unexpected error occurred while deleting.');
    }
}

// 4. Event-Handler für das Speichern/Bearbeiten
async function handleSaveClick(event) {
    event.preventDefault();
    const songId = detailsForm.elements['id'].value;

    const updatedSongData = {
        id: songId,
        title: detailsForm.elements['title'].value,
        author: detailsForm.elements['author'].value,
        lyrics: detailsForm.elements['lyrics'].value,
        originalOrder: detailsForm.elements['originalOrder'].value,
        theme: detailsForm.elements['theme'].value,
    };

    try {
        // Hier rufen wir den neuen IPC-Handler 'update-song' auf
        const result = await window.electronAPI.updateSong(updatedSongData); 
        
        if (result.success) {
            alert(`Song "${updatedSongData.title}" has been successfully updated.`);
            // Dropdown-Liste aktualisieren, falls der Titel geändert wurde
            loadSongs();
        } else {
            alert('Error while updating: ' + result.message);
        }
    } catch (error) {
        console.error('Editing error:', error);
        alert('An unexpected error occurred while editing.');
    }
}


// Start beim Laden des Fensters und Hinzufügen der Listener
window.addEventListener('DOMContentLoaded', () => {
    loadSongs();
    
    // Listener für Dropdown-Auswahl
    songSelect.addEventListener('change', (event) => {
        displaySongDetails(event.target.value);
    });
    
    // Listener für Löschen-Button
    deleteButton.addEventListener('click', handleDeleteClick);
    
    // Listener für Speichern/Bearbeiten-Formular
    detailsForm.addEventListener('submit', handleSaveClick);
});