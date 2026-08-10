import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Autenticación', () => {
  test('Debe cargar la página de Login correctamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Te damos la bienvenida' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Debe mostrar error al ingresar credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario_inexistente@iedch.edu.mx');
    await page.fill('input[type="password"]', 'PasswordErronea123');
    await page.click('button[type="submit"]');

    // Debe mostrar la alerta de error
    const alertError = page.locator('div.bg-red-50');
    await expect(alertError).toBeVisible({ timeout: 10000 });
    await expect(alertError).toContainText(/Correo o contraseña incorrectos|Ocurrió un error/i);
  });

  test('Debe alternar la visibilidad de la contraseña al hacer clic en el ojo', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Clic en el botón toggle de visibilidad
    const toggleButton = page.locator('form button[type="button"]');
    await toggleButton.click();
    
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('Debe iniciar sesión exitosamente como Alumno de prueba', async ({ page }) => {
    await loginAs(page, TEST_USERS.alumno);
    await expect(page).toHaveURL(/\/(dashboard|cursos)/);
  });
});
