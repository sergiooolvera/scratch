# Bitácora de Desarrollo - CursosIEDCH

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
