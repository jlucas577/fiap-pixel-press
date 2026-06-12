import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('reviews: criar, editar e excluir a própria review', async ({ page }) => {
  await loginUI(page, SEED.usuario);
  // A usuária não tem review de god-of-war pelo seed.
  await page.goto('/jogo/god-of-war');

  // Criar.
  await page.getByRole('button', { name: 'Escrever review' }).click();
  await page.getByLabel('Nota (0 a 10)').fill('8');
  await page.getByLabel('Texto (opcional)').fill('Excelente jogo de ação.');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Excelente jogo de ação.')).toBeVisible();

  // Editar (o botão passa a "Editar minha review").
  await page.getByRole('button', { name: 'Editar minha review' }).click();
  await page.getByLabel('Nota (0 a 10)').fill('6');
  await page.getByRole('button', { name: 'Salvar' }).click();

  // Excluir (botão na review + confirmação no modal).
  await page.getByRole('button', { name: 'Excluir' }).first().click();
  await page.getByRole('button', { name: 'Excluir' }).last().click();
  await expect(page.getByText('Excelente jogo de ação.')).toHaveCount(0);
});
