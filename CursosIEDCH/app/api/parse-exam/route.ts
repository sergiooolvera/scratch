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

        // Process text into questions
        const questions = [];
        // Match each question block starting with "Pregunta" until the next "Pregunta" or end of string
        const regex = /Pregunta\s+\d+[\s\S]*?(?=Pregunta\s+\d+|$)/gi;
        const blocs = text.match(regex);

        if (blocs) {
            for (const block of blocs) {
                const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                if (lines.length >= 5) {
                    // lines[0] will be 'Pregunta 1' or 'Pregunta 1 ¿Cuál es...?'
                    const pregunta = lines[0];
                    const opcion_a = lines[1];
                    const opcion_b = lines[2];
                    const opcion_c = lines[3];
                    const opcion_d = lines[4];

                    let respuesta_correcta = lines[5] || lines[4]; // Sometimes answers are 4 options and the 5th is the correct one, or 6th.

                    // The correct answer is usually the last line wrapped in parentheses
                    const lastLine = lines[lines.length - 1];
                    if (lastLine.startsWith('(') && lastLine.endsWith(')')) {
                        respuesta_correcta = lastLine.substring(1, lastLine.length - 1).trim();
                    } else {
                        // fallback to check if any line matches (Respuesta) pattern
                        const matchCorrect = block.match(/\((.*?)\)/);
                        if (matchCorrect) respuesta_correcta = matchCorrect[1].trim();
                    }

                    questions.push({
                        pregunta,
                        opcion_a,
                        opcion_b,
                        opcion_c,
                        opcion_d,
                        respuesta_correcta
                    });
                }
            }
        }

        if (questions.length === 0) {
            return NextResponse.json({ error: 'No se encontraron preguntas válidas en el PDF. Verifica el formato.' }, { status: 400 });
        }

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json({ error: 'Error procesando el PDF del examen' }, { status: 500 });
    }
}
