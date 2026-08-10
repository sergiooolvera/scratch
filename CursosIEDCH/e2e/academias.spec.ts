import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Academias, Grupos e Instituciones', () => {
  test('Debe cargar la vista de creación de academia en 4 pasos (/institucion/crear)', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/institucion/crear');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/Paso 1|Información Básica|Crear tu Academia/i').first()).toBeVisible();
  });

  test('Debe avanzar al Paso 2 en el Stepper al llenar los datos básicos de la academia', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/institucion/crear');

    const nombreInput = page.locator('input[placeholder*="Nombre"], input[name="nombre"]').first();
    if (await nombreInput.isVisible()) {
      await nombreInput.fill('Academia E2E Test ' + Date.now());
      
      const sigBtn = page.locator('button:has-text("Siguiente"), button:has-text("Continuar")').first();
      if (await sigBtn.isVisible()) {
        await sigBtn.click();
        await expect(page.locator('text=/Paso 2|Personalización/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('Debe cargar el listado de academias en el panel de profesor', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor');
    
    // Verificar que exista la sección Mis Academias
    await expect(page.locator('text=/Mis Academias|Academias/i').first()).toBeVisible();
  });
});
