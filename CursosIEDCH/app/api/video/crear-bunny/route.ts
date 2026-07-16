import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "El título del video es obligatorio." },
        { status: 400 }
      );
    }

    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    if (!libraryId || !apiKey) {
      return NextResponse.json(
        { error: "Configuración de Bunny.net incompleta en el servidor." },
        { status: 500 }
      );
    }

    const url = `https://video.bunnycdn.com/library/${libraryId}/videos`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Error de Bunny API: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Retornamos el guid (ID único del video en Bunny) para que el frontend pueda realizar el PUT
    return NextResponse.json({ videoId: data.guid });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
