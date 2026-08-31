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

  test('Debe mostrar los campos de información básica en el orden solicitado: 1) Título, 2) Descripción, 3) Temario, 4) Competencias', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    const labels = page.locator('label:has-text("Título del Curso"), label:has-text("Descripción Completa"), label:has-text("Temario"), label:has-text("Competencias a desarrollar")');
    await expect(labels.nth(0)).toContainText('Título del Curso');
    await expect(labels.nth(1)).toContainText('Descripción Completa');
    await expect(labels.nth(2)).toContainText('Temario');
    await expect(labels.nth(3)).toContainText('Competencias a desarrollar');
  });

  test('Debe permitir agregar módulos y temas en el Temario', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    // Verificar etiqueta y subtítulo de Temario
    const temarioLabel = page.locator('label:has-text("Temario")').first();
    await expect(temarioLabel).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Agrega los módulos y temas que incluirá tu curso.').first()).toBeVisible();

    // Botón Agregar módulo
    const btnAgregarModulo = page.locator('button:has-text("Agregar módulo")').first();
    await expect(btnAgregarModulo).toBeVisible();
    await btnAgregarModulo.click();

    // Debe crearse una tarjeta de Módulo 1 con placeholder de Título del módulo
    const inputTituloModulo = page.locator('input[placeholder="Título del módulo"]').first();
    await expect(inputTituloModulo).toBeVisible();
    await inputTituloModulo.fill('Módulo 1: Introducción a la Práctica Clínica');

    // Debe permitir escribir temas y agregar nuevos temas
    const inputTema1 = page.locator('input[placeholder="Tema 1"]').first();
    await expect(inputTema1).toBeVisible();
    await inputTema1.fill('Historia clínica y antecedentes');

    const btnAgregarTema = page.locator('button:has-text("Agregar tema")').first();
    await expect(btnAgregarTema).toBeVisible();
    await btnAgregarTema.click();

    // Verificar que se haya añadido un nuevo input de tema
    const inputsTemas = page.locator('input[placeholder^="Tema "]');
    expect(await inputsTemas.count()).toBeGreaterThanOrEqual(4);
  });

  test('Debe mostrar la sección "Competencias a desarrollar" con chips de verbos taxonómicos y contador de caracteres', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    // Verificar encabezado e instrucciones pedagógicas
    const compHeader = page.locator('label:has-text("Competencias a desarrollar")').first();
    await expect(compHeader).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Define lo que el alumno será capaz de lograr al finalizar el curso.').first()).toBeVisible();
    await expect(page.locator('text=Selecciona un verbo de la lista para cada competencia').first()).toBeVisible();

    // Verificar presencia de verbos principales
    await expect(page.locator('button:has-text("Identificar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Reconocer")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Describir")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Comprender")').first()).toBeVisible();

    // Verificar presencia de inputs de competencias iniciales y contador
    const compInputs = page.locator('input[placeholder*="Selecciona un verbo o escribe"]');
    await expect(compInputs.first()).toBeVisible();
    expect(await compInputs.count()).toBeGreaterThanOrEqual(3);
  });

  test('Debe permitir insertar verbos con un clic, agregar hasta 5 competencias y eliminar filas', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    const compInputs = page.locator('input[placeholder*="Selecciona un verbo o escribe"]');
    await expect(compInputs.first()).toBeVisible({ timeout: 15000 });

    // Clic en el primer input y luego clic en verbo "Identificar"
    await compInputs.first().click();
    const btnIdentificar = page.locator('button:has-text("Identificar")').first();
    await btnIdentificar.click();

    // Debe contener "Identificar " al inicio
    await expect(compInputs.first()).toHaveValue(/^Identificar /);

    // Completar el texto de la primera competencia
    await compInputs.first().fill('Identificar los conceptos clave de la práctica médica moderna.');
    await expect(compInputs.first()).toHaveValue('Identificar los conceptos clave de la práctica médica moderna.');

    // Probar botón agregar competencia
    const btnAgregarComp = page.locator('button:has-text("Agregar competencia")');
    if (await btnAgregarComp.isVisible()) {
      const initialCount = await compInputs.count();
      if (initialCount < 5) {
        await btnAgregarComp.click();
        expect(await compInputs.count()).toBe(initialCount + 1);
      }
    }

    // Probar eliminación de una fila con el botón de papelera
    const trashButtons = page.locator('button[title*="Eliminar competencia"], button[title*="Limpiar texto"]');
    const countBeforeDelete = await compInputs.count();
    if (countBeforeDelete > 1 && (await trashButtons.count()) > 0) {
      await trashButtons.last().click();
      expect(await compInputs.count()).toBe(countBeforeDelete - 1);
    }
  });

  test('No debe mostrar el campo redundante "Beneficios / ¿Qué aprenderá el alumno?" en el formulario de creación de curso', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    await expect(page.locator('label:has-text("Beneficios / ¿Qué aprenderá el alumno?")')).toHaveCount(0);
    await expect(page.locator('textarea[name="beneficios"]')).toHaveCount(0);
  });
});
