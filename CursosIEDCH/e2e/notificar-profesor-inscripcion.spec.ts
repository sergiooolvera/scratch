import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { notifyTeacherOnEnrollment } from '../lib/teacher-notifications';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

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

  test('La ruta /api/checkout rechaza inscripciones con cupón sin sesión activa', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        cursoId: '00000000-0000-0000-0000-000000000000',
        userId: '11111111-1111-1111-1111-111111111111',
        cuponCodigo: 'BECA100'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('Al inscribirse un alumno con cupón del 100%, se notifica al instructor in-app y por correo antes de responder /api/checkout', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    test.skip(!supabaseUrl || !serviceRoleKey, 'Se requiere SUPABASE_SERVICE_ROLE_KEY para validar en BD');

    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);
    const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const cuponCodigo = `E2E100_${unique}`.toUpperCase();

    let instructorId: string | null = null;
    let cursoId: string | null = null;
    let cuponId: string | null = null;
    let alumnoId: string | null = null;

    try {
      // 1. Obtener ID del alumno de pruebas
      const { data: usersList, error: listUsersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      expect(listUsersErr).toBeNull();
      const alumnoUser = usersList?.users.find(u => u.email?.toLowerCase() === TEST_USERS.alumno.email.toLowerCase());
      expect(alumnoUser).toBeTruthy();
      alumnoId = alumnoUser!.id;

      // 2. Crear instructor temporal con correo de prueba oficial de Resend (no rebota)
      const { data: createdInstructor, error: createInstrErr } = await supabaseAdmin.auth.admin.createUser({
        email: `delivered+e2e-${unique}@resend.dev`,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: {
          nombre: 'Instructor',
          apellido_paterno: 'E2E',
        }
      });
      expect(createInstrErr).toBeNull();
      instructorId = createdInstructor.user!.id;

      await supabaseAdmin.from('ie_profiles').upsert({
        id: instructorId,
        nombre: 'Instructor',
        apellido_paterno: 'E2E',
        rol: 'instructor',
        activo: true,
      });

      // 3. Crear curso temporal de pago asignado al instructor
      const { data: curso, error: cursoErr } = await supabaseAdmin
        .from('ie_cursos')
        .insert({
          titulo: `Curso E2E Cupón 100 ${unique}`,
          descripcion: 'Curso temporal para validar notificación al instructor con cupón del 100%.',
          precio: 499,
          estado: 'aprobado',
          creado_por: instructorId,
          instructor: 'Instructor E2E',
        })
        .select('id')
        .single();
      expect(cursoErr).toBeNull();
      cursoId = curso!.id;

      // 4. Crear cupón temporal del 100% para ese curso
      const { data: cupon, error: cuponErr } = await supabaseAdmin
        .from('ie_cupones')
        .insert({
          codigo: cuponCodigo,
          descuento_porcentaje: 100,
          activo: true,
          curso_id: cursoId,
        })
        .select('id')
        .single();
      expect(cuponErr).toBeNull();
      cuponId = cupon!.id;

      // 5. Iniciar sesión como alumno y canjear el cupón desde la UI del curso
      await loginAs(page, TEST_USERS.alumno);
      await page.goto(`/cursos/${cursoId}`);

      await page.getByRole('button', { name: /Tengo un Cupón/i }).click();
      await page.getByPlaceholder('Ej: BECA100').fill(cuponCodigo);

      const checkoutResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/checkout') && res.request().method() === 'POST'
      );

      await page.getByRole('button', { name: 'Aplicar' }).click();

      const checkoutResponse = await checkoutResponsePromise;
      expect(checkoutResponse.status()).toBe(200);
      const checkoutBody = await checkoutResponse.json();
      expect(checkoutBody).toEqual({ success: true, url: null });

      // 6. Verificar inmediatamente (sin polling) que la compra, notificación in-app y envío por correo ya existen
      const { data: compra } = await supabaseAdmin
        .from('ie_compras')
        .select('id, pagado, monto_pagado')
        .eq('user_id', alumnoId)
        .eq('curso_id', cursoId)
        .maybeSingle();

      expect(compra).toBeTruthy();
      expect(compra!.pagado).toBe(true);

      const { data: notif } = await supabaseAdmin
        .from('ie_notificaciones')
        .select('id, tipo, mensaje, enlace')
        .eq('usuario_id', instructorId)
        .eq('actor_id', alumnoId)
        .eq('tipo', 'venta_curso')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      expect(notif).toBeTruthy();
      expect(notif!.enlace).toBe('/profesor/ventas');
      expect(notif!.mensaje).toContain(TEST_USERS.alumno.email);

      if (process.env.RESEND_API_KEY) {
        const { data: auditLog } = await supabaseAdmin
          .from('ie_auditoria_logs')
          .select('id, evento, detalles')
          .eq('user_id', instructorId)
          .eq('evento', 'EMAIL_PROFESOR_NUEVO_ALUMNO')
          .contains('detalles', { curso_id: cursoId, alumno_id: alumnoId })
          .limit(1)
          .maybeSingle();

        expect(auditLog).toBeTruthy();
        expect(auditLog!.detalles?.metodo).toBe(`Cupón 100% (${cuponCodigo})`);
        expect(auditLog!.detalles?.resend_id).toBeTruthy();
      }

      // 7. Confirmar que en la UI el alumno queda inscrito
      await expect(page.getByText('¡Ya estás inscrito en este curso!')).toBeVisible({ timeout: 15000 });
    } finally {
      // Limpieza de datos temporales de prueba
      if (instructorId) {
        await supabaseAdmin.from('ie_auditoria_logs').delete().eq('user_id', instructorId);
        await supabaseAdmin.from('ie_notificaciones').delete().eq('usuario_id', instructorId);
      }
      if (cursoId && alumnoId) {
        await supabaseAdmin.from('ie_compras').delete().eq('curso_id', cursoId).eq('user_id', alumnoId);
      }
      if (cuponId) {
        await supabaseAdmin.from('ie_cupones').delete().eq('id', cuponId);
      }
      if (cursoId) {
        await supabaseAdmin.from('ie_cursos').delete().eq('id', cursoId);
      }
      if (instructorId) {
        await supabaseAdmin.from('ie_profiles').delete().eq('id', instructorId);
        await supabaseAdmin.auth.admin.deleteUser(instructorId);
      }
    }
  });

});
