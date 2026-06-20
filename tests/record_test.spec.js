import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';

test('add song button works', async ({ page }) => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  await window.locator('#song-add').click();
  await page2.getByLabel('Verfügbare Songs:').selectOption('2');
  await page2.getByText('Abbrechen Hinzufügen').click();
  await page2.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page).toHaveTitle('Main Page - Songshow');
  await electronApp.close();
});
