import { NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse';

const SYSTEM_PROMPT = `Eres un asistente experto en procesamiento de contenido educativo. Tu tarea es analizar el texto de un examen proporcionado por el usuario y extraer las preguntas de opción múltiple.

Debes devolver obligatoriamente un objeto JSON con la siguiente estructura:
{
  "questions": [
    {
      "pregunta": "Texto de la pregunta",
      "opcion_a": "Texto de la opción A (sin el prefijo 'A)' ni espacios adicionales al inicio)",
      "opcion_b": "Texto de la opción B (sin el prefijo 'B)' ni espacios adicionales al inicio)",
      "opcion_c": "Texto de la opción C (sin el prefijo 'C)' ni espacios adicionales al inicio)",
      "opcion_d": "Texto de la opción D (sin el prefijo 'D)' ni espacios adicionales al inicio)",
      "respuesta_correcta": "A" o "B" o "C" o "D" (debe ser la letra correspondiente a la respuesta correcta en mayúscula)",
      "tipo_pregunta": "opcion_multiple"
    }
  ]
}

Reglas importantes:
1. Solo debes devolver el JSON puro. No agregues explicaciones, ni bloques de código markdown como \`\`\`json. Tu respuesta debe comenzar con { y terminar con }.
2. Todas las preguntas deben tener exactamente 4 opciones de respuesta (A, B, C, D) y una única respuesta correcta claramente identificada.
3. Si en el texto se indica una respuesta correcta de otra forma (por ejemplo, con un texto descriptivo o una letra), debes deducir a qué letra de opción (A, B, C, D) corresponde.
4. El texto de las opciones no debe contener el prefijo de la opción (por ejemplo: si la opción en el texto es "A) Prevenir infecciones", el valor de "opcion_a" debe ser "Prevenir infecciones").
`;

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let text = '';
        let isJson = false;

        if (contentType.includes('application/json')) {
            const body = await req.json();
            text = body.text || '';
            isJson = true;
        } else {
            const formData = await req.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const data = await pdf(buffer);
            text = data.text;
        }

        if (!text || text.trim() === '') {
            return NextResponse.json({ error: 'El contenido del examen está vacío.' }, { status: 400 });
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

        // Si hay API key de DeepSeek, usamos IA para un procesamiento robusto y flexible
        if (DEEPSEEK_API_KEY) {
            try {
                const response = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: text }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.1
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error de API de DeepSeek:', errorText);
                    throw new Error(`Error en el servicio de IA (Status ${response.status})`);
                }

                const data = await response.json();
                const aiText = data.choices?.[0]?.message?.content || '';

                let cleanJson = aiText.trim();
                if (cleanJson.startsWith('```')) {
                    cleanJson = cleanJson.replace(/^```json\s*/i, '');
                    cleanJson = cleanJson.replace(/^```\s*/, '');
                    cleanJson = cleanJson.replace(/\s*```$/, '');
                }
                cleanJson = cleanJson.trim();

                const parsed = JSON.parse(cleanJson);
                if (!parsed || !Array.isArray(parsed.questions)) {
                    throw new Error('La respuesta de la IA no contiene una lista de preguntas válida.');
                }

                const questions = parsed.questions.map((q: any) => {
                    const opcion_a = (q.opcion_a || q.a || '').toString().trim();
                    const opcion_b = (q.opcion_b || q.b || '').toString().trim();
                    const opcion_c = (q.opcion_c || q.c || '').toString().trim();
                    const opcion_d = (q.opcion_d || q.d || '').toString().trim();

                    let respuesta_correcta = (q.respuesta_correcta || q.respuesta || '').toString().trim().toUpperCase();

                    // Intentar normalizar la letra si viene con prefijos o si viene en texto
                    if (respuesta_correcta.startsWith('A)') || respuesta_correcta.startsWith('A.')) respuesta_correcta = 'A';
                    else if (respuesta_correcta.startsWith('B)') || respuesta_correcta.startsWith('B.')) respuesta_correcta = 'B';
                    else if (respuesta_correcta.startsWith('C)') || respuesta_correcta.startsWith('C.')) respuesta_correcta = 'C';
                    else if (respuesta_correcta.startsWith('D)') || respuesta_correcta.startsWith('D.')) respuesta_correcta = 'D';

                    // Si no coincide directamente con A, B, C, D pero coincide con el texto de alguna opción
                    if (!['A', 'B', 'C', 'D'].includes(respuesta_correcta)) {
                        if (respuesta_correcta === opcion_a) respuesta_correcta = 'A';
                        else if (respuesta_correcta === opcion_b) respuesta_correcta = 'B';
                        else if (respuesta_correcta === opcion_c) respuesta_correcta = 'C';
                        else if (respuesta_correcta === opcion_d) respuesta_correcta = 'D';
                    }

                    return {
                        pregunta: (q.pregunta || q.texto || '').toString().trim(),
                        opcion_a,
                        opcion_b,
                        opcion_c,
                        opcion_d,
                        respuesta_correcta,
                        tipo_pregunta: 'opcion_multiple'
                    };
                });

                // Validar que todas las preguntas procesadas tengan sus campos y respuestas correctas válidas
                const preguntasValidas = questions.filter((q: any) => 
                    q.pregunta && 
                    q.opcion_a && 
                    q.opcion_b && 
                    q.opcion_c && 
                    q.opcion_d && 
                    ['A', 'B', 'C', 'D'].includes(q.respuesta_correcta)
                );

                if (preguntasValidas.length === 0) {
                    return NextResponse.json({
                        error: 'La IA no pudo estructurar preguntas válidas de opción múltiple del texto provisto. Asegúrese de que el texto contiene preguntas claras con sus respectivas opciones y respuestas.'
                    }, { status: 400 });
                }

                return NextResponse.json({ questions: preguntasValidas });

            } catch (aiError: any) {
                console.error('Error procesando examen con DeepSeek:', aiError);
                // Si la petición es JSON directo, fallamos ya que no hay fallback para texto plano
                if (isJson) {
                    return NextResponse.json({ error: 'Error al procesar el examen mediante IA: ' + aiError.message }, { status: 500 });
                }
                // Si es un archivo PDF, hacemos fallback al parser por expresiones regulares tradicional
                console.log('Haciendo fallback a expresiones regulares deterministas...');
            }
        } else if (isJson) {
            // El usuario pegó texto pero no hay API key configurada
            return NextResponse.json({
                error: 'Para procesar exámenes pegando texto se requiere configurar la clave de API de DeepSeek (DEEPSEEK_API_KEY).'
            }, { status: 400 });
        }

        // ─────────────────────────────────────────────────────────────────────
        // LÓGICA DE PROCESAMIENTO HEREDADA (FALLBACK / EXPRESIONES REGULARES)
        // ─────────────────────────────────────────────────────────────────────
        const questions: any[] = [];

        // Estrategia 1: Formato "Pregunta N"
        const regexPregunta = /Pregunta\s+\d+[\s\S]*?(?=Pregunta\s+\d+|$)/gi;
        const bloqPregunta = text.match(regexPregunta);

        if (bloqPregunta && bloqPregunta.length > 0) {
            for (const block of bloqPregunta) {
                const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                if (lines.length > 0) {
                    const isLibre = block.toLowerCase().includes('(respuesta libre)') || block.toLowerCase().includes('(respuestalibre)');
                    if (isLibre) {
                        const preguntaLine = lines[0];
                        let preguntaText = lines.slice(1).filter((l: string) => !l.toLowerCase().includes('(respuesta libre') && !l.toLowerCase().includes('(respuestalibre')).join(' ');
                        if (!preguntaText) {
                            preguntaText = preguntaLine;
                        } else {
                            preguntaText = preguntaLine + ' ' + preguntaText;
                        }
                        questions.push({
                            pregunta: preguntaText,
                            opcion_a: '',
                            opcion_b: '',
                            opcion_c: '',
                            opcion_d: '',
                            respuesta_correcta: '',
                            tipo_pregunta: 'respuesta_libre'
                        });
                    } else if (lines.length >= 5) {
                        const pregunta = lines[0];
                        const opcion_a = lines[1];
                        const opcion_b = lines[2];
                        const opcion_c = lines[3];
                        const opcion_d = lines[4];
                        let respuesta_correcta = '';
                        const lastLine = lines[lines.length - 1];
                        if (lastLine.startsWith('(') && lastLine.endsWith(')')) {
                            respuesta_correcta = lastLine.substring(1, lastLine.length - 1).trim();
                        } else {
                            const matchCorrect = block.match(/\((.*?)\)/);
                            if (matchCorrect) respuesta_correcta = matchCorrect[1].trim();
                        }
                        questions.push({
                            pregunta,
                            opcion_a,
                            opcion_b,
                            opcion_c,
                            opcion_d,
                            respuesta_correcta,
                            tipo_pregunta: 'opcion_multiple'
                        });
                    }
                }
            }
        }

        // Estrategia 2: Formato "1.Texto"
        if (questions.length === 0) {
            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');

            let currentQuestion: string | null = null;
            let currentOptions: string[] = [];

            const saveQuestion = (answer: string) => {
                if (!currentQuestion) return;
                const isLibre = answer.toLowerCase().includes('respuesta libre') || answer.toLowerCase().includes('respuestalibre');

                if (isLibre) {
                    questions.push({
                        pregunta: currentQuestion,
                        opcion_a: '',
                        opcion_b: '',
                        opcion_c: '',
                        opcion_d: '',
                        respuesta_correcta: '',
                        tipo_pregunta: 'respuesta_libre'
                    });
                } else if (currentOptions.length >= 4) {
                    questions.push({
                        pregunta: currentQuestion,
                        opcion_a: currentOptions[0].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_b: currentOptions[1].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_c: currentOptions[2].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_d: currentOptions[3].replace(/^[A-D][.)]\s*/i, '').trim(),
                        respuesta_correcta: answer,
                        tipo_pregunta: 'opcion_multiple'
                    });
                }
            };

            for (const line of lines) {
                const answerMatch = line.match(/^\((.+)\)$/) || line.match(/^\((.+[A-D])\s*$/);
                if (answerMatch) {
                    const inner = answerMatch[1].trim();
                    const isLibre = inner.toLowerCase().includes('respuesta libre') || inner.toLowerCase().includes('respuestalibre');
                    if (isLibre) {
                        saveQuestion(inner);
                    } else {
                        const letterMatch = inner.match(/\b([A-D])\s*$/i);
                        const resp = letterMatch ? letterMatch[1].toUpperCase() : inner;
                        saveQuestion(resp);
                    }
                    currentQuestion = null;
                    currentOptions = [];
                    continue;
                }

                const optionMatch = line.match(/^([A-D])[.)]\s+(.+)/i);
                if (optionMatch && currentQuestion) {
                    currentOptions.push(line);
                    continue;
                }

                const questionMatch = line.match(/^(\d+)[.)]\s*(.+)/);
                if (questionMatch) {
                    saveQuestion('');
                    currentQuestion = line.replace(/^\d+[.)]\s*/, '').trim();
                    currentOptions = [];
                    continue;
                }

                if (currentQuestion && currentOptions.length === 0 && !line.match(/^[A-D][.)]/i)) {
                    currentQuestion += ' ' + line;
                }
            }
            saveQuestion('');
        }

        if (questions.length === 0) {
            return NextResponse.json({
                error: 'No se encontraron preguntas válidas en el PDF. Formatos aceptados:\n• "Pregunta 1 ¿Texto?" con opciones y (Respuesta)\n• "1. ¿Texto?" con opciones A) B) C) D) y (Respuesta correcta LETRA)'
            }, { status: 400 });
        }

        const tieneRespuestaLibre = questions.some((q: any) => q.tipo_pregunta === 'respuesta_libre');
        if (tieneRespuestaLibre) {
            return NextResponse.json({
                error: 'Los exámenes solo pueden contener preguntas de opción múltiple.'
            }, { status: 400 });
        }

        const sinRespuesta = questions
            .map((q: any, i: number) => ({ num: i + 1, q }))
            .filter(({ q }: { q: any }) => q.tipo_pregunta === 'opcion_multiple' && !q.respuesta_correcta);

        if (sinRespuesta.length > 0) {
            const nums = sinRespuesta.map(({ num }: { num: number }) => num).join(', ');
            return NextResponse.json({
                error: `No se detectó la respuesta correcta para la(s) pregunta(s) de opción múltiple: ${nums}. Verifica que el PDF tenga el formato (Respuesta LETRA) en cada pregunta.`
            }, { status: 400 });
        }

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error parsing exam:', error);
        return NextResponse.json({ error: 'Error procesando el contenido del examen' }, { status: 500 });
    }
}
