import { test, expect } from '@playwright/test';

test('cadastro: criar conta nova autentica e leva ao catálogo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/cadastro/);

  await page.getByLabel('Nome').fill('E2E Tester');
  await page.getByLabel('E-mail').fill('e2e-novo@pixelpress.dev');
  await page.getByLabel('Senha').fill('Senha@123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL(/\/catalogo/);
  await expect(page.getByRole('heading', { name: 'Explorar jogos' })).toBeVisible();
});
