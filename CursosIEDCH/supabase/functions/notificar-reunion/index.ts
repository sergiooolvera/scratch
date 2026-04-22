import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const host = Deno.env.get('SMTP_HOST')
    const port = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const user = Deno.env.get('SMTP_USER')
    const pass = Deno.env.get('SMTP_PASS')

    // DEBUG SECRETS (Safe)
    console.log(`[MAILER] Config: Host=${host}, Port=${port}, User=${user}`)
    if (pass) {
        console.log(`[MAILER] Pass detected: ${pass[0]}***${pass[pass.length-1]} (Length: ${pass.length})`)
    }

    if (!host || !pass || !user) {
      return new Response(
        JSON.stringify({ error: "Faltan secretos SMTP en el Dashboard", details: "Env var SMTP_HOST, SMTP_USER or SMTP_PASS is missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    const { emails, cursoTitulo, reunionUrl, notaProfesor } = await req.json()
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay destinatarios", details: "La lista de correos llegó vacía a la función." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    console.log(`[MAILER] Enviando ${emails.length} correos para: ${cursoTitulo}`)

    const transporter = nodemailer.createTransport({
      host: host,
      port: 465, // Probemos SSL directo (465) en lugar de TLS (587) para mayor estabilidad en Deno
      secure: true,
      auth: { user, pass },
    });

    // 1. Verificar Conexión SMTP (Gmail)
    try {
      console.log(`[MAILER] Verificando conexión SSL...`)
      await transporter.verify()
      console.log("[MAILER] ✅ Conexión SMTP verificada exitosamente.")
    } catch (verifyError: any) {
      console.error("[MAILER_VERIFY_ERROR]", verifyError)
      return new Response(
        JSON.stringify({ 
          error: "Gmail rechazó la conexión. Verifica tu contraseña de aplicación.", 
          details: `Error de Gmail: ${verifyError.message}. Code: ${verifyError.code}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    console.log(`[LOG] Preparando para enviar a ${emails.length} alumnos.`);

    // Enviar correos secuencialmente para evitar bloqueos de Gmail y debuggear mejor
    const results = [];
    for (const email of emails) {
      try {
        const info = await transporter.sendMail({
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
                
                ${notaProfesor ? `
                  <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
                    <strong style="color: #c05621;">Nota del Profesor:</strong><br/>
                    <p style="margin: 5px 0 0 0; color: #7b341e; white-space: pre-wrap;">${notaProfesor}</p>
                  </div>
                ` : ''}

                ${reunionUrl ? `
                  <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #4a5568; margin-bottom: 15px;">Se ha programado una sesión en vivo:</p>
                    <a href="${reunionUrl}" target="_blank" style="background-color: #3182ce; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                      Unirse a la Reunión
                    </a>
                  </div>
                ` : ''}

                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;" />
                <p style="font-size: 12px; color: #a0aec0; text-align: center;">
                  Este es un aviso automático de SECNA Portal.<br/>
                  No respondas a este correo.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[LOG] Correo enviado a ${email}: ${info.messageId}`);
        results.push({ email, success: true, id: info.messageId });
      } catch (sendError: any) {
        console.error(`[ERROR] Error enviando a ${email}:`, sendError);
        results.push({ email, success: false, error: sendError.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[ERROR GENERAL]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
