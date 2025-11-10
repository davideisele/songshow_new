document.addEventListener('DOMContentLoaded', () => {
    // Überprüfen, ob die API vorhanden ist
    if (window.electronAPI && window.electronAPI.onContentReceived) {
        console.log('Beamer Page: Electron API ist verfügbar.');
        
        // Listener registrieren
        window.electronAPI.onContentReceived((content) => {
            
            const contentDiv = document.querySelector('.slide-content'); // Ersetzen Sie 'song-content' durch die ID Ihres Elements
            
            // Text in das Element einfügen (ggf. Zeilenumbrüche für HTML formatieren)
            contentDiv.innerHTML = content.replace(/\n/g, '<br>'); 
        });
        
    }else {
        console.error('Beamer Page: Electron API ist nicht verfügbar.');
    }
});