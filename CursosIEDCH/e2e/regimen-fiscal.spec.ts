import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Régimen Fiscal, Perfil y Mis Ventas 2026', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('iedch_subir_curso_tour_completed', 'true');
      localStorage.setItem('iedch_profesor_dashboard_tour_completed', 'true');
    });
  });

  test('Debe mostrar las 3 opciones de régimen fiscal en /perfil con Sin RFC por defecto', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/perfil/);

    // Verificar presencia del contenedor de selección de régimen
    const selectorRegimen = page.getByTestId('regimen-fiscal-selector');
    await expect(selectorRegimen).toBeVisible({ timeout: 15000 });

    // Verificar las 3 radio cards
    const radioSinRfc = page.getByTestId('radio-sin-rfc');
    const radioConRfc = page.getByTestId('radio-con-rfc');
    const radioPersonaMoral = page.getByTestId('radio-persona-moral');

    await expect(radioSinRfc).toBeVisible();
    await expect(radioConRfc).toBeVisible();
    await expect(radioPersonaMoral).toBeVisible();

    // Sin RFC no debe mostrar el input obligatorio de RFC
    await radioSinRfc.click();
    await expect(page.getByTestId('input-rfc')).toHaveCount(0);

    // Al seleccionar "Con RFC", debe desplegar el campo de RFC de 13 caracteres
    await radioConRfc.click();
    const inputRfcPf = page.getByTestId('input-rfc');
    await expect(inputRfcPf).toBeVisible();
    await expect(inputRfcPf).toHaveAttribute('maxlength', '13');

    // Al seleccionar "Persona Moral", debe desplegar el campo de RFC de 12 caracteres
    await radioPersonaMoral.click();
    const inputRfcPm = page.getByTestId('input-rfc');
    await expect(inputRfcPm).toBeVisible();
    await expect(inputRfcPm).toHaveAttribute('maxlength', '12');
  });

  test('Debe mostrar la columna y opciones de Régimen Fiscal en /admin/validaciones', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    await page.goto('/admin/validaciones');
    await expect(page).toHaveURL(/\/admin\/validaciones/);

    // Verificar encabezado de Régimen Fiscal en la tabla
    const thRegimen = page.getByRole('columnheader', { name: /Régimen Fiscal/i });
    await expect(thRegimen).toBeVisible({ timeout: 15000 });

    // Verificar que los registros muestren etiquetas de régimen activo
    await expect(page.locator('text=Activo:').first()).toBeVisible({ timeout: 15000 });
  });

  test('Debe proyectar el Régimen Fiscal activo y desglose financiero en /profesor/ventas', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await expect(page).toHaveURL(/\/profesor\/ventas/);

    // Verificar presencia del banner de Régimen Fiscal Activo
    const badgeRegimen = page.getByTestId('regimen-activo-titulo');
    await expect(badgeRegimen).toBeVisible({ timeout: 15000 });

    // Enlace a perfil
    const linkCambio = page.getByRole('link', { name: /Cambiar Régimen Fiscal/i });
    await expect(linkCambio).toBeVisible();
    await expect(linkCambio).toHaveAttribute('href', '/perfil');
  });
});
