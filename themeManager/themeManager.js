// --- Datenstruktur-Helfer ---

let localFilePaths = {
    image: '',
    video: ''
};

async function selectBackgroundImage() {
    console.log("Select Image")
    const filePath = await window.electronAPI.openFileDialog('image');
    
    if (filePath) {
        localFilePaths.image = filePath;
        document.getElementById('display-image-path').textContent = filePath;
        enableControls(true); 
    }
};

async function selectBackgroundVideo() {
    console.log("Select Video")
    const filePath = await window.electronAPI.openFileDialog('video');
    
    if (filePath) {
        localFilePaths.video = filePath;
        document.getElementById('display-video-path').textContent = filePath;
        enableControls(true); 
    }
};

function createEmptyTheme(name) {
  return {
    id: Date.now(), // Temporäre ID für neue Themes
    name: name,
    'background-option': 'color',
    'background-image': '',
    'background-video': '',
    // Einstellungen für den Haupt-Text (.slide-content)
    '.slide-content': {
      color: '#ffffff',
      'background-color': '#000000',
      'font-family': 'sans-serif',
      'font-size': '12px',
      'font-style': '',
      'font-weight': '',
      'text-decoration': '',
      'text-align': 'left',
      top: 'auto',
      bottom: 'auto',
      left: 'auto',
      right: 'auto',
    },
    // Einstellungen für die Übersetzungszeile (.translation-line)
    '.translation-line': {
      color: '#ffffff',
      'font-family': 'sans-serif',
      'font-size': '12px',
      'font-style': '',
      'font-weight': 'bold',
      'text-decoration': 'underline',
      'text-align': 'left',
    },
  };
}

function serializeFormToTheme(themeName) {
  // Nutzen Sie die direkt korrigierten IDs
  const theme = createEmptyTheme(
    themeName || document.getElementById('name').value,
  );
  const backgroundOption = document.getElementById('background-option').value;
  const mainText = theme['.slide-content'];
  const secondLang = theme['.translation-line'];
  theme['background-option'] = backgroundOption;

  // Hintergrund-Optionen (Anpassung für Electron)
  delete theme['background-image'];
  delete theme['background-video'];
  
  if (backgroundOption === 'image') {
      // Nutze den gespeicherten lokalen Pfad
      const imagePath = localFilePaths.image;
      if (imagePath) {
          theme['background-image'] = imagePath;
      }
  } else if (backgroundOption === 'video') {
      // Nutze den gespeicherten lokalen Pfad
      const videoPath = localFilePaths.video;
      if (videoPath) {
          theme['background-video'] = videoPath;
          mainText['background-color'] = 'transparent';
          console.log("Video path set in theme:", videoPath);
      }
  } else if (backgroundOption === 'color'){
      mainText['background-color'] = document.getElementById('background-color').value;
  }

  // II. Haupt-Text (.slide-content) - IDs sind nun direkt im HTML

  mainText['color'] = document.getElementById('text-color').value;
  mainText['font-family'] = document.getElementById('slide-font-family').value;
  mainText['font-size'] = document.getElementById('font-size').value + 'px';
  mainText['text-align'] = document.getElementById('font-align').value;
  mainText['top'] = document.getElementById('top').value;
  mainText['bottom'] = document.getElementById('bottom').value;
  mainText['left'] = document.getElementById('left').value;
  mainText['right'] = document.getElementById('right').value;

  // Font-Style (bold/italic/underline)
  mainText['font-weight'] = getFontWeight('');
  mainText['font-style'] = getFontStyle('');
  mainText['text-decoration'] = getFontDecoration('');

  // III. Zweit-Sprache (.translation-line) - IDs sind nun second-präfixiert
  secondLang['color'] = document.getElementById('second-text-color').value;
  secondLang['font-family'] =
    document.getElementById('second-font-family').value;
  secondLang['font-size'] =
    document.getElementById('second-font-size').value + 'px';
  secondLang['text-align'] = document.getElementById('second-font-align').value;
  secondLang['font-weight'] = getFontWeight('second');
  secondLang['font-style'] = getFontStyle('second');
  secondLang['text-decoration'] = getFontDecoration('second');

  return theme;
}

/**
 * Übernimmt die Theme-Daten in die Formularfelder.
 */

function deserializeThemeToForm(theme) {
  document.getElementById('id').value = theme.id || '';
  document.getElementById('name').value = theme.name || '';
  document.getElementById('background-option').value =
    theme['background-option'] || 'color';

  // Haupt-Text
  const mainText = theme['.slide-content'] || {};
  document.getElementById('text-color').value = mainText['color'] || '#ffffff';
  document.getElementById('background-color').value =
    mainText['background-color'] || '#000000';
  document.getElementById('slide-font-family').value =
    mainText['font-family'] || 'sans-serif';
  document.getElementById('font-size').value = (
    mainText['font-size'] || '12px'
  ).replace('px', '');
  document.getElementById('font-align').value =
    mainText['text-align'] || 'left';
  document.getElementById('top').value = mainText['top'] || 'auto';
  document.getElementById('bottom').value = mainText['bottom'] || 'auto';
  document.getElementById('left').value = mainText['left'] || 'auto';
  document.getElementById('right').value = mainText['right'] || 'auto';
  loadFontStyleButtons('', mainText);

  // Zweit-Sprache
  const secondLang = theme['.translation-line'] || {};
  document.getElementById('second-text-color').value =
    secondLang['color'] || '#ffffff';
  document.getElementById('second-font-family').value =
    secondLang['font-family'] || 'sans-serif';
  document.getElementById('second-font-size').value =
    secondLang['font-size'] || '12';
  document.getElementById('second-font-align').value =
    secondLang['text-align'] || 'left';
  loadFontStyleButtons('second', secondLang);

  // Live Preview aktualisieren
  updateThemePreview(theme);
  // Button-Status setzen
  enableControls(false); // Nach dem Laden sind keine Änderungen vorhanden
}

// --- Live Preview Logik (unverändert) ---

/**
 * Aktualisiert die Live-Vorschau basierend auf den aktuellen Formularwerten oder einem Theme-Objekt.
 * @param {object} [themeData] Optional: Theme-Daten (wenn nicht angegeben, werden die Formularwerte genutzt).
 */
function updateThemePreview(themeData) {
  const theme = themeData || serializeFormToTheme();
  const previewContainer = document.getElementById('preview');
  const slideContent = document.getElementById('preview-slide-content');
  const translationLine = document.getElementById('preview-translation-line');

  // Hintergrund-Einstellungen (vereinfacht)
  const bgColor = theme['background-color'] || '#000000';
  previewContainer.style.backgroundColor = bgColor;
  previewContainer.style.position = 'relative'; // Wichtig für absolute Positionierung

  // Haupt-Text (.slide-content)
  const mainStyles = theme['.slide-content'];
  if (mainStyles) {
    slideContent.style.color = mainStyles['color'] || 'inherit';
    slideContent.style.backgroundColor =
      mainStyles['background-color'] || 'inherit';
    slideContent.style.fontFamily = mainStyles['font-family'] || 'sans-serif';
    slideContent.style.fontSize = (mainStyles['font-size'] || '12') + 'px';
    slideContent.style.textAlign = mainStyles['text-align'] || 'left';
    slideContent.style.position = 'absolute';
    slideContent.style.left = mainStyles['left'] + '%';
    slideContent.style.top = mainStyles['top'] + '%';
    slideContent.style.bottom = mainStyles['bottom'] + '%';
    slideContent.style.right = mainStyles['right'] + '%';
    slideContent.style.width = '100%'; // Standardbreite, damit TextAlign funktioniert
    slideContent.style.boxSizing = 'border-box';
    applyFontStyles(slideContent, mainStyles['font-style']);
  }

  // Zweit-Sprache (.translation-line)
  const secondStyles = theme['.translation-line'];
  if (secondStyles) {
    translationLine.style.color = secondStyles['color'] || 'inherit';
    translationLine.style.fontFamily =
      secondStyles['font-family'] || 'sans-serif';
    translationLine.style.fontSize = (secondStyles['font-size'] || '12') + 'px';
    translationLine.style.textAlign = secondStyles['text-align'] || 'left';
    applyFontStyles(translationLine, secondStyles['font-style']);
  }
}

/**
 * Wendet CSS-Font-Styles (bold, italic, underline) an.
 */
function applyFontStyles(element, styleString) {
  const styles = styleString ? styleString.split(' ') : [];
  element.style.fontWeight = styles.includes('bold') ? 'bold' : 'normal';
  element.style.fontStyle = styles.includes('italic') ? 'italic' : 'normal';
  element.style.textDecoration = styles.includes('underline')
    ? 'underline'
    : 'none';
}

// --- Font Style Button Logik ---

/**
 * Extrahiert den kombinierten Font-Style-String aus den Buttons.
 * @param {''|'second'} group Die Gruppe ('' für Main, 'second' für Second-Lang).
 * @returns {string} Die kombinierten Styles (z.B. "bold italic").
 */
// function getFontStyleValue(group) {
//   const prefix = group ? 'second-' : '';
//   const styles = [];

//   // Wir iterieren direkt über die ID-Präfixe, da die IDs jetzt eindeutig sind
//   if (
//     document
//       .getElementById(`${prefix}font-bold`)
//       ?.getAttribute('aria-pressed') === 'true'
//   ) {
//     return 'bold';
//   }
//   if (
//     document
//       .getElementById(`${prefix}font-italic`)
//       ?.getAttribute('aria-pressed') === 'true'
//   ) {
//     styles.push('italic');
//   }
//   if (
//     document
//       .getElementById(`${prefix}font-underline`)
//       ?.getAttribute('aria-pressed') === 'true'
//   ) {
//     styles.push('underline');
//   }

//   return styles.join(' ');
// }

function getFontWeight(group) {
  const prefix = group ? 'second-' : '';
  if (
    document
      .getElementById(`${prefix}font-bold`)
      ?.getAttribute('aria-pressed') === 'true'
  ) {
    return 'bold';
  }
}

function getFontStyle(group) {
  const prefix = group ? 'second-' : '';
  if (
    document
      .getElementById(`${prefix}font-italic`)
      ?.getAttribute('aria-pressed') === 'true'
  ) {
    return 'italic';
  }
}

function getFontDecoration(group) {
  const prefix = group ? 'second-' : '';
  if (
    document
      .getElementById(`${prefix}font-underline`)
      ?.getAttribute('aria-pressed') === 'true'
  ) {
    return 'underline';
  }
}

/**
 * Setzt den Status der Font-Style Buttons.
 * @param {''|'second'} group Die Gruppe.
 * @param {string} styleString Der kombinierte Style-String.
 */
function loadFontStyleButtons(group, styleObject) {
  // Stellen Sie sicher, dass styleObject ein Objekt ist, falls es null oder undefined übergeben wurde
  const styles = styleObject || {};
  const prefix = group ? 'second-' : '';

  const boldBtn = document.getElementById(`${prefix}font-bold`);
  const italicBtn = document.getElementById(`${prefix}font-italic`);
  const underlineBtn = document.getElementById(`${prefix}font-underline`);

  // Hilfsfunktion, um aria-pressed korrekt zu setzen
  function setAriaPressed(btn, expectedValue) {
    if (btn) {
      // styles[key] gibt den Wert ('bold', 'italic', 'underline' oder undefined) zurück.
      // Wir prüfen, ob dieser Wert mit dem erwarteten Wert übereinstimmt.
      // Der doppelte Negationsoperator (!!) wandelt true/false in einen booleschen Wert um.

      const isPressed = styles[expectedValue] === expectedValue;

      // aria-pressed erwartet einen String 'true' oder 'false'
      btn.setAttribute('aria-pressed', isPressed.toString());
    }
  }

  setAriaPressed(boldBtn, 'font-weight', 'bold');
  setAriaPressed(italicBtn, 'font-style', 'italic');
  setAriaPressed(underlineBtn, 'text-decoration', 'underline');
}

// **Korrektur der Hilfsfunktion (vereinfacht):**

function setAriaPressed(btn, propertyName, expectedValue) {
  if (btn) {
    // Prüft, ob der Wert im Objekt (z.B. styles['font-weight']) dem erwarteten Wert ('bold') entspricht.
    const isPressed = styles[propertyName] === expectedValue;
    btn.setAttribute('aria-pressed', isPressed.toString());
  }
}

/**
 * Toggle-Funktion für die Font-Style Buttons.
 * @param {Event} event Das Klick-Event.
 */
function toggleFontStyle(event) {
  const button = event.currentTarget;
  const isPressed = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-pressed', !isPressed);
  updateThemePreview();
  enableControls();
  console.log("Font style toggled", button.id);
}

// --- Electron IPC Interaktion (Backend) ---

/**
 * Lädt die Liste der Theme-Namen und füllt das <select>-Feld.
 */
async function loadThemeList() {
  const select = document.getElementById('theme-select');
  select.innerHTML = '<option value="">--- Select Theme ---</option>'; // Zurücksetzen

  try {
    const themeNames = await electronAPI.getThemes();

    themeNames.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Fehler beim Laden der Theme-Liste:', error);
    alert('Konnte die Theme-Liste nicht laden. Electron IPC-Fehler.');
  }
}

/**
 * Lädt das ausgewählte Theme und füllt das Formular.
 */
async function loadSelectedTheme() {
  const themeName = document.getElementById('theme-select').value;
  if (!themeName) {
    // Formular zurücksetzen
    document.getElementById('theme-details-form').reset();
    document.getElementById('id').value = '';
    document.getElementById('name').value = '';
    updateThemePreview(createEmptyTheme(''));
    document.getElementById('save-button').textContent = 'Safe (Edit)';
    document.getElementById('delete-button').style.display = 'none';
    enableControls(false);
    return;
  }

  try {
    const themeData = await electronAPI.getThemeDetails(themeName);

    // Fügt den Namen zum Objekt hinzu, falls er im JSON fehlt
    themeData.name = themeName;

    deserializeThemeToForm(themeData);
    document.getElementById('save-button').textContent = 'Safe (Edit)';
    document.getElementById('delete-button').style.display = 'inline-block';
  } catch (error) {
    console.error(`Fehler beim Laden von Theme "${themeName}":`, error);
    alert(`Konnte Theme "${themeName}" nicht laden. Prüfen Sie die Datei.`);
  }
}

/**
 * Speichert das aktuelle Theme (neu erstellen oder aktualisieren).
 */
async function saveTheme(event) {
  event.preventDefault();
  const themeData = serializeFormToTheme();
  // Prüfen, ob der Save-Button den "New"-Status hat
  const isNewTheme =
    document.getElementById('save-button').textContent === 'Safe (New)';
  const name = themeData.name;

  if (!name) {
    alert('Bitte geben Sie einen Theme-Namen ein.');
    return;
  }

  try {
    await electronAPI.saveTheme(themeData);

    alert(`Theme "${name}" erfolgreich gespeichert.`);
    await loadThemeList();

    // Neues Theme im Dropdown auswählen, falls erfolgreich erstellt
    if (isNewTheme) {
      document.getElementById('theme-select').value = name;
    }

    // Lade das Theme neu, um den Status (ID, etc.) zu aktualisieren
    await loadSelectedTheme();

    enableControls(false);
  } catch (error) {
    console.error('Fehler beim Speichern des Themes:', error);
    alert(
      `Konnte Theme "${name}" nicht speichern. Fehler: ${
        error.message || error
      }`,
    );
  }
}

/**
 * Löscht das ausgewählte Theme.
 */
async function deleteTheme() {
  const select = document.getElementById('theme-select');
  const themeName = select.value;

  if (!themeName) return;
  if (
    !confirm(
      `Sind Sie sicher, dass Sie das Theme "${themeName}" unwiderruflich löschen möchten?`,
    )
  )
    return;

  try {
    await electronAPI.deleteThemeFile(themeName);

    alert(`Theme "${themeName}" erfolgreich gelöscht.`);

    // Dropdown aktualisieren und Formular zurücksetzen
    await loadThemeList();
    document.getElementById('theme-select').value = '';
    loadSelectedTheme();
  } catch (error) {
    console.error(`Fehler beim Löschen von Theme "${themeName}":`, error);
    alert(
      `Konnte Theme "${themeName}" nicht löschen. Fehler: ${
        error.message || error
      }`,
    );
  }
}

// --- UI / Control Logik ---

/**
 * Bereitet das Formular für die Erstellung eines neuen Themes vor.
 */
function addNewTheme() {
  const newThemeName = prompt(
    'Bitte geben Sie einen Namen für das neue Theme ein:',
  );
  if (!newThemeName) return;

  // Prüfe, ob der Name bereits existiert (optional, aber gut)
  const existingTheme = Array.from(
    document.getElementById('theme-select').options,
  ).find((opt) => opt.value === newThemeName);
  if (existingTheme) {
    alert(`Das Theme "${newThemeName}" existiert bereits.`);
    document.getElementById('theme-select').value = newThemeName;
    loadSelectedTheme();
    return;
  }

  const newTheme = createEmptyTheme(newThemeName);

  document.getElementById('theme-select').value = '';
  deserializeThemeToForm(newTheme);

  document.getElementById('save-button').textContent = 'Safe (New)';
  document.getElementById('delete-button').style.display = 'none';
  document.getElementById('name').focus();
  enableControls(true);
}

/**
 * Aktiviert/deaktiviert die Steuerelemente und den Speichern-Button.
 * @param {boolean} [changed=true] Ob Änderungen vorliegen.
 */
function enableControls(changed = true) {
  const saveButton = document.getElementById('save-button');
  const themeIsSelected = document.getElementById('theme-select').value !== '';
  const isNew = saveButton.textContent === 'Safe (New)';

  saveButton.disabled = !changed && !isNew;

  // Aktualisiere den Text nur, wenn sich der Status ändert, um das 'Safe (New)' beizubehalten
  if (!isNew) {
    saveButton.textContent = changed ? 'Safe (Edit)' : 'Safe (Edit)';
  } else if (!changed) {
    // Wenn es ein neues Theme ist und keine Änderungen vorliegen,
    // sollte es trotzdem speicherbar sein, solange der Name gesetzt ist.
    saveButton.disabled = false;
  }
}

// --- Initialisierung ---

/**
 * Fügt alle Event-Listener hinzu.
 */
function setupEventListeners() {
  // Theme Auswahl
  document
    .getElementById('theme-select')
    .addEventListener('change', loadSelectedTheme);
  document
    .getElementById('add-new-theme')
    .addEventListener('click', addNewTheme);
  document
    .getElementById('delete-selected-theme')
    .addEventListener('click', deleteTheme);

  // Formular Aktionen
  document
    .getElementById('save-button')
    .addEventListener('click', saveTheme);
  document
    .getElementById('delete-button')
    .addEventListener('click', deleteTheme);

  // Formular-Änderungen für Live-Vorschau und Speichern-Button
  document
    .querySelectorAll('#theme-details-form input, #theme-details-form select')
    .forEach((element) => {
      // Da die meisten Felder onchange/oninput im HTML haben,
      // fügen wir hier nur Listener für Felder ohne vorhandenen Handler hinzu.
      if (
        !element.hasAttribute('onchange') &&
        !element.hasAttribute('oninput')
      ) {
        element.addEventListener('change', () => {
          updateThemePreview();
          enableControls();
        });
        element.addEventListener('input', () => enableControls());
      }
    });

  // Font-Style Buttons
  document.querySelectorAll('button[data-style]').forEach((button) => {
    button.addEventListener('click', toggleFontStyle);
  });

  document.getElementById('select-image-button').addEventListener('click', selectBackgroundImage);
  document.getElementById('select-video-button').addEventListener('click', selectBackgroundVideo);
}

function toggleBackgroundOptions() {
    // Das ausgewählte Element auslesen
    const selectElement = document.getElementById('background-option');
    const selectedValue = selectElement.value;

    // Die Container-Elemente
    const colorContainer = document.getElementById('background-color-container');
    const imageContainer = document.getElementById('background-image-container');
    const videoContainer = document.getElementById('background-video-container');

    // Alle Container standardmäßig verstecken (oder 'none' setzen)
    colorContainer.style.display = 'none';
    imageContainer.style.display = 'none';
    videoContainer.style.display = 'none';

    // Nur den relevanten Container anzeigen
    if (selectedValue === 'color') {
        colorContainer.style.display = 'block';
    } else if (selectedValue === 'image') {
        imageContainer.style.display = 'block';
    } else if (selectedValue === 'video') {
        videoContainer.style.display = 'block';
    }
    
    // Optional: Die Funktionen, die du bereits im 'oninput' hattest, kannst du hier bei Bedarf auch aufrufen, 
    // z.B. wenn eine Auswahl das Theme-Vorschaubild beeinflussen soll.
    // updateThemePreview(); 
    // enableControls();
}

/**
 * Startet die Anwendung.
 */
function init() {
  // KEINE ID-KORREKTUREN MEHR NÖTIG! Das HTML ist korrekt.
  setupEventListeners();
  loadThemeList();
  updateThemePreview(createEmptyTheme(''));
  enableControls(false);
  toggleBackgroundOptions();

  document.getElementById('delete-button').style.display = 'none';
}

// Start der Anwendung nach dem Laden des DOM
document.addEventListener('DOMContentLoaded', init);
