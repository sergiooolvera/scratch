import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Navegación y Selector de Módulos en Subir/Editar Curso', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');
    await expect(page.locator('body')).toBeVisible();

    // Navegar a la pestaña 2: Temario y Clases
    const tabModulos = page.locator('button:has-text("2. Temario y Clases")').first();
    await expect(tabModulos).toBeVisible({ timeout: 15000 });
    await tabModulos.click();
  });

  test('Debe mostrar la barra de navegación de módulos con su selector desplegable y píldoras rápidas', async ({ page }) => {
    // Verificar encabezado de navegación de módulos
    await expect(page.locator('text=Navegación de Módulos')).toBeVisible();
    
    // Verificar presencia del combo desplegable
    const selectModulo = page.locator('#select-modulo-activo');
    await expect(selectModulo).toBeVisible();

    // Verificar botón de alternar vista y botón de nuevo módulo
    await expect(page.locator('#btn-toggle-modo-vista')).toBeVisible();
    await expect(page.locator('#btn-agregar-modulo-top')).toBeVisible();

    // Verificar píldora "Todos" y píldora del primer módulo
    await expect(page.locator('button:has-text("Todos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Módulo 1")').first()).toBeVisible();
  });

  test('Debe permitir agregar un nuevo módulo y enfocarlo automáticamente en el selector', async ({ page }) => {
    const btnAgregar = page.locator('#btn-agregar-modulo-top');
    await expect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    // El contador de módulos debe actualizarse a 2
    await expect(page.locator('text=2 módulos')).toBeVisible();

    // El selector debe tener seleccionado el módulo 2
    const selectModulo = page.locator('#select-modulo-activo');
    await expect(selectModulo).toHaveValue('1');

    // Debe mostrar la píldora para Módulo 2
    await expect(page.locator('button:has-text("Módulo 2")').first()).toBeVisible();

    // El pie de navegación debe indicar Módulo 2 de 2 y permitir regresar al Módulo Anterior
    const btnPrev = page.locator('#btn-modulo-prev');
    await expect(btnPrev).toBeVisible();
    await expect(btnPrev).not.toBeDisabled();
  });

  test('Debe permitir cambiar entre módulos usando las píldoras y los botones de navegación inferior', async ({ page }) => {
    // Añadir dos módulos adicionales (total 3)
    await page.locator('#btn-agregar-modulo-top').click();
    await page.locator('#btn-agregar-modulo-top').click();
    await expect(page.locator('text=3 módulos')).toBeVisible();

    // Hacer clic en la píldora de Módulo 1
    const pildoraMod1 = page.locator('button:has-text("Módulo 1")').first();
    await pildoraMod1.click();
    await expect(page.locator('#select-modulo-activo')).toHaveValue('0');
    await expect(page.locator('#btn-modulo-prev')).toBeDisabled();

    // Usar botón Siguiente Módulo (#2)
    const btnNext = page.locator('#btn-modulo-next');
    await expect(btnNext).toBeVisible();
    await btnNext.click();
    await expect(page.locator('#select-modulo-activo')).toHaveValue('1');

    // Usar botón Módulo Anterior (#1)
    const btnPrev = page.locator('#btn-modulo-prev');
    await expect(btnPrev).not.toBeDisabled();
    await btnPrev.click();
    await expect(page.locator('#select-modulo-activo')).toHaveValue('0');
  });

  test('Debe permitir alternar entre el modo de enfoque y la vista completa de todos los módulos', async ({ page }) => {
    // Añadir un módulo para tener al menos 2
    await page.locator('#btn-agregar-modulo-top').click();

    const btnToggle = page.locator('#btn-toggle-modo-vista');
    
    // Cambiar a Ver Todos
    await btnToggle.click();
    await expect(page.locator('text=Vista general: mostrando todos los módulos')).toBeVisible();
    await expect(page.locator('#select-modulo-activo')).toHaveValue('all');

    // Volver a Modo Enfoque
    await btnToggle.click();
    await expect(page.locator('text=Editando enfocado: Módulo 1')).toBeVisible();
    await expect(page.locator('#select-modulo-activo')).toHaveValue('0');
  });
});
