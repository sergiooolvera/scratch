import { NextResponse } from 'next/server';
// @ts-ignore
import pdf from 'pdf-parse';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);
        const text = data.text;

        const questions: any[] = [];

        // ────────────────────────────────────────────────────
        // Estrategia 1: Formato "Pregunta N"
        // ────────────────────────────────────────────────────
        const regexPregunta = /Pregunta\s+\d+[\s\S]*?(?=Pregunta\s+\d+|$)/gi;
        const bloqPregunta = text.match(regexPregunta);

        if (bloqPregunta && bloqPregunta.length > 0) {
            for (const block of bloqPregunta) {
                const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                if (lines.length >= 5) {
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
                    questions.push({ pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta });
                }
            }
        }

        // ────────────────────────────────────────────────────
        // Estrategia 2: Formato "1.Texto" o "1. Texto"
        // Opciones: A) B) C) D)
        // Respuesta: (Texto LETRA) — la letra está al final dentro del paréntesis
        // ────────────────────────────────────────────────────
        if (questions.length === 0) {
            // Dividir el texto en bloques por número de pregunta
            // Acepta: "1.Texto", "1. Texto", "1)Texto", "1) Texto"
            const blockRegex = /(\d+)[.)]\s*/g;
            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');

            let currentQuestion: string | null = null;
            let currentOptions: string[] = [];
            let currentAnswer = '';

            const saveQuestion = (answer: string) => {
                if (currentQuestion && currentOptions.length >= 4) {
                    questions.push({
                        pregunta: currentQuestion,
                        opcion_a: currentOptions[0].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_b: currentOptions[1].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_c: currentOptions[2].replace(/^[A-D][.)]\s*/i, '').trim(),
                        opcion_d: currentOptions[3].replace(/^[A-D][.)]\s*/i, '').trim(),
                        respuesta_correcta: answer,
                    });
                }
            };

            for (const line of lines) {
                // ¿Es línea de respuesta? Formato: (Texto LETRA) ej. (Hipótesis B)
                const answerMatch = line.match(/^\((.+)\)$/);
                if (answerMatch) {
                    const inner = answerMatch[1].trim();
                    const letterMatch = inner.match(/\b([A-D])\s*$/i);
                    const resp = letterMatch ? letterMatch[1].toUpperCase() : inner;
                    saveQuestion(resp);
                    currentQuestion = null;
                    currentOptions = [];
                    continue;
                }

                // ¿Es opción? A) B) C) D)
                const optionMatch = line.match(/^([A-D])[.)]\s+(.+)/i);
                if (optionMatch && currentQuestion) {
                    currentOptions.push(line);
                    continue;
                }

                // ¿Es inicio de pregunta? Número seguido de . o )
                const questionMatch = line.match(/^(\d+)[.)]\s*(.+)/);
                if (questionMatch) {
                    // Si ya teníamos una pregunta con 4 opciones, guardarla (aunque no haya respuesta)
                    saveQuestion('');
                    currentQuestion = line.replace(/^\d+[.)]\s*/, '').trim();
                    currentOptions = [];
                    continue;
                }

                // ¿Es continuación de la pregunta actual?
                if (currentQuestion && currentOptions.length === 0 && !line.match(/^[A-D][.)]/i)) {
                    currentQuestion += ' ' + line;
                }
            }
            // Guardar la última pregunta si quedó pendiente
            saveQuestion('');
        }

        if (questions.length === 0) {
            return NextResponse.json({
                error: 'No se encontraron preguntas válidas en el PDF. Formatos aceptados:\n• "Pregunta 1 ¿Texto?" con opciones y (Respuesta)\n• "1. ¿Texto?" con opciones A) B) C) D) y (Respuesta correcta LETRA)'
            }, { status: 400 });
        }

        // Verificar que todas las preguntas tengan respuesta
        const sinRespuesta = questions
            .map((q: any, i: number) => ({ num: i + 1, q }))
            .filter(({ q }: { q: any }) => !q.respuesta_correcta);

        if (sinRespuesta.length > 0) {
            const nums = sinRespuesta.map(({ num }: { num: number }) => num).join(', ');
            return NextResponse.json({
                error: `No se detectó la respuesta correcta para la(s) pregunta(s): ${nums}. Verifica que el PDF tenga el formato (Respuesta LETRA) en cada pregunta.`
            }, { status: 400 });
        }

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json({ error: 'Error procesando el PDF del examen' }, { status: 500 });
    }
}
