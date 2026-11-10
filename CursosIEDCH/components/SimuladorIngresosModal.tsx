'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  User,
  Building2,
  IdCard,
  Users,
  CircleDollarSign,
  Coins,
  FileText,
  ChevronUp,
  ChevronDown,
  Info,
  ArrowRight,
  Check
} from 'lucide-react'
import {
  LISTA_REGIMENES_SIMULADOR,
  RegimenFiscalSimulador,
  SIMULADOR_CONSTANTS,
  calcularSimulacionGanancias
} from '@/lib/simulador-ganancias'

type SimuladorIngresosModalProps = {
  isOpen: boolean
  onClose: () => void
  precioPublico: number
  /** Props heredadas por compatibilidad con subir-curso / editar-curso */
  aplicarIvaGlobal?: boolean
  comisionInstructorPercent?: number
  onChangePrecio?: (precio: number) => void
  onChangeAplicarIva?: (aplica: boolean) => void
}

type TooltipKey = 'stripe' | 'egac' | 'impuestos' | null

const REGIMEN_ICONS: Record<RegimenFiscalSimulador, React.ComponentType<{ className?: string }>> = {
  PERSONA_FISICA: User,
  PERSONA_MORAL: Building2,
  SIN_RFC: IdCard
}

function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export default function SimuladorIngresosModal({
  isOpen,
  onClose,
  precioPublico
}: SimuladorIngresosModalProps) {
  const [regimen, setRegimen] = useState<RegimenFiscalSimulador>('PERSONA_FISICA')
  const [alumnos, setAlumnos] = useState<number>(SIMULADOR_CONSTANTS.DEFAULT_ALUMNOS)
  const [alumnosStr, setAlumnosStr] = useState<string>(String(SIMULADOR_CONSTANTS.DEFAULT_ALUMNOS))
  const [precio, setPrecio] = useState<number>(SIMULADOR_CONSTANTS.MIN_PRECIO)
  const [precioStr, setPrecioStr] = useState<string>(String(SIMULADOR_CONSTANTS.MIN_PRECIO))
  const [desgloseAbierto, setDesgloseAbierto] = useState<boolean>(true)
  const [activeTooltip, setActiveTooltip] = useState<TooltipKey>(null)

  useEffect(() => {
    if (isOpen) {
      const precioInicial =
        Number.isFinite(precioPublico) && precioPublico >= SIMULADOR_CONSTANTS.MIN_PRECIO
          ? Math.round(precioPublico)
          : SIMULADOR_CONSTANTS.MIN_PRECIO
      setPrecio(precioInicial)
      setPrecioStr(String(precioInicial))
      setActiveTooltip(null)
    }
  }, [isOpen, precioPublico])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const resultado = useMemo(
    () =>
      calcularSimulacionGanancias({
        regimen,
        precioLista: precio,
        alumnos
      }),
    [regimen, precio, alumnos]
  )

  if (!isOpen) return null

  // Progreso visual de los sliders (acotado al rango visual de la barra)
  const alumnosClamped = Math.min(
    SIMULADOR_CONSTANTS.MAX_ALUMNOS,
    Math.max(SIMULADOR_CONSTANTS.MIN_ALUMNOS, alumnos)
  )
  const alumnosPct =
    ((alumnosClamped - SIMULADOR_CONSTANTS.MIN_ALUMNOS) /
      (SIMULADOR_CONSTANTS.MAX_ALUMNOS - SIMULADOR_CONSTANTS.MIN_ALUMNOS)) *
    100

  const precioClamped = Math.min(
    SIMULADOR_CONSTANTS.MAX_PRECIO,
    Math.max(SIMULADOR_CONSTANTS.MIN_PRECIO, precio)
  )
  const precioPct =
    ((precioClamped - SIMULADOR_CONSTANTS.MIN_PRECIO) /
      (SIMULADOR_CONSTANTS.MAX_PRECIO - SIMULADOR_CONSTANTS.MIN_PRECIO)) *
    100

  // Anillo circular SVG para porcentaje de tus ventas
  const porcentajeVentasRounded = Math.min(100, Math.max(0, Math.round(resultado.porcentajeDeTusVentas)))
  const radio = 30
  const circunferencia = 2 * Math.PI * radio
  const strokeDashoffset = circunferencia - (porcentajeVentasRounded / 100) * circunferencia

  const whatsappMensaje = `Hola, usé el simulador de ingresos de Grupo EGAC (${resultado.regimen.titulo}, ${resultado.alumnos} alumnos a ${formatMXN(precio)} MXN) y solicito acompañamiento contable.`
  const whatsappUrl = `${SIMULADOR_CONSTANTS.WHATSAPP_URL_BASE}?text=${encodeURIComponent(whatsappMensaje)}`

  const toggleTooltip = (key: TooltipKey) => {
    setActiveTooltip((prev) => (prev === key ? null : key))
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulador-titulo"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-3xl bg-[#f8fafc] border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-5 text-slate-900"
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar simulador"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-3 pr-10">
          <div className="mt-1 flex items-end gap-1 h-6 shrink-0" aria-hidden="true">
            <span className="w-1.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="w-1.5 h-4 rounded-sm bg-blue-600" />
            <span className="w-1.5 h-6 rounded-sm bg-blue-700" />
          </div>
          <div>
            <h2 id="simulador-titulo" className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Simula tus ingresos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Descubre cuánto podrías recibir por tus cursos.
            </p>
          </div>
        </div>

        {/* Paso 1: Régimen fiscal */}
        <section aria-labelledby="paso-regimen-titulo" className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h3 id="paso-regimen-titulo" className="text-sm sm:text-base font-bold text-slate-900">
                ¿Cómo estás registrado fiscalmente?
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona la opción que corresponda a tu situación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LISTA_REGIMENES_SIMULADOR.map((item) => {
              const Icon = REGIMEN_ICONS[item.id]
              const isSelected = regimen === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`regimen-${item.id}`}
                  onClick={() => setRegimen(item.id)}
                  className={`relative text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between min-h-[104px] ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-blue-50/50 shadow-sm'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between w-full mb-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'text-blue-600' : 'text-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {item.titulo}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {item.subtitulo}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Pasos 2 y 3: Sliders de Alumnos y Precio */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xs">
          {/* Paso 2: Alumnos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <label htmlFor="simulador-alumnos-input" className="block text-sm font-bold text-slate-900">
                    2. ¿Cuántos alumnos?
                  </label>
                  <p className="text-xs text-slate-500">
                    Mueve la línea para cambiar el volumen.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-center min-w-[96px] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
                <input
                  id="simulador-alumnos-input"
                  data-testid="simulador-alumnos-input"
                  type="number"
                  min={SIMULADOR_CONSTANTS.MIN_ALUMNOS}
                  max={SIMULADOR_CONSTANTS.MAX_ALUMNOS}
                  value={alumnosStr}
                  onChange={(e) => {
                    const raw = e.target.value
                    setAlumnosStr(raw)
                    const val = parseInt(raw, 10)
                    if (!Number.isNaN(val) && val >= SIMULADOR_CONSTANTS.MIN_ALUMNOS) {
                      setAlumnos(Math.min(50000, val))
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(alumnosStr, 10)
                    const normalized = Number.isNaN(val)
                      ? SIMULADOR_CONSTANTS.MIN_ALUMNOS
                      : Math.min(50000, Math.max(SIMULADOR_CONSTANTS.MIN_ALUMNOS, val))
                    setAlumnos(normalized)
                    setAlumnosStr(String(normalized))
                  }}
                  aria-label="Número de alumnos"
                  className="w-20 text-center text-lg font-extrabold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="block text-[11px] text-slate-500 -mt-0.5">
                  {alumnos === 1 ? 'alumno' : 'alumnos'}
                </span>
              </div>
            </div>

            <div>
              <input
                type="range"
                aria-label="Control deslizante de alumnos"
                data-testid="simulador-alumnos-slider"
                min={SIMULADOR_CONSTANTS.MIN_ALUMNOS}
                max={SIMULADOR_CONSTANTS.MAX_ALUMNOS}
                step={1}
                value={alumnosClamped}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setAlumnos(val)
                  setAlumnosStr(String(val))
                }}
                style={{
                  background: `linear-gradient(to right, #2563eb ${alumnosPct}%, #e2e8f0 ${alumnosPct}%)`
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mt-1.5">
                <span>1</span>
                <span>5,000</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Paso 3: Precio del curso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <label htmlFor="simulador-precio-input" className="block text-sm font-bold text-slate-900">
                    3. Precio del curso
                  </label>
                  <p className="text-xs text-slate-500">
                    Aumenta de $50 en $50.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-center min-w-[104px] focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-900">$</span>
                  <input
                    id="simulador-precio-input"
                    data-testid="simulador-precio-input"
                    type="number"
                    min={SIMULADOR_CONSTANTS.MIN_PRECIO}
                    max={100000}
                    step={SIMULADOR_CONSTANTS.STEP_PRECIO}
                    value={precioStr}
                    onChange={(e) => {
                      const raw = e.target.value
                      setPrecioStr(raw)
                      const val = Number(raw)
                      if (!Number.isNaN(val) && val >= 0) {
                        setPrecio(val)
                      }
                    }}
                    onBlur={() => {
                      const val = Number(precioStr)
                      const normalized =
                        Number.isNaN(val) || val < SIMULADOR_CONSTANTS.MIN_PRECIO
                          ? SIMULADOR_CONSTANTS.MIN_PRECIO
                          : val
                      setPrecio(normalized)
                      setPrecioStr(String(normalized))
                    }}
                    aria-label="Precio del curso en MXN"
                    className="w-20 text-center text-lg font-extrabold text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <span className="block text-[11px] text-slate-500 -mt-0.5">MXN</span>
              </div>
            </div>

            <div>
              <input
                type="range"
                aria-label="Control deslizante de precio del curso"
                data-testid="simulador-precio-slider"
                min={SIMULADOR_CONSTANTS.MIN_PRECIO}
                max={SIMULADOR_CONSTANTS.MAX_PRECIO}
                step={SIMULADOR_CONSTANTS.STEP_PRECIO}
                value={precioClamped}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setPrecio(val)
                  setPrecioStr(String(val))
                }}
                style={{
                  background: `linear-gradient(to right, #10b981 ${precioPct}%, #e2e8f0 ${precioPct}%)`
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mt-1.5">
                <span>$200</span>
                <span>$10,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tarjeta Verde de Estimación */}
        <section className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-emerald-800">
                Tu estimación
              </span>
              <div
                data-testid="simulador-ingreso-neto-hero"
                className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-tight"
              >
                {formatMXN(resultado.liquidacionNetaTotal)}{' '}
                <span className="text-sm sm:text-base font-bold text-emerald-900">MXN</span>
              </div>
              <span className="block text-xs text-emerald-800/80">
                Ingreso neto estimado
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-emerald-200/60 sm:pl-5">
            <div>
              <span className="block text-xs font-medium text-slate-500">
                Ventas brutas
              </span>
              <div
                data-testid="simulador-ventas-brutas-hero"
                className="text-base sm:text-lg font-extrabold text-slate-900"
              >
                {formatMXN(resultado.ventasBrutas)}{' '}
                <span className="text-xs font-bold text-slate-600">MXN</span>
              </div>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white border border-emerald-100 text-[11px] font-medium text-slate-600">
                {resultado.alumnos.toLocaleString('es-MX')}{' '}
                {resultado.alumnos === 1 ? 'alumno' : 'alumnos'} × ${precio.toLocaleString('es-MX')}
              </span>
            </div>

            {/* Anillo SVG de porcentaje de ventas */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={radio}
                    fill="none"
                    stroke="#d1fae5"
                    strokeWidth="6"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={radio}
                    fill="none"
                    stroke="#047857"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <span
                  data-testid="simulador-porcentaje-ventas"
                  className="absolute text-sm font-black text-emerald-950"
                >
                  {porcentajeVentasRounded}%
                </span>
              </div>
              <span className="text-[11px] text-slate-600 mt-0.5">de tus ventas</span>
            </div>
          </div>
        </section>

        {/* Acordeón Ver desglose de tu ingreso */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <button
            type="button"
            aria-expanded={desgloseAbierto}
            onClick={() => setDesgloseAbierto((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold text-slate-900">
                Ver desglose de tu ingreso
              </span>
            </div>
            {desgloseAbierto ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {desgloseAbierto && (
            <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
              <div className="divide-y divide-slate-100">
                {/* Ventas brutas */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Ventas brutas</span>
                  <span
                    data-testid="desglose-ventas-brutas"
                    className="font-semibold text-slate-900 tabular-nums"
                  >
                    {formatMXN(resultado.ventasBrutas)} MXN
                  </span>
                </div>

                {/* Comisión de procesamiento de pago */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span>Comisión de procesamiento de pago</span>
                      <button
                        type="button"
                        onClick={() => toggleTooltip('stripe')}
                        aria-label="Detalle comisión de procesamiento de pago"
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      data-testid="desglose-comision-stripe"
                      className="font-semibold text-slate-900 tabular-nums"
                    >
                      -{formatMXN(resultado.totalDeduccionStripe)} MXN
                    </span>
                  </div>
                  {activeTooltip === 'stripe' && (
                    <p className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                      Pasarela Stripe: 3.6% sobre venta bruta + $3.00 MXN por alumno (
                      {formatMXN(resultado.comisionStripeBase)}) + 16% IVA (
                      {formatMXN(resultado.ivaComisionStripe)}). Subtotal del curso sin IVA:{' '}
                      {formatMXN(resultado.ventaBrutaSubtotal)}.
                    </p>
                  )}
                </div>

                {/* Participación EGAC */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span>Participación EGAC</span>
                      <button
                        type="button"
                        onClick={() => toggleTooltip('egac')}
                        aria-label="Detalle participación EGAC"
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      data-testid="desglose-participacion-egac"
                      className="font-semibold text-slate-900 tabular-nums"
                    >
                      -{formatMXN(resultado.participacionEgacTotal)} MXN
                    </span>
                  </div>
                  {activeTooltip === 'egac' && (
                    <p className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                      Esquema 70/30 sobre base distribuible ({formatMXN(resultado.baseDistribuible)}):
                      Comisión EGAC 30% ({formatMXN(resultado.comisionEgacBase)}) + 16% IVA (
                      {formatMXN(resultado.ivaComisionEgac)}). Tu participación bruta del 70% es{' '}
                      {formatMXN(resultado.participacionBrutaInstructor)}.
                    </p>
                  )}
                </div>

                {/* Impuestos / retenciones estimadas */}
                <div className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span>Impuestos / retenciones estimadas</span>
                      <button
                        type="button"
                        onClick={() => toggleTooltip('impuestos')}
                        aria-label="Detalle impuestos y retenciones estimadas"
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      data-testid="desglose-impuestos"
                      className="font-semibold text-slate-900 tabular-nums"
                    >
                      -{formatMXN(resultado.totalImpuestosRetenciones)} MXN
                    </span>
                  </div>
                  {activeTooltip === 'impuestos' && (
                    <p className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                      {resultado.regimen.resumenFiscal} ISR retenido:{' '}
                      {formatMXN(resultado.retencionISR)} · IVA retenido:{' '}
                      {formatMXN(resultado.retencionIVA)} (sobre IVA trasladado de{' '}
                      {formatMXN(resultado.ivaTrasladadoAlumnos)}). Ganancia neta por alumno:{' '}
                      {formatMXN(resultado.gananciaNetaPorAlumno)}.
                    </p>
                  )}
                </div>
              </div>

              {/* Ingreso neto estimado */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-950">Ingreso neto estimado</span>
                <span
                  data-testid="simulador-ingreso-neto-desglose"
                  className="font-black text-emerald-950 tabular-nums text-sm sm:text-base"
                >
                  {formatMXN(resultado.liquidacionNetaTotal)} MXN
                </span>
              </div>

              {/* Nota aclaratoria */}
              <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  El resultado es una estimación y puede variar según tu situación fiscal y las condiciones de la operación.
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Botón CTA WhatsApp y Pie de página */}
        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="simulador-whatsapp-cta"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#109973] hover:bg-[#0d8261] text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all"
          >
            {/* Ícono WhatsApp limpio */}
            <svg
              className="w-5 h-5 fill-current shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.391c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-1.984 1.422-.516.078-1.156.109-1.875-.109-.438-.141-.984-.328-1.688-.641-2.953-1.281-4.875-4.266-5.031-4.469-.141-.203-1.203-1.594-1.203-3.047s.766-2.156 1.031-2.453c.266-.297.578-.375.781-.375.188 0 .391 0 .563.016.188.016.438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.094.203-.141.328-.297.516-.156.188-.328.406-.469.547-.156.156-.328.328-.141.656.188.328.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.625 1.625.328.156.516.125.719-.094.203-.219.844-.984 1.078-1.328.219-.344.453-.281.75-.172.297.109 1.906.906 2.234 1.063.328.156.547.234.625.375.078.141.078.797-.172 1.5z" />
            </svg>
            <span>Solicito acompañamiento contable</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </a>

          <p className="text-[11px] text-slate-400 text-center">
            Cálculo estimado. El resultado fiscal puede variar según la situación de cada instructor.
          </p>
        </div>
      </div>
    </div>
  )
}
