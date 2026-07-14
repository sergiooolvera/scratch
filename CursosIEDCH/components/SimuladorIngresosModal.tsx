import React, { useState, useEffect } from 'react'
import { X, Calculator, Info, Landmark, ChevronDown } from 'lucide-react'

type SimuladorIngresosModalProps = {
  isOpen: boolean;
  onClose: () => void;
  precioPublico: number;
  aplicarIvaGlobal: boolean;
  comisionInstructorPercent?: number;
  onChangePrecio?: (precio: number) => void;
  onChangeAplicarIva?: (aplica: boolean) => void;
}

type RegimenType = 'ACTIVIDAD_EMPRESARIAL' | 'PLATAFORMA_RFC' | 'PLATAFORMA_SIN_RFC' | 'PLATAFORMA_MORAL_SIN_RFC';

const REGIMENES = [
  { value: 'ACTIVIDAD_EMPRESARIAL', label: 'Actividad Empresarial y Profesional' },
  { value: 'PLATAFORMA_RFC', label: 'Plataforma Personas Físicas con RFC' },
  { value: 'PLATAFORMA_SIN_RFC', label: 'Plataforma Personas Físicas sin RFC' },
  { value: 'PLATAFORMA_MORAL_SIN_RFC', label: 'Plataforma Persona Moral sin RFC' }
] as const;

export default function SimuladorIngresosModal({ 
  isOpen, 
  onClose, 
  precioPublico, 
  aplicarIvaGlobal, 
  comisionInstructorPercent,
  onChangePrecio, 
  onChangeAplicarIva 
}: SimuladorIngresosModalProps) {
  const [precio, setPrecio] = useState(precioPublico)
  const [alumnos, setAlumnos] = useState(20)
  const [regimen, setRegimen] = useState<RegimenType>('ACTIVIDAD_EMPRESARIAL')
  const [isOpenRegimen, setIsOpenRegimen] = useState(false)

  // Sincronizar precio al público cuando se abra el modal (mínimo de 199 recomendado si es de pago)
  useEffect(() => {
    if (isOpen) {
      setPrecio(precioPublico < 199 ? 199 : precioPublico)
    }
  }, [isOpen, precioPublico])

  if (!isOpen) return null

  // --- CONFIGURACIÓN DE COMISIÓN DE LA BASE DE DATOS ---
  const comisionPercent = comisionInstructorPercent !== undefined && comisionInstructorPercent !== null 
    ? comisionInstructorPercent 
    : 60;
  const comisionLabel = `Comisión para el Instructor (${comisionPercent}%)`;

  // --- CÁLCULOS ACTUALIZADOS BASADOS EN EXCEL FILA 16 EN ADELANTE ---
  const precioAlPublico = precio

  // 1. Ingreso Bruto Total = Precio al público * Alumnos
  const ingresoBrutoTotal = precioAlPublico * alumnos

  // 2. Desglose de importe total y IVA Trasladado (16%)
  const desgloseImporteTotal = ingresoBrutoTotal / 1.16
  const ivaTrasladado16 = desgloseImporteTotal * 0.16
  const totalRecibido = desgloseImporteTotal + ivaTrasladado16 // Equivale a ingresoBrutoTotal

  // 3. Total Bruto (Subtotal + IVA) en banco antes de Stripe es igual a totalRecibido
  const totalBrutoFila16 = totalRecibido

  // 4. (-) Comisión Stripe Variable (3.6%) = Ingreso Bruto * 3.6% (sin IVA)
  const comisionStripeVariable = ingresoBrutoTotal * 0.036

  // 5. (-) Comisión Stripe Fija ($3.00 MXN por alumno) = Alumnos * 3.0 (sin IVA)
  const comisionStripeFija = alumnos * 3.0

  // 6. Total Libre en Banco (Neto) = Ingreso Bruto - Comisión Stripe Variable - Comisión Stripe Fija
  const totalLibreBanco = Math.max(0, ingresoBrutoTotal - comisionStripeVariable - comisionStripeFija)

  // 7. Comisión para el Instructor = Total Libre en Banco * multiplicador configurable
  const comisionInstructor = Math.max(0, totalLibreBanco * (comisionPercent / 100))

  // 8. Desglose de pago instructor (Subtotal + IVA)
  const importeSubtotal = comisionInstructor / 1.16
  const ivaPagadoInstructor = importeSubtotal * 0.16
  const totalBrutoInstructor = importeSubtotal + ivaPagadoInstructor // Equivale a comisionInstructor

  // 9. Cálculos Fiscales según Régimen (Retenciones)
  let retencionISR = 0
  let retencionIVA = 0

  if (regimen === 'ACTIVIDAD_EMPRESARIAL') {
    retencionISR = importeSubtotal * 0.10 // 10% del subtotal
    retencionIVA = importeSubtotal * 0.10667 // 10.667% del subtotal (según B27: B23*0.10667)
  } else if (regimen === 'PLATAFORMA_RFC') {
    retencionISR = totalBrutoInstructor * 0.025 // 2.5% del total bruto (según C26: C25*0.025)
    retencionIVA = importeSubtotal * 0.08 // 8% del subtotal (según C27: C23*0.08)
  } else if (regimen === 'PLATAFORMA_SIN_RFC') {
    retencionISR = totalBrutoInstructor * 0.20 // 20% del total bruto (según D26: D25*0.2)
    retencionIVA = ivaPagadoInstructor * 1.0 // 100% del IVA (según D27: (D23*0.16)*1)
  } else if (regimen === 'PLATAFORMA_MORAL_SIN_RFC') {
    retencionISR = totalBrutoInstructor * 0.20 // 20% del total bruto (según E26: E25*0.2)
    retencionIVA = ivaPagadoInstructor * 1.0 // 100% del IVA (según E27: (E23*0.16)*1)
  }

  const totalRetenciones = retencionISR + retencionIVA
  const pagoNeto = Math.max(0, totalBrutoInstructor - totalRetenciones)

  const formatter = new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const handleGuardar = () => {
    if (precio < 199) return;
    if (onChangePrecio) onChangePrecio(precio)
    if (onChangeAplicarIva) onChangeAplicarIva(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Simulador de Ventas e Ingresos SIAI</h2>
              <p className="text-xs text-gray-500">Calcula tus ganancias estimadas de acuerdo con tu régimen fiscal.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Columna Izquierda: Variables de Entrada (2/5 partes) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              Variables de Entrada
            </h3>

            <div className="space-y-4">
              {/* 1. Régimen Fiscal (Combobox Premium) */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Régimen Fiscal del Instructor</label>
                <button
                  type="button"
                  onClick={() => setIsOpenRegimen(!isOpenRegimen)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black bg-white font-medium flex items-center justify-between cursor-pointer text-left shadow-sm hover:border-gray-300"
                >
                  <span className="truncate pr-2">
                    {REGIMENES.find(r => r.value === regimen)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ${isOpenRegimen ? 'rotate-180' : ''}`} />
                </button>

                {isOpenRegimen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsOpenRegimen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 py-1 animate-slide-up">
                      {REGIMENES.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setRegimen(item.value)
                            setIsOpenRegimen(false)
                          }}
                          className={`w-full px-4 py-3 text-left text-xs font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            regimen === item.value 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{item.label}</span>
                          {regimen === item.value && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 2. Costo del curso */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio al Público del Curso (MXN)</label>
                <div className="relative rounded-2xl shadow-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input 
                    type="number" 
                    value={precio || ''} 
                    onChange={(e) => setPrecio(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black bg-white font-medium"
                    placeholder="199.00"
                    min="199"
                  />
                </div>
                {precio < 199 && (
                  <div className="mt-2 p-2.5 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 font-medium flex items-center gap-1.5 animate-fade-in">
                    <Info size={14} className="shrink-0" />
                    <span>El precio mínimo debe ser de $199 MXN.</span>
                  </div>
                )}
                {precio >= 199 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-xl border border-blue-100/50 text-xs text-blue-700 font-medium flex items-center gap-1.5 animate-fade-in">
                    <Info size={14} className="shrink-0" />
                    <span>Precio base desglosado: <strong className="font-bold">{formatter.format(precio / 1.16)}</strong> | IVA (16%): <strong className="font-bold">{formatter.format(precio - (precio / 1.16))}</strong></span>
                  </div>
                )}
              </div>

              {/* 3. Número de alumnos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número Estimado de Alumnos</label>
                <input 
                  type="number" 
                  value={alumnos || ''} 
                  onChange={(e) => setAlumnos(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black bg-white font-medium"
                  placeholder="20"
                  min="1"
                />
              </div>
            </div>

            {/* Tarjeta del Régimen Seleccionado */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark size={12} />
                Detalles del régimen
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">
                {regimen === 'ACTIVIDAD_EMPRESARIAL' && 'Actividad Empresarial y Profesional: Retención de ISR del 10% y de IVA del 10.667% sobre el subtotal neto de la comisión del instructor.'}
                {regimen === 'PLATAFORMA_RFC' && 'Plataforma con RFC: Retención de ISR del 2.5% sobre la comisión total bruta, y retención de IVA del 8% sobre el subtotal neto.'}
                {regimen === 'PLATAFORMA_SIN_RFC' && 'Plataforma sin RFC: Retención de ISR del 20% sobre la comisión total bruta, y retención de IVA del 100% sobre el IVA trasladado de la comisión.'}
                {regimen === 'PLATAFORMA_MORAL_SIN_RFC' && 'Persona Moral sin RFC: Retención de ISR del 20% sobre la comisión total bruta, y retención de IVA del 100% sobre el IVA trasladado de la comisión.'}
              </p>
            </div>
          </div>

          {/* Columna Derecha: Proyección Financiera (3/5 partes) */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Proyección y Distribución Financiera
            </h3>

            {/* Gran Total a Recibir */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                  Pago Neto Estimado a Depositar
                </span>
                <span className="text-xs text-emerald-700/80 block leading-tight">
                  Tus ganancias estimadas después de retenciones fiscales y comisiones de Stripe.
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600 font-sans block tracking-tight">
                  {formatter.format(pagoNeto)}
                </span>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="p-3.5 pl-4">Concepto / Rubro</th>
                    <th className="p-3.5 pr-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {/* Fila 16 en adelante de la Calculadora Excel */}
                  <tr>
                    <td className="p-3 pl-4 font-semibold text-gray-900">Total Bruto (Subtotal + IVA) <span className="text-[10px] text-gray-400 font-normal">(Precio al público {precio > 0 ? formatter.format(precio) : '$0.00'} × {alumnos} alumnos)</span></td>
                    <td className="p-3 pr-4 text-right font-bold text-gray-900">{formatter.format(totalBrutoFila16)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500">(-) Comisión Stripe Variable <span className="text-[10px] text-gray-400">(3.6% sobre Ingreso Bruto)</span></td>
                    <td className="p-3 pr-4 text-right text-red-500">-{formatter.format(comisionStripeVariable)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500">(-) Comisión Stripe Fija <span className="text-[10px] text-gray-400">($3.00 MXN por alumno)</span></td>
                    <td className="p-3 pr-4 text-right text-red-500">-{formatter.format(comisionStripeFija)}</td>
                  </tr>
                  <tr className="bg-blue-50/30">
                    <td className="p-3 pl-4 font-semibold text-blue-900">Total Libre en Banco (Neto)</td>
                    <td className="p-3 pr-4 text-right font-bold text-blue-900">{formatter.format(totalLibreBanco)}</td>
                  </tr>
                  {/* Comisión del Instructor configurable */}
                  <tr className="bg-indigo-50/20">
                    <td className="p-3 pl-4 font-medium text-indigo-900">{comisionLabel}</td>
                    <td className="p-3 pr-4 text-right font-bold text-indigo-900">{formatter.format(comisionInstructor)}</td>
                  </tr>
                  <tr className="bg-gray-50/30">
                    <td className="p-3 pl-6 text-gray-500">Importe subtotal (Antes de IVA)</td>
                    <td className="p-3 pr-4 text-right text-gray-800">{formatter.format(importeSubtotal)}</td>
                  </tr>
                  <tr className="bg-gray-50/30">
                    <td className="p-3 pl-6 text-gray-500">(+) IVA trasladado al instructor (16%)</td>
                    <td className="p-3 pr-4 text-right text-gray-800">
                      {ivaPagadoInstructor > 0 ? `+${formatter.format(ivaPagadoInstructor)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50 font-medium">
                    <td className="p-3 pl-6 text-gray-700">Total Bruto del Instructor (Subtotal + IVA)</td>
                    <td className="p-3 pr-4 text-right text-gray-900">{formatter.format(totalBrutoInstructor)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-6 text-gray-500">(-) Retención de ISR</td>
                    <td className="p-3 pr-4 text-right text-red-500">
                      {retencionISR > 0 ? `-${formatter.format(retencionISR)}` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-6 text-gray-500">(-) Retención de IVA</td>
                    <td className="p-3 pr-4 text-right text-red-500">
                      {retencionIVA > 0 ? `-${formatter.format(retencionIVA)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-red-50/20">
                    <td className="p-3 pl-6 text-red-700 font-medium">Total de Retenciones</td>
                    <td className="p-3 pr-4 text-right text-red-600 font-semibold">
                      {totalRetenciones > 0 ? `-${formatter.format(totalRetenciones)}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Leyenda y Descargo de Responsabilidad */}
        <div className="px-6 py-4 bg-amber-50/50 border-t border-b border-amber-100 flex gap-3 text-amber-800">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800/90 font-medium">
            <strong>Leyenda del Simulador de Ventas:</strong> Esto solo es un simulador de ventas. Los valores finales pueden cambiar según el régimen fiscal aplicable, cupones adquiridos por los estudiantes, alumnos o aprendices inscritos por vendedores externos (cuyas comisiones de afiliación aplican de manera independiente) o por la mercadotecnia de la plataforma.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl font-semibold text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleGuardar}
            disabled={precio < 199}
            className={`px-6 py-3 rounded-2xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-50 transition-all duration-200 cursor-pointer ${precio < 199 ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`}
          >
            Aplicar Precio al Curso
          </button>
        </div>
      </div>
    </div>
  )
}
