const { _electron: electron } = require('@playwright/test');

(async () => {
  // Startet deine Electron-App
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  // Aktiviert den Pausen-Modus -> Das öffnet den Playwright Inspector!
  await window.pause();
})();