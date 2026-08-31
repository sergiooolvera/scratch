import { test, expect } from '@playwright/test';

test.describe('Módulo de Validación de Constancias y Certificados', () => {
  test('Debe cargar la página de verificación de constancias (/validar)', async ({ page }) => {
    await page.goto('/validar');
    await expect(page.locator('body')).toBeVisible();
    const searchInput = page.locator('input[placeholder*="Folio"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('Debe mostrar alerta de error cuando el folio es inexistente', async ({ page }) => {
    await page.goto('/validar');
    const searchInput = page.locator('input[placeholder*="Folio"], input[type="text"]').first();
    await searchInput.fill('00000000-0000-0000-0000-000000000000');
    
    const searchButton = page.locator('button[type="submit"]').first();
    await searchButton.click();

    // Esperar mensaje de no encontrado o invalidez
    const errorMessage = page.locator('text=/No se encontró|inválido|no existe|inválida/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
  });

  test('Debe mostrar el pie de página institucional en la página de validación', async ({ page }) => {
    await page.goto('/validar');
    const footerText = page.locator('text=/El Instituto Educativo de Especialdiades para la Conducta/i').first();
    await expect(footerText).toBeVisible({ timeout: 10000 });
  });
});
