/**
 * Motor de cálculo del Simulador de Ganancias EGAC 2026.
 *
 * Implementa las fórmulas de los tres libros oficiales:
 * - Simulador_Ganancias_Instructor_Persona_Fisica_2026_VER_1_2.xlsx
 * - Simulador_Ganancias_Instructor_Persona_Moral_2026_VER_1_2.xlsx
 * - Simulador_Ganancias_Instructor_Persona_Fisica_SIN_RFC_2026.xlsx
 */

export type RegimenFiscalSimulador = 'PERSONA_FISICA' | 'PERSONA_MORAL' | 'SIN_RFC'

export interface RegimenMetadata {
  id: RegimenFiscalSimulador
  titulo: string
  subtitulo: string
  tasaRetencionISR: number
  tasaRetencionIVA: number
  resumenFiscal: string
}

export const REGIMENES_SIMULADOR: Record<RegimenFiscalSimulador, RegimenMetadata> = {
  PERSONA_FISICA: {
    id: 'PERSONA_FISICA',
    titulo: 'Persona física',
    subtitulo: 'Plataformas digitales',
    tasaRetencionISR: 0.025, // 2.5% Art. 113-A LISR Reforma 2026
    tasaRetencionIVA: 0.5, // 50% del IVA trasladado Art. 18-J LIVA
    resumenFiscal: 'Retención 2.5% ISR (Art. 113-A LISR) y 50% del IVA trasladado (Art. 18-J LIVA).'
  },
  PERSONA_MORAL: {
    id: 'PERSONA_MORAL',
    titulo: 'Persona moral',
    subtitulo: 'Empresa / sociedad',
    tasaRetencionISR: 0.025, // 2.5% acreditable a cuenta del ISR anual PM Reforma 2026
    tasaRetencionIVA: 0.5, // 50% del IVA trasladado Art. 18-J LIVA
    resumenFiscal: 'Retención 2.5% ISR acreditable a cuenta del ISR anual PM y 50% del IVA trasladado (Art. 18-J LIVA).'
  },
  SIN_RFC: {
    id: 'SIN_RFC',
    titulo: 'Sin RFC',
    subtitulo: 'Aún no cuenta con RFC',
    tasaRetencionISR: 0.2, // 20.0% Art. 113-A LISR por falta de RFC
    tasaRetencionIVA: 1.0, // 100.0% del IVA trasladado Art. 18-J LIVA por falta de RFC
    resumenFiscal: 'Retención 20% ISR (Art. 113-A LISR) y 100% del IVA trasladado (Art. 18-J LIVA) por falta de RFC.'
  }
}

export const LISTA_REGIMENES_SIMULADOR: RegimenMetadata[] = [
  REGIMENES_SIMULADOR.PERSONA_FISICA,
  REGIMENES_SIMULADOR.PERSONA_MORAL,
  REGIMENES_SIMULADOR.SIN_RFC
]

export const SIMULADOR_CONSTANTS = {
  MIN_ALUMNOS: 1,
  MAX_ALUMNOS: 5000,
  DEFAULT_ALUMNOS: 20,
  MIN_PRECIO: 200,
  MAX_PRECIO: 10000,
  STEP_PRECIO: 50,
  TASA_IVA: 0.16,
  STRIPE_PERCENT: 0.036,
  STRIPE_FIXED_MXN: 3,
  EGAC_SHARE: 0.3,
  INSTRUCTOR_SHARE: 0.7,
  WHATSAPP_URL_BASE: 'https://wa.me/527298184978'
} as const

export interface SimulacionInput {
  regimen: RegimenFiscalSimulador
  precioLista: number
  alumnos: number
}

export interface SimulacionResultado {
  regimen: RegimenMetadata
  precioLista: number
  precioBaseUnitario: number
  ivaUnitario: number
  alumnos: number
  ventaBrutaSubtotal: number
  ivaTrasladadoAlumnos: number
  ventasBrutas: number
  comisionStripeBase: number
  ivaComisionStripe: number
  totalDeduccionStripe: number
  baseDistribuible: number
  comisionEgacBase: number
  ivaComisionEgac: number
  participacionEgacTotal: number
  participacionBrutaInstructor: number
  retencionISR: number
  retencionIVA: number
  totalImpuestosRetenciones: number
  liquidacionNetaTotal: number
  gananciaNetaPorAlumno: number
  margenNetoSubtotal: number
  porcentajeDeTusVentas: number
}

/**
 * Calcula el desglose financiero y fiscal completo siguiendo las fórmulas de los Excel 2026.
 */
export function calcularSimulacionGanancias({
  regimen,
  precioLista,
  alumnos
}: SimulacionInput): SimulacionResultado {
  const metadata = REGIMENES_SIMULADOR[regimen]
  const precioValido = Number.isFinite(precioLista) ? Math.max(0, precioLista) : 0
  const alumnosValido = Number.isFinite(alumnos) ? Math.max(1, Math.floor(alumnos)) : 1

  const { TASA_IVA, STRIPE_PERCENT, STRIPE_FIXED_MXN, EGAC_SHARE, INSTRUCTOR_SHARE } = SIMULADOR_CONSTANTS

  // Celdas B5 - B6: Desglose unitario del precio de lista con IVA incluido
  const precioBaseUnitario = precioValido / (1 + TASA_IVA)
  const ivaUnitario = precioBaseUnitario * TASA_IVA

  // Celdas B14 - B16: Ventas brutas del grupo
  const ventaBrutaSubtotal = precioBaseUnitario * alumnosValido
  const ivaTrasladadoAlumnos = ventaBrutaSubtotal * TASA_IVA
  const ventasBrutas = ventaBrutaSubtotal + ivaTrasladadoAlumnos

  // Celdas B17 - B19: Deducción de pasarela Stripe (3.6% + $3.00 por alumno + 16% IVA)
  const comisionStripeBase = ventasBrutas * STRIPE_PERCENT + STRIPE_FIXED_MXN * alumnosValido
  const ivaComisionStripe = comisionStripeBase * TASA_IVA
  const totalDeduccionStripe = comisionStripeBase + ivaComisionStripe

  // Celdas B20 - B23: Base distribuible 70/30 y participación EGAC / Instructor
  const baseDistribuible = Math.max(0, ventaBrutaSubtotal - totalDeduccionStripe)
  const comisionEgacBase = baseDistribuible * EGAC_SHARE
  const ivaComisionEgac = comisionEgacBase * TASA_IVA
  const participacionEgacTotal = comisionEgacBase + ivaComisionEgac
  const participacionBrutaInstructor = baseDistribuible * INSTRUCTOR_SHARE

  // Celdas B24 - B25: Retenciones de ISR (s/subtotal) e IVA (s/IVA trasladado)
  const retencionISR = ventaBrutaSubtotal * metadata.tasaRetencionISR
  const retencionIVA = ivaTrasladadoAlumnos * metadata.tasaRetencionIVA
  const totalImpuestosRetenciones = retencionISR + retencionIVA

  // Celdas B26 - B28: Liquidación neta total en banco, ganancia por alumno y márgenes
  const liquidacionNetaTotal = Math.max(
    0,
    participacionBrutaInstructor +
      ivaTrasladadoAlumnos -
      ivaComisionEgac -
      retencionISR -
      retencionIVA
  )

  const gananciaNetaPorAlumno = alumnosValido > 0 ? liquidacionNetaTotal / alumnosValido : 0
  const margenNetoSubtotal = ventaBrutaSubtotal > 0 ? (liquidacionNetaTotal / ventaBrutaSubtotal) * 100 : 0
  const porcentajeDeTusVentas = ventasBrutas > 0 ? (liquidacionNetaTotal / ventasBrutas) * 100 : 0

  return {
    regimen: metadata,
    precioLista: precioValido,
    precioBaseUnitario,
    ivaUnitario,
    alumnos: alumnosValido,
    ventaBrutaSubtotal,
    ivaTrasladadoAlumnos,
    ventasBrutas,
    comisionStripeBase,
    ivaComisionStripe,
    totalDeduccionStripe,
    baseDistribuible,
    comisionEgacBase,
    ivaComisionEgac,
    participacionEgacTotal,
    participacionBrutaInstructor,
    retencionISR,
    retencionIVA,
    totalImpuestosRetenciones,
    liquidacionNetaTotal,
    gananciaNetaPorAlumno,
    margenNetoSubtotal,
    porcentajeDeTusVentas
  }
}
