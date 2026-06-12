import { Page, expect } from '@playwright/test';

export const SEED = {
  senha: 'Senha@123',
  usuario: 'usuario@pixelpress.dev',
  moderador: 'moderador@pixelpress.dev',
  admin: 'admin@pixelpress.dev',
};

/** Login pela UI: preenche o formulário e aguarda chegar ao catálogo. */
export async function loginUI(page: Page, email: string, senha: string = SEED.senha): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/catalogo/);
}
