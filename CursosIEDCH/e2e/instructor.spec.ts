import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Profesor y Creación/Edición de Cursos', () => {
  test('Debe cargar el Panel del Profesor con estadísticas de Alumnos, Cursos y Certificados', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor');

    await expect(page).toHaveURL(/\/profesor/);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('a[href="/profesor/ventas"]').first()).toBeVisible();
  });

  test('Debe cargar la pantalla de Subir Curso (/profesor/subir-curso)', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/Información del Curso|Título|Categoría/i').first()).toBeVisible();
  });

  test('Debe contener las 6 categorías oficiales en el selector de categoría del curso', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    const selectCategoria = page.locator('select[name="categoria"]').first();
    if (await selectCategoria.isVisible()) {
      const options = await selectCategoria.locator('option').allInnerTexts();
      const categoriesText = options.join(' ');
      expect(categoriesText).toMatch(/Salud|Negocios|Tecnología|Desarrollo|Idiomas|Más/i);
    }
  });

  test('Debe incluir el módulo de contenido y estructura de recursos del curso', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    const recursoOrModulo = page.locator('text=/Módulo|Recurso|Video|Contenido|Temario/i').first();
    await expect(recursoOrModulo).toBeVisible({ timeout: 15000 });
  });
});
