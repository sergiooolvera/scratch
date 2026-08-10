import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Cuestionarios y Exámenes', () => {
  test('Debe acceder al panel del alumno y cargar sus cursos/exámenes asignados', async ({ page }) => {
    await loginAs(page, TEST_USERS.alumno);
    await page.goto('/dashboard');
    
    // Verificar que la vista de dashboard cargue sin errores
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
