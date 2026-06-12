import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('biblioteca: adicionar, editar status/horas e remover', async ({ page }) => {
  await loginUI(page, SEED.usuario);

  // Adiciona god-of-war (não está na biblioteca da usuária pelo seed).
  await page.goto('/jogo/god-of-war');
  await page.getByRole('button', { name: '+ Adicionar à biblioteca' }).click();
  await page.getByLabel('Status').selectOption('JOGANDO');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();

  await page.goto('/biblioteca');
  const card = page.getByTestId('bib-item-god-of-war');
  await expect(card).toBeVisible();

  // Editar status/horas.
  await card.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Status').selectOption('ZERADO');
  await page.getByLabel('Horas jogadas').fill('50');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(card.getByText('50h jogadas')).toBeVisible();

  // Remover (botão da linha + confirmação no modal).
  await card.getByRole('button', { name: 'Remover' }).click();
  await page.getByRole('button', { name: 'Remover' }).last().click();
  await expect(page.getByTestId('bib-item-god-of-war')).toHaveCount(0);
});
