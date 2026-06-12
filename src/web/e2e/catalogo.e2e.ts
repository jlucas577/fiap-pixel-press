import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('catálogo: buscar e abrir o detalhe de um jogo', async ({ page }) => {
  await loginUI(page, SEED.usuario);

  await page.getByLabel('Buscar jogos').fill('witcher');
  // Abre o card do jogo (link com o nome do jogo).
  await page.getByRole('link', { name: /witcher/i }).first().click();

  await expect(page).toHaveURL(/\/jogo\/the-witcher-3-wild-hunt/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
