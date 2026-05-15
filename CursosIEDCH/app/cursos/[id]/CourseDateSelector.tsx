'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { updateCompraDate } from './updateDateAction'

export default function CourseDateSelector({ savedDateStr, cursoId }: { savedDateStr?: string, cursoId: string }) {
    
    let initY = '2025'
    let initM = '11'
    let initD = '24'
    let activeDate = savedDateStr
    if (activeDate) {
        // Only use savedDateStr if it's within the valid range May 2025 to May 2026
        const parts = activeDate.split('-')
        if (parts.length === 3) {
            const y = parseInt(parts[0])
            const m = parseInt(parts[1])
            if (!((y === 2025 && m >= 5) || (y === 2026 && m <= 5))) {
                activeDate = undefined
            }
        }
    }
    
    if (activeDate) {
        const parts = activeDate.split('-')
        if (parts.length === 3) {
            initY = parts[0]
            initM = parts[1]
            initD = parts[2]
        }
    }

    const [year, setYear] = useState(initY)
    const [month, setMonth] = useState(initM)
    const [day, setDay] = useState(initD)
    const [hasSelected, setHasSelected] = useState(!!activeDate)
    const [isSaving, setIsSaving] = useState(false)

    const handleDateChange = async (type: 'y'|'m'|'d', val: string) => {
        setHasSelected(true)
        let newY = year
        let newM = month
        let newD = day

        if (type === 'y') newY = val
        if (type === 'm') newM = val
        if (type === 'd') newD = val

        // Validar límites de meses (Mayo 2025 a Mayo 2026)
        if (newY === '2025' && parseInt(newM) < 5) newM = '05'
        if (newY === '2026' && parseInt(newM) > 5) newM = '05'

        // Validar cantidad de días del mes
        const daysInMonth = new Date(parseInt(newY), parseInt(newM), 0).getDate()
        if (parseInt(newD) > daysInMonth) newD = daysInMonth.toString().padStart(2, '0')

        setYear(newY)
        setMonth(newM)
        setDay(newD)

        setIsSaving(true)
        const newIso = new Date(parseInt(newY), parseInt(newM) - 1, parseInt(newD), 12, 0, 0).toISOString()
        await updateCompraDate(cursoId, newIso)
        setIsSaving(false)
        setHasSelected(true)
    }

    const months = [
        { val: '01', label: 'Enero' },
        { val: '02', label: 'Febrero' },
        { val: '03', label: 'Marzo' },
        { val: '04', label: 'Abril' },
        { val: '05', label: 'Mayo' },
        { val: '06', label: 'Junio' },
        { val: '07', label: 'Julio' },
        { val: '08', label: 'Agosto' },
        { val: '09', label: 'Septiembre' },
        { val: '10', label: 'Octubre' },
        { val: '11', label: 'Noviembre' },
        { val: '12', label: 'Diciembre' },
    ]

    const validMonths = months.filter(m => {
        const mNum = parseInt(m.val)
        if (year === '2025') return mNum >= 5
        if (year === '2026') return mNum <= 5
        return true
    })

    const daysInCurrentMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => (i + 1).toString().padStart(2, '0'))

    return (
        <div className="mb-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm inline-block max-w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                    <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <label className="text-sm font-bold text-gray-800">
                    Fecha de emisión de tu Constancia
                </label>
            </div>
            
            <div className="flex items-center gap-2">
                <select 
                    value={day} 
                    onChange={e => handleDateChange('d', e.target.value)}
                    className="block rounded-lg border-0 py-2.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-semibold bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                    value={month} 
                    onChange={e => handleDateChange('m', e.target.value)}
                    className="block rounded-lg border-0 py-2.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-semibold bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                >
                    {validMonths.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
                <select 
                    value={year} 
                    onChange={e => handleDateChange('y', e.target.value)}
                    className="block rounded-lg border-0 py-2.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-semibold bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                </select>
            </div>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed max-w-sm">
                {isSaving ? (
                    <span className="text-blue-600 font-medium">Guardando...</span>
                ) : !hasSelected ? (
                    <span className="text-amber-600 font-medium bg-amber-50 px-1 py-0.5 rounded">
                        Si no eliges, por defecto saldrá el 24 de Noviembre de 2025.
                    </span>
                ) : (
                    <span className="text-green-600 font-medium">
                        Fecha guardada correctamente.
                    </span>
                )}
            </p>
        </div>
    )
}
