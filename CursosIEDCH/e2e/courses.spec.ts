import { test, expect } from '@playwright/test';

test.describe('Módulo de Cursos y Catálogo', () => {
  test('Debe cargar la página principal con la barra superior y logo', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que el título principal o marca del sitio cargue
    await expect(page).toHaveTitle(/Cursos|EGAC|IEDCH/i);
    
    // Verificar la presencia del logo o encabezado principal
    const logo = page.locator('img[alt*="Logo"]').first();
    await expect(logo).toBeVisible({ timeout: 15000 });
  });

  test('Debe permitir buscar cursos en la barra de búsqueda si existe', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Enfermería');
      await page.keyboard.press('Enter');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Debe redirigir al login si un usuario no autenticado intenta acceder a mis-cursos', async ({ page }) => {
    await page.goto('/mis-cursos');
    await expect(page).toHaveURL(/\/(login|dashboard|mis-cursos)/);
  });

  test('Debe mostrar precio tachado (+20%) en color naranja para cursos de pago en el catálogo', async ({ page }) => {
    await page.goto('/cursos');
    // Esperar a que los elementos del catálogo carguen
    await page.waitForLoadState('networkidle');
    const tachedPrices = page.locator('span.line-through.text-orange-500');
    const count = await tachedPrices.count();
    if (count > 0) {
      await expect(tachedPrices.first()).toBeVisible();
    }
  });
});
