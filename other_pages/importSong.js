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

// Funktion, um das Dropdown mit echten Themes aus der DB zu füllen
async function initThemeSelector() {
  const themeDropdown = document.getElementById('theme');
  if (!themeDropdown) return;


  try {
    console.log('Lade Themes für das Dropdown...');
    // Hole alle verfügbaren Themes (deine Electron API nutzen)
    const themes = await window.electronAPI.getThemes(); 
    
    // Dropdown leeren
    themeDropdown.innerHTML = '';

    // Die Themes hinzufügen
    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme; // Der Name des Themes (z.B. "dark")
      option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      themeDropdown.appendChild(option);
    });

    console.log(`${themes.length} Themes erfolgreich in den Selector geladen.`);
  } catch (error) {
    console.error('Fehler beim Laden der Themes für das Dropdown:', error);
  }
}

// Beim Start aufrufen
document.addEventListener('DOMContentLoaded', initThemeSelector);