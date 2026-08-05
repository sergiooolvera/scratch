'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

interface OnboardingTourProps {
  rol?: string
}

// Paleta de colores temáticos por rol
const colorsByRole: Record<string, { accent: string; hover: string; bg: string }> = {
  alumno: { accent: '#2563eb', hover: '#1d4ed8', bg: '#eff6ff' }, // Azul
  financiero: { accent: '#4f46e5', hover: '#4338ca', bg: '#e0e7ff' }, // Indigo
  instructor: { accent: '#059669', hover: '#047857', bg: '#ecfdf5' }, // Esmeralda
  capacitador: { accent: '#059669', hover: '#047857', bg: '#ecfdf5' }, // Esmeralda
  institucion: { accent: '#ea580c', hover: '#c2410c', bg: '#fff7ed' }, // Naranja
  admin: { accent: '#9333ea', hover: '#7e22ce', bg: '#faf5ff' }, // Púrpura
}

export default function OnboardingTour({ rol = 'alumno' }: OnboardingTourProps) {
  const [isMounted, setIsMounted] = useState(false)

  const activeColors = colorsByRole[rol.toLowerCase()] || colorsByRole.alumno

  useEffect(() => {
    setIsMounted(true)

    const handleStartTour = () => {
      // Retrasar ligeramente para asegurar que el DOM esté listo
      setTimeout(() => {
        startTour()
      }, 300)
    }

    window.addEventListener('start-onboarding-tour', handleStartTour)

    // Evaluar la ruta actual en el navegador
    const pathname = window.location.pathname
    
    if (pathname.includes('/profesor/subir-curso') || pathname.includes('/profesor/editar-curso')) {
      const tourVistoSubir = localStorage.getItem('iedch_subir_curso_tour_completed')
      if (!tourVistoSubir) {
        const autoStartTimeout = setTimeout(() => {
          startTour(true) // true indica que fue arranque automático
        }, 1500)
        return () => {
          clearTimeout(autoStartTimeout)
          window.removeEventListener('start-onboarding-tour', handleStartTour)
        }
      }
    } else if (pathname === '/profesor' || pathname === '/profesor/') {
      const tourVistoDashboardProf = localStorage.getItem('iedch_profesor_dashboard_tour_completed')
      if (!tourVistoDashboardProf) {
        const autoStartTimeout = setTimeout(() => {
          startTour(true)
        }, 1500)
        return () => {
          clearTimeout(autoStartTimeout)
          window.removeEventListener('start-onboarding-tour', handleStartTour)
        }
      }
    } else if (pathname.startsWith('/cursos/') && !pathname.endsWith('/certificado') && !pathname.endsWith('/constancia') && !pathname.endsWith('/contenido') && !pathname.endsWith('/examen')) {
      const tourVistoCursoDetail = localStorage.getItem('iedch_curso_detail_tour_completed')
      if (!tourVistoCursoDetail) {
        const autoStartTimeout = setTimeout(() => {
          startTour(true)
        }, 1500)
        return () => {
          clearTimeout(autoStartTimeout)
          window.removeEventListener('start-onboarding-tour', handleStartTour)
        }
      }
    } else {
      const tourVisto = localStorage.getItem('iedch_onboarding_completed')
      if (!tourVisto) {
        // Retrasar 2 segundos para dar tiempo a cargar la app y que no sea molesto
        const autoStartTimeout = setTimeout(() => {
          startTour(true) // true indica que fue arranque automático
        }, 2000)
        return () => {
          clearTimeout(autoStartTimeout)
          window.removeEventListener('start-onboarding-tour', handleStartTour)
        }
      }
    }

    return () => {
      window.removeEventListener('start-onboarding-tour', handleStartTour)
    }
  }, [rol])

  const startTour = (isAuto = false) => {
    // Si ya existe un popover de driver.js en el DOM o una bandera global indica que está activo, no hacer nada
    if (document.querySelector('.driver-popover') || (typeof window !== 'undefined' && (window as any).__iedch_tour_active)) {
      return
    }

    if (typeof window !== 'undefined') {
      (window as any).__iedch_tour_active = true
    }

    const pathname = window.location.pathname

    // Si está en la página del detalle del curso, cargar tour de adquisición de curso
    if (pathname.startsWith('/cursos/') && !pathname.endsWith('/certificado') && !pathname.endsWith('/constancia') && !pathname.endsWith('/contenido') && !pathname.endsWith('/examen')) {
      const stepsCurso: any[] = [
        {
          popover: {
            title: 'Ficha Informativa del Curso 📚',
            description: 'Te damos la bienvenida al detalle del curso. Aquí podrás consultar el temario, el instructor, los beneficios y los métodos para inscribirte.',
            position: 'center'
          }
        }
      ]

      if (document.querySelector('#tour-informacion-curso')) {
        stepsCurso.push({
          element: '#tour-informacion-curso',
          popover: {
            title: 'Información Básica 📝',
            description: 'Revisa la descripción completa del curso, la duración estimada en horas, el perfil del instructor y las competencias o beneficios que obtendrás al graduarte.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-codigo-referido')) {
        stepsCurso.push({
          element: '#tour-codigo-referido',
          popover: {
            title: 'Código de Referido 🏷️',
            description: 'Si tienes un código de algún instructor, ingresa el código promocional para obtener beneficios o registrar tu matrícula bajo su red de capacitación.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-metodos-pago')) {
        stepsCurso.push({
          element: '#tour-metodos-pago',
          popover: {
            title: 'Métodos de Inscripción y Pago 💳',
            description: 'Elige tu opción de pago: Stripe/Stripe OXXO con tarjeta, transferencia bancaria directa (copiando la CLABE), subiendo un comprobante de OXXO en efectivo, o ingresando un cupón de descuento.',
            side: 'top',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-opiniones-curso')) {
        stepsCurso.push({
          element: '#tour-opiniones-curso',
          popover: {
            title: 'Valoraciones y Opiniones 💬',
            description: 'Consulta los testimonios y comentarios reales de otros estudiantes que ya han tomado este curso en el portal.',
            side: 'top',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-ayuda')) {
        stepsCurso.push({
          element: '#tour-ayuda',
          popover: {
            title: 'Reiniciar Recorrido 💡',
            description: 'Si en algún momento del pago olvidas cómo reportar tu comprobante bancario, haz clic en este botón circular de ayuda para repetir este tour.',
            side: 'bottom',
            align: 'end'
          }
        })
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(5, 10, 25, 0.75)',
        stageRadius: 12,
        popoverClass: 'driverjs-premium-theme',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido! 👍',
        steps: stepsCurso,
        onDestroyed: () => {
          if (typeof window !== 'undefined') {
            (window as any).__iedch_tour_active = false;
          }
          if (isAuto) {
            localStorage.setItem('iedch_curso_detail_tour_completed', 'true')
          }
        }
      })

      driverObj.drive()
      return
    }

    // Si está en la página del Dashboard del Profesor, cargar tour de control de profesor
    if (pathname === '/profesor' || pathname === '/profesor/') {
      const stepsProf: any[] = [
        {
          popover: {
            title: '¡Panel de Control del Instructor! 👨‍🏫',
            description: 'Desde este panel puedes crear academias, subir cursos, gestionar inscripciones y revisar el rendimiento general de tu contenido. ¡Exploremos las acciones!',
            position: 'center'
          }
        }
      ]

      if (document.querySelector('#tour-crear-academia')) {
        stepsProf.push({
          element: '#tour-crear-academia',
          popover: {
            title: 'Crear Academia 🏢',
            description: 'Configura y personaliza tu propia academia virtual con tus logotipos e identidad. Podrás agrupar cursos en grupos y registrar instructores colaboradores.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-crear-curso-dashboard')) {
        stepsProf.push({
          element: '#tour-crear-curso-dashboard',
          popover: {
            title: 'Crear Cursos 📚',
            description: 'Diseña y sube un nuevo programa educativo. Aquí podrás agregar contenido modular, lecciones en video, PDFs, tareas y evaluaciones.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-resumen-rapido')) {
        stepsProf.push({
          element: '#tour-resumen-rapido',
          popover: {
            title: 'Resumen Rápido de Métricas 📊',
            description: 'Monitorea de un vistazo el rendimiento general: la cantidad de alumnos inscritos en tus cursos, las materias publicadas, constancias emitidas y tus finanzas acumuladas.',
            side: 'top',
            align: 'center'
          }
        })
      }

      // Navbar links del menú de profesor
      if (document.querySelector('#tour-navbar-links')) {
        stepsProf.push({
          element: '#tour-navbar-links',
          popover: {
            title: 'Acciones Rápidas del Menú 🧭',
            description: 'Accede a herramientas avanzadas en la barra: lista de tus cursos creados, dudas pendientes de alumnos, revisión de exámenes, cuestionarios y tareas.',
            side: 'bottom',
            align: 'start'
          }
        })
      }

      if (document.querySelector('#tour-ayuda')) {
        stepsProf.push({
          element: '#tour-ayuda',
          popover: {
            title: 'Guía y Soporte 💡',
            description: '¿Olvidaste cómo funciona alguna sección? Haz clic en este botón de ayuda en cualquier momento para reiniciar este tutorial específico del panel.',
            side: 'bottom',
            align: 'end'
          }
        })
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(5, 10, 25, 0.75)',
        stageRadius: 12,
        popoverClass: 'driverjs-premium-theme',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido! 👍',
        steps: stepsProf,
        onDestroyed: () => {
          if (typeof window !== 'undefined') {
            (window as any).__iedch_tour_active = false;
          }
          if (isAuto) {
            localStorage.setItem('iedch_profesor_dashboard_tour_completed', 'true')
          }
        }
      })

      driverObj.drive()
      return
    }

    // Si está en la página de subir o editar curso, cargar tour de creación
    if (pathname.includes('/profesor/subir-curso') || pathname.includes('/profesor/editar-curso')) {
      const stepsSubir: any[] = [
        {
          popover: {
            title: 'Creador de Cursos Premium 🛠️',
            description: 'Te damos la bienvenida al panel de creación y edición de cursos. Aquí puedes estructurar tu temario, configurar métodos de pago, simuladores, IA de Gamma y evaluaciones. ¡Veamos cómo funciona!',
            position: 'center'
          }
        }
      ]

      if (document.querySelector('#tour-recuperar-borrador')) {
        stepsSubir.push({
          element: '#tour-recuperar-borrador',
          popover: {
            title: 'Recuperar Borradores 💾',
            description: 'El sistema guarda tu progreso automáticamente en el navegador. Si sales por accidente, podrás restaurar tu trabajo aquí con un solo clic.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      if (document.querySelector('#tour-pasos-creacion')) {
        stepsSubir.push({
          element: '#tour-pasos-creacion',
          popover: {
            title: 'Etapas de Configuración 📋',
            description: 'El proceso está dividido en cuatro etapas secuenciales: Información básica del curso, definición del Temario, la Evaluación final y el envío a revisión.',
            side: 'bottom',
            align: 'center'
          }
        })
      }

      // Paso del Simulador de Ingresos en Pestaña 1
      if (document.querySelector('#btn-simulador-ingresos') || document.querySelector('#tab-btn-info')) {
        stepsSubir.push({
          element: '#btn-simulador-ingresos',
          popover: {
            title: 'Simulador de Ventas e Ingresos 📊',
            description: 'Calcula tus ganancias estimadas de acuerdo con tu régimen fiscal. Escribe el precio deseado del curso (mínimo $199 MXN) y simula ganancias netas deduciendo comisiones bancarias.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-info') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })
      }

      // Paso de la IA de Gamma en Pestaña 2
      if (document.querySelector('#tab-btn-modulos')) {
        stepsSubir.push({
          element: '#tab-btn-modulos',
          popover: {
            title: 'Temario y Clases 📚',
            description: 'Aquí organizas las clases del curso por módulos. Puedes estructurar tu temario y subir los recursos educativos correspondientes.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-modulos') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })

        stepsSubir.push({
          element: document.querySelector('#btn-gamma-first') ? '#btn-gamma-first' : '#tab-btn-modulos',
          popover: {
            title: 'Generación con IA (Gamma) 🪄',
            description: 'Nuestra plataforma cuenta con la IA de Gamma integrada. Puedes generar presentaciones temáticas completas (en formatos PDF o PPTX) para tus clases en segundos.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-modulos') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })
      }

      // Paso de Carga de Exámenes en Pestaña 3
      if (document.querySelector('#tab-btn-examen')) {
        stepsSubir.push({
          element: '#tab-btn-examen',
          popover: {
            title: 'Evaluación y Exámenes 📝',
            description: 'Define la calificación mínima para que el alumno apruebe el curso y obtenga su constancia de estudios.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-examen') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })

        stepsSubir.push({
          element: document.querySelector('#input-archivo-examen') ? '#input-archivo-examen' : '#tab-btn-examen',
          popover: {
            title: 'Cargar Examen desde PDF 📄',
            description: 'Sube un archivo PDF con tus preguntas de opción múltiple. Nuestra IA se encargará de leerlo y cargar masivamente las preguntas para evitar que las captures manualmente.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-examen') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })
      }

      // Paso de Enviar a Revisión en Pestaña 4
      if (document.querySelector('#tab-btn-avisos')) {
        stepsSubir.push({
          element: document.querySelector('#btn-enviar-revision') ? '#btn-enviar-revision' : '#tab-btn-avisos',
          popover: {
            title: 'Enviar a Revisión ✉️',
            description: 'Al finalizar de estructurar tu curso, escribe avisos o enlaces de videoconferencia en vivo (Zoom, Teams, Meet) y presiona "Guardar curso y Enviar a revisión" para que el administrador lo autorice.',
            side: 'bottom',
            align: 'center'
          },
          onHighlightStarted: () => {
            const tabBtn = document.querySelector('#tab-btn-avisos') as HTMLButtonElement;
            if (tabBtn) tabBtn.click();
          }
        })
      }

      if (document.querySelector('#tour-guardar-borrador')) {
        stepsSubir.push({
          element: '#tour-guardar-borrador',
          popover: {
            title: 'Guardar Avances Manuales 💾',
            description: 'Te recomendamos hacer clic aquí periódicamente para salvar los datos de la sección actual antes de cambiar de sección o menú.',
            side: 'bottom',
            align: 'end'
          }
        })
      }

      if (document.querySelector('#tour-ayuda')) {
        stepsSubir.push({
          element: '#tour-ayuda',
          popover: {
            title: 'Ayuda y Tutoriales 💡',
            description: '¿Olvidaste cómo hacer algo? Haz clic en este icono de ayuda en cualquier momento para reiniciar este tutorial específico de la página.',
            side: 'bottom',
            align: 'end'
          }
        })
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(5, 10, 25, 0.75)',
        stageRadius: 12,
        popoverClass: 'driverjs-premium-theme',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido! 👍',
        steps: stepsSubir,
        onDestroyed: () => {
          if (typeof window !== 'undefined') {
            (window as any).__iedch_tour_active = false;
          }
          if (isAuto) {
            localStorage.setItem('iedch_subir_curso_tour_completed', 'true')
          }
        }
      })

      driverObj.drive()
      return
    }

    // Definición dinámica de pasos según lo que esté realmente presente en el DOM para el Dashboard / general
    const steps: any[] = [
      {
        popover: {
          title: '¡Te damos la bienvenida al Portal IEDCH! 🎓',
          description: 'Hemos preparado una guía interactiva rápida para mostrarte las acciones principales que puedes realizar. ¡Te tomará solo un minuto!',
          position: 'center'
        }
      }
    ]

    // 1. Enlace o Menú del Navbar
    if (document.querySelector('#tour-navbar-links')) {
      steps.push({
        element: '#tour-navbar-links',
        popover: {
          title: 'Panel de Navegación 🧭',
          description: 'Aquí encontrarás tus accesos directos principales. Como ' + 
            (rol === 'alumno' ? 'tus cursos activos, catálogos de materias y expedientes.' : 'tus cursos asignados, cuestionarios e ingresos financieros.'),
          side: 'bottom',
          align: 'start'
        }
      })
    }
    
    // Paso especial para profesores: Botón Subir Curso (si existe en Desktop o Móvil)
    const isProfesor = ['instructor', 'capacitador', 'institucion'].includes(rol.toLowerCase())
    const selectorSubirCurso = document.querySelector('#tour-subir-curso') ? '#tour-subir-curso' : (document.querySelector('#tour-subir-curso-movil') ? '#tour-subir-curso-movil' : null)
    if (isProfesor && selectorSubirCurso) {
      steps.push({
        element: selectorSubirCurso,
        popover: {
          title: 'Crear Nuevos Cursos ➕',
          description: '¡Comparte tu conocimiento! Haz clic aquí para acceder al formulario de creación donde podrás subir videos, exámenes, tareas, recursos y estructurar tu temario de forma sencilla.',
          side: 'bottom',
          align: 'center'
        }
      })
    }

    // 2. Campana de Notificaciones
    if (document.querySelector('#tour-notificaciones')) {
      steps.push({
        element: '#tour-notificaciones',
        popover: {
          title: 'Campana de Notificaciones 🔔',
          description: 'Mantente al día con notificaciones en tiempo real, alertas de exámenes, mensajes de instructores y avisos administrativos.',
          side: 'bottom',
          align: 'center'
        }
      })
    }

    // 3. Tarjeta de Cursos / Dashboard Principal (si está visible)
    if (document.querySelector('.course-card, #tour-dashboard-cursos')) {
      steps.push({
        element: document.querySelector('.course-card') ? '.course-card' : '#tour-dashboard-cursos',
        popover: {
          title: 'Gestión de Cursos 📚',
          description: 'Aquí se muestran tus materias activas. Puedes ver tu barra de progreso e ingresar para ver lecciones, tareas y exámenes haciendo clic en las tarjetas.',
          side: 'top',
          align: 'center'
        }
      })
    }

    // 4. Perfil de Usuario
    if (document.querySelector('#tour-perfil')) {
      steps.push({
        element: '#tour-perfil',
        popover: {
          title: 'Mi Perfil y Ajustes 👤',
          description: 'Configura tus datos personales, sube tu fotografía de perfil, gestiona tus métodos de pago y accede a la seguridad de tu cuenta.',
          side: 'bottom',
          align: 'end'
        }
      })
    }

    // 5. Botón de Ayuda
    if (document.querySelector('#tour-ayuda')) {
      steps.push({
        element: '#tour-ayuda',
        popover: {
          title: 'Reiniciar esta Guía 💡',
          description: '¿Olvidaste dónde estaba algo? No te preocupes. Puedes volver a iniciar este tutorial interactivo cuando quieras haciendo clic aquí.',
          side: 'bottom',
          align: 'end'
        }
      })
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(5, 10, 25, 0.75)',
      stageRadius: 12,
      popoverClass: 'driverjs-premium-theme',
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Comenzar 🚀',
      steps: steps,
      onDestroyed: () => {
        if (typeof window !== 'undefined') {
          (window as any).__iedch_tour_active = false;
        }
        // Al cerrar o terminar el tour, guardamos que ya se completó
        if (isAuto) {
          localStorage.setItem('iedch_onboarding_completed', 'true')
        }
      }
    })

    driverObj.drive()
  }

  if (!isMounted) return null

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --tour-accent: ${activeColors.accent};
        --tour-accent-hover: ${activeColors.hover};
        --tour-accent-light: ${activeColors.bg};
      }

      /* Contenedor principal del Popover */
      .driverjs-premium-theme.driver-popover {
        background-color: rgba(255, 255, 255, 0.94) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid var(--tour-accent-light) !important;
        border-radius: 18px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        padding: 20px !important;
        max-width: 330px !important;
        color: #1e293b !important;
      }

      /* Título del Popover */
      .driverjs-premium-theme .driver-popover-title {
        font-size: 16px !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        margin-bottom: 8px !important;
        line-height: 1.35 !important;
      }

      /* Descripción del Popover */
      .driverjs-premium-theme .driver-popover-description {
        font-size: 13.5px !important;
        color: #475569 !important;
        line-height: 1.55 !important;
        margin-bottom: 0 !important;
      }

      /* Botones de navegación */
      .driverjs-premium-theme .driver-popover-footer {
        margin-top: 18px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        border-top: 1px solid #f1f5f9 !important;
        padding-top: 12px !important;
      }

      .driverjs-premium-theme .driver-popover-navigation-btns {
        display: flex !important;
        gap: 6px !important;
      }

      /* Botón Siguiente / Completar */
      .driverjs-premium-theme .driver-popover-next-btn {
        background-color: var(--tour-accent) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 7px 14px !important;
        font-size: 12.5px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        text-shadow: none !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }

      .driverjs-premium-theme .driver-popover-next-btn:hover {
        background-color: var(--tour-accent-hover) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 10px -1px rgba(0, 0, 0, 0.15) !important;
      }

      /* Botón Anterior */
      .driverjs-premium-theme .driver-popover-prev-btn {
        background-color: transparent !important;
        color: #64748b !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 10px !important;
        padding: 7px 14px !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
      }

      .driverjs-premium-theme .driver-popover-prev-btn:hover {
        background-color: #f8fafc !important;
        color: #334155 !important;
        border-color: #94a3b8 !important;
      }

      /* Texto de progreso */
      .driverjs-premium-theme .driver-popover-progress-text {
        font-size: 11.5px !important;
        color: #94a3b8 !important;
        font-weight: 600 !important;
      }

      /* Flecha indicadora del Popover */
      .driverjs-premium-theme .driver-popover-arrow {
        border-color: rgba(255, 255, 255, 0.94) !important;
      }
      
      /* Animación del highlight del spotlight */
      .driverjs-active-element {
        box-shadow: 0 0 0 4px var(--tour-accent-light), 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        transition: box-shadow 0.2s ease !important;
      }
    ` }} />
  )
}
