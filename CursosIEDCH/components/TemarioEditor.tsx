'use client'

import React from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'

export interface ModuloTemario {
    id?: string;
    titulo: string;
    temas: string[];
    abierto?: boolean;
}

interface TemarioEditorProps {
    temario: ModuloTemario[];
    onChange: (temario: ModuloTemario[]) => void;
    disabled?: boolean;
}

export default function TemarioEditor({ temario = [], onChange, disabled = false }: TemarioEditorProps) {
    const handleAgregarModulo = () => {
        const nuevoModulo: ModuloTemario = {
            titulo: '',
            temas: ['', '', ''],
            abierto: true
        };
        onChange([...temario, nuevoModulo]);
    };

    const handleEliminarModulo = (modIdx: number) => {
        const nuevoTemario = temario.filter((_, idx) => idx !== modIdx);
        onChange(nuevoTemario);
    };

    const handleToggleModulo = (modIdx: number) => {
        const nuevoTemario = temario.map((m, idx) => {
            if (idx === modIdx) {
                const estaAbierto = m.abierto !== undefined ? m.abierto : true;
                return { ...m, abierto: !estaAbierto };
            }
            return m;
        });
        onChange(nuevoTemario);
    };

    const handleActualizarTituloModulo = (modIdx: number, titulo: string) => {
        const nuevoTemario = temario.map((m, idx) => {
            if (idx === modIdx) {
                return { ...m, titulo };
            }
            return m;
        });
        onChange(nuevoTemario);
    };

    const handleAgregarTema = (modIdx: number) => {
        const nuevoTemario = temario.map((m, idx) => {
            if (idx === modIdx) {
                return {
                    ...m,
                    temas: [...(m.temas || []), ''],
                    abierto: true
                };
            }
            return m;
        });
        onChange(nuevoTemario);
    };

    const handleActualizarTema = (modIdx: number, temaIdx: number, texto: string) => {
        const nuevoTemario = temario.map((m, idx) => {
            if (idx === modIdx) {
                const nuevosTemas = [...(m.temas || [])];
                nuevosTemas[temaIdx] = texto;
                return { ...m, temas: nuevosTemas };
            }
            return m;
        });
        onChange(nuevoTemario);
    };

    const handleEliminarTema = (modIdx: number, temaIdx: number) => {
        const nuevoTemario = temario.map((m, idx) => {
            if (idx === modIdx) {
                const nuevosTemas = (m.temas || []).filter((_, tIdx) => tIdx !== temaIdx);
                return { ...m, temas: nuevosTemas };
            }
            return m;
        });
        onChange(nuevoTemario);
    };

    return (
        <div className="space-y-3 pt-2">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-800">Temario</label>
                    <p className="text-xs text-gray-500 mt-0.5">Agrega los módulos y temas que incluirá tu curso.</p>
                </div>
                <button
                    type="button"
                    onClick={handleAgregarModulo}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium text-xs transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar módulo</span>
                </button>
            </div>

            {temario.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50">
                    <p className="text-xs text-gray-500">
                        No hay módulos en el temario. Haz clic en <strong className="text-indigo-600">+ Agregar módulo</strong> para estructurar los temas de tu curso.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {temario.map((mod, modIdx) => {
                        const abierto = mod.abierto !== undefined ? mod.abierto : true;
                        return (
                            <div
                                key={mod.id || modIdx}
                                className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden transition"
                            >
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b border-gray-100 gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="font-bold text-sm text-gray-800 whitespace-nowrap">
                                            Módulo {modIdx + 1}:
                                        </span>
                                        <input
                                            type="text"
                                            value={mod.titulo}
                                            disabled={disabled}
                                            onChange={(e) => handleActualizarTituloModulo(modIdx, e.target.value)}
                                            placeholder="Título del módulo"
                                            className="w-full text-sm text-gray-800 bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1 transition font-medium placeholder:font-normal placeholder-gray-400 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleModulo(modIdx)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition"
                                            title={abierto ? 'Colapsar módulo' : 'Expandir módulo'}
                                        >
                                            {abierto ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarModulo(modIdx)}
                                            disabled={disabled}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                                            title="Eliminar módulo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {abierto && (
                                    <div className="p-4 space-y-2.5 bg-white">
                                        <div className="space-y-2">
                                            {(mod.temas || []).map((tema, temaIdx) => (
                                                <div key={temaIdx} className="flex items-center gap-2 group">
                                                    <span className="text-indigo-500 text-base leading-none select-none pl-1 font-bold">•</span>
                                                    <input
                                                        type="text"
                                                        value={tema}
                                                        disabled={disabled}
                                                        onChange={(e) => handleActualizarTema(modIdx, temaIdx, e.target.value)}
                                                        placeholder={`Tema ${temaIdx + 1}`}
                                                        className="flex-1 text-sm text-gray-700 bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-gray-50/50 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-1 transition placeholder-gray-400 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminarTema(modIdx, temaIdx)}
                                                        disabled={disabled}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 rounded transition disabled:opacity-50"
                                                        title="Eliminar tema"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleAgregarTema(modIdx)}
                                                disabled={disabled}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Agregar tema</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
