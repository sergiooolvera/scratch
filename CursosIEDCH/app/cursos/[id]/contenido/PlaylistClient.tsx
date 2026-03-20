'use client'

import { useState } from 'react'
import ContentViewer from './ContentViewer'
import { PlayCircle, FileText } from 'lucide-react'

type Modulo = {
    id: string;
    titulo: string;
    url_contenido: string;
}

export default function PlaylistClient({
    playlist,
    requiereExamen,
    urlExamen
}: {
    playlist: Modulo[],
    requiereExamen?: boolean,
    urlExamen?: string | null
}) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!playlist || playlist.length === 0) {
        return (
            <div className="col-span-full">
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">El contenido de este curso aún no está disponible.</p>
                </div>
            </div>
        )
    }

    const currentItem = playlist[currentIndex]
    const isSingleItem = playlist.length === 1

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 w-full">
            {/* Main Content Viewer (80%) */}
            <div className={`${isSingleItem ? 'lg:col-span-5' : 'lg:col-span-4'} flex flex-col`}>
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex-grow">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {currentItem.titulo}
                        </h2>
                        {!isSingleItem && (
                            <p className="text-sm text-gray-500">Módulo {currentIndex + 1} de {playlist.length}</p>
                        )}
                    </div>
                    <div className="p-4 sm:p-6 bg-gray-50">
                        <ContentViewer url={currentItem.url_contenido} />
                    </div>
                </div>
            </div>

            {/* Playlist Sidebar */}
            {!isSingleItem && (
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden sticky top-8">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                Contenido del Curso
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {playlist.map((item, index) => {
                                const isActive = index === currentIndex
                                return (
                                    <li key={item.id || index}>
                                        <button
                                            onClick={() => setCurrentIndex(index)}
                                            className={`w-full text-left px-4 py-4 flex items-start transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                        >
                                            <PlayCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <div>
                                                <p className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
                                                    {index + 1}. {item.titulo}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
