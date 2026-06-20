import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';

test('add song button works', async ({ page }) => {
    const electronApp = await electron.launch({ args: ['.'] });
    const window = await electronApp.firstWindow();
    const windowPromise = electronApp.waitForEvent('window');
    await window.click('#song-add');
    const newWindow = await windowPromise;
    const header = newWindow.locator('h2');
    await expect(header).toContainText('Song zum Ablaufplan hinzufügen');
    await electronApp.close();
});
