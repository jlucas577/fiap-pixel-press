import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('landing pública carrega e login leva ao catálogo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/PixelPress/i).first()).toBeVisible();

  await loginUI(page, SEED.usuario);
  await expect(page.getByRole('heading', { name: 'Explorar jogos' })).toBeVisible();
});
