document.getElementById('import-song-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const songData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        lyrics: document.getElementById('lyrics').value,
        originalOrder: document.getElementById('originalOrder').value,
        theme: document.getElementById('theme').value,
    };

    const result = await window.electronAPI.addNewSong(songData);

    if (result.success) {
        alert('Song saved successfully!');
        // Schließt das Fenster nach erfolgreichem Speichern
        window.close();
    } else {
        alert('Error saving song: ' + result.message);
    }
});

document.getElementById('cancel-button').addEventListener('click', () => {
    window.close();
});