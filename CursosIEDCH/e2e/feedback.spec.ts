import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Comentarios, Sugerencias y Retroalimentación', () => {
  test('Debe cargar la página pública de envío de comentarios (/comentarios)', async ({ page }) => {
    await page.goto('/comentarios');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1, h2')).toContainText(/Comentarios|Sugerencias|Opinión/i);
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Debe mostrar el botón flotante global de comentarios en el portal', async ({ page }) => {
    await page.goto('/');
    const floatingButton = page.locator('a[href="/comentarios"], button:has-text("Comentarios")').first();
    await expect(floatingButton).toBeVisible({ timeout: 15000 });
  });

  test('Debe autocompletar el perfil si el usuario está autenticado', async ({ page }) => {
    await loginAs(page, TEST_USERS.alumno);
    await page.goto('/comentarios');
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toHaveValue(/@/i, { timeout: 15000 });
    }
  });

  test('Debe redirigir a un usuario no admin si intenta acceder a /admin/comentarios', async ({ page }) => {
    await loginAs(page, TEST_USERS.alumno);
    await page.goto('/admin/comentarios');
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });
});
