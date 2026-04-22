import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Falta RESEND_API_KEY en las variables de entorno' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    try {
        const { to, courseTitle, instructorName, reason } = await request.json();

        if (!to || !courseTitle || !reason) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'SECNA Portal <onboarding@resend.dev>', // Por defecto Resend usa este; puedes cambiarlo si tienes un dominio verificado
            to: [to],
            subject: `Revisión de tu curso "${courseTitle}"`,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola ${instructorName || 'Instructor'},</h2>
          <p>Lamentamos informarte que tu curso <strong>"${courseTitle}"</strong> no ha podido ser aprobado en este momento.</p>
          <p><strong>Motivo / Observaciones:</strong></p>
          <blockquote style="background-color: #f9f9f9; border-left: 4px solid #ccc; margin: 1.5em 0; padding: 1em;">
            ${reason.replace(/\n/g, '<br/>')}
          </blockquote>
          <p>Por favor, revisa estas observaciones, realiza las correcciones necesarias y vuelve a enviar tu curso para su revisión.</p>
          <br>
          <p>Atentamente,<br><strong>El equipo de IEDCH</strong></p>
        </div>
      `,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error enviando el correo' }, { status: 500 });
    }
}
