import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Revisión y Visualización de Cuestionarios Abiertos del Profesor', () => {
  test.beforeEach(async ({ page }) => {
    // Iniciar sesión como profesor
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/revision-cuestionarios');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Debe cargar la pantalla de Revisión de Cuestionarios Abiertos con selector de cursos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Revisión de Cuestionarios Abiertos');
    await expect(page.locator('text=Selecciona un Curso para revisar o consultar cuestionarios')).toBeVisible();
    
    const selectCurso = page.locator('select').first();
    await expect(selectCurso).toBeVisible();
  });

  test('Debe mostrar la información, preguntas activas y estado de alumnos al seleccionar un curso con cuestionario', async ({ page }) => {
    const selectCurso = page.locator('select').first();
    
    // Obtener las opciones disponibles en el selector
    const options = await selectCurso.locator('option').allTextContents();
    
    // Buscar si está el curso CAP o cualquier curso disponible
    const opcionCAP = options.find(o => o.includes('CAP-Integración') || o.includes('Presión Arterial') || o.includes('Bases de Enfermería'));
    
    if (opcionCAP) {
      await selectCurso.selectOption({ label: opcionCAP });

      // Debe mostrar el panel de métricas con badge activo
      const badgeActivo = page.locator('text=Cuestionario Abierto Configurado y Activo');
      if (await badgeActivo.isVisible({ timeout: 5000 })) {
        await expect(badgeActivo).toBeVisible();
        await expect(page.locator('text=Preguntas Activas')).toBeVisible();
        await expect(page.locator('text=Alumnos Inscritos')).toBeVisible();

        // Debe permitir ver las preguntas configuradas
        const btnVerPreguntas = page.locator('button:has-text("Ver Preguntas")').first();
        if (await btnVerPreguntas.isVisible()) {
          await btnVerPreguntas.click();
          await expect(page.locator('text=Preguntas Configuradas').first()).toBeVisible();
          await expect(page.locator('text=Pregunta #1').first()).toBeVisible();
        }
      }
    }
  });

  test('Debe permitir cambiar entre cursos y mostrar botón directo para editar cuestionarios', async ({ page }) => {
    const selectCurso = page.locator('select').first();
    const options = await selectCurso.locator('option').all();

    if (options.length > 1) {
      // Seleccionar la segunda opción (el primer curso real)
      await selectCurso.selectOption({ index: 1 });

      // Debe aparecer el enlace para Editar Cuestionarios en el Curso
      const linkEditar = page.locator('a:has-text("Editar Cuestionarios en el Curso")');
      await expect(linkEditar).toBeVisible();
      await expect(linkEditar).toHaveAttribute('href', /\/profesor\/editar-curso\//);
    }
  });
});
