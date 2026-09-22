import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Funcionalidad de Archivar y Desarchivar Cursos', () => {
  test('Debe mostrar botones de filtro por estado en /admin/cursos', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    await page.goto('/admin/cursos');

    await expect(page).toHaveURL(/\/admin\/cursos/);
    
    // Verificar visibilidad de filtros por estado
    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Aprobados' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archivados' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pendientes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rechazados' })).toBeVisible();
  });

  test('Debe poder alternar filtros y buscar cursos en /admin/cursos', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    await page.goto('/admin/cursos');

    // Hacer clic en filtro de Archivados
    await page.getByRole('button', { name: 'Archivados' }).click();
    await expect(page.getByRole('button', { name: 'Archivados' })).toHaveClass(/bg-white/);

    // Hacer clic en filtro de Aprobados
    await page.getByRole('button', { name: 'Aprobados' }).click();
    await expect(page.getByRole('button', { name: 'Aprobados' })).toHaveClass(/bg-white/);
  });
});
