import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Clase Virtual Modular por Módulo (Zoom, Meet, Teams)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('iedch_subir_curso_tour_completed', 'true');
      localStorage.setItem('iedch_profesor_dashboard_tour_completed', 'true');
    });
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Debe mostrar la sección de Clase Virtual en el Paso 2 (Temario y Clases) para cada módulo', async ({ page }) => {
    // 1. Navegar al Paso 2: Temario y Clases
    const tabModulos = page.locator('button:has-text("2. Temario y Clases")').first();
    await expect(tabModulos).toBeVisible({ timeout: 15000 });
    await tabModulos.click();

    // 2. Verificar que existe la sección de Clase Virtual en el Módulo 1
    const seccionClaseVirtualMod1 = page.locator('text=Clase Virtual o Enlace Externo (Zoom, Meet, Teams) (Opcional)').first();
    await expect(seccionClaseVirtualMod1).toBeVisible();

    // 3. Escribir datos de clase virtual en el módulo 1
    const inputReunionMod1 = page.locator('input[placeholder*="https://zoom.us/j/"]').first();
    await expect(inputReunionMod1).toBeVisible();
    await inputReunionMod1.fill('https://meet.google.com/abc-defg-hij');

    const textareaNotaMod1 = page.locator('textarea[placeholder*="Próxima clase virtual"]').first();
    await expect(textareaNotaMod1).toBeVisible();
    await textareaNotaMod1.fill('Clase de inducción el lunes a las 6:00 PM');

    // 4. Verificar que aparece el botón de limpiar enlace y nota
    const btnLimpiarMod1 = page.locator('button:has-text("LIMPIAR ENLACE Y NOTA")').first();
    await expect(btnLimpiarMod1).toBeVisible();

    // 5. Agregar un Módulo 2 y verificar que tiene sus propios campos independientes
    const btnAgregarModulo = page.locator('#btn-agregar-modulo-top');
    await btnAgregarModulo.click();

    const inputReunionMod2 = page.locator('input[placeholder*="https://zoom.us/j/"]').first();
    await expect(inputReunionMod2).toBeVisible();
    await expect(inputReunionMod2).toHaveValue('');

    await inputReunionMod2.fill('https://zoom.us/j/1234567890');
    await expect(inputReunionMod2).toHaveValue('https://zoom.us/j/1234567890');

    // 6. Probar botón de limpiar en el módulo 2
    const btnLimpiarMod2 = page.locator('button:has-text("LIMPIAR ENLACE Y NOTA")').first();
    await expect(btnLimpiarMod2).toBeVisible();
    await btnLimpiarMod2.click({ force: true });
    await expect(inputReunionMod2).toHaveValue('');
  });

  test('El Paso 4 (Avisos, Notas y Enviar a Revisión) NO debe incluir la sección de enlace de videoconferencia', async ({ page }) => {
    // 1. Navegar al Paso 4
    const tabRevision = page.locator('button:has-text("4. Avisos, Notas")').first();
    await expect(tabRevision).toBeVisible({ timeout: 15000 });
    await tabRevision.click();

    // 2. Verificar que el título del paso es 4. Avisos, Notas y Enviar a Revisión
    await expect(page.locator('#seccion-paso-4 h2:has-text("4. Avisos, Notas y Enviar a Revisión")')).toBeVisible();

    // 3. Verificar que NO hay campo de enlace de videoconferencia ni dentro del paso 4 ni visible en pantalla
    const inputZoomPaso4 = page.locator('#seccion-paso-4 input[placeholder*="zoom.us"]');
    await expect(inputZoomPaso4).toHaveCount(0);

    const tituloClaseEnVivo = page.locator('#seccion-paso-4 h4:has-text("Enlace de Clase Virtual o Videoconferencia")');
    await expect(tituloClaseEnVivo).toHaveCount(0);
  });
});
