import React, { useState, useEffect } from 'react'
import { X, Calculator, Info } from 'lucide-react'

type SimuladorIngresosModalProps = {
  isOpen: boolean;
  onClose: () => void;
  precioBase: number;
  aplicarIvaGlobal: boolean;
  onChangePrecio?: (precio: number) => void;
  onChangeAplicarIva?: (aplica: boolean) => void;
}

export default function SimuladorIngresosModal({ isOpen, onClose, precioBase, aplicarIvaGlobal, onChangePrecio, onChangeAplicarIva }: SimuladorIngresosModalProps) {
  const [precio, setPrecio] = useState(precioBase)
  const [alumnos, setAlumnos] = useState(20)
  const [regimen, setRegimen] = useState<'RESICO' | 'PF' | 'PM'>('RESICO')
  const [aplicarIva, setAplicarIva] = useState(aplicarIvaGlobal)

  // Sync with props if they change while open
  useEffect(() => {
    setPrecio(precioBase)
  }, [precioBase])
  
  useEffect(() => {
    setAplicarIva(aplicarIvaGlobal)
  }, [aplicarIvaGlobal])

  if (!isOpen) return null

  // Cálculos basados en el Excel
  const ingresoBrutoTotal = precio * alumnos
  // Nota: Asumimos que si aplica IVA, el precio ya lo incluye (Subtotal = Precio / 1.16). 
  // Si no aplica, el subtotal es el precio completo.
  const subtotalVenta = aplicarIva ? (ingresoBrutoTotal / 1.16) : ingresoBrutoTotal
  const ivaCobrado = aplicarIva ? (subtotalVenta * 0.16) : 0
  
  const comisionStripe = ingresoBrutoTotal * 0.0348
  const comisionStripeFija = ingresoBrutoTotal * 0.00348
  
  // Si aplica IVA, el Total Libre en Banco debe restar el IVA que le pertenece al SAT
  const totalLibreBanco = subtotalVenta - comisionStripe - comisionStripeFija
  const comisionInstructor = totalLibreBanco * 0.50
  
  // IVA del instructor (Asimilados a salarios "PM" es exento)
  const ivaInstructor = regimen === 'PM' ? 0 : comisionInstructor * 0.16
  const totalBrutoInstructor = comisionInstructor + ivaInstructor
  
  // Retenciones
  let retencionISR = 0
  let retencionIVA = 0
  
  if (regimen === 'PM') {
    retencionISR = comisionInstructor * 0.075
    retencionIVA = 0
  } else if (regimen === 'PF') {
    retencionISR = comisionInstructor * 0.10
    retencionIVA = comisionInstructor * 0.106667
  } else if (regimen === 'RESICO') {
    retencionISR = comisionInstructor * 0.0125
    retencionIVA = comisionInstructor * 0.106667
  }
  
  const totalRetenciones = retencionISR + retencionIVA
  const pagoNeto = totalBrutoInstructor - totalRetenciones

  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

  const handleGuardar = () => {
    if (onChangePrecio) onChangePrecio(precio)
    if (onChangeAplicarIva) onChangeAplicarIva(aplicarIva)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calculator size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Simulador de Ingresos</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controles */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio del Curso</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input 
                    type="number" 
                    value={precio} 
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimado de Alumnos</label>
                <input 
                  type="number" 
                  value={alumnos} 
                  onChange={(e) => setAlumnos(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu Régimen Fiscal</label>
                <select 
                  value={regimen} 
                  onChange={(e) => setRegimen(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="RESICO">RESICO</option>
                  <option value="PF">Persona Física (Actividad E y P)</option>
                  <option value="PM">Persona Moral (Asimilados)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <input 
                  type="checkbox" 
                  id="sim_iva" 
                  checked={aplicarIva} 
                  onChange={(e) => setAplicarIva(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="sim_iva" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Aplicar IVA al curso
                </label>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-sm text-blue-800 space-y-2">
              <div className="flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <p><strong>Nota importante:</strong> El precio del curso debe incluir IVA. Este cálculo asume que el precio ingresado ya es el final para el estudiante.</p>
              </div>
              <div className="flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <p>Esta calculadora es <strong>solo un simulador</strong> y los valores finales pueden variar ligeramente.</p>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Proyección de Ventas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingreso Bruto Total:</span>
                  <span className="font-medium text-gray-900">{formatter.format(ingresoBrutoTotal)}</span>
                </div>
                {aplicarIva && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (Sin IVA):</span>
                      <span className="font-medium text-gray-900">{formatter.format(subtotalVenta)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>IVA Cobrado (16%):</span>
                      <span>-{formatter.format(ivaCobrado)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-red-600">
                  <span>Comisión Stripe (Procesador):</span>
                  <span>-{formatter.format(comisionStripe + comisionStripeFija)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                  <span className="text-gray-800">Total Libre en Banco:</span>
                  <span className="text-gray-900">{formatter.format(totalLibreBanco)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tus Ingresos (50%)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Comisión Base:</span>
                  <span className="font-medium text-gray-900">{formatter.format(comisionInstructor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium text-gray-900">{formatter.format(ivaInstructor)}</span>
                </div>
                <div className="flex justify-between text-red-600 pt-2 border-t border-gray-200">
                  <span>Retención ISR:</span>
                  <span>-{formatter.format(retencionISR)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retención IVA:</span>
                  <span>-{formatter.format(retencionIVA)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Pago Neto a Depositar:</span>
                <span className="text-2xl font-bold text-green-600">{formatter.format(pagoNeto)}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleGuardar}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            Aplicar Precio al Curso
          </button>
        </div>
      </div>
    </div>
  )
}
