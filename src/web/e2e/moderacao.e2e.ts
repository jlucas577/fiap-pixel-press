import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('moderação: moderador oculta uma denúncia pendente', async ({ page }) => {
  await loginUI(page, SEED.moderador);
  await page.goto('/moderacao');
  await expect(page.getByRole('heading', { name: 'Denúncias pendentes' })).toBeVisible();

  // Há ao menos uma denúncia pendente (admin → review da usuária, pelo seed).
  await page.getByRole('button', { name: 'Ocultar review' }).first().click();
  await page.getByLabel('Motivo da ocultação').fill('Conteúdo viola as diretrizes.');
  await page.getByRole('button', { name: 'Confirmar ocultação' }).click();

  // Modal de confirmação fecha após a ocultação.
  await expect(page.getByRole('button', { name: 'Confirmar ocultação' })).toHaveCount(0);
});
