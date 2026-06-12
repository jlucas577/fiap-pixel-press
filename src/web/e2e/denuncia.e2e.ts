import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('denúncia: usuário denuncia a review de outro', async ({ page }) => {
  await loginUI(page, SEED.usuario);
  // portal-2 tem a review do moderador; a usuária comum pode denunciá-la.
  await page.goto('/jogo/portal-2');

  await page.getByRole('button', { name: /Denunciar/ }).first().click();
  await page.getByLabel('Motivo').fill('Spoilers não marcados no texto.');
  await page.getByRole('button', { name: 'Enviar denúncia' }).click();

  // Modal fecha após sucesso.
  await expect(page.getByRole('button', { name: 'Enviar denúncia' })).toHaveCount(0);
});
