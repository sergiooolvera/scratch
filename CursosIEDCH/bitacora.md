# Bitácora de Desarrollo - CursosIEDCH

## Fecha: 2026-08-31
### Tarea: Despliegue a Producción (Actualización de Firma en Constancias y Microcredenciales a "CEO. Juan Manuel de la luz Sierra")

#### Diagnóstico y Acciones:
- **Solicitud del Usuario:** Desplegar todos los cambios validados a producción.
- **Validación Previa:** Ejecutada y aprobada la suite completa de Playwright (**56 de 56 pruebas aprobadas al 100%**).
- **Gestión de Ramas Git:**
  1. Commit y push en la rama `staging` (`git push origin staging`).
  2. Merge en la rama `main` (`git checkout main`, `git merge staging`) y push a producción (`git push origin main`), activando el despliegue automático en Vercel.
  3. Retorno a la rama activa de desarrollo `staging` (`git checkout staging`).

### Tarea: Actualización de Nombre y Cargo en Constancias y Microcredenciales a "CEO. Juan Manuel de la luz Sierra"

#### Diagnóstico del Problema:
- **Requerimiento:** Modificar la firma y titulación de "Lic. Juan Manuel, De la luz Sierra" a "CEO. Juan Manuel de la luz Sierra" en todas las plantillas y documentos oficiales de constancias y microcredenciales del sistema.
- **Componentes Identificados:**
  1. [`components/ActividadConstanciaDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/ActividadConstanciaDocument.tsx): Constancias de actividades institucionales.
  2. [`components/CertificadoDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoDocument.tsx): Constancia Modelo 1 (predeterminado).
  3. [`components/CertificadoModelo2.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo2.tsx): Constancia Modelo 2.
  4. [`components/CertificadoModelo3.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo3.tsx): Constancia Modelo 3.
  5. [`components/MicrocredencialDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/MicrocredencialDocument.tsx): Reverso legal y firma de la microcredencial digital.

#### Acciones Realizadas:
1. **Actualización de Plantillas de Constancias y Microcredenciales:**
   - Se actualizó el texto de la firma en [`components/ActividadConstanciaDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/ActividadConstanciaDocument.tsx) a `CEO. Juan Manuel de la luz Sierra`.
   - Se actualizó la firma en [`components/CertificadoDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoDocument.tsx) a `CEO. Juan Manuel de la luz Sierra`.
   - Se actualizó la firma en [`components/CertificadoModelo2.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo2.tsx) a `CEO. Juan Manuel de la luz Sierra`.
   - Se actualizó la firma en [`components/CertificadoModelo3.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo3.tsx) a `CEO. Juan Manuel de la luz Sierra`.
   - Se actualizó el bloque de firma de Director General en el reverso de [`components/MicrocredencialDocument.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/MicrocredencialDocument.tsx) a `CEO. Juan Manuel de la luz Sierra`.
2. **Pruebas Automatizadas con Playwright:**
   - Se ampliaron las pruebas en [`e2e/certificates.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/certificates.spec.ts).
   - Se ejecutó la suite completa de Playwright (`npx playwright test`), obteniendo **56 de 56 pruebas aprobadas al 100%**.

### Tarea: Despliegue a Producción (Selector y Menú de Módulos Enfocados para Temario y Clases)

#### Diagnóstico y Acciones:
- **Solicitud del Usuario:** Desplegar todos los cambios validados a producción.
- **Validación Previa:** Ejecutada y aprobada la suite completa de Playwright (**55 de 55 pruebas aprobadas al 100%**).
- **Gestión de Ramas Git:**
  1. Commit y push en la rama `staging` (`git push origin staging`).
  2. Merge en la rama `main` (`git checkout main`, `git merge staging`) y push a producción (`git push origin main`), activando el despliegue automático en Vercel.
  3. Retorno a la rama activa de desarrollo `staging` (`git checkout staging`).

### Tarea: Selector y Menú de Módulos Enfocados para "Temario y Clases" (Subir y Editar Curso)

#### Diagnóstico del Problema:
- **Requerimiento:** Al gestionar cursos con múltiples módulos (10, 15 o más), la sección de "2. Temario y Clases" se volvía excesivamente larga y engorrosa en pantalla. Se solicitó un menú/combo y selector para poder elegir y trabajar enfocado en un solo módulo a la vez, con la opción de ver todos cuando sea necesario.
- **Análisis de Diseño (Grill-Me):**
  - Implementación de un selector dual: Combo desplegable superior con resumen contextual de cada módulo + barra de píldoras rápidas horizontales + botón de alternar "Modo Enfoque" / "Ver Todos".
  - Auto-selección y foco automático al presionar "+ Añadir Módulo".
  - Sincronización inteligente de índices al subir/bajar módulos y al eliminarlos.
  - Barra de navegación inferior contextual ("← Módulo Anterior", indicador "Módulo X de Y", "Siguiente Módulo →" / "Añadir Siguiente Módulo").
  - Validación con auto-enfoque: si falta un campo obligatorio en un módulo que no está actualmente visible en pantalla, el sistema cambia a la pestaña de módulos y enfoca el módulo correspondiente para alertar al profesor.

#### Acciones Realizadas:
1. **Creación de Curso ([`app/profesor/subir-curso/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)):**
   - Se añadió el estado `selectedModuloIdx` (`number | 'all'`).
   - Se integró el encabezado con selector desplegable estilizado (`#select-modulo-activo`), barra de píldoras con badges de contenido y actividades, y botón de cambio de vista (`#btn-toggle-modo-vista`).
   - Se implementó la renderización selectiva mediante `modulosParaMostrar` y la barra de navegación contextual inferior (`#btn-modulo-prev`, `#btn-modulo-next`).
   - Se conectó el auto-enfoque en las validaciones de `guardarCurso`.
2. **Edición de Curso ([`app/profesor/editar-curso/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/[id]/page.tsx)):**
   - Se incorporó la misma arquitectura de navegación enfocada y selector dual para cursos existentes.
   - Sincronización completa con los borradores automáticos y la persistencia de datos.
3. **Pruebas Automatizadas con Playwright ([`e2e/profesor-selector-modulos.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/profesor-selector-modulos.spec.ts)):**
   - Se crearon 4 pruebas E2E que validan la visualización del selector, adición con auto-foco, alternancia entre módulos vía píldoras/botones inferiores, y alternancia entre vista enfocada y vista general.
   - Se ejecutó la suite completa de Playwright (**55 de 55 pruebas aprobadas al 100%**).

### Tarea: Despliegue a Producción (Integración del número oficial de WhatsApp Business)

#### Diagnóstico y Acciones:
- **Solicitud del Usuario:** Desplegar todos los cambios validados a producción.
- **Validación Previa:** Ejecutada y aprobada la suite completa de Playwright (**51 de 51 pruebas aprobadas al 100%**).
- **Gestión de Ramas Git:**
  1. Push en la rama `staging` (`git push origin staging`).
  2. Merge en la rama `main` (`git checkout main`, `git merge staging`) y push a producción (`git push origin main`), activando el despliegue automático en Vercel.
  3. Retorno a la rama activa de desarrollo `staging` (`git checkout staging`).

### Tarea: Integración del número oficial de WhatsApp Business (729 818 4978)

#### Diagnóstico del Problema:
- **Requerimiento:** Implantar el número oficial de WhatsApp Business: `Tel: (729 818 4978)`.
- **Análisis:** 
  - El botón flotante (FAB) de WhatsApp en la landing page ([`components/landing/Testimonials.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Testimonials.tsx)) apuntaba a un enlace dummy `https://wa.me/5211234567890`.
  - El número en el footer ([`components/landing/Footer.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Footer.tsx)) era un texto estático que requería enlace directo interactivo a WhatsApp Business `https://wa.me/527298184978`.
  - En la vista de curso ([`app/cursos/[id]/CourseActions.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/[id]/CourseActions.tsx)), el modal de soporte carecía de acceso directo por WhatsApp.

#### Acciones Realizadas:
1. **Actualización de Botón Flotante (FAB):**
   - En [`components/landing/Testimonials.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Testimonials.tsx), se actualizó el enlace hacia `https://wa.me/527298184978`.
2. **Enlace Interactivo en Footer:**
   - En [`components/landing/Footer.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Footer.tsx), se convirtió el elemento de teléfono en un enlace interactivo directo a `https://wa.me/527298184978`.
3. **Botón de WhatsApp en Modal de Soporte del Curso:**
   - En [`app/cursos/[id]/CourseActions.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/[id]/CourseActions.tsx), se añadió un botón directo de WhatsApp Business (`+52 729 818 4978`) en la sección de dudas y soporte.
4. **Pruebas Automatizadas con Playwright:**
   - Se añadió una prueba E2E en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts) para validar la presencia del FAB, los enlaces y la información de contacto de WhatsApp Business.
   - Se ejecutó la suite completa de Playwright para garantizar cero regresiones.

### Tarea: Despliegue a Producción (Eliminación de Beneficios y Reordenamiento de Formularios de Cursos)

#### Diagnóstico y Acciones:
- **Solicitud del Usuario:** Desplegar todos los cambios validados a producción.
- **Validación Previa:** Ejecutada y aprobada la suite de Playwright (**100% aprobada**).
- **Gestión de Ramas Git:**
  1. Commit y push en la rama `staging` (`git push origin staging`).
  2. Merge en la rama `main` (`git checkout main`, `git merge staging`) y push a producción (`git push origin main`), activando el despliegue automático en Vercel.
  3. Retorno a la rama activa de desarrollo `staging` (`git checkout staging`).

### Tarea: Reordenamiento de Campos Principales en Formularios de Cursos (1. Título, 2. Descripción, 3. Temario, 4. Competencias)

#### Diagnóstico del Problema:
- **Requerimiento:** Establecer una secuencia lógica y fluida de llenado para el docente al crear y editar cursos:
  1) Título del curso
  2) Descripción del curso
  3) Temario (Módulos y temas)
  4) Competencias (Competencias pedagógicas estructuradas)

#### Acciones Realizadas:
1. **Reorganización en Crear Curso ([`app/profesor/subir-curso/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)):**
   - Se reubicó el componente `TemarioEditor` para posicionarse inmediatamente después del campo de `Descripción Completa` y antes de `CompetenciasEditor`.
2. **Reorganización en Editar Curso ([`app/profesor/editar-curso/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/[id]/page.tsx)):**
   - Se adaptó la misma estructura secuencial (Título -> Descripción -> Temario -> Competencias).
3. **Reorganización en Auditoría de Administración ([`app/admin/cursos/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/admin/cursos/page.tsx)):**
   - Se ajustó el orden de comparación de borradores para reflejar esta jerarquía.
4. **Pruebas Automatizadas con Playwright:**
   - Se creó una prueba específica en [`e2e/instructor.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/instructor.spec.ts) para validar el orden exacto de los campos en el formulario.

### Tarea: Eliminación de la sección redundante "Beneficios / ¿Qué aprenderá el alumno?" en Crear y Editar Cursos

#### Diagnóstico del Problema:
- **Contexto:** El formulario de creación (`/profesor/subir-curso`) y edición (`/profesor/editar-curso/[id]`) mantenía un campo libre textarea para "Beneficios / ¿Qué aprenderá el alumno?".
- **Problema:** Dicho campo resultaba redundante tras la implementación del módulo pedagógico de "Competencias a desarrollar" (con taxonomía de Bloom y estructuración por filas) y contenía validaciones requeridas que bloqueaban el guardado si no se llenaba dicho campo.

#### Acciones Realizadas:
1. **Eliminación de la UI en Crear y Editar Curso:**
   - Se removió el elemento `<textarea name="beneficios" ... />` y su etiqueta correspondiente en [`app/profesor/subir-curso/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx).
   - Se removió el elemento `<textarea name="beneficios" ... />` y su etiqueta correspondiente en [`app/profesor/editar-curso/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/[id]/page.tsx).
2. **Eliminación de Validaciones Bloqueantes:**
   - Se suprimió la comprobación `if (!formData.beneficios?.trim())` tanto en la creación de cursos como en la actualización de propuestas/borradores de edición.
3. **Pruebas Automatizadas con Playwright:**
   - Se incorporó la prueba de regresión en [`e2e/instructor.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/instructor.spec.ts) para verificar la ausencia del campo redundante y validar el correcto funcionamiento del formulario del profesor.

### Tarea: Resaltar opción de Registro ("Regístrate gratis ahora") en la vista de Login (`/login`)

#### Diagnóstico del Problema:
- **Requerimiento:** El usuario solicitó hacer más llamativo y visible el enlace de "¿No tienes cuenta? Regístrate gratis ahora" en la pantalla de inicio de sesión para mejorar el registro de alumnos.
- **Implementación previa:** Era un párrafo de texto simple con un enlace azul (`text-blue-600`) alineado debajo del título, que se perdía visualmente.

#### Acciones Realizadas:
1. **Rediseño de Enlace a Botón Secundario en [`app/login/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/login/page.tsx):**
   - Se transformó el párrafo original por un contenedor interactivo (`Link`) con comportamiento de botón destacado secundario.
   - Se configuró un fondo azul muy suave (`bg-blue-50`), borde sutil (`border-blue-200`), esquinas redondeadas (`rounded-xl`), y padding adecuado para simular una tarjeta interactiva.
   - Se añadió el icono `ArrowRight` a la derecha con un efecto hover animado (`group-hover:translate-x-1 transition-transform`) y cambio de fondo interactivo (`hover:bg-blue-100/80`) para incentivar la acción de registro.
2. **Pruebas Automatizadas con Playwright:**
   - Se ejecutó la suite de autenticación de Playwright (`npx playwright test e2e/auth.spec.ts`), validando con éxito las 4 pruebas del módulo (100% aprobadas).

## Fecha: 2026-08-29
### Tarea: Corrección de Visualización Responsiva en iPad / Tablets para la Sección "Valoraciones y opiniones" (`/cursos/[id]`)

#### Diagnóstico del Problema:
- **Causa Raíz:** En [`app/cursos/[id]/CourseReviews.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseReviews.tsx), se estaban utilizando clases de Tailwind no válidas (`lg:col-span-3.5` y `lg:col-span-8.5`).
- Al no ser clases nativas de Tailwind, el compilador de CSS las ignoraba. En pantallas con resolución `lg` (1024px, como iPads en horizontal o portátiles compactos), el contenedor padre creaba una cuadrícula de 12 columnas (`lg:grid-cols-12`) y, por defecto de CSS Grid, cada elemento hijo sin `col-span` tomaba un ancho de 1 columna (`span 1` de 12, es decir, ~8.3% del contenedor).
- Esto provocaba que tanto el bloque de calificación promedio como el bloque de las 3 tarjetas de opiniones quedaran comprimidos en columnas de ~80px en el extremo izquierdo de la tarjeta, rompiendo los textos en columnas verticales y dejando el 80% restante de la tarjeta en blanco.

#### Acciones Realizadas:
1. **Corrección de Clases Grid en [`CourseReviews.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseReviews.tsx):**
   - Se reemplazó `lg:col-span-3.5` por `lg:col-span-4 xl:col-span-3`.
   - Se reemplazó `lg:col-span-8.5` por `lg:col-span-8 xl:col-span-9`.
   - Se ajustó la distribución responsiva interna (`flex flex-col sm:flex-row lg:flex-col xl:flex-row` en la tarjeta de promedio y `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` en las tarjetas de reseñas con `min-w-0` y `truncate`), garantizando una lectura fluida en móviles, tabletas (iPad vertical/horizontal) y escritorios.
2. **Pruebas Automatizadas con Playwright:**
   - Se añadió la prueba E2E de validación de vista iPad / tablet en [`e2e/curso-detalle-redesign.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/curso-detalle-redesign.spec.ts) para resoluciones de 1024x768 y 768x1024.
   - Se ejecutó la suite completa de Playwright (`npx playwright test`), pasando con éxito las **48 de 48 pruebas** (100% aprobadas).
3. **Despliegue a Producción:**
   - Se realizó commit y push en la rama `staging`.
   - Se fusionó `staging` en `main` y se envió (`git push origin main`), activando el despliegue automático en producción en Vercel.
   - Se regresó el entorno de trabajo a la rama activa `staging`.

## Fecha: 2026-08-28
### Tarea: Despliegue a Producción del Rediseño Integral de Cursos (`/cursos/[id]`)

#### Diagnóstico y Acciones:
- **Solicitud del Usuario:** Desplegar todos los cambios validados a producción.
- **Validación Previa:** Ejecutada y aprobada la suite completa de Playwright (**47 de 47 pruebas superadas**, 100% verde).
- **Gestión de Ramas Git:**
  1. Commit y push de todos los componentes nuevos, pruebas E2E y refactorizaciones en la rama `staging` (`git push origin staging`).
  2. Cambio a la rama `main` (`git checkout main`), merge directo de `staging` (`git merge staging`) y push a producción (`git push origin main`), activando el build y despliegue automático en Vercel.
  3. Retorno a la rama activa de desarrollo `staging` (`git checkout staging`).

## Fecha: 2026-08-27
### Tarea: Rediseño integral de la página de información y venta del curso (`/cursos/[id]`)

#### Diagnóstico y Requerimiento:
- **Objetivo:** Modernizar la presentación visual de los cursos convirtiendo la página de detalle (`/cursos/[id]`) en una landing page de alta conversión profesional y limpia basada en el diseño de referencia.
- **Ajustes Pixel-Perfect:**
  1. Grid central de **3 columnas en 1 sola fila horizontal**: `Temario del curso` (con numeración circular 01, 02... y botón `Ver temario completo ∨`), `Competencias que desarrollarás` (con checklist y diana morada), e `Instructor` (con enlace "Ver perfil ↗", avatar interactivo y modal completo de perfil académico y profesional del docente).
  2. Hero superior con badges outline de `Duración`, `Modalidad` y `Constancia con valor curricular verificable`, junto a la tarjeta de portada limpia (se removió el botón flotante "Ver presentación del curso" para una visualización más despejada de la portada).
  3. Sección de `Valoraciones y opiniones`, `Así obtienes tu constancia verificable` y `Explorar todos los cursos` reorganizadas a **ancho completo de pantalla (Full Width)** justo debajo del bloque de compra/hero, aprovechando al máximo el espacio horizontal disponible para los comentarios y diagramas.
  4. Sección horizontal de `Así obtienes tu constancia verificable` con 5 pasos conectados con flechas `→`.
  5. Banner inferior morado intenso `Explorar todos los cursos` ubicado al final de la columna de contenido.
  6. Panel lateral sticky con precio `$399 MXN`, 4 botones de pago (`Pagar con Tarjeta / OXXO`, `Pagar con Transferencia`, `Reportar Pago Oxxo`, `Tengo un Cupón`) configurados para redirigir a `/login?next=/cursos/[id]` si el usuario no ha iniciado sesión, preservando la navegación pública.

#### Acciones Realizadas:
1. **Creación de Componentes Modulares:**
   - [`app/cursos/[id]/CourseHero.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseHero.tsx): Hero superior con badges y botón de desplazamiento interactivo.
   - [`app/cursos/[id]/CourseSyllabus.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseSyllabus.tsx): Componente interactivo para el temario del curso con soporte de módulos, temas y botón de expandir/colapsar.
   - [`app/cursos/[id]/CourseCompetencies.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseCompetencies.tsx): Visualizador estilizado de competencias clave.
   - [`app/cursos/[id]/CourseInstructorCard.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseInstructorCard.tsx): Tarjeta de perfil del instructor con datos de `ie_profiles` y badge verificado EGAC.
   - [`app/cursos/[id]/CourseProcessSteps.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseProcessSteps.tsx): Diagrama horizontal de 5 pasos para la obtención de constancias con valor curricular.
   - [`app/cursos/[id]/ExploreBanner.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/ExploreBanner.tsx): Banner inferior de call-to-action hacia el catálogo.
2. **Refactorización de Vistas Existentes:**
   - [`app/cursos/[id]/CourseReviews.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseReviews.tsx): Tarjeta de promedio, barras de progreso, tarjetas de testimonios y modal interactivo para leer todas las opiniones y calificar.
   - [`app/cursos/[id]/CourseActions.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseActions.tsx): Panel lateral sticky con los 4 métodos de pago, badges de seguridad, modal de ejemplo de constancia institucional y preguntas frecuentes, así como accesos para alumnos inscritos.
   - [`app/cursos/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx): Ensamblado general del layout de 2 columnas responsivo con carga de perfiles de instructores y metadatos SEO/OpenGraph.
3. **Pruebas Automatizadas con Playwright (E2E):**
   - Se creó [`e2e/curso-detalle-redesign.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/curso-detalle-redesign.spec.ts) para validar el renderizado del Hero, Grid de Temario/Competencias/Instructor, Valoraciones, 5 pasos, Banner inferior, modales y acciones de compra.
   - Se validaron con éxito las pruebas específicas (`npx playwright test e2e/curso-detalle-redesign.spec.ts`) y la suite completa de Playwright.

## Fecha: 2026-08-21
### Tarea: Resolución de Error de Build ("Import map: aliased to relative './components/landing/Testimonials'")

#### Diagnóstico del Problema:
- **Causa Raíz:** En `app/page.tsx` se importó el componente `Testimonials` (y otros componentes de la landing) mediante `@/components/landing/Testimonials`.
- Los nuevos archivos de componentes en `components/landing/`, las imágenes en `public/images/` y las pruebas E2E en `e2e/landing.spec.ts` fueron creados localmente pero estaban como **archivos sin rastrear (untracked files)** en Git.
- Al intentar ejecutar la compilación remota / despliegue en Vercel o desde el repositorio remoto, Next.js no encontraba la ruta del módulo `components/landing/Testimonials` al no estar commiteados en el repositorio.

#### Acciones Realizadas:
1. **Verificación de Compilación Local:** Se ejecutó `npm run build` localmente y la compilación de Next.js finalizó exitosamente.
2. **Ajuste de Pruebas E2E (Playwright):**
   - Se ajustó el selector del logo en [`e2e/courses.spec.ts`](file:///C:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/courses.spec.ts) a `img[alt*="Logo"]` para coincidir con `alt="Logo EGAC"`.
   - Se ejecutaron las pruebas E2E con `npx playwright test`, validando que las 28 pruebas pasaron sin ningún error.
3. **Instrucciones para Despliegue:**
   - Agregar los archivos a Git (`git add components/landing/ public/images/ e2e/landing.spec.ts`).
   - Confirmar los cambios con commit y push a la rama `staging`.

## Fecha: 2026-08-24
### Tarea: Corrección de error de React "Rules of Hooks" al navegar a Iniciar Sesión desde el Navbar

#### Diagnóstico del Problema:
- **Causa Raíz:** En `components/Navbar.tsx`, la sentencia condicional `if (pathname === '/') return null;` se ejecutaba en la línea 24, **antes** de la invocación de `useEffect(...)` en la línea 26.
- Al cargar la página principal `/`, `Navbar` retornaba `null` sin invocar `useEffect`. Al hacer clic en "Iniciar Sesión" y navegar a `/login`, la condición era falsa y React procedía a ejecutar `useEffect`, provocando un cambio en el número y orden de Hooks ejecutados entre renderizados y haciendo colapsar la app con el error "React has detected a change in the order of Hooks called by Navbar".

#### Acciones Realizadas:
1. **Refactorización de Navbar:** Se movió la instrucción `if (pathname === '/') return null;` hacia el final del componente [components/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx), justo antes del `return (...)` principal. De esta manera, todos los hooks (`useState`, `useEffect`) son ejecutados incondicionalmente en cada renderizado.
2. **Pruebas E2E (Playwright):**
   - Se añadió una prueba E2E en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts) para simular la navegación desde la página principal `/` hacia `/login` mediante el botón "Iniciar Sesión".
   - Se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts` y `npx playwright test e2e/auth.spec.ts`, pasando el 100% de las pruebas exitosamente.

### Tarea: Redirección correcta desde el modal "¿Cómo quieres participar?" a los formularios de registro de Instructor y Organización

#### Diagnóstico del Problema:
- **Causa Raíz:** En [components/landing/CourseModal.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/CourseModal.tsx), ambas opciones ("Soy Instructor" y "Soy Institución") apuntaban a `href="/login"` en lugar de dirigir al formulario de registro correspondiente.
- La página de registro [app/register/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/register/page.tsx) procesa el parámetro de URL `type`: `type=instructor` activa el formulario y tema de Instructor, mientras que `type=institucion` activa el formulario y tema de Organización.

#### Acciones Realizadas:
1. **Actualización de Enlaces en CourseModal:**
   - Se cambió el enlace del botón "Soy Instructor" a `/register?type=instructor`.
   - Se cambió el enlace del botón "Soy Institución" a `/register?type=institucion`.
2. **Pruebas E2E (Playwright):**
   - Se actualizaron las aserciones en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts) para verificar que los enlaces dentro del modal tengan los atributos `href` correctos hacia `/register?type=instructor` y `/register?type=institucion`.
   - Se ejecutaron y pasaron exitosamente las pruebas de Playwright con `npx playwright test e2e/landing.spec.ts`.

### Tarea: Vinculación de la tarjeta "Verifica la autenticidad de tu constancia" a la sección de validaciones (/validar)

#### Diagnóstico del Problema:
- **Causa Raíz:** En [components/landing/HeroSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/HeroSection.tsx), la tarjeta de "Verifica la autenticidad de tu constancia" estaba maquetada como un `div` estático con la clase `cursor-pointer`, pero carecía de funcionalidad de navegación o enlace `Link`.

#### Acciones Realizadas:
1. **Conversión a Link Interactivo:**
   - Se importó `Link` de `next/link` en [HeroSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/HeroSection.tsx).
   - Se reemplazó el contenedor `div` por un componente `<Link href="/validar" ...>` para dirigir a los usuarios a la página de validación de constancias.
2. **Pruebas E2E (Playwright):**
   - Se agregó la prueba `Debe navegar a la página de validación de constancia desde la tarjeta del Hero` en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts).
   - Se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts`, pasando 4 de 4 pruebas exitosamente.

### Tarea: Población dinámica y completa del combobox de categorías en la barra de búsqueda de la Landing Page

#### Diagnóstico del Problema:
- **Causa Raíz:** En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), la barra de búsqueda contenía un elemento `<select>` con solo la opción estática `<option>Todas las categorías</option>`.

#### Acciones Realizadas:
1. **Población Completa de Categorías:**
   - Se definieron todas las categorías estándar de la plataforma (Salud, Negocios, Tecnología, Desarrollo Personal, Idiomas, Arte y Diseño, Ciencias, Educación).
   - Se agregó la consulta a Supabase para obtener dinámicamente cualquier otra categoría única registrada en la tabla `ie_cursos`.
   - Se convirtió la barra de búsqueda en un formulario interactivo `<form action="/dashboard" method="GET">` con el select `<select name="category">`, permitiendo filtrar cursos directamente al presionar "Buscar".
2. **Optimización del Filtrado en Dashboard:**
   - Se mejoró el filtrado por categoría en [app/dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx) para hacerlo insensible a mayúsculas/minúsculas y compatible con las claves de categorías.
3. **Pruebas E2E (Playwright):**
   - Se añadió el test `Debe mostrar todas las opciones de categorías en el combobox del buscador` en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts).
   - Se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts`, pasando las 5 pruebas exitosamente.

### Tarea: Consulta e información pública de cursos desde la búsqueda sin requerir Inicio de Sesión obligatorio

#### Diagnóstico del Problema:
- **Causa Raíz:** Al presionar "Buscar" en el buscador de la landing page, el formulario apuntaba a `action="/dashboard"`. Dado que `/dashboard` está protegido y requiere un usuario autenticado, Middleware redirigía a usuarios invitados a `/login`.
- Requisito del usuario: Buscar o consultar la información de un curso debe ser una experiencia totalmente pública; el inicio de sesión únicamente debe ser requerido cuando el usuario decide inscribirse o realizar el pago.

#### Acciones Realizadas:
1. **Creación del Catálogo Público de Cursos (`/cursos`):**
   - Se implementó la página [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx) como un Client Component interactivo con `Suspense`.
   - Permite a usuarios sin autenticación buscar términos (`q`) y filtrar categorías (`category`) de forma 100% pública.
   - Presenta las tarjetas de los cursos con botón **"Ver información"**, dirigiendo a [`/cursos/[id]`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx) donde se muestra la ficha completa del curso (temario, descripción, instructor, precio) sin login.
2. **Reorientación del Buscador de la Landing Page:**
   - En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), se modificó el `form action` de `/dashboard` a `/cursos`.
3. **Flujo de Autenticación al Inscribir/Comprar:**
   - En [app/cursos/[id]/CourseActions.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseActions.tsx), se aseguró que la redirección a `/login?redirect=/cursos/[id]` ocurra estrictamente cuando el usuario decide presionar los botones de inscripción o pago ("Inscribirse Gratis", "Pagar con Tarjeta/Oxxo", etc.).
4. **Pruebas E2E (Playwright):**
   - Se agregó el test `Debe realizar la búsqueda de cursos públicamente sin pedir inicio de sesión` en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts).
   - Se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts`, superando las 6 pruebas exitosamente (15.2s).

### Tarea: Configuración de dominios de imágenes remotos en Next.js para Supabase Storage

#### Diagnóstico del Problema:
- **Causa Raíz:** Al renderizar portadas subidas por usuarios a Supabase Storage (`jbwqedyepptuasrfawqj.supabase.co`), Next.js arrojaba `Runtime Error: Invalid src prop` al no contar con el hostname registrado en `next.config.ts`.

#### Acciones Realizadas:
1. **Configuración de Remote Patterns:**
   - En [next.config.ts](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/next.config.ts), se agregó `images.remotePatterns` especificando los dominios `**.supabase.co`, `jbwqedyepptuasrfawqj.supabase.co`, `lh3.googleusercontent.com` y `avatars.githubusercontent.com`.
2. **Renderizado Resiliente de Imágenes:**
   - En [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx), se utilizó renderizado de imagen adaptable para prevenir errores runtime ante cualquier URL remota dinámica.
3. **Verificación:**
   - Se compiló exitosamente la aplicación con `npx next build` y se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts` (6 pasadas de 6).

### Tarea: Eliminación de espacio en blanco excesivo en las tarjetas de cursos en Cursos Populares y Catálogo

#### Diagnóstico del Problema:
- **Causa Raíz:** 
  1. En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), el contenedor flex principal `flex flex-col xl:flex-row gap-6` provocaba que la cuadrícula de tarjetas se estirara verticalmente para igualar la altura del banner lateral "AVAL ACADÉMICO".
  2. Cada tarjeta poseía `h-full` y los títulos tenían una altura mínima forzada `min-h-[3rem]`, lo cual dejaba un gran hueco blanco vacío entre la etiqueta "Constancia + Microcredencial" y la sección inferior del precio y botón "Ver curso".
  3. No se estaba mostrando la descripción corta del curso (`course.descripcion`) en las tarjetas de la sección popular.

#### Acciones Realizadas:
1. **Ajuste de Maquetación y Flexbox en PopularCourses:**
   - Se añadió `items-start` al contenedor `flex flex-col xl:flex-row gap-6 items-start` para evitar que la fila estire artificialmente las tarjetas.
   - Se removió `h-full` rígido y `min-h-[3rem]` del título para permitir que las tarjetas ajusten su altura según el contenido de forma armónica.
   - Se integró la descripción del curso (`course.descripcion`) con `line-clamp-2` para aprovechar el espacio de forma estética e informativa.
   - Se añadió una línea divisoria `border-t border-gray-100` sobre la barra de precio e inscripción en la tarjeta.
   - Se ajustó el padding interno y tamaño del icono en el banner "AVAL ACADÉMICO" (`p-6 sm:p-8`, `w-16 h-16 sm:w-20 sm:h-20`) para un balance visual perfecto.
2. **Optimizaciones Armónicas en Catálogo de Cursos (`app/cursos/page.tsx`):**
   - Se removió `min-h-[3rem]` en los títulos de [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx) y se distribuyó el contenido de las tarjetas con `flex flex-col flex-grow justify-between`.
3. **Pruebas E2E (Playwright):**
   - Se ejecutaron las pruebas E2E con `npx playwright test` validando que todos los flujos continúan pasando sin regresiones.

### Tarea: Obtención dinámica de Imágenes y Duración desde BD con Fallback /mundo.jpeg

#### Diagnóstico del Problema:
- **Causa Raíz:** 
  1. La duración mostrada en las tarjetas de la landing page estaba harcodeada como `"20 HRS"`, sin consultar la columna `duracion` de la tabla `ie_cursos` de Supabase.
  2. Al no contar con `imagen_url`, se estaban utilizando imágenes de portada temporales (`/images/cover_bg_...`) en lugar del asset por defecto acordado (`/mundo.jpeg`).

#### Acciones Realizadas:
1. **Actualización de Consultas a Supabase:**
   - En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx) y [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx), se incluyó el campo `duracion` dentro del `.select(...)` de la tabla `ie_cursos`.
2. **Formateo Dinámico de Duración e Imagen Fallback:**
   - Se creó una función helper `formatBadgeDuracion` para extraer y formatear la duración de la base de datos (p. ej. `"20 HRS"`, `"1 HR"`, etc.).
   - Se estableció `/mundo.jpeg` (`public/mundo.jpeg`) como la imagen por defecto para cualquier curso que no tenga un `imagen_url` definido en la base de datos.
3. **Pruebas E2E (Playwright):**
   - Se ejecutaron las pruebas automatizadas para asegurar la integridad de la landing page y el catálogo público.

### Tarea: Redirección del botón "Explorar todos los cursos" al catálogo público (/cursos)

#### Diagnóstico del Problema:
- **Causa Raíz:** 
  1. En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), el enlace del botón *"Explorar todos los cursos"* apuntaba a `href="/dashboard"`.
  2. Al no estar autenticado, la ruta protegida `/dashboard` activaba la redirección de Middleware hacia `/login`.

#### Acciones Realizadas:
1. **Actualización de Ruta en PopularCourses:**
   - Se cambió el destino del enlace de `href="/dashboard"` a `href="/cursos"` para dirigir a los usuarios al catálogo público interactivo.
2. **Pruebas E2E (Playwright):**
   - Se añadió el test `Debe navegar a la vista pública de cursos al hacer clic en Explorar todos los cursos` en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts).
   - Se ejecutaron y pasaron exitosamente las 7 pruebas de la landing page.

### Tarea: Corrección de enlaces rotos y desactualizados en el pie de página (Footer)

#### Diagnóstico del Problema:
- **Causa Raíz:** 
  1. En [components/landing/Footer.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Footer.tsx), los enlaces de *"Catálogo de Cursos"* y *"Validar Constancia"* apuntaban a identificadores hash inactivos (`#cursos`, `#validacion`).
  2. El enlace de *"Aviso de Privacidad"* apuntaba a una URL obsoleta (`/privacidad-alaolla.html`) y *"Términos y Condiciones"* apuntaba a `#`.

#### Acciones Realizadas:
1. **Actualización de Enlaces en Footer:**
   - *"Catálogo de Cursos"* -> `/cursos`
   - *"Validar Constancia"* -> `/validar`
   - *"Inicio"* -> `/`
   - *"Aviso de Privacidad"* -> `/legal/aviso-privacidad`
   - *"Términos y Condiciones"* -> `/legal/terminos-uso`
2. **Pruebas E2E (Playwright):**
   - Se añadió el test `Debe contener enlaces válidos y funcionales en el Footer` en [`e2e/landing.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts).
   - Se ejecutaron las pruebas con `npx playwright test e2e/landing.spec.ts` (8 pruebas superadas con éxito).

### Tarea: Integración de las Secciones Nosotros, Preguntas Frecuentes y Contacto desde IEDCH2

#### Diagnóstico del Problema:
- **Requisito:** La landing page de `CursosIEDCH` carecía de los componentes interactivos de las secciones **Nosotros**, **Preguntas Frecuentes (FAQ)** y **Contacto** provenientes del diseño del proyecto `IEDCH2`.

#### Acciones Realizadas:
1. **Creación del Componente NosotrosSection (`#nosotros`):**
   - Implementación del componente [components/landing/NosotrosSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/NosotrosSection.tsx).
   - Incorporación de la Misión, Visión, Valores (*Innovación, Excelencia, Integridad, Humanismo, Colaboración*), Cultura Organizacional y Ecosistema EGAC.
   - Diseño de la Placa Institucional con datos oficiales (Fundación 10 de diciembre de 2020, Escritura Pública 14,525, Metepec Mex y RFC `IEE201210KE1`).
2. **Creación del Componente FAQSection (`#faq`):**
   - Implementación del componente [components/landing/FAQSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/FAQSection.tsx).
   - Incorporación de la barra de búsqueda interactiva en tiempo real por palabras clave.
   - Alternador por tipo de usuario (*Portal Alumnos* vs *Instructores y Organizaciones*) y acordeones desplegables categorizados.
3. **Creación del Componente ContactSection (`#contacto`):**
   - Implementación del componente [components/landing/ContactSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/ContactSection.tsx).
   - Formulario interactivo de envío de mensajes con validación y confirmación visual.
   - Tarjetas de información oficiales de soporte (`soporte@grupoegac.com`, WhatsApp Business `+52 729 818 4978` y horarios de atención).
4. **Integración en la Landing Page Principal (`app/page.tsx`):**
   - Renderizado secuencial de `<NosotrosSection />`, `<FAQSection />` y `<ContactSection />` en [app/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/page.tsx).
5. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts`):**
   - Adición de 3 pruebas E2E para verificar el despliegue de la Placa de Respaldo, la funcionalidad del filtro en FAQ y la interacción del formulario de contacto.
   - Ejecución y validación exitosa de las 11 pruebas del suite (`npx playwright test e2e/landing.spec.ts`, 100% aprobadas en 18.4s).

### Tarea: Refactorización a Páginas Independientes (`/nosotros`, `/preguntas-frecuentes`, `/contacto`)

#### Diagnóstico del Problema:
- **Preferencia del Usuario:** En lugar de incrustar todas las secciones en una sola página de aterrizaje tipo One-Page con anclajes hash, se solicitó separar cada sección en su propia página/ruta independiente dentro de Next.js.

#### Acciones Realizadas:
1. **Creación de Rutas Independientes:**
   - **`/nosotros`**: Implementación de [app/nosotros/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/nosotros/page.tsx) con la información institucional, Misión, Visión, Valores y la Placa de Respaldo Institucional.
   - **`/preguntas-frecuentes`**: Implementación de [app/preguntas-frecuentes/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/preguntas-frecuentes/page.tsx) con la barra de búsqueda en tiempo real, filtro por portal y acordeones.
   - **`/faq`**: Implementación de [app/faq/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/faq/page.tsx) como alias de redirección hacia `/preguntas-frecuentes`.
   - **`/contacto`**: Implementación de [app/contacto/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/contacto/page.tsx) con el formulario interactivo y tarjetas de atención directa.
2. **Actualización de Navegación (Navbar & Footer):**
   - En [components/landing/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Navbar.tsx), se cambiaron los enlaces a rutas directas (`/`, `/nosotros`, `/preguntas-frecuentes`, `/contacto`) y se implementó `usePathname()` para resaltar dinámicamente la pestaña activa.
   - En [components/landing/Footer.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Footer.tsx), se actualizaron los enlaces del pie de página hacia las nuevas rutas independientes.
3. **Limpieza de la Página Principal (`app/page.tsx`):**
   - Se removió el renderizado inline en [app/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/page.tsx) para mantener la vista limpia enfocada en Hero, Cursos Populares y Testimonios.
4. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts`):**
   - Se actualizaron las pruebas E2E para validar la carga de cada ruta independiente y la navegación fluida a través del Navbar.
   - Resultado de ejecución: **12 passed (24.8s)**, 100% de pruebas superadas exitosamente.
5. **Ocultación del Navbar secundario del Portal:**
   - En [components/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx), se incluyeron las rutas públicas (`/nosotros`, `/preguntas-frecuentes`, `/faq`, `/contacto`) en la lista de exclusión `landingRoutes` para que el Navbar secundario blanco ("EGAC | PORTAL") no se renderice superpuesto en ninguna de las páginas públicas.

### Tarea: Exclusión de Cursos de Prueba del Usuario `maestro@iedch.com` en Vistas Públicas

#### Diagnóstico del Problema:
- **Requisito del Usuario:** Los cursos de prueba/demo creados o editados por la cuenta `maestro@iedch.com` (`f160fe4d-5461-44c5-b868-51f1f0cae4c2`), como "BioMecanica" y "ALIMENTOS", aparecían públicamente en la sección "Cursos populares" y en el catálogo público `/cursos`.

#### Acciones Realizadas:
1. **Filtrado en Cursos Populares (`PopularCourses.tsx`):**
   - En [components/landing/PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), se aplicó el filtro de consulta `.neq('creado_por', 'f160fe4d-5461-44c5-b868-51f1f0cae4c2')` a la tabla `ie_cursos` para que únicamente se muestren los 4 mejores cursos profesionales de la plataforma.
2. **Filtrado en Catálogo Público (`app/cursos/page.tsx`):**
   - En [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx), se añadió la exclusión `.neq('creado_por', 'f160fe4d-5461-44c5-b868-51f1f0cae4c2')` en la consulta principal de Supabase.
3. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts`):**
   - Se validaron nuevamente las 12 pruebas del suite de Playwright (`npx playwright test e2e/landing.spec.ts`), obteniendo un resultado limpio de **12 passed (19.9s)**.

### Tarea: Configuración de la Imagen de Fondo en el Hero Section

#### Diagnóstico del Problema:
- **Requisito del Usuario:** Integrar la imagen corporativa `/cover_bg_1_mexican.png` como fondo de la sección principal Hero (`HeroSection.tsx`).

#### Acciones Realizadas:
1. **Actualización de HeroSection (`HeroSection.tsx`):**
   - En [components/landing/HeroSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/HeroSection.tsx), se incorporó el componente `<Image src="/cover_bg_1_mexican.png" fill ... />` con `opacity-35` y un degradado suave de fondo `from-[#0b1b36] via-[#0b1b36]/80 to-[#0b1b36]/60`.
   - Permite apreciar el diseño de fondo mientras mantiene una legibilidad y contraste óptimos para los textos, botones e indicadores del Hero.
2. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts`):**
   - Se ejecutaron las pruebas automatizadas (`npx playwright test e2e/landing.spec.ts`), aprobando **12 de 12 pruebas (19.7s)**.

### Tarea: Redirección del Cierre de Sesión y Enlaces de Inicio a la Raíz (`/`)

#### Diagnóstico del Problema:
- **Requisito del Usuario:** El evento de cierre de sesión (`SIGNED_OUT`), el clic en el Logo del portal y el icono de Inicio deben dirigir a la raíz del sitio `http://localhost:3000/` (o dominio de producción), en lugar de enviar a `http://localhost:3000/login`.

#### Acciones Realizadas:
1. **Redirección de Cierre de Sesión en Navbar (`components/Navbar.tsx`):**
   - En [components/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx), se cambió `router.push('/login')` por `router.push('/')` en el manejador `SIGNED_OUT`.
2. **Actualización de Enlaces en Logo e Icono de Inicio:**
   - Se actualizó el enlace del Logo del portal a `<Link href="/">` en [components/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx).
   - Se actualizó el botón con icono de Inicio (Home) a `<Link href="/">`.
3. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts` & `e2e/auth.spec.ts`):**
   - Se modificó `handleLogout` y el evento `SIGNED_OUT` en [components/Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) para utilizar `window.location.href = '/'`. Esto evita que el `middleware.ts` intercepte una reevaluación no autenticada de `/dashboard` y la redirija a `/login`.
   - Se validaron los suites completos (`npx playwright test e2e/landing.spec.ts e2e/auth.spec.ts`), superando las **16 pruebas al 100% (31.7s)**.

### Tarea: Integración de los Enlaces Oficiales de Redes Sociales desde `IEDCH2`

#### Diagnóstico del Problema:
- **Requisito del Usuario:** Actualizar los botones y accesos a redes sociales utilizando las URLs oficiales del proyecto `IEDCH2`.

#### Acciones Realizadas:
1. **Actualización de Enlaces en Footer y Contacto:**
   - **Facebook:** `https://www.facebook.com/share/1ATRDoAfoQ/?mibextid=wwXIfr`
   - **Instagram:** `https://www.instagram.com/academy_egac?igsh=MW82OTczb2hoamI5bw%3D%3D&utm_source=qr`
   - **WhatsApp Business:** `https://wa.me/527298184978`
2. **Implementación de Componentes:**
   - En [components/landing/Footer.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/Footer.tsx), se reemplazó el enlace nulo `#` de LinkedIn por el canal directo de WhatsApp y se configuraron las redes de Facebook e Instagram.
   - En [components/landing/ContactSection.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/ContactSection.tsx), se agregó el bloque *"Redes Sociales Oficiales"* con botones directos.
3. **Pruebas Automáticas con Playwright (`e2e/landing.spec.ts`):**
   - Se validó el suite de Playwright (`npx playwright test e2e/landing.spec.ts`), obteniendo un resultado exitoso de **12 passed (23.2s)**.

### Tarea: Despliegue a Producción (Merge a `main` y PUSH a Vercel)

#### Diagnóstico del Problema:
- **Solicitud del Usuario:** Subir todos los cambios, mejoras e integraciones de las páginas `/nosotros`, `/preguntas-frecuentes`, `/contacto`, correcciones de redirección e imagen de fondo a producción.

#### Acciones Realizadas:
1. **Commit y Push en `staging`:**
   - Se realizó commit de todos los componentes nuevos, rutas e imágenes en la rama `staging` y se subió con `git push origin staging`.
2. **Merge y Despliegue en `main`:**
   - Se cambió a la rama `main` (`git checkout main`) y se fusionaron los cambios de `staging` (`git merge staging`).
   - Se enviaron los cambios a producción con `git push origin main` desencadenando la compilación y despliegue automático en Vercel.
3. **Retorno a `staging`:**
    - Siguiendo la regla del proyecto, se retornó a la rama activa de desarrollo `staging` (`git checkout staging`).

### Tarea: Análisis y Guía para Cambio de Dominio a grupoegac.com e Impacto en Pagos (Stripe & Supabase)

#### Diagnóstico del Problema:
- **Requisito del Usuario:** Asignar el dominio `grupoegac.com` al proyecto `cursos-iedch` (actualmente en `cursos.grupoegac.com` y con `grupoegac.com` vinculado temporalmente al proyecto `iedch-2`), y evaluar si este cambio afectará el procesamiento de pagos.

#### Análisis Realizado:
1. **Paso a Paso en Vercel:**
   - Desvincular `grupoegac.com` y `www.grupoegac.com` del proyecto `iedch-2`.
   - Asignar `grupoegac.com` como dominio principal en `cursos-iedch`.
   - Configurar `cursos.grupoegac.com` como redirección HTTP 301 permanente hacia `grupoegac.com`.
   - Actualizar `NEXT_PUBLIC_APP_URL` a `https://grupoegac.com`.
2. **Evaluación de Impacto en Pagos y Autenticación:**
   - **Pagos con Tarjeta (Stripe Checkout):** No se ven interrumpidos. El código lee `referer` de la petición HTTP para generar la URL de retorno (`success_url`), redirigiendo correctamente a `grupoegac.com/api/checkout/verify`.
   - **Pagos en OXXO (Stripe Webhook):** Stripe notifica cobros en OXXO mediante llamadas `POST` asíncronas a `/api/webhook`. Las redirecciones 301 no conservan payloads de peticiones `POST`. Se documentó actualizar la URL del Webhook en el Dashboard de Stripe a `https://grupoegac.com/api/webhook` en cuanto se disponga de acceso.
   - **Pagos Manuales / SPEI:** 100% funcionales dentro del sistema.
   - **Supabase Auth / OAuth:** Se requiere agregar `https://grupoegac.com/**` en `Redirect URLs` de Supabase para evitar discrepancias de cookies tras login social.
3. **Entregable:**
   - Se creó el artefacto `plan_cambio_dominio.md` con la guía paso a paso y la matriz de impacto.

### Tarea: Ajuste de Layout en Grid para Super Cursos

#### Diagn�stico del Problema:
- **Requisito:** Los cursos marcados como 'Super Curso' deben destacarse ocupando el espacio de dos tarjetas (2 columnas) en las vistas de cat�logo y landing.
- **Causa Ra�z:** El grid asignaba col-span-1 por defecto a todos los elementos en app/cursos/page.tsx y components/landing/PopularCourses.tsx.

#### Acciones Realizadas:
1. **Ajuste CSS de Tailwind:**
   - Se a�adi� condicionalmente las clases `sm:col-span-2 lg:col-span-2` a los contenedores si `es_super_curso` es verdadera.
2. **Pruebas E2E (Playwright):**
   - Se ejecutaron las pruebas con npx playwright test.


- Se actualiz la consulta en PopularCourses.tsx para ordenar los cursos: primero los supercursos (del ms actual al ms viejo) y despus los normales (del ms actual al ms viejo).

### Tarea: Unificación de Espacio de Tarjetas de Cursos (1 Espacio)

#### Diagnóstico del Problema:
- **Requisito del Usuario:** Los cursos en la sección de 'Cursos populares' y catálogo deben ocupar solo 1 espacio (1 columna) de forma uniforme, sin hacer diferencias de tamaño (col-span-2) para los cursos marcados como supercursos.
- **Causa Raíz:** Los elementos contenían condicionalmente las clases sm:col-span-2 lg:col-span-2 cuando es_super_curso era verdadero.

#### Acciones Realizadas:
1. **Ajuste en componentes:**
   - En [PopularCourses.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/landing/PopularCourses.tsx), se removió la clase sm:col-span-2 lg:col-span-2, asegurando que cada tarjeta ocupe exactamente 1 espacio de columna dentro de la cuadrícula.
   - En [app/cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/page.tsx), se removió la clase condicional para mantener coherencia en la vista de catálogo general.
2. **Pruebas E2E (Playwright):**
   - Se agregó y ejecutó la prueba en [landing.spec.ts](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/landing.spec.ts) para validar que ninguna tarjeta en la sección 'Cursos populares' contenga la clase col-span-2.
   - Todas las pruebas de Playwright pasaron exitosamente (13/13 en landing y 3/3 en courses).


---

## Fecha: 2026-08-26
### Tarea: Implementación de campo interactivo de Temario en Crear y Editar Cursos

#### Contexto y Requerimiento:
- Se solicitó agregar un campo estructurado de **Temario** (módulos y temas) en la sección de información básica del curso, posicionado inmediatamente después del campo *Título del Curso* y antes de *Descripción Completa*, tanto en la vista de creación de cursos (`/profesor/subir-curso`) como en la vista de edición (`/profesor/editar-curso/[id]`).
- El diseño visual cuenta con acordeón para cada módulo, inputs editables de títulos, viñetas (`•`) y listas dinámicas de temas, botones de agregar/eliminar módulo y agregar/eliminar tema, y botones de colapsar/expandir.

#### Cambios Realizados:
1. **Base de Datos y Esquema SQL:**
   - Creado script de migración `agregar_temario_cursos.sql` para agregar la columna `temario jsonb DEFAULT '[]'::jsonb` en `public.ie_cursos` junto con un índice GIN de rendimiento `idx_ie_cursos_temario`.
   - Actualizado `esquema_produccion.sql` para incluir la columna `temario` en la tabla `ie_cursos` y el índice de rendimiento correspondiente.
2. **Componente Reutilizable:**
   - Creado `components/TemarioEditor.tsx` con interfaz `ModuloTemario` (`titulo`, `temas`, `abierto`), soporte completo para colapsar/expandir, inputs con estado sincronizado y acciones de agregar/eliminar temas y módulos.
3. **Formularios de Subir y Editar Curso:**
   - `app/profesor/subir-curso/page.tsx`: Se integró el estado `temario`, el componente `TemarioEditor` tras el título del curso y la persistencia en el objeto de inserción `cursoDraftObj` en `ie_cursos`.
   - `app/profesor/editar-curso/[id]/page.tsx`: Se integró el estado `temario`, la carga reactiva desde `curso.cambios_pendientes.temario` (si hay borrador) o `curso.temario`, y el guardado tanto en borrador como en actualización directa.
4. **Auditoría de Administrador y Detalle Público:**
   - `app/admin/cursos/page.tsx`: Se incorporó `renderTemarioCompare` para comparar cambios en el temario entre la versión original y la nueva versión propuesta en el modal de auditoría.
   - `app/api/admin/aprobar-borrador/route.ts`: Persistencia asegurada del campo `temario` al aprobar borradores.
   - `app/cursos/[id]/page.tsx`: Renderizado estructurado del Temario del Curso en la ficha pública del curso.
5. **Pruebas Automatizadas (Playwright):**
   - Actualizado `e2e/instructor.spec.ts` con validaciones de visibilidad de Temario, creación de módulos, asignación de títulos y adición de temas.
   - Ejecutadas con éxito las pruebas: 40 tests pasados (`npx playwright test`).

- **Ajuste de Visualización en Auditoría de Administrador (/admin/cursos):**
  - Se reordenó la fila de comparación de Temario en el modal de auditoría de borrador para ubicarse inmediatamente después del campo **Título**, facilitando su visibilidad inmediata sin requerir scroll extenso.
  - Se optimizó el renderizado de `renderTemarioCompare` para mostrar siempre la fila comparativa con las tarjetas y viñetas de cada módulo y tema.
  - Se agregó soporte para previsualizar el temario estructurado en el modal de previsualización general de cursos del Administrador.
  - Pruebas E2E de administración actualizadas y validadas con éxito.

---

## Fecha: 2026-08-26
### Tarea: Implementación de Selector de Competencias con Verbos Taxonómicos (Bloom) en Crear y Editar Cursos

#### Contexto y Requerimiento:
- Se transformó la captura de *Competencias a desarrollar* en la creación (`/profesor/subir-curso`) y edición (`/profesor/editar-curso/[id]`) de cursos.
- Anteriormente se utilizaba un área de texto libre; ahora se implementó un flujo interactivo guiado por verbos pedagógicos de acción (Taxonomía de Bloom), donde el usuario puede seleccionar un verbo de una barra o menú desplegable para insertarlo automáticamente en la competencia y redactar el resultado de aprendizaje esperado.
- Reglas pedagógicas y límites:
  - Mínimo 3 competencias y máximo 5 competencias por curso.
  - Contador de caracteres en tiempo real por competencia (`XX/80`).
  - Botones de navegación horizontal (`<` y `>`) para explorar los chips de verbos.
  - Menú desplegable clasificado por categorías taxonómicas (Conocimiento, Comprensión, Aplicación, Análisis, Evaluación, Creación).
  - Filas numeradas con botón de papelera para eliminar o limpiar, y botón ancho inferior `+ Agregar competencia`.
  - Compatibilidad total con la base de datos `ie_cursos.competencias` (almacenamiento en texto multilinea).

#### Cambios Realizados:
1. **Componente Reutilizable:**
   - Creado [`components/CompetenciasEditor.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CompetenciasEditor.tsx) con la lógica interactiva, carrusel de verbos, dropdown taxonómico, parsing bidireccional, límites de 3 a 5 competencias y contador de caracteres.
2. **Formularios de Creación y Edición:**
   - [`app/profesor/subir-curso/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx): Integrado `CompetenciasEditor` y validación de mínimo 3 competencias completadas antes de publicar.
   - [`app/profesor/editar-curso/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/[id]/page.tsx): Integrado `CompetenciasEditor` y validación de mínimo 3 competencias en la edición directa y de borradores.
3. **Pruebas Automatizadas (Playwright):**
   - Actualizado [`e2e/instructor.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/instructor.spec.ts) con 2 nuevos tests E2E:
     - Verificación del renderizado de la sección, instrucciones, chips de verbos taxonómicos y contador.
     - Verificación de inserción de verbos con un clic, captura de competencias, límite de 5 competencias y eliminación de filas.
   - Ejecución y validación exitosa de la suite completa de Playwright: **43 de 43 pruebas pasaron (100% éxito)**.

### Tarea: Adopción del Modelo Estructurado de "Competencias abordadas" en Vistas Públicas y de Validación

#### Contexto y Requerimiento:
- Se rediseñó la presentación de competencias en la página de validación pública ([/validar](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/validar/page.tsx)) y en el detalle de cursos ([/cursos/[id]](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/[id]/page.tsx)).
- Se pasó de un bloque de texto plano a un diseño estructurado con:
  - Encabezado con ícono `Bookmark` y título **"Competencias abordadas"**.
  - Texto introductorio: *"La presente capacitación incluyó contenidos orientados al desarrollo de competencias relacionadas con:"*.
  - Círculos azules oscuros con números blancos (`1`, `2`, `3`...) y líneas divisorias sutiles entre cada competencia.

#### Cambios Realizados:
1. **Componente Reutilizable:**
   - Creado [`components/CompetenciasDisplay.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CompetenciasDisplay.tsx) con la función `parseCompetenciasList` para segmentar cadenas de texto multilínea y renderizar el formato con círculos numerados.
2. **Integración en Vistas:**
   - [`app/validar/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/validar/page.tsx): Integrado `CompetenciasDisplay` en la ficha de constancia verificada.
   - [`app/cursos/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/[id]/page.tsx): Integrado `CompetenciasDisplay` en la ficha pública del curso.
3. **Pruebas y Verificación:**
   - Compilación Next.js validada con éxito (`npm run build`).
   - Suite Playwright ejecutada: **43 de 43 pruebas pasadas con 100% de éxito**.

---

---

## Fecha: 2026-09-01
### Tarea: Botón Flotante de Retorno a la Navegación de Módulos (Subir y Editar Curso)

#### Contexto y Requerimiento:
- Al capturar o editar cursos en la sección **2. Temario y Clases**, la longitud del formulario aumenta significativamente cuando se configuran múltiples recursos (videos, PDFs, PPTs, HTMLs), tareas, exámenes modulares con preguntas múltiples/abiertas, cuestionarios y juegos interactivos (puzzles, ahorcados, sopas de letras, anagramas).
- Se implementó un botón flotante accesible e intuitivo que aparece dinámicamente cuando el usuario se desplaza verticalmente por el contenido, permitiéndole regresar suave y rápidamente a la barra superior de **Navegación de Módulos** con un solo clic.

#### Cambios Realizados:
1. **Página de Subir Curso ([`app/profesor/subir-curso/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)):**
   - Se añadió el atributo `id="seccion-navegacion-modulos"` y la clase `scroll-mt-24` al contenedor superior de Navegación de Módulos.
   - Se incorporó un estado `mostrarBotonFlotanteModulos` con un `useEffect` que escucha el scroll de la ventana (activándose a partir de 280px de desplazamiento vertical).
   - Se añadió la función `scrollToNavegacionModulos` con cálculo de offset ergonómico para garantizar un scroll suave (`behavior: 'smooth'`).
   - Se renderizó el botón flotante con diseño moderno (`gradient`, sombra profunda, animación de aparición/desaparición con opacidad y traslación, ícono `ArrowUp`, ícono `Layers` y texto "Navegación de Módulos") posicionado en `fixed bottom-20 right-6 z-40` para convivir armónicamente con el botón de sugerencias del layout.

2. **Página de Editar Curso ([`app/profesor/editar-curso/[id]/page.tsx`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/[id]/page.tsx)):**
   - Se aplicó la misma arquitectura y comportamiento que en Subir Curso para mantener consistencia total.

3. **Pruebas Automatizadas con Playwright ([`e2e/profesor-selector-modulos.spec.ts`](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/profesor-selector-modulos.spec.ts)):**
   - Se añadió un nuevo caso de prueba E2E: *'Debe mostrar el botón flotante al hacer scroll hacia abajo y regresar a la navegación de módulos al hacer clic'*.
   - Se ejecutaron las pruebas automatizadas con Playwright, obteniendo **5 de 5 pruebas pasadas (100% de éxito)**.

4. **Despliegue a Producción:**
   - Cambios fusionados a la rama `main` y desplegados exitosamente en Vercel ([https://www.grupoegac.com](https://www.grupoegac.com)).



