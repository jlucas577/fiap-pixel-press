import { test, expect } from '@playwright/test';
import { loginUI, SEED } from './utils';

test('guards de rota: USUARIO é bloqueado de moderação e admin', async ({ page }) => {
  await loginUI(page, SEED.usuario);

  // RequireRole redireciona para /catalogo quando o papel é insuficiente.
  await page.goto('/moderacao');
  await expect(page).toHaveURL(/\/catalogo/);

  await page.goto('/admin/usuarios');
  await expect(page).toHaveURL(/\/catalogo/);
});
