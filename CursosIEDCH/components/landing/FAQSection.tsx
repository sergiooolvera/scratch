'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, HelpCircle, User, GraduationCap, X } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  keywords: string
}

interface FAQSubcategory {
  title: string
  items: FAQItem[]
}

interface FAQCategory {
  id: 'alumnos' | 'instructores'
  label: string
  description: string
  icon: string
  subcategories: FAQSubcategory[]
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'alumnos',
    label: 'Portal Alumnos',
    description: 'Cuentas, cursos, constancias y formas de pago.',
    icon: '👨‍🎓',
    subcategories: [
      {
        title: '🔒 Acceso y Cuenta (Alumnos)',
        items: [
          {
            id: 'a-1',
            question: '¿Cómo creo una cuenta?',
            answer: 'Haz clic en el botón "Iniciar Sesión" y selecciona la opción "Crear cuenta". Completa el formulario con tu nombre, correo electrónico y contraseña.',
            keywords: 'crear cuenta registro nombre correo contraseña'
          },
          {
            id: 'a-2',
            question: 'Olvidé mi contraseña, ¿qué puedo hacer?',
            answer: 'Utiliza la opción ¿Olvidaste tu contraseña? disponible en la pantalla de acceso y sigue las instrucciones enviadas a tu correo electrónico.',
            keywords: 'olvide contraseña restablecer recuperar'
          },
          {
            id: 'a-3',
            question: 'No puedo iniciar sesión en mi cuenta, ¿qué debo hacer?',
            answer: 'Verifica que tu correo electrónico y contraseña sean correctos. Si el problema continúa, restablece tu contraseña o contacta al equipo de soporte.',
            keywords: 'iniciar sesion error acceso entrar'
          },
          {
            id: 'a-4',
            question: '¿Puedo cambiar mi contraseña?',
            answer: 'Sí. Puedes actualizar tu contraseña desde la configuración de tu perfil una vez que hayas iniciado sesión.',
            keywords: 'cambiar contraseña actualizar perfil'
          },
          {
            id: 'a-5',
            question: '¿Puedo cambiar mi correo electrónico?',
            answer: 'Sí. Dependiendo de la configuración de tu cuenta, podrás actualizar tu correo electrónico desde tu perfil o solicitar apoyo a soporte.',
            keywords: 'cambiar correo email perfil'
          },
          {
            id: 'a-6',
            question: '¿Cómo actualizo mis datos personales?',
            answer: 'Accede a tu perfil de usuario y modifica la información personal que desees actualizar.',
            keywords: 'datos personales nombre perfil modificar'
          },
          {
            id: 'a-7',
            question: '¿Puedo acceder desde mi teléfono móvil?',
            answer: 'Sí. La plataforma puede utilizarse desde computadoras, tabletas y dispositivos móviles con acceso a internet.',
            keywords: 'celular telefono movil tablet dispositivo'
          },
          {
            id: 'a-8',
            question: '¿Puedo tener más de una cuenta?',
            answer: 'Se recomienda utilizar una sola cuenta para mantener centralizados tus cursos, historial de aprendizaje y credenciales digitales.',
            keywords: 'varias cuentas multiple historial'
          },
          {
            id: 'a-9',
            question: '¿Cómo cierro sesión de forma segura?',
            answer: 'Haz clic en tu perfil y selecciona la opción "Salir", especialmente cuando utilices dispositivos compartidos.',
            keywords: 'cerrar sesion salir dispositivo compartido'
          },
          {
            id: 'a-10',
            question: '¿Cómo elimino mi cuenta?',
            answer: 'Si deseas eliminar tu cuenta, puedes solicitarlo a través de soporte técnico enviando un correo a soporte@grupoegac.com.',
            keywords: 'eliminar borrar cuenta dar de baja'
          }
        ]
      },
      {
        title: '💻 Plataforma y Cursos (Alumnos)',
        items: [
          {
            id: 'c-1',
            question: '¿Dónde puedo consultar mis cursos?',
            answer: 'Todos los cursos, talleres y programas en los que participas se encuentran disponibles en tu panel principal en la sección "Mis Cursos".',
            keywords: 'consultar mis cursos mis capacitaciones panel'
          },
          {
            id: 'c-2',
            question: '¿Cómo continúo con mi capacitación?',
            answer: 'Ingresa a "Mis Cursos", selecciona el programa que deseas continuar y haz clic en "Reanudar" para retomar en tu último módulo avanzado.',
            keywords: 'continuar reanudar avance modulo'
          },
          {
            id: 'c-3',
            question: '¿Puedo descargar los materiales o videos de los cursos?',
            answer: 'Los materiales descargables (PDF, guías, plantillas) pueden guardarse en tu dispositivo. Los videos se reproducen exclusivamente dentro de la plataforma.',
            keywords: 'descargar pdf material guia video offline'
          },
          {
            id: 'c-4',
            question: '¿Los cursos tienen una fecha límite para completarse?',
            answer: 'La mayoría de los programas ofrecen acceso asincrónico a tu propio ritmo, salvo aquellas capacitaciones con sesiones en vivo o vigencia de inscripción especificada.',
            keywords: 'limite tiempo vigencia caducidad ritmo'
          },
          {
            id: 'c-5',
            question: '¿Cómo obtengo mi constancia o certificado?',
            answer: 'Al finalizar con éxito todos los módulos y evaluaciones del curso, la plataforma habilitará automáticamente la descarga de tu constancia en PDF.',
            keywords: 'constancia certificado diploma diploma descargar'
          },
          {
            id: 'c-6',
            question: '¿Cómo puedo verificar la autenticidad de mi constancia?',
            answer: 'Cada constancia emitida cuenta con un código único de validación y QR. Puedes verificarlo en nuestro validador público en línea (/validar).',
            keywords: 'verificar autenticidad qr codigo folio validador'
          },
          {
            id: 'c-7',
            question: '¿Puedo compartir mis credenciales digitales?',
            answer: 'Sí. Puedes compartir tus constancias, microcredenciales e insignias digitales en medios sociales y redes profesionales como LinkedIn con un solo clic.',
            keywords: 'compartir linkedin redes sociales insignia'
          },
          {
            id: 'c-8',
            question: '¿Cómo puedo contactar a mi instructor u organización?',
            answer: 'Si la capacitación tiene habilitados canales directos, podrás escribir en la sección de "Dudas y Respuestas del Instructor" dentro del curso.',
            keywords: 'contactar instructor dudas mensajes profesor'
          },
          {
            id: 'c-9',
            question: '¿Qué hago si encuentro un error dentro de la plataforma?',
            answer: 'Puedes reportar cualquier incidencia técnica al equipo enviando una descripción y captura a soporte@grupoegac.com.',
            keywords: 'error fallo reporte bug problema soporte'
          },
          {
            id: 'c-10',
            question: '¿La plataforma guarda automáticamente mi progreso?',
            answer: 'Sí. Tu avance y actividades se registran y guardan automáticamente en la nube para que puedas continuar en cualquier momento.',
            keywords: 'guardar progreso automatico avance nube'
          }
        ]
      },
      {
        title: '💳 Pagos y Facturación (Alumnos)',
        items: [
          {
            id: 'p-1',
            question: '¿Cómo pago un curso o capacitación?',
            answer: 'En el catálogo de cursos, selecciona la capacitación de tu interés, haz clic en "Ver detalles" o "Comprar" y elige el método de pago (Tarjeta de débito/crédito, Pago en OXXO, o Transferencia).',
            keywords: 'pago comprar tarjeta debito credito oxxo transferencia'
          },
          {
            id: 'p-2',
            question: '¿Cómo utilizo mi cupón de descuento?',
            answer: 'Durante el proceso de pago encontrarás el campo "Tengo un cupón". Ingresa el código respetando mayúsculas y minúsculas y presiona "Aplicar".',
            keywords: 'cupon descuento codigo promocion aplicar'
          },
          {
            id: 'p-3',
            question: 'Mi cupón no funciona, ¿qué puedo hacer?',
            answer: 'Verifica que el código haya sido escrito exactamente como te lo proporcionaron y confirma que siga vigente y aplique al curso elegido.',
            keywords: 'cupon error no funciona invalido caducado'
          },
          {
            id: 'p-4',
            question: '¿Puedo pagar en OXXO?',
            answer: 'Sí. La plataforma permite generar una ficha de pago con referencia con la cual podrás depositar en efectivo en cualquier tienda OXXO.',
            keywords: 'oxxo efectivo deposito referencia ficha'
          },
          {
            id: 'p-5',
            question: '¿Cuánto tiempo tarda en reflejarse un pago realizado en OXXO?',
            answer: 'Los pagos en OXXO suelen ser inmediatos, aunque en ocasiones pueden tardar de 12 a 48 horas según los procesos de OXXO Pay.',
            keywords: 'tiempo oxxo acreditacion horas reflejar'
          },
          {
            id: 'p-6',
            question: 'Realicé un pago en OXXO y aún no tengo acceso. ¿Qué debo hacer?',
            answer: 'Si han pasado más de 48 horas hábiles, envía tu comprobante impreso de OXXO a soporte@grupoegac.com para validar y darte acceso de inmediato.',
            keywords: 'oxxo sin acceso comprobante ticket soporte'
          }
        ]
      }
    ]
  },
  {
    id: 'instructores',
    label: 'Instructores y Organizaciones',
    description: 'Creación de cursos, pagos, insignia CAP y CFI.',
    icon: '👨‍🏫',
    subcategories: [
      {
        title: '📝 Registro y Creador (Instructores/Org)',
        items: [
          {
            id: 'i-1',
            question: '¿Cómo puedo registrarme como instructor u organización?',
            answer: 'En el botón "Quiero publicar un curso" de la barra superior, selecciona si eres Instructor Independiente o Institución y completa la solicitud.',
            keywords: 'registro instructor institucion publicar organizacion'
          },
          {
            id: 'i-2',
            question: '¿Tiene algún costo crear un perfil de creador?',
            answer: 'El registro inicial y la creación de cuenta para instructores y organizaciones es totalmente gratuito.',
            keywords: 'costo precio gratis publicar registro'
          },
          {
            id: 'i-3',
            question: '¿Quiénes pueden publicar capacitaciones en la plataforma?',
            answer: 'Profesionales, especialistas, académicos, consultores, escuelas, empresas e instituciones que cumplan con los estándares educativos del ecosistema.',
            keywords: 'quienes pueden publicar requisitos profesor escuela'
          }
        ]
      },
      {
        title: '🛠️ Creación y Gestión de Cursos',
        items: [
          {
            id: 'i-4',
            question: '¿Cómo creo un nuevo curso o programa?',
            answer: 'Desde tu panel de administración / creador, haz clic en "Crear Curso". Podrás estructurar módulos, lecciones, evaluaciones y subir recursos.',
            keywords: 'crear nuevo curso modulos lecciones panel'
          },
          {
            id: 'i-5',
            question: '¿Qué formatos de contenido puedo subir?',
            answer: 'Puedes integrar videos (Vimeo/YouTube/Cloud), documentos PDF, audios, imágenes y crear exámenes de opción múltiple o preguntas abiertas.',
            keywords: 'formatos video pdf examen audio recursos'
          },
          {
            id: 'i-6',
            question: '¿Puedo editar un curso después de haber sido publicado?',
            answer: 'Sí. Puedes actualizar lecciones, agregar recursos adicionales o ajustar descripciones en cualquier momento.',
            keywords: 'editar modificar curso publicado lecciones'
          }
        ]
      },
      {
        title: '🛡️ Credenciales Digitales (Creadores)',
        items: [
          {
            id: 'i-7',
            question: '¿La plataforma emite constancias automáticamente?',
            answer: 'Sí. Una vez configurado tu curso, la plataforma emite constancias digitales automatizadas a cada estudiante al completar el 100% de la formación.',
            keywords: 'emision automatica constancia certificado'
          },
          {
            id: 'i-8',
            question: '¿Las constancias cuentan con código de verificación QR o firma?',
            answer: 'Todas las constancias incluyen folio único, código QR de validación pública en línea y firmas institucionales autorizadas.',
            keywords: 'qr firma validador folio verificacion'
          }
        ]
      },
      {
        title: '💰 Monetización e Ingresos',
        items: [
          {
            id: 'i-9',
            question: '¿Cómo recibo los pagos por las ventas de mis cursos?',
            answer: 'Los ingresos generados se transfieren a tu cuenta bancaria registrada mediante transferencia bancaria SPEI o el procesador de pagos integrado.',
            keywords: 'monetizacion ingresos recibo pagos transferencia banco'
          },
          {
            id: 'i-10',
            question: '¿Qué porcentaje de comisión cobra la plataforma?',
            answer: 'Contamos con esquemas transparentes de comisión competitivos diseñados para maximizar la ganancia del creador. Consulta los detalles al registrarte.',
            keywords: 'comision porcentaje ganancias cobro'
          },
          {
            id: 'i-11',
            question: '¿Cada cuánto tiempo se realizan las transferencias o desembolsos?',
            answer: 'Los cortes y desembolsos se realizan de manera periódica según el calendario establecido en tu panel de instructor.',
            keywords: 'corte desembolso tiempo transferencias pagos'
          }
        ]
      },
      {
        title: '🎟️ Cupones y Códigos (Creadores)',
        items: [
          {
            id: 'i-12',
            question: '¿Puedo crear cupones de descuento para mis estudiantes?',
            answer: 'Sí. Desde tu panel puedes generar códigos promocionales de descuento porcentual o monto fijo.',
            keywords: 'cupones promocion descuento creador'
          },
          {
            id: 'i-13',
            question: '¿Puedo establecer una fecha de caducidad para los cupones?',
            answer: 'Sí, puedes definir el límite de usos y la fecha de vigencia exacta de cada cupón que generes.',
            keywords: 'vigencia caducidad limites cupón'
          }
        ]
      },
      {
        title: '🏆 Programas Especiales (CAP / CFI)',
        items: [
          {
            id: 'i-14',
            question: '¿Qué es la Insignia CAP (Creador Académico Preferente)?',
            answer: 'Es un reconocimiento de excelencia otorgado a instructores con alto desempeño, excelentes valoraciones de alumnos y cumplimiento continuo.',
            keywords: 'cap creador academico preferente insignia excelencia'
          },
          {
            id: 'i-15',
            question: '¿Cómo puedo obtener un Nombramiento CFI (Centro de Formación Interna)?',
            answer: 'Acredita a empresas y organizaciones que imparten y gestionan al menos 3 capacitaciones internas continuas dentro del ecosistema.',
            keywords: 'cfi centro formacion interna nombramiento empresa'
          }
        ]
      },
      {
        title: '⚖️ Políticas y Soporte Técnico',
        items: [
          {
            id: 'i-16',
            question: '¿Qué sucede si incumplo las políticas? ¿Se puede apelar?',
            answer: 'El incumplimiento de normas o propiedad intelectual puede generar restricciones. Puedes enviar una solicitud de apelación a soporte.',
            keywords: 'politicas apelar sancion reglas'
          },
          {
            id: 'i-17',
            question: '¿Qué prácticas no están permitidas?',
            answer: 'Está prohibida la suplantación de identidad, carga de contenidos fraudulentos o distribución de materiales sin derechos de autor.',
            keywords: 'prohibido fraudulento derechos autor copia'
          },
          {
            id: 'i-18',
            question: '¿Cómo reporto un problema o contacto al equipo?',
            answer: 'Escribe a soporte@grupoegac.com indicando tu nombre de usuario y detalle de la consulta.',
            keywords: 'reporte contacto soporte ayuda'
          }
        ]
      }
    ]
  }
]

export default function FAQSection() {
  const [activeTab, setActiveTab] = useState<'alumnos' | 'instructores'>('alumnos')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const currentCategory = useMemo(() => {
    return FAQ_DATA.find((c) => c.id === activeTab) || FAQ_DATA[0]
  }, [activeTab])

  // Filtered logic across categories if searching, or within current category
  const filteredSubcategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return currentCategory.subcategories

    return currentCategory.subcategories
      .map((subcat) => {
        const filteredItems = subcat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            item.keywords.toLowerCase().includes(q)
        )
        return { ...subcat, items: filteredItems }
      })
      .filter((subcat) => subcat.items.length > 0)
  }, [currentCategory, searchQuery])

  const totalResults = useMemo(() => {
    return filteredSubcategories.reduce((acc, sub) => acc + sub.items.length, 0)
  }, [filteredSubcategories])

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section id="faq" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> Centro de Ayuda
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1b36] tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Encuentra respuestas rápidas a tus dudas sobre el uso de la plataforma, capacitaciones, pagos y certificados.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe tu duda (ej: oxxo, constancia, crear cuenta, cupones)..."
              className="w-full pl-11 pr-10 py-4 rounded-full border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-indigo-600 font-semibold mt-2 text-center">
              Se encontraron {totalResults} resultado(s) para &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Portal Filter Cards / Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
          {FAQ_DATA.map((cat) => {
            const isActive = activeTab === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  {cat.id === 'alumnos' ? <User className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isActive ? 'text-indigo-950' : 'text-[#0b1b36]'}`}>
                    {cat.label}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Accordions Container */}
        <div className="max-w-4xl mx-auto space-y-8">
          {totalResults === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <span className="text-4xl block mb-2">🔍</span>
              <h4 className="font-bold text-[#0b1b36] text-base mb-1">No encontramos resultados</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Intenta buscar palabras clave más generales como &quot;oxxo&quot;, &quot;cuenta&quot;, &quot;factura&quot; o &quot;constancia&quot;.
              </p>
            </div>
          ) : (
            filteredSubcategories.map((subcat) => (
              <div key={subcat.title} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-[#0b1b36] mb-4 flex items-center gap-2">
                  {subcat.title}
                </h3>
                <div className="space-y-3">
                  {subcat.items.map((item) => {
                    const isOpen = !!openItems[item.id] || searchQuery.length > 0
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow duration-200"
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 hover:bg-slate-50/80 transition-colors"
                        >
                          <h4 className="font-semibold text-[#0b1b36] text-sm sm:text-base leading-snug">
                            {item.question}
                          </h4>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
