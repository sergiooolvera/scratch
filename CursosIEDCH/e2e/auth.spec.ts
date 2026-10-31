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

  test('Debe cargar la página de Recuperar Contraseña y permitir solicitar enlace', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Recuperar Contraseña' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    await page.fill('input[type="email"]', 'soporte@grupoegac.com');
    await page.click('button[type="submit"]');

    // Debe mostrar mensaje de confirmación o aviso de límite de seguridad
    const responseMsg = page.locator('p.text-green-600, p.text-red-500');
    await expect(responseMsg).toBeVisible({ timeout: 10000 });
  });

  test('Debe mostrar pantalla de enlace inválido o expirado en /update-password sin sesión activa', async ({ page }) => {
    await page.goto('/update-password');
    
    // Al no haber sesión ni token, debe mostrar el estado de enlace expirado o inválido
    await expect(page.getByRole('heading', { name: 'Enlace inválido o expirado' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Solicitar un nuevo enlace' })).toBeVisible();
  });

  test('Debe redirigir automáticamente a /update-password si se detecta fragmento hash de recuperación en la raíz', async ({ page }) => {
    await page.goto('/#type=recovery&access_token=test_token_hash');
    
    // AuthRecoveryHandler debe interceptar el hash y redirigir a /update-password
    await expect(page).toHaveURL(/\/update-password/);
  });
});
