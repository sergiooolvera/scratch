import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Reporte de Ventas para Profesor/Instructor - Requisitos 2026', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('iedch_subir_curso_tour_completed', 'true');
      localStorage.setItem('iedch_profesor_dashboard_tour_completed', 'true');
    });
  });

  test('1. Debe renderizar la estructura completa: Header, Filtros, 4 KPIs, Paneles de Datos y Tabla', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await expect(page).toHaveURL(/\/profesor\/ventas/);

    // Botón regresar y encabezado
    await expect(page.getByTestId('btn-regresar')).toBeVisible();
    await expect(page.getByTestId('header-curso-titulo')).toBeVisible();

    // Filtros de búsqueda
    await expect(page.getByTestId('input-buscar-alumno')).toBeVisible();
    await expect(page.getByTestId('select-buscar-curso')).toBeVisible();
    await expect(page.getByTestId('select-buscar-anio')).toBeVisible();
    await expect(page.getByTestId('select-buscar-mes')).toBeVisible();
    await expect(page.getByTestId('btn-buscar')).toBeVisible();

    // 4 KPIs
    await expect(page.getByTestId('kpi-ventas-registradas')).toBeVisible();
    await expect(page.getByTestId('kpi-proximo-pago')).toBeVisible();
    await expect(page.getByTestId('kpi-pagos-pendientes')).toBeVisible();
    await expect(page.getByTestId('kpi-monto-pendiente')).toBeVisible();

    // Paneles centrales
    await expect(page.getByTestId('panel-datos-bancarios')).toBeVisible();
    await expect(page.getByTestId('panel-pagos-pendientes-curso')).toBeVisible();

    // Sección de tabla
    await expect(page.getByTestId('seccion-tabla-ventas')).toBeVisible();
  });

  test('2. Debe mostrar datos bancarios registrados, insignia de verificación y régimen fiscal', async ({ page }) => {
    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');

    // Panel de datos bancarios
    const panelBanco = page.getByTestId('panel-datos-bancarios');
    await expect(panelBanco).toContainText('Banco:');
    await expect(panelBanco).toContainText('Titular:');
    await expect(panelBanco).toContainText('Cuenta:');
    await expect(panelBanco).toContainText('CLABE:');

    // Insignia de verificación (VERIFICADO o NO VERIFICADO)
    const badgeVerif = panelBanco.locator('[data-testid="badge-verificado"], [data-testid="badge-no-verificado"]');
    await expect(badgeVerif).toBeVisible();

    // Régimen Fiscal activo
    await expect(page.getByTestId('regimen-activo-titulo')).toBeVisible();
  });

  test('3. Debe ejecutar la consulta al presionar Buscar y renderizar métodos de pago y estatus', async ({ page }) => {
    await page.route('**/api/admin/stripe-sessions', async route => {
      const mockData = {
        data: [
          {
            id: 'cs_test_1',
            created: 1785984000,
            paid_at: 1785984000,
            amount: 450.00,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Juan Pérez',
            curso_id: 'curso_1',
            curso_titulo: 'Cuidados Domiciliarios',
            curso_modalidad: 'abierta',
            curso_limite_inscripcion: null,
            method: 'Tarjeta',
            origin: 'Stripe'
          },
          {
            id: 'cs_test_2',
            created: 1785983000,
            paid_at: null,
            amount: 450.00,
            payment_status: 'unpaid',
            status: 'open',
            customer_name: 'Ana López',
            curso_id: 'curso_1',
            curso_titulo: 'Cuidados Domiciliarios',
            curso_modalidad: 'abierta',
            curso_limite_inscripcion: null,
            method: 'OXXO',
            origin: 'Stripe'
          },
          {
            id: 'cs_test_3',
            created: 1785982000,
            paid_at: 1785982000,
            amount: 800.00,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Carlos Ruiz',
            curso_id: 'curso_2',
            curso_titulo: 'Curso de Anatomía',
            curso_modalidad: 'cerrada',
            curso_limite_inscripcion: '2026-08-01',
            method: 'Transferencia',
            origin: 'Manual'
          },
          {
            id: 'cs_test_4',
            created: 1785981000,
            paid_at: 1785981000,
            amount: 0.00,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'María Gómez',
            curso_id: 'curso_2',
            curso_titulo: 'Curso de Anatomía',
            curso_modalidad: 'cerrada',
            curso_limite_inscripcion: '2026-08-01',
            method: 'Cupón 100% Descuento',
            origin: 'Cupón / Beca'
          }
        ]
      };
      await route.fulfill({ status: 200, json: mockData });
    });

    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');

    // Hacer clic en Buscar
    await page.getByTestId('btn-buscar').click();

    // Verificar que los KPIs se actualicen
    await expect(page.getByTestId('kpi-ventas-registradas')).toHaveText('4');

    // Verificar presencia de los métodos en la tabla
    const tabla = page.getByTestId('seccion-tabla-ventas');
    await expect(tabla).toContainText('Tarjeta');
    await expect(tabla).toContainText('OXXO');
    await expect(tabla).toContainText('Transferencia');
    await expect(tabla).toContainText('Cupón 100%');

    // Verificar estatus Pagado y Pendiente
    await expect(page.getByTestId('status-pagado').first()).toBeVisible();
    await expect(page.getByTestId('status-pendiente').first()).toBeVisible();

    // En pagos pendientes por curso debe listar los cursos con ventas pagadas
    const panelPagosCurso = page.getByTestId('panel-pagos-pendientes-curso');
    await expect(panelPagosCurso).toContainText('Cuidados Domiciliarios');
    await expect(panelPagosCurso).toContainText('Curso de Anatomía');
  });

  test('4. Debe abrir la pantalla emergente con el desglose de la simulación al hacer clic en Desglose', async ({ page }) => {
    await page.route('**/api/admin/stripe-sessions', async route => {
      const mockData = {
        data: [
          {
            id: 'v1',
            created: 1785984000,
            paid_at: 1785984000,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Juan Pérez',
            curso_id: 'c1',
            curso_titulo: 'Cuidados Domiciliarios',
            curso_modalidad: 'abierta',
            method: 'Tarjeta'
          }
        ]
      };
      await route.fulfill({ status: 200, json: mockData });
    });

    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await page.getByTestId('btn-buscar').click();

    // Botón de desglose en la tabla de pagos pendientes
    const btnDesglose = page.getByTestId('btn-desglose-c1');
    await expect(btnDesglose).toBeVisible();
    await btnDesglose.click();

    // Modal de desglose visible
    const modal = page.getByTestId('modal-desglose');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('modal-desglose-titulo')).toContainText('Desglose de Liquidación Neta');
    await expect(page.getByTestId('modal-desglose-monto-neto')).toBeVisible();

    // Conceptos contables presentes
    await expect(modal).toContainText('1. Ventas Brutas');
    await expect(modal).toContainText('2. Comisión Pasarela Stripe');
    await expect(modal).toContainText('3. Base Distribuible');
    await expect(modal).toContainText('4. Participación Bruta Instructor (70%)');
    await expect(modal).toContainText('5. Retención ISR');
    await expect(modal).toContainText('6. Retención IVA');
    await expect(modal).toContainText('Liquidación Neta Final');

    // Cerrar modal
    await page.getByTestId('btn-cerrar-modal').click();
    await expect(modal).toHaveCount(0);
  });

  test('5. Debe filtrar reactivamente en el grid de ventas por método de pago', async ({ page }) => {
    await page.route('**/api/admin/stripe-sessions', async route => {
      const mockData = {
        data: [
          {
            id: 'v1',
            created: 1785984000,
            paid_at: 1785984000,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Alumno Tarjeta',
            curso_id: 'c1',
            curso_titulo: 'Curso General',
            method: 'Tarjeta'
          },
          {
            id: 'v2',
            created: 1785983000,
            paid_at: 1785983000,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Alumno OXXO',
            curso_id: 'c1',
            curso_titulo: 'Curso General',
            method: 'OXXO'
          },
          {
            id: 'v3',
            created: 1785982000,
            paid_at: 1785982000,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Alumno Transferencia',
            curso_id: 'c1',
            curso_titulo: 'Curso General',
            method: 'Transferencia'
          }
        ]
      };
      await route.fulfill({ status: 200, json: mockData });
    });

    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await page.getByTestId('btn-buscar').click();

    const tabla = page.getByTestId('seccion-tabla-ventas');
    await expect(tabla).toContainText('Alumno Tarjeta');
    await expect(tabla).toContainText('Alumno OXXO');
    await expect(tabla).toContainText('Alumno Transferencia');

    // Filtrar solo OXXO
    const selectMetodo = page.getByTestId('select-filtro-metodo-pago');
    await selectMetodo.selectOption('oxxo');
    await expect(tabla).toContainText('Alumno OXXO');
    await expect(tabla).not.toContainText('Alumno Tarjeta');
    await expect(tabla).not.toContainText('Alumno Transferencia');

    // Filtrar solo Transferencia
    await selectMetodo.selectOption('transferencia');
    await expect(tabla).toContainText('Alumno Transferencia');
    await expect(tabla).not.toContainText('Alumno OXXO');
    await expect(tabla).not.toContainText('Alumno Tarjeta');

    // Regresar a Todos los métodos
    await selectMetodo.selectOption('todos');
    await expect(tabla).toContainText('Alumno Tarjeta');
    await expect(tabla).toContainText('Alumno OXXO');
    await expect(tabla).toContainText('Alumno Transferencia');
  });

  test('6. Debe filtrar por año y mes en el buscador superior y actualizar los pagos pendientes por corte', async ({ page }) => {
    await page.route('**/api/admin/stripe-sessions', async route => {
      const mockData = {
        data: [
          {
            id: 'v_marzo',
            created: 1774656000, // Marzo 2026
            paid_at: 1774656000,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Alumno de Marzo',
            curso_id: 'c1',
            curso_titulo: 'Fundamentos de Investigación',
            curso_modalidad: 'abierta',
            method: 'Tarjeta'
          },
          {
            id: 'v_abril',
            created: 1777420800, // Abril 2026
            paid_at: 1777420800,
            amount: 500,
            payment_status: 'paid',
            status: 'complete',
            customer_name: 'Alumno de Abril',
            curso_id: 'c1',
            curso_titulo: 'Fundamentos de Investigación',
            curso_modalidad: 'abierta',
            method: 'Tarjeta'
          }
        ]
      };
      await route.fulfill({ status: 200, json: mockData });
    });

    await loginAs(page, TEST_USERS.profesor);
    await page.goto('/profesor/ventas');
    await page.getByTestId('btn-buscar').click();

    // Sin filtro de año ni mes, se ven ambos
    await expect(page.getByTestId('kpi-ventas-registradas')).toHaveText('2');
    const panelPagos = page.getByTestId('panel-pagos-pendientes-curso');
    await expect(panelPagos).toContainText('Marzo');
    await expect(panelPagos).toContainText('Abril');

    // Filtrar por Año 2026 y Mes de Marzo ('03')
    const selectAnio = page.getByTestId('select-buscar-anio');
    const selectMes = page.getByTestId('select-buscar-mes');
    await selectAnio.selectOption('2026');
    await selectMes.selectOption('03');

    // Al filtrar por Marzo, la tabla y los pagos pendientes solo reflejan marzo
    await expect(page.getByTestId('kpi-ventas-registradas')).toHaveText('1');
    const tabla = page.getByTestId('seccion-tabla-ventas');
    await expect(tabla).toContainText('Alumno de Marzo');
    await expect(tabla).not.toContainText('Alumno de Abril');
    await expect(panelPagos).toContainText('Marzo');
    await expect(panelPagos).not.toContainText('Abril');
  });
});
