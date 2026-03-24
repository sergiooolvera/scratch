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

        // Parse PDF
        const data = await pdf(buffer);
        const text = data.text;

        const questions: any[] = [];

        // ────────────────────────────────────────────────────
        // Estrategia 1: Formato "Pregunta N" (original)
        // Pregunta 1 ¿Texto?
        // A) opción a
        // B) opción b
        // C) opción c
        // D) opción d
        // (Respuesta)
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
        // Estrategia 2: Formato numerado "1." o "1)" 
        // Detecta preguntas que empiezan con número seguido de . o )
        // 1. ¿Texto de la pregunta?
        // a) Opción A    o    A. Opción A
        // b) Opción B         B. Opción B
        // c) Opción C         C. Opción C
        // d) Opción D         D. Opción D
        // Respuesta: a   o    (a)
        // ────────────────────────────────────────────────────
        if (questions.length === 0) {
            // Separar bloques por número de pregunta
            const regexNum = /(?:^|\n)\s*(\d+)[.)]\s+/g;
            const splits: number[] = [];
            let m;
            while ((m = regexNum.exec(text)) !== null) {
                splits.push(m.index);
            }

            for (let i = 0; i < splits.length; i++) {
                const block = text.slice(splits[i], splits[i + 1] ?? text.length);
                const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                if (lines.length < 2) continue;

                // La primera línea puede ser "1. Texto" o "1)" — extraer pregunta
                const preguntaRaw = lines[0].replace(/^\d+[.)]\s*/, '').trim();
                if (!preguntaRaw) continue;

                // Opciones: líneas que empiezan con a) b) c) d) o A. B. C. D.
                const optionRegex = /^[abcdABCD][.)]\s*/;
                const optionLines = lines.slice(1).filter((l: string) => optionRegex.test(l));

                if (optionLines.length < 4) continue;

                const opcion_a = optionLines[0].replace(optionRegex, '').trim();
                const opcion_b = optionLines[1].replace(optionRegex, '').trim();
                const opcion_c = optionLines[2].replace(optionRegex, '').trim();
                const opcion_d = optionLines[3].replace(optionRegex, '').trim();

                // Respuesta correcta: buscar "(X)" o "Respuesta: X" o "Clave: X"
                let respuesta_correcta = '';
                const respMatch = block.match(/[Rr]espuesta[:\s]+([abcdABCD])/);
                const claveMatch = block.match(/[Cc]lave[:\s]+([abcdABCD])/);
                const parensMatch = block.match(/\(([abcdABCD])\)/i);

                if (respMatch) respuesta_correcta = respMatch[1].toLowerCase();
                else if (claveMatch) respuesta_correcta = claveMatch[1].toLowerCase();
                else if (parensMatch) respuesta_correcta = parensMatch[1].toLowerCase();

                questions.push({
                    pregunta: `${i + 1}. ${preguntaRaw}`,
                    opcion_a,
                    opcion_b,
                    opcion_c,
                    opcion_d,
                    respuesta_correcta,
                });
            }
        }

        if (questions.length === 0) {
            return NextResponse.json({
                error: 'No se encontraron preguntas válidas en el PDF. Formatos aceptados:\n• "Pregunta 1 ¿Texto?" con opciones y (Respuesta)\n• "1. ¿Texto?" con opciones a) b) c) d) y Respuesta: X'
            }, { status: 400 });
        }

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json({ error: 'Error procesando el PDF del examen' }, { status: 500 });
    }
}
