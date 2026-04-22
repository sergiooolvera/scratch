import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, cursoTitulo, publicUrl, folio } = await req.json()

    // CONFIGURACIÓN SMTP (Igual que el registro de usuarios)
    // Estos secretos deben estar en tu Dashboard de Supabase -> Settings -> Edge Functions -> Secrets
    const SMTP_HOST = Deno.env.get('SMTP_HOST')
    const SMTP_PORT = Deno.env.get('SMTP_PORT')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'no-reply@tu-dominio.com'

    if (!SMTP_HOST || !SMTP_PASS) {
      throw new Error('Faltan configuraciones SMTP (Host o Pass) en los Secrets de Supabase.')
    }

    const client = new SmtpClient();
    await client.connect({
      hostname: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      username: SMTP_USER || '',
      password: SMTP_PASS,
      tls: true,
    });

    await client.send({
      from: `IEDCH <${SMTP_FROM}>`,
      to: email,
      subject: `Tu Constancia Oficial: ${cursoTitulo}`,
      content: `Hola, hemos generado tu constancia oficial del curso: ${cursoTitulo}. Puedes verla aquí: ${publicUrl}. Folio: ${folio}`,
      html: `
        <div style="font-family: sans-serif; padding: 40px; background-color: #f4f7f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
            <h2 style="color: #2c3e50; margin-top: 0;">¡Felicidades por tu logro!</h2>
            <p style="color: #5d6d7e; line-height: 1.6;">
              Tu constancia oficial del curso <strong style="color: #2c3e50;">${cursoTitulo}</strong> ya está disponible.
            </p>
            <div style="margin: 40px 0; text-align: center;">
              <a href="${publicUrl}" target="_blank" style="background-color: #3498db; color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver Constancia (PDF)
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

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[SMTP_ERROR]', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
