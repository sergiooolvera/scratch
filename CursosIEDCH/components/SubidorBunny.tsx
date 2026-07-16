"use client";

import React, { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SubidorBunnyProps {
  title: string;
  onUploadComplete: (url: string) => void;
}

export default function SubidorBunny({ title, onUploadComplete }: SubidorBunnyProps) {
  const [file, setFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completado, setCompletado] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setCompletado(false);
    }
  };

  const iniciarSubida = async () => {
    alert("¡Click en Subir detectado en el navegador!");
    console.log("iniciarSubida llamada. Archivo seleccionado:", file);
    if (!file) {
      setError("Por favor, selecciona un archivo de video primero.");
      return;
    }

    setSubiendo(true);
    setProgreso(0);
    setError(null);

    try {
      console.log("Llamando a /api/video/crear-bunny...");
      // 1. Crear el registro del video en Bunny a través de nuestra API local
      const resCrear = await fetch("/api/video/crear-bunny", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title || file.name }),
      });

      console.log("Respuesta de /api/video/crear-bunny:", resCrear.status);
      if (!resCrear.ok) {
        const errData = await resCrear.json();
        throw new Error(errData.error || "No se pudo inicializar el video en Bunny.");
      }

      const { videoId } = await resCrear.json();
      console.log("Video creado en Bunny con ID:", videoId);

      const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
      const accessKey = process.env.NEXT_PUBLIC_BUNNY_UPLOAD_KEY;

      console.log("Configuración en cliente - LibraryId:", libraryId, "AccessKey configurada:", !!accessKey);

      if (!libraryId) {
        throw new Error("Falta la configuración NEXT_PUBLIC_BUNNY_LIBRARY_ID.");
      }

      if (!accessKey) {
        throw new Error("No se ha configurado la API Key de subida para Bunny.net en el cliente (NEXT_PUBLIC_BUNNY_UPLOAD_KEY).");
      }

      console.log("Iniciando carga XMLHttpRequest directa a Bunny...");
      // 2. Subir directamente el archivo mediante PUT a los servidores de Bunny Stream usando XMLHttpRequest
      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("AccessKey", accessKey);
      xhr.setRequestHeader("Accept", "application/json");

      // Monitorear progreso
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const porcentaje = Math.round((event.loaded / event.total) * 100);
          console.log(`Progreso de subida: ${porcentaje}%`);
          setProgreso(porcentaje);
        }
      };

      xhr.onload = () => {
        console.log("Carga finalizada. Status HTTP:", xhr.status);
        if (xhr.status === 200) {
          const finalEmbedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
          console.log("URL de incrustación generada:", finalEmbedUrl);
          onUploadComplete(finalEmbedUrl);
          setCompletado(true);
          setSubiendo(false);
          setFile(null);
        } else {
          setError(`Error al subir: ${xhr.statusText} (${xhr.status})`);
          setSubiendo(false);
        }
      };

      xhr.onerror = (e) => {
        console.error("Error de red en XHR:", e);
        setError("Error de red al intentar subir el archivo a Bunny.net.");
        setSubiendo(false);
      };

      xhr.send(file);

    } catch (err: any) {
      console.error("Excepción en iniciarSubida:", err);
      setError(err.message || "Ocurrió un error inesperado al subir el video.");
      setSubiendo(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-bold text-gray-600">Sube tu video desde tu dispositivo</span>
        {completado && (
          <span className="flex items-center gap-1 text-green-600 font-bold">
            <CheckCircle2 className="h-4 w-4" /> ¡Subido con éxito!
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="video/*"
          disabled={subiendo}
          onChange={handleFileChange}
          className="flex-1 text-xs text-gray-500 border border-gray-300 p-1.5 rounded bg-white cursor-pointer"
        />
        <button
          type="button"
          onClick={iniciarSubida}
          disabled={subiendo || !file}
          className={`flex items-center gap-2 rounded text-white font-bold transition-all duration-300 ${
            subiendo || !file
              ? "bg-gray-300 cursor-not-allowed px-3 py-2 text-xs"
              : "bg-blue-600 hover:bg-blue-700 shadow-lg px-6 py-3 text-sm scale-105 transform hover:scale-110 active:scale-95"
          }`}
        >
          {subiendo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progreso}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir
            </>
          )}
        </button>
      </div>

      {subiendo && (
        <div className="mt-2.5">
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-200"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
