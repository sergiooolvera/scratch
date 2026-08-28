import { test, expect } from '@playwright/test';

test.describe('Detalle de Curso - Rediseño de Vista Moderna', () => {
  test('Debe cargar la vista de detalle de curso con el nuevo diseño tipo landing page', async ({ page }) => {
    // 1. Navegar al catálogo de cursos primero
    await page.goto('/cursos');
    await page.waitForLoadState('networkidle');

    // 2. Encontrar el primer enlace a un curso en el catálogo
    const courseCardLink = page.locator('a[href^="/cursos/"]').first();
    await expect(courseCardLink).toBeVisible({ timeout: 15000 });
    
    // Obtener la URL del curso y navegar
    const courseUrl = await courseCardLink.getAttribute('href');
    expect(courseUrl).toBeTruthy();
    await page.goto(courseUrl!);
    await page.waitForLoadState('networkidle');

    // 3. Verificar elementos clave del Hero
    await expect(page.locator('text=CURSO EN LÍNEA').first()).toBeVisible();
    await expect(page.locator('text=Duración').first()).toBeVisible();
    await expect(page.locator('text=Modalidad').first()).toBeVisible();
    await expect(page.locator('text=Constancia con valor curricular').first()).toBeVisible();

    // 4. Verificar secciones del Grid de Contenido
    await expect(page.locator('#temario-curso')).toBeVisible();
    await expect(page.locator('text=Temario del curso').first()).toBeVisible();
    await expect(page.locator('text=Competencias que desarrollarás').first()).toBeVisible();
    await expect(page.locator('text=Instructor').first()).toBeVisible();

    // 5. Verificar sección de Valoraciones y Opiniones
    await expect(page.locator('text=Valoraciones y opiniones').first()).toBeVisible();
    await expect(page.locator('text=Ver todas las opiniones').first()).toBeVisible();

    // 6. Verificar sección de los 5 pasos de constancia
    await expect(page.locator('text=Así obtienes tu constancia verificable').first()).toBeVisible();
    await expect(page.locator('text=Regístrate').first()).toBeVisible();
    await expect(page.locator('text=Realiza tu pago').first()).toBeVisible();
    await expect(page.locator('text=Accede al curso').first()).toBeVisible();
    await expect(page.locator('text=Finaliza y aprueba').first()).toBeVisible();
    await expect(page.locator('text=Obtén tu constancia').first()).toBeVisible();

    // 7. Verificar el Banner Inferior de exploración
    await expect(page.locator('text=Explorar todos los cursos').first()).toBeVisible();
    await expect(page.locator('text=Descubre más capacitaciones y sigue aprendiendo.').first()).toBeVisible();

    // 8. Verificar la tarjeta lateral de checkout / métodos de pago o accesos
    await expect(page.locator('text=Pago 100% seguro').first()).toBeVisible();
    await expect(page.locator('text=Tu constancia tiene valor curricular verificable').first()).toBeVisible();
    await expect(page.locator('text=¿Tienes dudas?').first()).toBeVisible();
  });

  test('Debe interactuar correctamente con el modal de opiniones completas', async ({ page }) => {
    await page.goto('/cursos');
    const courseCardLink = page.locator('a[href^="/cursos/"]').first();
    const courseUrl = await courseCardLink.getAttribute('href');
    await page.goto(courseUrl!);
    await page.waitForLoadState('networkidle');

    // Clic en "Ver todas las opiniones"
    const openReviewsBtn = page.locator('button:has-text("Ver todas las opiniones")');
    await openReviewsBtn.click();

    // Validar que el modal se muestre
    await expect(page.locator('text=Opiniones de la Comunidad')).toBeVisible();
    
    // Cerrar modal
    const closeBtn = page.locator('button:has(svg.lucide-x)').last();
    await closeBtn.click();
    await expect(page.locator('text=Opiniones de la Comunidad')).not.toBeVisible();
  });

  test('Debe abrir y cerrar correctamente el modal de perfil del instructor', async ({ page }) => {
    await page.goto('/cursos');
    const courseCardLink = page.locator('a[href^="/cursos/"]').first();
    const courseUrl = await courseCardLink.getAttribute('href');
    await page.goto(courseUrl!);
    await page.waitForLoadState('networkidle');

    // Clic en "Ver perfil"
    const openInstructorBtn = page.locator('button:has-text("Ver perfil")').first();
    await expect(openInstructorBtn).toBeVisible();
    await openInstructorBtn.click();

    // Validar que el modal de instructor se muestre
    await expect(page.locator('text=Perfil Académico del Docente')).toBeVisible();
    await expect(page.locator('text=Semblanza Profesional')).toBeVisible();

    // Cerrar modal
    const closeBtn = page.locator('button:has(svg.lucide-x)').last();
    await closeBtn.click();
    await expect(page.locator('text=Perfil Académico del Docente')).not.toBeVisible();
  });

  test('Debe redirigir a la pantalla de login al hacer clic en los botones de pago si no está autenticado', async ({ page }) => {
    await page.goto('/cursos');
    const courseCardLink = page.locator('a[href^="/cursos/"]').first();
    const courseUrl = await courseCardLink.getAttribute('href');
    await page.goto(courseUrl!);
    await page.waitForLoadState('networkidle');

    // Clic en "Pagar con Transferencia"
    const transferBtn = page.locator('button:has-text("Pagar con Transferencia")');
    await expect(transferBtn).toBeVisible();
    await transferBtn.click();

    // Debe redirigir a la vista de login con parámetro next
    await page.waitForURL(/\/login\?next=/);
    expect(page.url()).toContain('/login?next=');
  });
});
