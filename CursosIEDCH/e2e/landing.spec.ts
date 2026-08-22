import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('Debe cargar la página principal con el nuevo diseño', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que el Hero se muestre (usando text en lugar de exact heading por los saltos de línea)
    await expect(page.locator('text="El presente"').first()).toBeVisible();
    await expect(page.locator('text="del futuro"').first()).toBeVisible();
    
    // Verificar Navbar
    await expect(page.locator('nav').getByRole('link', { name: 'Inicio' })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'Nosotros' })).toBeVisible();
    
    // Verificar sección Cursos Populares
    await expect(page.getByRole('heading', { name: 'Cursos populares' })).toBeVisible();
    
    // Verificar Testimonios
    await expect(page.getByRole('heading', { name: 'Lo que dicen nuestros estudiantes' })).toBeVisible();
  });

  test('Debe abrir el modal de publicación de cursos', async ({ page }) => {
    await page.goto('/');
    
    const botonPublicar = page.getByRole('button', { name: /Quiero publicar un curso/i }).first();
    await botonPublicar.click();

    // Verificar el Modal
    const modal = page.locator('div[role="dialog"]');
    await expect(modal.getByRole('heading', { name: '¿Cómo quieres participar?' })).toBeVisible();
    await expect(modal.getByRole('link', { name: /Soy Instructor/i })).toBeVisible();
    await expect(modal.getByRole('link', { name: /Soy Institución/i })).toBeVisible();
  });
});
