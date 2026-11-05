import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notifyTeacherOnEnrollment } from '../lib/teacher-notifications';

test.describe('Notificación por Correo al Profesor al Inscribirse un Alumno', () => {

  test('La función notifyTeacherOnEnrollment maneja de forma segura cursos inexistentes', async () => {
    const result = await notifyTeacherOnEnrollment({
      cursoId: '00000000-0000-0000-0000-000000000000',
      alumnoId: '11111111-1111-1111-1111-111111111111',
      metodoPago: 'Prueba E2E'
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('course_not_found');
  });

  test('La ruta de verificación de checkout /api/checkout/verify redirige sin session_id', async ({ request }) => {
    const response = await request.get('/api/checkout/verify', {
      maxRedirects: 0
    });

    // Debe responder con redirección (307 o 302 o 303) al dashboard
    expect([301, 302, 303, 307, 308]).toContain(response.status());
  });

  test('La ruta /api/approve-payment requiere autenticación y rechaza peticiones no autorizadas', async ({ request }) => {
    const response = await request.post('/api/approve-payment', {
      data: {
        pagoId: 'fake-pago',
        userId: 'fake-user',
        cursoId: 'fake-curso',
        accion: 'aprobar'
      }
    });

    // Al no tener sesión autorizada de admin, debe rechazar
    expect([401, 403, 500]).toContain(response.status());
  });

  test('El webhook de Stripe /api/webhook valida la firma de seguridad y rechaza llamadas falsas', async ({ request }) => {
    const response = await request.post('/api/webhook', {
      data: { type: 'checkout.session.completed' },
      headers: {
        'stripe-signature': 'invalid_signature_test'
      }
    });

    // Debe responder con error 400 por firma inválida de Stripe
    expect(response.status()).toBe(400);
  });

  test('La ruta /api/report-payment-auto rechaza reportes de pago OXXO sin sesión activa', async ({ request }) => {
    const response = await request.post('/api/report-payment-auto', {
      data: {
        cursoId: '00000000-0000-0000-0000-000000000000',
        userId: '11111111-1111-1111-1111-111111111111',
        metodo: 'oxxo',
        filePath: 'test/receipt.pdf'
      }
    });

    // Sin sesión de usuario debe responder 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

});
