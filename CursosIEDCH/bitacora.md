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
