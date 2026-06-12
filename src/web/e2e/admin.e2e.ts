import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('admin: alterar o papel de um usuário', async ({ page }) => {
  await loginUI(page, SEED.admin);
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();

  // Eleva o usuário inativo a MODERADOR (linha não-própria, não afeta outros specs).
  const row = page.getByRole('row', { name: /inativo@pixelpress\.dev/ });
  await row.getByRole('combobox').selectOption('MODERADOR');

  // A linha passa a refletir o novo papel (badge + select).
  await expect(row.getByText('MODERADOR').first()).toBeVisible();
});
