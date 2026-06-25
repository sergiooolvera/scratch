import React, { useState, useEffect } from 'react'
import { X, Calculator, Info, Landmark, HelpCircle, CheckCircle } from 'lucide-react'

type SimuladorIngresosModalProps = {
  isOpen: boolean;
  onClose: () => void;
  precioPublico: number;
  aplicarIvaGlobal: boolean;
  onChangePrecio?: (precio: number) => void;
  onChangeAplicarIva?: (aplica: boolean) => void;
}

type RegimenType = 'RESICO' | 'ACTIVIDAD_PROFESIONAL' | 'ASIMILADOS' | 'PERSONA_MORAL';

export default function SimuladorIngresosModal({ 
  isOpen, 
  onClose, 
  precioPublico, 
  aplicarIvaGlobal, 
  onChangePrecio, 
  onChangeAplicarIva 
}: SimuladorIngresosModalProps) {
  const [precio, setPrecio] = useState(precioPublico)
  const [alumnos, setAlumnos] = useState(20)
  const [regimen, setRegimen] = useState<RegimenType>('RESICO')

  // Sincronizar precio al público cuando se abra el modal (mínimo de 199 recomendado si es de pago)
  useEffect(() => {
    if (isOpen) {
      setPrecio(precioPublico < 199 ? 199 : precioPublico)
    }
  }, [isOpen, precioPublico])

  if (!isOpen) return null

  // --- CÁLCULOS ACTUALIZADOS: INGRESO BRUTO SOBRE PRECIO AL PÚBLICO (CON IVA) ---
  
  // El precio ingresado en el simulador ya es el precio al público
  const precioAlPublico = precio

  // 1. Ingreso Bruto Total = Precio al público * Alumnos
  const ingresoBrutoTotal = precioAlPublico * alumnos

  // 2. (-) Comisión Stripe Variable = Ingreso Bruto * 3.6% * 1.16
  const comisionStripeVariable = ingresoBrutoTotal * 0.036 * 1.16

  // 3. (-) Comisión Stripe Fija = Alumnos * $3.00 * 1.16
  const comisionStripeFija = alumnos * 3.0 * 1.16

  // 4. Total Libre en Banco (Neto) = Ingreso Bruto - Comisión Stripe Variable - Comisión Stripe Fija
  const totalLibreBanco = Math.max(0, ingresoBrutoTotal - comisionStripeVariable - comisionStripeFija)

  // 5. Comisión para el Instructor (50%) = Total Libre en Banco * 50%
  const comisionInstructor = Math.max(0, totalLibreBanco * 0.50)

  // 6. Cálculos Fiscales según Régimen
  let subtotalNeto = 0
  let ivaTrasladado = 0
  let totalBruto = 0
  let retencionISR = 0
  let retencionIVA = 0

  if (regimen === 'RESICO') {
    subtotalNeto = comisionInstructor / 1.16
    ivaTrasladado = subtotalNeto * 0.16
    totalBruto = subtotalNeto + ivaTrasladado // que es igual a comisionInstructor
    retencionISR = subtotalNeto * 0.0125      // 1.25% de retención de ISR en RESICO
    retencionIVA = subtotalNeto * 0.106667    // 10.6667% de retención de IVA en RESICO
  } else if (regimen === 'ACTIVIDAD_PROFESIONAL') {
    subtotalNeto = comisionInstructor / 1.16
    ivaTrasladado = subtotalNeto * 0.16
    totalBruto = subtotalNeto + ivaTrasladado // que es igual a comisionInstructor
    retencionISR = subtotalNeto * 0.10        // 10% de retención de ISR en Actividad Profesional
    retencionIVA = subtotalNeto * 0.106667    // 10.6667% de retención de IVA en Actividad Profesional
  } else if (regimen === 'ASIMILADOS') {
    subtotalNeto = comisionInstructor         // No traslada IVA
    ivaTrasladado = 0
    totalBruto = comisionInstructor
    retencionISR = subtotalNeto * 0.0615      // 6.15% de retención de ISR en Asimilados
    retencionIVA = 0
  } else if (regimen === 'PERSONA_MORAL') {
    subtotalNeto = comisionInstructor / 1.16
    ivaTrasladado = subtotalNeto * 0.16
    totalBruto = subtotalNeto + ivaTrasladado // que es igual a comisionInstructor
    retencionISR = 0                          // Persona Moral no sufre retención de ISR de sí misma aquí
    retencionIVA = 0
  }

  const totalRetenciones = retencionISR + retencionIVA
  const pagoNeto = Math.max(0, totalBruto - totalRetenciones)

  const formatter = new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const handleGuardar = () => {
    if (precio < 199) return;
    if (onChangePrecio) onChangePrecio(precio)
    // El IVA global en el curso ahora siempre se activa si el precio es mayor a 0, 
    // pero para compatibilidad con el resto del flujo, pasamos true
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
              {/* Costo del curso */}
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

              {/* Número de alumnos */}
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

              {/* Régimen Fiscal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Régimen Fiscal del Instructor</label>
                <select 
                  value={regimen} 
                  onChange={(e) => setRegimen(e.target.value as RegimenType)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black bg-white font-medium cursor-pointer"
                >
                  <option value="RESICO">RESICO (P. Física)</option>
                  <option value="ACTIVIDAD_PROFESIONAL">Actividad Profesional (Honorarios)</option>
                  <option value="ASIMILADOS">Asimilados a Salarios</option>
                  <option value="PERSONA_MORAL">Persona Moral (S.A. / S.C.)</option>
                </select>
              </div>
            </div>

            {/* Tarjeta del Régimen Seleccionado */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark size={12} />
                Detalles del régimen
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">
                {regimen === 'RESICO' && 'Régimen Simplificado de Confianza: Se aplica una tasa de retención de ISR del 1.25% y una retención de IVA del 10.6667% sobre el subtotal neto. Excelente para personas físicas con ingresos menores a 3.5 MDP.'}
                {regimen === 'ACTIVIDAD_PROFESIONAL' && 'Persona Física con Actividad Profesional (Honorarios): Se aplica una retención de ISR del 10% y una retención de IVA del 10.6667% sobre el subtotal neto. Apto para profesionistas independientes tradicionales.'}
                {regimen === 'ASIMILADOS' && 'Asimilados a Salarios: No traslada IVA (tasa exenta/no objeto). Se calcula una retención estimada del 6.15% sobre la comisión base.'}
                {regimen === 'PERSONA_MORAL' && 'Persona Moral (S.A. / S.C.): No se aplican retenciones automáticas de ISR ni de IVA por parte de la plataforma en la simulación base. El IVA del 16% se traslada completo y el instructor gestiona sus impuestos internamente.'}
              </p>
            </div>
          </div>

          {/* Columna Derecha: Proyección Financiera (3/5 partes) */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Proyección y Distribución Financiera
            </h3>

            {/* Gran Total a Recibir (Ahora arriba) */}
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
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="p-3.5 pl-4">Concepto / Rubro</th>
                    <th className="p-3.5 pr-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  <tr>
                    <td className="p-3 pl-4 font-medium">Ingreso Bruto Total <span className="text-[10px] text-gray-400">(Precio al público {precio > 0 ? formatter.format(precio) : '$0.00'} × {alumnos} alumnos)</span></td>
                    <td className="p-3 pr-4 text-right font-semibold text-gray-900">{formatter.format(ingresoBrutoTotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500">(-) Comisión Stripe Variable <span className="text-[10px] text-gray-400">(3.6% + IVA)</span></td>
                    <td className="p-3 pr-4 text-right text-red-500">-{formatter.format(comisionStripeVariable)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500">(-) Comisión Stripe Fija <span className="text-[10px] text-gray-400">($3.00 MXN + IVA por alumno)</span></td>
                    <td className="p-3 pr-4 text-right text-red-500">-{formatter.format(comisionStripeFija)}</td>
                  </tr>
                  <tr className="bg-blue-50/30">
                    <td className="p-3 pl-4 font-semibold text-blue-900">Total Libre en Banco (Neto)</td>
                    <td className="p-3 pr-4 text-right font-bold text-blue-900">{formatter.format(totalLibreBanco)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 font-medium text-indigo-900">Comisión para el Instructor (50%)</td>
                    <td className="p-3 pr-4 text-right font-bold text-indigo-900">{formatter.format(comisionInstructor)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-3 pl-4 text-gray-500 pl-6">Subtotal Neto (Antes de IVA)</td>
                    <td className="p-3 pr-4 text-right text-gray-800">{formatter.format(subtotalNeto)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="p-3 pl-4 text-gray-500 pl-6">(+) IVA Trasladado (16%)</td>
                    <td className="p-3 pr-4 text-right text-gray-800">
                      {ivaTrasladado > 0 ? `+${formatter.format(ivaTrasladado)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50 font-medium">
                    <td className="p-3 pl-4 text-gray-700 pl-6">Total Bruto (Subtotal + IVA)</td>
                    <td className="p-3 pr-4 text-right text-gray-900">{formatter.format(totalBruto)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500 pl-6">(-) Retención de ISR</td>
                    <td className="p-3 pr-4 text-right text-red-500">
                      {retencionISR > 0 ? `-${formatter.format(retencionISR)}` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-gray-500 pl-6">(-) Retención de IVA</td>
                    <td className="p-3 pr-4 text-right text-red-500">
                      {retencionIVA > 0 ? `-${formatter.format(retencionIVA)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-red-50/20">
                    <td className="p-3 pl-4 text-red-700 pl-6 font-medium">Total de Retenciones</td>
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
