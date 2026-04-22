import nodemailer from 'nodemailer';

export interface SendMailOptions {
  emails: string[];
  cursoTitulo: string;
  reunionUrl?: string | null;
  notaProfesor?: string | null;
}

export async function sendReunionNotification({ emails, cursoTitulo, reunionUrl, notaProfesor }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, ''); // Limpiar espacios

  if (!host || !user || !pass) {
    throw new Error('Configuración SMTP incompleta en variables de entorno.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.verify();

  const results = [];
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: `"SECNA Portal" <${user}>`,
        to: email,
        subject: `AVISO: Clase en Vivo / Información de ${cursoTitulo}`,
        html: `
          <div style="font-family: sans-serif; padding: 30px; background-color: #f4f7f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50;">Aviso de tu Profesor</h2>
              <p style="color: #5d6d7e; font-size: 16px;">
                Tienes una actualización importante para el curso: <strong>${cursoTitulo}</strong>.
              </p>
              ${notaProfesor ? `<div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;"><strong>Nota del Profesor:</strong><p>${notaProfesor}</p></div>` : ''}
              ${reunionUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${reunionUrl}" target="_blank" style="background-color: #3182ce; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">Unirse a la Reunión</a></div>` : ''}
              <p style="font-size: 12px; color: #a0aec0; text-align: center;">Este es un aviso automático de SECNA Portal.</p>
            </div>
          </div>
        `,
      });
      results.push({ email, success: true });
    } catch (err: any) {
      results.push({ email, success: false, error: err.message });
    }
  }
  return results;
}

export interface SendCertificateOptions {
  email: string;
  cursoTitulo: string;
  publicUrl: string;
  folio: string;
}

export async function sendCertificateNotification({ email, cursoTitulo, publicUrl, folio }: SendCertificateOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');

  if (!host || !user || !pass) {
    throw new Error('Configuración SMTP incompleta.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"SECNA Portal" <${user}>`,
    to: email,
    subject: `Tu Constancia Oficial: ${cursoTitulo}`,
    html: `
      <div style="font-family: sans-serif; padding: 40px; background-color: #f4f7f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
          <h2 style="color: #2c3e50; margin-top: 0;">¡Felicidades por tu logro!</h2>
          <p style="color: #5d6d7e; line-height: 1.6;">
            Tu constancia oficial del curso <strong style="color: #2c3e50;">${cursoTitulo}</strong> ya está disponible.
          </p>
          <div style="margin: 40px 0; text-align: center;">
            <a href="${publicUrl}" target="_blank" style="background-color: #3498db; color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Descargar Constancia (PDF)
            </a>
          </div>
          <p style="font-size: 13px; color: #abb2b9; text-align: center;">
            Folio de validación: ${folio}<br/>
            Servicio Nacional de Evaluación y Registro Laboral
          </p>
        </div>
      </div>
    `,
  });

  return { success: true, messageId: info.messageId };
}
