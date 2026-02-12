import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';

test('starting up correctly', async ({ page }) => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  console.log('Aktuelle URL:', await window.url());
  const header = window.locator('title');
  await expect(window).toHaveTitle('Main Page - Songshow');
  await electronApp.close();
});
