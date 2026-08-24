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
    // Verificar los enlaces hacia registro de instructor e institución
    const linkInstructor = modal.getByRole('link', { name: /Soy Instructor/i });
    await expect(linkInstructor).toBeVisible();
    await expect(linkInstructor).toHaveAttribute('href', '/register?type=instructor');

    const linkInstitucion = modal.getByRole('link', { name: /Soy Institución/i });
    await expect(linkInstitucion).toBeVisible();
    await expect(linkInstitucion).toHaveAttribute('href', '/register?type=institucion');
  });

  test('Debe navegar a la página de login sin errores de React Hooks', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Iniciar Sesión"');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Debe navegar a la página de validación de constancia desde la tarjeta del Hero', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Verifica la autenticidad de tu constancia"');
    await expect(page).toHaveURL(/\/validar/);
  });

  test('Debe mostrar todas las opciones de categorías en el combobox del buscador', async ({ page }) => {
    await page.goto('/');
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toBeVisible();
    
    // Verificar que existan las opciones de categorías clave en el select
    const options = await categorySelect.locator('option').allInnerTexts();
    expect(options).toContain('Todas las categorías');
    expect(options).toContain('Salud');
    expect(options).toContain('Negocios');
    expect(options).toContain('Tecnología');
    expect(options).toContain('Desarrollo Personal');
    expect(options).toContain('Idiomas');
  });

  test('Debe realizar la búsqueda de cursos públicamente sin pedir inicio de sesión', async ({ page }) => {
    await page.goto('/');
    const searchForm = page.locator('form[action="/cursos"]');
    await searchForm.locator('input[name="q"]').fill('salud');
    await searchForm.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/cursos\?q=salud/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/Cursos/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Debe navegar a la vista pública de cursos al hacer clic en Explorar todos los cursos', async ({ page }) => {
    await page.goto('/');
    const botonExplorar = page.getByRole('link', { name: /Explorar todos los cursos/i });
    await expect(botonExplorar).toBeVisible();
    await botonExplorar.click();
    await expect(page).toHaveURL(/\/cursos/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Debe contener enlaces válidos y funcionales en el Footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    
    // Verificar enlaces principales del footer
    await expect(footer.getByRole('link', { name: 'Catálogo de Cursos' })).toHaveAttribute('href', '/cursos');
    await expect(footer.getByRole('link', { name: 'Validar Constancia' })).toHaveAttribute('href', '/validar');
    await expect(footer.getByRole('link', { name: 'Aviso de Privacidad' })).toHaveAttribute('href', '/legal/aviso-privacidad');
    await expect(footer.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute('href', '/legal/terminos-uso');
  });
});
