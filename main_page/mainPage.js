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
})

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
  songListContainer.appendChild(newSongItem);
  playlist.push(newSongItem);
});

songListContainer.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('song-item')) {
        console.log('Clicked on', event.target.innerHTML);
    }
});