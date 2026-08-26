'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Trash2, Plus, Check } from 'lucide-react'

// Clasificación pedagógica de verbos de acción (Taxonomía de Bloom)
export const CATEGORIAS_BLOOM = [
    {
        nombre: 'Conocimiento / Recordar',
        verbos: ['Identificar', 'Reconocer', 'Describir', 'Conocer', 'Nombrar', 'Definir', 'Recordar', 'Listar', 'Localizar']
    },
    {
        nombre: 'Comprensión',
        verbos: ['Comprender', 'Explicar', 'Diferenciar', 'Relacionar', 'Interpretar', 'Examinar', 'Clasificar', 'Resumir', 'Distinguir', 'Ilustrar']
    },
    {
        nombre: 'Aplicación',
        verbos: ['Aplicar', 'Implementar', 'Demostrar', 'Resolver', 'Utilizar', 'Emplear', 'Ejecutar', 'Operar', 'Practicar']
    },
    {
        nombre: 'Análisis',
        verbos: ['Analizar', 'Comparar', 'Contrastar', 'Categorizar', 'Investigar', 'Diagnosticar', 'Desglosar', 'Discriminar']
    },
    {
        nombre: 'Evaluación',
        verbos: ['Evaluar', 'Justificar', 'Validar', 'Criticar', 'Argumentar', 'Medir', 'Calificar', 'Estimar', 'Seleccionar']
    },
    {
        nombre: 'Creación / Diseño',
        verbos: ['Diseñar', 'Desarrollar', 'Formular', 'Construir', 'Planificar', 'Integrar', 'Generar', 'Proponer', 'Estructurar']
    }
]

// Lista aplanada de verbos principales para la barra de acceso rápido
export const VERBOS_DESTACADOS = [
    'Identificar',
    'Reconocer',
    'Describir',
    'Comprender',
    'Conocer',
    'Explicar',
    'Diferenciar',
    'Relacionar',
    'Interpretar',
    'Examinar',
    'Analizar',
    'Aplicar',
    'Evaluar',
    'Diseñar',
    'Desarrollar',
    'Demostrar',
    'Formular',
    'Implementar',
    'Comparar',
    'Sintetizar',
    'Resolver',
    'Integrar',
    'Planificar',
    'Construir',
    'Clasificar',
    'Justificar'
]

const TODOS_LOS_VERBOS = Array.from(
    new Set([
        ...VERBOS_DESTACADOS,
        ...CATEGORIAS_BLOOM.flatMap(c => c.verbos)
    ])
)

interface CompetenciasEditorProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    minCompetencias?: number;
    maxCompetencias?: number;
    maxChars?: number;
}

export default function CompetenciasEditor({
    value = '',
    onChange,
    disabled = false,
    minCompetencias = 3,
    maxCompetencias = 5,
    maxChars = 80
}: CompetenciasEditorProps) {
    // Parser inicial para desglosar el string guardado
    const parseInitialItems = (val: string): string[] => {
        if (!val || !val.trim()) {
            return ['', '', '']; // Inicializar con 3 filas por defecto
        }
        const lines = val
            .split('\n')
            .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(l => l.length > 0);

        if (lines.length === 0) {
            return ['', '', ''];
        }
        // Asegurar que tenga al menos minCompetencias filas visibles para guiar al usuario
        while (lines.length < minCompetencias) {
            lines.push('');
        }
        return lines.slice(0, maxCompetencias);
    };

    const [items, setItems] = useState<string[]>(() => parseInitialItems(value));
    const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [verboActivo, setVerboActivo] = useState<string>('Identificar');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sincronizar si cambia el prop `value` externamente (ej. carga asíncrona de curso)
    useEffect(() => {
        const parsed = parseInitialItems(value);
        const currentJoined = items.map(t => t.trim()).filter(Boolean).join('\n');
        const incomingJoined = parsed.map(t => t.trim()).filter(Boolean).join('\n');
        if (incomingJoined !== currentJoined) {
            setItems(parsed);
        }
    }, [value]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Notificar cambios al padre
    const emitChange = (newItems: string[]) => {
        setItems(newItems);
        // Formatear texto limpio conservando saltos de línea
        const cleanedText = newItems
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .join('\n');
        onChange(cleanedText);
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -220 : 220;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleSelectVerbo = (verbo: string) => {
        if (disabled) return;
        setVerboActivo(verbo);
        setDropdownOpen(false);

        let targetIndex = focusedIndex;

        // Si no hay un input enfocado válido, buscar la primera fila vacía
        if (targetIndex === null || targetIndex < 0 || targetIndex >= items.length) {
            const firstEmptyIdx = items.findIndex(item => !item.trim());
            if (firstEmptyIdx !== -1) {
                targetIndex = firstEmptyIdx;
            } else if (items.length < maxCompetencias) {
                // Crear nueva fila con el verbo si hay espacio
                const newItems = [...items, `${verbo} `];
                emitChange(newItems);
                setFocusedIndex(newItems.length - 1);
                setTimeout(() => {
                    inputRefs.current[newItems.length - 1]?.focus();
                }, 50);
                return;
            } else {
                targetIndex = items.length - 1;
            }
        }

        const currentText = items[targetIndex] || '';
        let newText = '';

        if (!currentText.trim()) {
            newText = `${verbo} `;
        } else {
            // Verificar si el texto ya empieza con algún verbo conocido para reemplazarlo
            const words = currentText.trim().split(/\s+/);
            const firstWord = words[0];
            const isKnownVerb = TODOS_LOS_VERBOS.some(v => v.toLowerCase() === firstWord.toLowerCase());

            if (isKnownVerb) {
                words[0] = verbo;
                newText = words.join(' ') + ' ';
            } else {
                newText = `${verbo} ${currentText}`;
            }
        }

        // Recortar a maxChars si excede
        if (newText.length > maxChars) {
            newText = newText.slice(0, maxChars);
        }

        const newItems = [...items];
        newItems[targetIndex] = newText;
        emitChange(newItems);
        setFocusedIndex(targetIndex);

        setTimeout(() => {
            const el = inputRefs.current[targetIndex!];
            if (el) {
                el.focus();
                const pos = newText.length;
                el.setSelectionRange(pos, pos);
            }
        }, 50);
    };

    const handleItemChange = (index: number, text: string) => {
        if (text.length > maxChars) return;
        const newItems = [...items];
        newItems[index] = text;
        emitChange(newItems);
    };

    const handleAgregarCompetencia = () => {
        if (disabled || items.length >= maxCompetencias) return;
        const newItems = [...items, ''];
        emitChange(newItems);
        const newIdx = newItems.length - 1;
        setFocusedIndex(newIdx);
        setTimeout(() => {
            inputRefs.current[newIdx]?.focus();
        }, 50);
    };

    const handleEliminarCompetencia = (index: number) => {
        if (disabled) return;
        if (items.length <= 1) {
            // Si solo queda una fila, simplemente vaciar su contenido
            const newItems = [''];
            emitChange(newItems);
            setFocusedIndex(0);
            return;
        }

        const newItems = items.filter((_, idx) => idx !== index);
        emitChange(newItems);
        const nextFocus = Math.min(index, newItems.length - 1);
        setFocusedIndex(nextFocus);
    };

    // Verbos visibles según la categoría seleccionada o lista destacada
    const verbosVisibles = selectedCategory
        ? (CATEGORIAS_BLOOM.find(c => c.nombre === selectedCategory)?.verbos || VERBOS_DESTACADOS)
        : VERBOS_DESTACADOS;

    return (
        <div className="space-y-4 pt-2">
            {/* Cabecera y descripción */}
            <div>
                <label className="block text-base font-bold text-gray-900">
                    Competencias a desarrollar
                </label>
                <p className="text-sm text-gray-600 mt-1">
                    Define lo que el alumno será capaz de lograr al finalizar el curso.
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Selecciona un verbo de la lista para cada competencia y escribe el resultado que se espera alcanzar. (Escribe al menos {minCompetencias} y máximo {maxCompetencias})
                </p>
            </div>

            {/* Barra horizontal de verbos taxonómicos */}
            <div className="relative flex items-center gap-2">
                {/* Botón selector principal con acción de inserción y split de menú */}
                <div className="relative shrink-0 flex items-center rounded-xl bg-indigo-600 text-white shadow-sm overflow-hidden" ref={dropdownRef}>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectVerbo(verboActivo)}
                        className="px-3.5 py-2 text-sm font-semibold hover:bg-indigo-700 transition"
                        title={`Insertar verbo "${verboActivo}"`}
                    >
                        {verboActivo || 'Identificar'}
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="px-2 py-2.5 bg-indigo-700 hover:bg-indigo-800 transition border-l border-indigo-500/60 flex items-center justify-center"
                        title="Ver más verbos y categorías de aprendizaje"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menú desplegable de categorías y verbos */}
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-72 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-2 text-gray-800">
                            <div className="px-2 py-1 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Categorías Taxonómicas
                                </span>
                                {selectedCategory && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory(null)}
                                        className="text-[11px] text-indigo-600 hover:underline font-medium"
                                    >
                                        Ver todos
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                {CATEGORIAS_BLOOM.map(cat => (
                                    <div key={cat.nombre} className="border-b border-gray-50 pb-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex justify-between items-center transition ${
                                                selectedCategory === cat.nombre
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <span>{cat.nombre}</span>
                                            {selectedCategory === cat.nombre && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </button>
                                        <div className="flex flex-wrap gap-1 mt-1 pl-2">
                                            {cat.verbos.slice(0, 6).map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleSelectVerbo(v)}
                                                    className={`text-[11px] px-2 py-0.5 rounded-md transition ${
                                                        verboActivo === v
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                                                    }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Flecha scroll izquierda */}
                <button
                    type="button"
                    onClick={() => handleScroll('left')}
                    className="shrink-0 p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 shadow-sm transition"
                    title="Desplazar a la izquierda"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Contenedor desplazable de chips de verbos */}
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {verbosVisibles.map(verbo => {
                        const isSelected = verboActivo === verbo;
                        return (
                            <button
                                key={verbo}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleSelectVerbo(verbo)}
                                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                                    isSelected
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300'
                                }`}
                            >
                                {verbo}
                            </button>
                        );
                    })}
                </div>

                {/* Flecha scroll derecha */}
                <button
                    type="button"
                    onClick={() => handleScroll('right')}
                    className="shrink-0 p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 shadow-sm transition"
                    title="Desplazar a la derecha"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Lista de cajas de texto de competencias numeradas */}
            <div className="space-y-3 pt-1">
                {items.map((competencia, index) => {
                    const charCount = competencia.length;
                    const isOverLimit = charCount > maxChars;

                    return (
                        <div
                            key={index}
                            className="flex items-center gap-2 group"
                        >
                            {/* Caja de captura de competencia */}
                            <div className={`flex-1 flex items-center bg-white border rounded-xl px-3.5 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${
                                isOverLimit ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'
                            }`}>
                                <span className="text-sm font-bold text-gray-700 mr-2 shrink-0 select-none">
                                    {index + 1}.
                                </span>
                                <input
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    disabled={disabled}
                                    value={competencia}
                                    onChange={e => handleItemChange(index, e.target.value)}
                                    onFocus={() => setFocusedIndex(index)}
                                    maxLength={maxChars}
                                    placeholder="Selecciona un verbo o escribe la competencia..."
                                    className="flex-1 bg-transparent border-none p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                />
                                <span className={`text-[11px] font-medium ml-2 shrink-0 select-none ${
                                    charCount >= maxChars ? 'text-amber-600 font-bold' : 'text-gray-400'
                                }`}>
                                    {charCount}/{maxChars}
                                </span>
                            </div>

                            {/* Botón de papelera para eliminar fila */}
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleEliminarCompetencia(index)}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-100 shrink-0"
                                title={items.length <= 1 ? "Limpiar texto" : "Eliminar competencia"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Botón para agregar nueva competencia (Máximo 5) */}
            {items.length < maxCompetencias ? (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={handleAgregarCompetencia}
                    className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm hover:border-indigo-300"
                >
                    <Plus className="w-4 h-4" />
                    <span>Agregar competencia</span>
                </button>
            ) : (
                <p className="text-center text-xs text-gray-400 italic pt-1">
                    Has alcanzado el límite máximo de {maxCompetencias} competencias permitidas.
                </p>
            )}
        </div>
    );
}
