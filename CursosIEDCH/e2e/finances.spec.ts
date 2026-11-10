import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Módulo de Finanzas, Ventas y Simulador Fiscal 2026', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('iedch_subir_curso_tour_completed', 'true');
      localStorage.setItem('iedch_profesor_dashboard_tour_completed', 'true');
    });
  });

  test('Debe permitir el acceso del profesor a la vista de ventas (/profesor/ventas)', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await expect(page).toHaveURL(/\/profesor\/ventas/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Debe abrir el nuevo simulador desde Subir Curso con el diseño y valores iniciales correctos', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    const btnSimulador = page.locator('#btn-simulador-ingresos');
    await expect(btnSimulador).toBeVisible({ timeout: 15000 });
    await expect(btnSimulador).toContainText('Simular Ganancias');
    await btnSimulador.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Simula tus ingresos' })).toBeVisible();
    await expect(dialog.getByText('Descubre cuánto podrías recibir por tus cursos.')).toBeVisible();

    // Verificar las 3 opciones fiscales oficiales
    await expect(dialog.getByTestId('regimen-PERSONA_FISICA')).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByTestId('regimen-PERSONA_MORAL')).toHaveAttribute('aria-checked', 'false');
    await expect(dialog.getByTestId('regimen-SIN_RFC')).toHaveAttribute('aria-checked', 'false');

    // Valores por defecto: 20 alumnos x $200 MXN
    await expect(dialog.getByTestId('simulador-alumnos-input')).toHaveValue('20');
    await expect(dialog.getByTestId('simulador-precio-input')).toHaveValue('200');
    await expect(dialog.getByTestId('simulador-ventas-brutas-hero')).toContainText('$4,000.00 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-hero')).toContainText('$2,283.64 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-desglose')).toContainText('$2,283.64 MXN');
    await expect(dialog.getByTestId('simulador-porcentaje-ventas')).toHaveText('57%');

    // Verificar que no exista el botón anterior "Aplicar Precio al Curso" y sí el CTA de WhatsApp
    await expect(dialog.getByRole('button', { name: /Aplicar Precio al Curso/i })).toHaveCount(0);
    const whatsappCta = dialog.getByTestId('simulador-whatsapp-cta');
    await expect(whatsappCta).toBeVisible();
    await expect(whatsappCta).toHaveAttribute('href', /https:\/\/wa\.me\/527298184978/);
  });

  test('Debe calcular exactamente los montos de los Excel 2026 para Persona física, Persona moral y Sin RFC', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    await page.locator('#btn-simulador-ingresos').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Caso de referencia de los 3 archivos Excel: 25 alumnos a $1,000 MXN
    await dialog.getByTestId('simulador-alumnos-input').fill('25');
    await dialog.getByTestId('simulador-precio-input').fill('1000');

    // 1. Persona física (2.5% ISR + 50% IVA)
    await expect(dialog.getByTestId('desglose-ventas-brutas')).toContainText('$25,000.00 MXN');
    await expect(dialog.getByTestId('desglose-comision-stripe')).toContainText('-$1,131.00 MXN');
    await expect(dialog.getByTestId('desglose-participacion-egac')).toContainText('-$7,106.41 MXN');
    await expect(dialog.getByTestId('desglose-impuestos')).toContainText('-$2,262.93 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-hero')).toContainText('$14,499.66 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-desglose')).toContainText('$14,499.66 MXN');
    await expect(dialog.getByTestId('simulador-porcentaje-ventas')).toHaveText('58%');

    // 2. Persona moral (2.5% ISR acreditable + 50% IVA)
    await dialog.getByTestId('regimen-PERSONA_MORAL').click();
    await expect(dialog.getByTestId('regimen-PERSONA_MORAL')).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByTestId('desglose-impuestos')).toContainText('-$2,262.93 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-hero')).toContainText('$14,499.66 MXN');

    // 3. Sin RFC (20% ISR + 100% IVA)
    await dialog.getByTestId('regimen-SIN_RFC').click();
    await expect(dialog.getByTestId('regimen-SIN_RFC')).toHaveAttribute('aria-checked', 'true');
    await expect(dialog.getByTestId('desglose-impuestos')).toContainText('-$7,758.62 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-hero')).toContainText('$9,003.97 MXN');
    await expect(dialog.getByTestId('simulador-ingreso-neto-desglose')).toContainText('$9,003.97 MXN');
    await expect(dialog.getByTestId('simulador-porcentaje-ventas')).toHaveText('36%');
  });

  test('Debe permitir interactuar con acordeón, tooltips informativos, sliders, precio prellenado y cierre en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/subir-curso');

    // Prellenar precio del curso en el formulario antes de abrir el simulador
    const precioForm = page.locator('input[name="precio"]');
    await expect(precioForm).toBeVisible({ timeout: 15000 });
    await precioForm.fill('1500');

    await page.locator('#btn-simulador-ingresos').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('simulador-precio-input')).toHaveValue('1500');

    // Probar sincronización de los sliders de rango
    await dialog.getByTestId('simulador-precio-slider').fill('500');
    await expect(dialog.getByTestId('simulador-precio-input')).toHaveValue('500');
    await dialog.getByTestId('simulador-alumnos-slider').fill('10');
    await expect(dialog.getByTestId('simulador-alumnos-input')).toHaveValue('10');

    // Abrir detalle de Participación EGAC (70/30)
    await dialog.getByRole('button', { name: 'Detalle participación EGAC' }).click();
    await expect(dialog.getByText(/Esquema 70\/30 sobre base distribuible/i)).toBeVisible();

    // Abrir detalle de impuestos
    await dialog.getByRole('button', { name: 'Detalle impuestos y retenciones estimadas' }).click();
    await expect(dialog.getByText(/Art\. 113-A LISR/i)).toBeVisible();

    // Colapsar y volver a expandir el desglose
    const toggleDesglose = dialog.getByRole('button', { name: 'Ver desglose de tu ingreso' });
    await toggleDesglose.click();
    await expect(dialog.getByTestId('desglose-ventas-brutas')).toBeHidden();
    await toggleDesglose.click();
    await expect(dialog.getByTestId('desglose-ventas-brutas')).toBeVisible();

    // Cerrar modal con botón X
    await dialog.getByRole('button', { name: 'Cerrar simulador' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Debe funcionar el nuevo simulador con reparto 70/30 desde Editar Curso (/profesor/editar-curso/[id])', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(supabaseUrl).toBeTruthy();
    expect(supabaseServiceKey).toBeTruthy();

    const adminClient = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const profUser = usersData?.users?.find((u) => u.email === TEST_USERS.profesor.email);
    expect(profUser).toBeTruthy();

    // Crear curso temporal con porcentaje_profesor legacy (40) para confirmar que el simulador 2026 usa 70/30
    const { data: tempCurso, error: insertError } = await adminClient
      .from('ie_cursos')
      .insert({
        titulo: 'Curso Temporal E2E Simulador 2026',
        descripcion: 'Curso temporal para validar simulador en editar-curso',
        precio: 1000,
        estado: 'aprobado',
        creado_por: profUser!.id,
        porcentaje_profesor: 40,
      })
      .select('id')
      .single();

    expect(insertError).toBeNull();
    expect(tempCurso?.id).toBeTruthy();

    try {
      await loginAs(page, TEST_USERS.profesor);
      await page.goto(`/profesor/editar-curso/${tempCurso!.id}`);

      const btnSimulador = page.locator('#btn-simulador-ingresos');
      await expect(btnSimulador).toBeVisible({ timeout: 15000 });
      await expect(btnSimulador).toContainText('Simular Ganancias');
      await btnSimulador.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: 'Simula tus ingresos' })).toBeVisible();
      await expect(dialog.getByTestId('simulador-precio-input')).toHaveValue('1000');

      await dialog.getByTestId('simulador-alumnos-input').fill('25');
      await expect(dialog.getByTestId('simulador-ingreso-neto-hero')).toContainText('$14,499.66 MXN');
      await expect(dialog.getByTestId('desglose-participacion-egac')).toContainText('-$7,106.41 MXN');
    } finally {
      await adminClient.from('ie_cursos').delete().eq('id', tempCurso!.id);
    }
  });
});
