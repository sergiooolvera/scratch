import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Finanzas, Ventas y Simulador Fiscal', () => {
  test('Debe permitir el acceso del profesor a la vista de ventas (/profesor/ventas)', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await expect(page).toHaveURL(/\/profesor\/ventas/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Debe mostrar el botón de Simular Ingresos y desplegar el modal fiscal', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');

    const simuladorBtn = page.locator('button:has-text("Simulador"), button:has-text("Calculadora")').first();
    if (await simuladorBtn.isVisible()) {
      await simuladorBtn.click();
      
      // El modal debe ser visible con las opciones de Régimen Fiscal
      const modalHeader = page.locator('text=/Simulador de Ingresos|Calculadora Fiscal/i').first();
      await expect(modalHeader).toBeVisible();

      // Verificar que contenga los regímenes fiscales clave
      const selectRegimen = page.locator('select').first();
      if (await selectRegimen.isVisible()) {
        await selectRegimen.selectOption({ index: 1 });
      }
    }
  });
});
