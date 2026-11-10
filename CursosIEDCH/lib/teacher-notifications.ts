import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export interface TeacherEnrollmentNotificationParams {
    cursoId: string;
    alumnoId: string;
    alumnoEmail?: string;
    alumnoNombre?: string;
    monto?: number;
    metodoPago?: string;
    supabaseAdminClient?: any;
    createInAppNotification?: boolean;
}

export interface TeacherEnrollmentNotificationResult {
    success: boolean;
    reason?: string;
    emailId?: string;
    profesorEmail?: string;
    error?: any;
}

/**
 * Notifica al profesor de un curso por correo electrónico (usando Resend)
 * cuando un nuevo alumno se inscribe en su curso.
 * Incluye verificación de idempotencia para evitar duplicados.
 */
export async function notifyTeacherOnEnrollment(
    params: TeacherEnrollmentNotificationParams
): Promise<TeacherEnrollmentNotificationResult> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!params.supabaseAdminClient && (!supabaseUrl || !supabaseKey)) {
            console.warn('[TEACHER_NOTIF] Variables de Supabase no configuradas en el entorno.');
            return { success: false, reason: 'missing_supabase_env' };
        }

        const supabaseAdmin = params.supabaseAdminClient || createClient(
            supabaseUrl!,
            supabaseKey!
        );

        // 1. Obtener detalles del curso
        const { data: curso, error: cursoError } = await supabaseAdmin
            .from('ie_cursos')
            .select('id, titulo, creado_por, precio')
            .eq('id', params.cursoId)
            .single();

        if (cursoError || !curso) {
            console.warn(`[TEACHER_NOTIF] Curso no encontrado: ${params.cursoId}`);
            return { success: false, reason: 'course_not_found' };
        }

        if (!curso.creado_por) {
            console.log(`[TEACHER_NOTIF] El curso "${curso.titulo}" no tiene creador/profesor asignado.`);
            return { success: false, reason: 'no_creator' };
        }

        // 2. Comprobar idempotencia en ie_auditoria_logs para evitar enviar correos dobles
        try {
            const { data: logExistente } = await supabaseAdmin
                .from('ie_auditoria_logs')
                .select('id')
                .eq('evento', 'EMAIL_PROFESOR_NUEVO_ALUMNO')
                .contains('detalles', { curso_id: params.cursoId, alumno_id: params.alumnoId })
                .limit(1)
                .maybeSingle();

            if (logExistente) {
                console.log(`[TEACHER_NOTIF] Notificación ya enviada previamente para curso ${params.cursoId} y alumno ${params.alumnoId}.`);
                return { success: true, reason: 'already_sent' };
            }
        } catch (idempErr) {
            console.warn('[TEACHER_NOTIF] Aviso al verificar idempotencia en logs:', idempErr);
        }

        // 3. Obtener datos del profesor
        const { data: profProfile } = await supabaseAdmin
            .from('ie_profiles')
            .select('nombre, apellido_paterno, apellido_materno, correo_adicional')
            .eq('id', curso.creado_por)
            .single();

        let profEmail: string | undefined;
        try {
            const { data: profUserData } = await supabaseAdmin.auth.admin.getUserById(curso.creado_por);
            profEmail = profUserData?.user?.email;
        } catch (authErr) {
            console.warn('[TEACHER_NOTIF] Error obteniendo usuario auth del profesor:', authErr);
        }

        if (!profEmail) {
            profEmail = profProfile?.correo_adicional;
        }

        if (!profEmail) {
            console.warn(`[TEACHER_NOTIF] No se encontró correo registrado para el profesor ${curso.creado_por}.`);
            return { success: false, reason: 'teacher_email_not_found' };
        }

        const profNombre = [profProfile?.nombre, profProfile?.apellido_paterno]
            .filter(Boolean)
            .join(' ') || 'Profesor';

        // 4. Obtener datos del alumno si no fueron provistos
        let studentEmail = params.alumnoEmail;
        if (!studentEmail) {
            try {
                const { data: studentUserData } = await supabaseAdmin.auth.admin.getUserById(params.alumnoId);
                studentEmail = studentUserData?.user?.email;
            } catch (authErr) {
                console.warn('[TEACHER_NOTIF] Error obteniendo correo del alumno:', authErr);
            }
        }
        if (!studentEmail) studentEmail = 'Alumno registrado';

        let studentNombre = params.alumnoNombre;
        if (!studentNombre) {
            const { data: studentProfile } = await supabaseAdmin
                .from('ie_profiles')
                .select('nombre, apellido_paterno, apellido_materno')
                .eq('id', params.alumnoId)
                .single();

            studentNombre = [studentProfile?.nombre, studentProfile?.apellido_paterno, studentProfile?.apellido_materno]
                .filter(Boolean)
                .join(' ') || studentEmail;
        }

        // 5. Notificación in-app si se solicita
        if (params.createInAppNotification) {
            try {
                const { error: notifInsertError } = await supabaseAdmin.from('ie_notificaciones').insert({
                    usuario_id: curso.creado_por,
                    actor_id: params.alumnoId,
                    tipo: 'venta_curso',
                    mensaje: `¡Felicidades! El alumno ${studentEmail} se ha inscrito a tu curso "${curso.titulo}".`,
                    enlace: '/profesor/ventas'
                });
                if (notifInsertError) {
                    console.error('[TEACHER_NOTIF] Error insertando notificación in-app:', notifInsertError);
                }
            } catch (notifErr) {
                console.error('[TEACHER_NOTIF] Error registrando notificación in-app:', notifErr);
            }
        }

        // 6. Validar configuración de Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.warn('[TEACHER_NOTIF] Variable RESEND_API_KEY no configurada. Omitiendo email.');
            return { success: false, reason: 'missing_api_key' };
        }

        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Grupo EGAC <soporte@grupoegac.com>';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cursos-iedch.vercel.app';
        const panelUrl = `${appUrl}/profesor`;

        const fechaStr = new Date().toLocaleDateString('es-MX', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Plantilla HTML del correo
        const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Nuevo Alumno Inscrito</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Grupo EGAC Portal</h1>
      <p style="margin: 6px 0 0; font-size: 13px; color: #bfdbfe;">Ecosistema Global de Acreditación y Capacitación</p>
    </div>
    
    <div style="padding: 32px 24px;">
      <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
        ✓ Nueva Inscripción Confirmada
      </div>
      
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">¡Hola, ${profNombre}!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Te notificamos que un nuevo alumno se ha inscrito formalmente a tu curso <strong>"${curso.titulo}"</strong>.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Curso:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${curso.titulo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Alumno:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${studentNombre}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Correo de contacto:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${studentEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500; ${params.metodoPago ? 'border-bottom: 1px solid #e2e8f0;' : ''}">Fecha:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; ${params.metodoPago ? 'border-bottom: 1px solid #e2e8f0;' : ''}">${fechaStr}</td>
          </tr>
          ${params.metodoPago ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Modalidad / Método:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${params.metodoPago}</td>
          </tr>` : ''}
        </table>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
        Puedes revisar la lista de alumnos inscritos, su avance en los módulos y los exámenes o tareas entregadas directamente desde tu panel de profesor.
      </p>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${panelUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          Ir a mi Panel de Profesor
        </a>
      </div>
    </div>
    
    <div style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">Recibiste esta notificación automática porque eres el instructor asignado a este curso en Grupo EGAC.</p>
    </div>
  </div>
</body>
</html>
`;

        const { data: resendData, error: resendError } = await resend.emails.send({
            from: fromEmail,
            to: profEmail,
            subject: `🎓 ¡Nuevo alumno inscrito en tu curso: ${curso.titulo}!`,
            html: emailHtml
        });

        if (resendError) {
            console.error('[TEACHER_NOTIF] Error de Resend al enviar correo al profesor:', resendError);
            return { success: false, error: resendError };
        }

        // 7. Registrar en ie_auditoria_logs para idempotencia y registro
        try {
            await supabaseAdmin.from('ie_auditoria_logs').insert({
                user_id: curso.creado_por,
                evento: 'EMAIL_PROFESOR_NUEVO_ALUMNO',
                detalles: {
                    curso_id: params.cursoId,
                    alumno_id: params.alumnoId,
                    profesor_email: profEmail,
                    resend_id: resendData?.id,
                    metodo: params.metodoPago || 'directo'
                }
            });
        } catch (auditErr) {
            console.error('[TEACHER_NOTIF] Error guardando log de auditoría:', auditErr);
        }

        console.log(`[TEACHER_NOTIF] Correo enviado a ${profEmail} (Resend ID: ${resendData?.id})`);
        return { success: true, emailId: resendData?.id, profesorEmail: profEmail };

    } catch (err: any) {
        console.error('[TEACHER_NOTIF] Excepción no controlada:', err);
        return { success: false, error: err?.message || String(err) };
    }
}
