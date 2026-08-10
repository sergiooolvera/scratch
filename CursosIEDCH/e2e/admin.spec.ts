import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Administración y Permisos de Rol', () => {
  test('Debe redirigir al dashboard a un Alumno intentando ingresar a /admin', async ({ page }) => {
    await loginAs(page, TEST_USERS.alumno);
    await page.goto('/admin');
    
    // Middleware debe bloquear acceso a /admin y redirigir a /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Debe permitir acceso a /admin para el usuario Administrador de prueba', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    await page.goto('/admin');
    
    // El administrador debe poder ver la ruta /admin sin ser redirigido a /dashboard
    await expect(page).toHaveURL(/\/admin/);
  });

  test('Debe permitir acceso a /profesor para el usuario Profesor de prueba', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor');
    
    // El profesor debe poder ver la ruta /profesor sin ser redirigido a /dashboard
    await expect(page).toHaveURL(/\/profesor/);
  });
});
