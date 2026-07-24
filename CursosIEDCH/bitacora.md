# Bitácora de Avance - CursosIEDCH

Esta bitácora resume los avances realizados recientemente en el proyecto, organizados por áreas clave.

## 🚀 Resumen de Avances Recientes (Julio 2026)

### 🔗 Botón de Compartir y Vista Previa Enriquecida de Curso (19 de Julio de 2026)
- **Componente Interactivo de Cliente:** Creación del componente `ShareButton.tsx` en `app/cursos/[id]/` utilizando `lucide-react` para iconografía moderna.
- **Acción Dual de Compartido:**
  - En dispositivos móviles o navegadores compatibles, hace uso de la API nativa `navigator.share` para una integración de sistema fluida.
  - En navegadores de escritorio, copia automáticamente la URL del curso al portapapeles y cambia de forma dinámica el estado del botón a un check verde con la leyenda "¡Enlace copiado!" durante 2.5 segundos.
- **Metadatos Open Graph y Twitter Cards Dinámicos:** Implementación de la función dinámica `generateMetadata` de Next.js. El servidor ahora extrae en tiempo real la información del curso (Título, Descripción e Imagen de portada) para generar las etiquetas meta de Open Graph. Al compartir el enlace en WhatsApp, Facebook, Telegram o Twitter, la aplicación ahora generará de forma automática una tarjeta elegante que incluye la imagen del curso, el título destacado en negrita y la descripción.
- **Integración Responsiva:** Se reestructuró la cabecera del detalle del curso (`app/cursos/[id]/page.tsx`) con un contenedor flexible para situar el botón de forma alineada y estéticamente atractiva en pantallas de cualquier tamaño.

### 🐰 Integración de Bunny.net Stream para Videos de Clases (15 de Julio de 2026)
- **Variables de Entorno:** Configuración de `NEXT_PUBLIC_BUNNY_LIBRARY_ID` y `NEXT_PUBLIC_BUNNY_STREAM_HOST` en `.env.local` para posibilitar el acceso al CDN y almacenamiento optimizado de Bunny.
- **Ruta de API Segura:** Creación de la API Route en `/app/api/video/crear-bunny/route.ts` para inicializar el video en Bunny.net de forma remota y segura sin exponer claves privadas en el navegador.
- **Subida Directa (Direct Upload):** Desarrollo del componente reutilizable `components/SubidorBunny.tsx` que permite a los instructores arrastrar/seleccionar un archivo de video desde su equipo y subirlo directo a los servidores de Bunny.net mediante peticiones HTTP PUT asíncronas con barra de progreso, previniendo sobrecargar el servidor de Next.js.
- **Mejora Visual y de Usabilidad (15 de Julio de 2026):** Se cambió la etiqueta descriptiva de "Subidor directo Bunny.net Stream" a "Sube tu video desde tu dispositivo". Además, se modificó el comportamiento del botón "Subir": mientras no haya un archivo seleccionado se muestra en su estilo por defecto y, al momento en que el usuario carga o selecciona un video, el botón se vuelve más grande (mayor padding, mayor tamaño de fuente), con una sombra más visible (`shadow-lg`), escala aumentada (`scale-105`) y efectos de transición y hover más interactivos para incentivar el clic de subida de forma clara.
- **Integración en Formularios de Cursos:** Integración del cargador en las vistas de creación (`app/profesor/subir-curso/page.tsx`) y edición de cursos (`app/profesor/editar-curso/[id]/page.tsx`).
- **Reproducción Fluida de Alumno:** Actualización de `ContentViewer.tsx` para detectar URLs de `mediadelivery.net` y `bunnycdn.com`, incrustando un iframe responsivo y seguro para el reproductor de Bunny.net Stream en el visor del alumno.

### 📊 Tarjeta de "Mis ventas" en el Panel del Profesor (15 de Julio de 2026)
- **Tarjeta de Acceso Directo:** Se expandió el grid del panel del profesor (`app/profesor/page.tsx`) de 3 a 4 columnas en pantallas medianas y grandes.
- **Enlace a Finanzas:** Se agregó una nueva tarjeta interactiva ("Mis ventas") con el icono `TrendingUp` que redirige de forma directa a la sección de finanzas y ventas (`/profesor/ventas`). Cuenta con un diseño premium y micro-interacciones (borde activo, sombra y flecha de enlace dinámico).

### 📁 Homogeneización de Categorías de Cursos (15 de Julio de 2026)
- **Unificación de Opciones:** Se modificaron los formularios de creación (`app/profesor/subir-curso/page.tsx`) y edición de cursos (`app/profesor/editar-curso/[id]/page.tsx`) para ofrecer exactamente el conjunto de 6 categorías del dashboard de alumnos:
  1. **Salud** (`salud`)
  2. **Negocios** (`negocios`)
  3. **Tecnología** (`tecnologia`)
  4. **Desarrollo Personal** (`desarrollo`)
  5. **Idiomas** (`idiomas`)
  6. **Más** (`mas`)
- **Actualización de Tarjetas de Curso:** Se actualizó el mapeo de etiquetas en `components/CourseCard.tsx` para sincronizar los textos, emojis y colores de fondo/borde según cada una de las nuevas categorías, manteniendo además compatibilidad con los cursos creados anteriormente con categorías heredadas.
- **Modificación y Orden de Regímenes Fiscales:** Se actualizaron los regímenes fiscales en el componente [SimuladorIngresosModal.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/SimuladorIngresosModal.tsx) al orden y nombres específicos solicitados:
  1. **Actividad empresarial y Profesional** (ACTIVIDAD_EMPRESARIAL): Mantiene las retenciones del 10% de ISR y 10.667% de IVA sobre el subtotal neto.
  2. **Plataforma personas Físicas con RFC** (PLATAFORMA_RFC): Mantiene las retenciones de 2.5% de ISR sobre el total bruto y 8% de IVA sobre el subtotal.
  3. **Plataforma personas Morales con RFC** (PLATAFORMA_MORAL_RFC): Configurado con retenciones del 0% tanto para ISR como para IVA (las personas morales no sufren retenciones por parte de la plataforma al contar con RFC).
  4. **Sin RFC** (SIN_RFC): Aplica las retenciones máximas por defecto del 20% de ISR sobre el total bruto y 100% de IVA sobre el IVA trasladado de la comisión.
- **Actualización de Tarjetas de Información:** Se actualizaron los textos de descripción fiscal dentro del simulador para que correspondan con los nuevos regímenes y su comportamiento fiscal.

### 🏢 Academias Populares en la Vista de Alumno (13 de Julio de 2026)
- **Layout de Grid de Dos Columnas:** Se reestructuró la maquetación del dashboard del alumno (`app/dashboard/page.tsx`) a un grid adaptativo (`lg:grid-cols-3`) que ubica el catálogo e información del alumno en la columna izquierda (`lg:col-span-2`) y un nuevo panel lateral en la columna derecha (`lg:col-span-1`).
- **Sección de Academias Populares:** Se implementó una lista dinámica de las academias que más alumnos tienen inscritos en sus cursos asignados. Se obtiene a partir de la relación entre academias, grupos, cursos y compras pagadas en Supabase. Cuenta con un diseño premium que muestra el logo de la academia, nombre, número de alumnos y un botón de "Ingresar" que redirige al portal correspondiente.
- **Gráficos e Ilustraciones Premium:** Se incorporó una sección ilustrativa con los beneficios clave de unirse a una academia y un banner degradado interactivo para invitar al alumno a explorar más academias del portal.
- **Datos Fallback Estéticos:** Se incorporó un fallback representativo idéntico al mockup (Salud, Negocios, Tecnología e Idiomas) para garantizar que el diseño premium siempre se visualice y no quede vacío mientras se crean más academias en el sistema.

### 📊 Actualización de Calculadora Fiscal y Simulador de Ventas (13 de Julio de 2026)
- **Reordenación de Variables**: Se reposicionó el Régimen Fiscal al inicio del formulario del simulador para una mejor experiencia de usuario.
- **Nuevos Regímenes Fiscales (Fila 10 del Excel)**: Se implementaron los regímenes oficiales: Actividad Empresarial y Profesional, Plataforma Personas Físicas con RFC, Plataforma Personas Físicas sin RFC, y Plataforma Persona Moral sin RFC.
- **Comisión Stripe Sincronizada**: Se alineó el cálculo de Stripe quitando el recargo del IVA para las comisiones variable (3.6%) y fija ($3.00), igualando al nuevo formato de Excel.
- **Comisión de Instructor desde Base de Datos**: Se vinculó el cálculo con la columna `porcentaje_profesor` de la tabla `ie_cursos` en Supabase (por defecto 60% si es nulo o al subir un curso nuevo) y se removieron los inputs de la interfaz para evitar su modificación por parte del usuario. La etiqueta se autogenera dinámicamente como `"Comisión para el Instructor (X%)"`.
- **Retenciones Fiscales Precisas**: Se programaron las retenciones de ISR e IVA detalladas en las columnas del Excel para cada uno de los cuatro regímenes, logrando que el pago neto a depositar concuerde al centavo.

### 🎨 Rediseño del Dashboard del Alumno: Banner Hero con IA y Tarjetas de Categorías Grandes (12 de Julio de 2026)
- **Banner Hero Interactivo:** Se integró un banner principal de bienvenida con la ilustración de una estudiante generada mediante IA (`public/hero_student_banner.png`) a la derecha, con un fondo degradado oscuro de alta calidad y un botón de llamada a la acción ("Explorar cursos"). Se ajustó su altura a la mitad para lograr un diseño más compacto y equilibrado, y se corrigieron las clases a `bg-zinc-950` y `from-zinc-950` para asegurar que el fondo se renderice correctamente en negro.
- **Estructura de Búsqueda Mejorada y Avatar:** Se posicionó la barra de búsqueda en la parte superior derecha de la pantalla junto a un saludo inicial que reintegra la imagen de avatar circular del estudiante (`ie_profiles.fotografia_perfil` o metadatos de sesión) y su respectiva etiqueta de rol de forma limpia y profesional.
- **Categorías como Tarjetas Modernas:** Se reemplazaron las píldoras horizontales por una cuadrícula de 6 tarjetas de categorías grandes. Cada tarjeta contiene un icono de Lucide en un círculo de color pastel y sombra suave, interactuando directamente con el filtro de búsqueda. Se estructuraron las categorías: Salud, Negocios, Tecnología, Desarrollo Personal, Idiomas y Más.

### 📲 Reducción de Espaciado Vertical Excesivo y Altura de Línea Global (9 de Julio de 2026)
- **Token de Espaciado Global (Tailwind v4):** Se configuró `--spacing: 0.22rem` (reducción respecto al valor base predeterminado de `0.25rem`) en la directiva `@theme inline` dentro de [globals.css](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/globals.css). Esto reduce dinámicamente todos los paddings, margins y gaps de todo el portal en un ~12% de manera uniforme y segura.
- **Reducción de Altura de Línea (line-height):** Se estableció un `line-height: 1.4` en la regla del cuerpo (`body`) en [globals.css](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/globals.css) para que el interlineado de todos los textos del sitio sea más compacto.
- **Compactación del Panel del Profesor:** Se disminuyeron adicionalmente los márgenes verticales y gaps de la pantalla del panel de control del profesor (`app/profesor/page.tsx`).
- **Reducción de Espaciado en Contenido de Cursos:** Se redujo el margen superior de los bloques de "Proyecto o Tarea Práctica" y "Cuestionario Abierto" en `app/cursos/[id]/contenido/PlaylistClient.tsx`.

### 👨‍🏫 Ocultar alertas de presentaciones descargadas (9 de Julio de 2026)
- **Botón "Lo sigo revisando":** Se incorporó un botón dinámico con estilo de borde ámbar y fondo blanco al lado de "Utilizar esta presentación" en la sección de recursos del módulo de edición y subida de cursos.
- **Estado Local e Interactivo:** Al pulsar "Lo sigo revisando", se almacena temporalmente el ID de la presentación en un estado de React (`hiddenGenerations`) para ocultar el div de alerta en la sesión actual.
- **Persistencia Temporal:** La alerta volverá a mostrarse en la siguiente ocasión en que el profesor acceda a la edición o subida del curso (cuando el componente se vuelva a montar), cumpliendo con el comportamiento solicitado.

### 🏢 Creación de Academia Paso a Paso (3 de Julio de 2026)
- **Flujo de Registro Paso a Paso (Stepper):** Se desarrolló una interfaz interactiva premium de 4 pasos (`/institucion/crear`) para guiar a los usuarios en la creación de su academia de manera inmersiva.
- **Paso 1 (Información Básica):** Formulario completo con validación del nombre, descripción con contador de caracteres (300 máx), selección de categorías orientadas a salud, urgencias e idiomas, y selector de archivos interactivo con visualización previa para cargar el logotipo.
- **Paso 2 (Personalización):** Rediseñado por completo para ofrecer un selector de 7 colores circulares interactivos, zona de subida de banner y campo de mensaje de bienvenida (opcional), sincronizado con una simulación del portal web en la tarjeta de vista previa lateral (pestañas interactivas, logo, nombre y mensaje de bienvenida en tiempo real).
- **Paso 3 (Configuración):** Rediseñado en dos columnas para ofrecer interruptores tipo toggle de permisos (Academia pública, Permitir inscripciones, Certificados automáticos, Foro de discusión) a la izquierda, e inputs de Información de contacto (Correo de contacto obligatorio con validación, Teléfono, Sitio web), campo de subdominio de acceso y barra interactiva de enlaces de Redes Sociales (Facebook, Instagram, LinkedIn, YouTube) a la derecha.
- **Paso 4 (Resumen):** Rediseñado en 3 tarjetas de columnas de revisión (Información básica, Personalización y Configuración) que permiten devolverse a editar los pasos correspondientes con un clic, agregando una barra verde interactiva en la parte inferior para configurar si se creará un curso de inmediato al lanzar la academia, y optimizando la maquetación a pantalla completa al ocultar el panel flotante lateral de vista previa.
- **Flujo de Integración Rápida de Curso:** Se incorporó una tarjeta lateral inteligente que permite activar el flujo de subir un curso inmediatamente al finalizar el registro.
- **Habilitación y Control en Panel:** Se modificó el enlace del botón de "Crear Academia" en `app/profesor/page.tsx` para redirigir a `/institucion/crear` a los usuarios con rol de `institucion`, `capacitador`, `instructor` y `admin` (mostrando además correctamente la etiqueta de *🛡️ Administrador* en la esquina superior si el rol interno es `admin`).
- **Ajuste de Permisos en Middleware:** Se modificó `middleware.ts` para autorizar a los roles de `instructor` y `capacitador` a acceder a la ruta `/institucion/crear`, evitando redirecciones cíclicas incorrectas al dashboard.

## 🚀 Resumen de Avances Recientes (Junio 2026)

### 💬 Comentarios y Sugerencias Globales (29 de Junio de 2026)
- **Enlace Flotante Global:** Se incorporó un botón flotante (`fixed`) sumamente estético en la esquina inferior derecha de toda la aplicación que dice "Comentarios y sugerencias", con fondo de glassmorphism y micro-interacciones.
- **Página de Envío de Opiniones (`/comentarios`):** Se diseñó y desarrolló una página específica para capturar de manera interactiva comentarios y sugerencias de cualquier usuario del portal.
- **Detección Automática de Sesión:** Si el usuario tiene sesión iniciada, el formulario de comentarios autocompleta automáticamente su nombre y correo, vinculando además su `user_id` de forma transparente en la base de datos.
- **Base de Datos y Seguridad:** Se creó la estructura en la base de datos `public.ie_comentarios` con políticas RLS de inserción pública e índices de alto rendimiento para mejorar la velocidad y seguridad del feedback.
- **Bandeja de Entrada del Administrador (`/admin/comentarios`):** Se creó una sección administrativa completa y de diseño premium para consultar, buscar y filtrar todos los comentarios recibidos (soporta filtrados avanzados por rol y búsquedas inteligentes).
- **Integración de Menús de Administración:** Se incorporó el acceso rápido a los comentarios en el `AdminNavbar` global, en el dropdown de navegación del `Navbar` principal (sección Soporte) y en la barra lateral del menú móvil de la plataforma.


### 👨‍🏫 Dashboard Premium Unificado para Instructores, Capacitadores e Instituciones (29 de Junio de 2026)
- **Ruta de Control Unificada:** Se creó la página principal del profesor (`app/profesor/page.tsx`) con un diseño altamente estético y premium basado en las especificaciones del cliente.
- **Redirección Automatizada por Roles:** Se modificó la página de inicio `/dashboard` (`app/dashboard/page.tsx`) para redirigir automáticamente a los usuarios con rol de `instructor`, `capacitador` o `institucion` a su respectivo portal.
- **Remoción de Ingresos e Indicadores Reajustados:** Se eliminó la tarjeta de estadística "Ingresos este mes" y se rediseñó el contenedor de resumen rápido a una cuadrícula equilibrada de 3 columnas para Alumnos, Cursos Publicados y Certificados Emitidos.
- **Visualización de Métricas Reales Directas:**
  - Se implementó el cálculo en tiempo real de estadísticas dinámicas directamente de la base de datos de Supabase.
  - Para el rol de `institucion`, se suman dinámicamente las actividades presenciales (`ie_actividad_institucion`), alumnos por actividad (`ie_actividad_alumnos`) y folios de constancia reales, además de sus cursos de plataforma.
  - Se corrigió la consulta de certificados emitidos de cursos en plataforma: en lugar de consultar la tabla vacía `ie_constancias`, ahora calcula de forma precisa los registros aprobados de `ie_examenes_usuario` para los cursos del instructor.
  - Se eliminaron por completo los fallbacks de demostración (si un usuario no posee registros, las estadísticas reflejan con exactitud el valor `0`).
- **Diseño de Banners y Secciones:**
  - Se crearon banners visuales con ilustraciones vectoriales (SVG) responsivas para la creación rápida de Academias y Cursos (enlazados a `/profesor/subir-curso`).
  - Se integró la sección de "Mis Academias" con diseño de tarjetas modernas y micro-interacciones.
  - **Actividad Reciente Personalizada:** Se removió el enlace "Ver todas" de la cabecera. Asimismo, se cambió la visualización de eventos de alumnos por un listado en tiempo real de las acciones del instructor/institución (registro de nuevos cursos, ediciones en sus cursos e historial y registro de actividades presenciales), ordenadas por fecha con formateador de tiempo relativo en español.
  - **Botonera de Navegación del Navbar:** Se insertó un botón interactivo de inicio (icono de casita `Home` de lucide-react) al lado izquierdo de la campana de notificaciones para permitir a los usuarios con sesión iniciada retornar de forma ágil a su página de inicio inteligente (`/dashboard`).

### 🎓 Mejoras de Interfaz y Experiencia del Usuario (11 de Junio de 2026)
- **Leyenda de Material Didáctico:** Se agregó la etiqueta visual "Material Didáctico" con ícono representativo en la vista de contenido del alumno para clarificar el área de visualización de recursos.
- **Optimización de Tareas y Cuestionarios:** Se estilizó el formulario de entrega ("Datos de tarea") encapsulándolo en un recuadro azul para mayor claridad visual.
- **Mensajes de Validación Claros:** Se agregaron avisos detallados como "o no se han acreditado los módulos anteriores que anteceden a este examen" para evitar confusión en los alumnos.
- **Ordenamiento de Contenido:** Se implementaron controles interactivos (flechas) para el reordenamiento visual de recursos y módulos desde el panel de creación del profesor.
- **Soporte de Documentos:** Se mejoró y diagnosticó la sincronización y lectura de documentos PDF como exámenes o guías dentro de la plataforma.

## ðŸ“… Resumen de Avances Recientes (Mayo 2026)

### ðŸ“œ Certificados y Constancias Responsivos en MÃ³viles (20 de Mayo de 2026)
- **VisualizaciÃ³n Unificada y Adaptativa:** Se creÃ³ el componente cliente inteligente `ResponsiveCertificateWrapper.tsx` que mide el ancho de pantalla del dispositivo y aplica una transformaciÃ³n vectorial matemÃ¡tica (`transform: scale`) con ajuste colapsable de altura en tiempo real.
- **IntegraciÃ³n de Constancias y Certificados:** Se integrÃ³ el wrapper en las pÃ¡ginas de **Certificado de Cursos** (`app/cursos/[id]/certificado/page.tsx`), **Constancia de Cursos** (`app/cursos/[id]/constancia/page.tsx`) y **Constancia de Actividad Institucional** (`app/institucion/constancia/[id]/page.tsx`), permitiendo que se encojan al 100% de la pantalla del celular sin desbordarse, manteniendo el PDF de descarga en mÃ¡xima resoluciÃ³n de escritorio (A4).

### âœï¸ Inputs NumÃ©ricos y Preguntas MultilÃ­nea en ExÃ¡menes (20 de Mayo de 2026)
- **EliminaciÃ³n del Cero en Inputs NumÃ©ricos:** Se actualizaron los estados y validaciones en los inputs de parÃ¡metros de examen (calificaciÃ³n mÃ­nima, tiempo lÃ­mite, intentos permitidos y lÃ­mite de cambios de pantalla) para permitir borrar el campo de forma natural (estado `number | ''`) y proveer valores por defecto seguros en el servidor en caso de enviarse vacÃ­os.
- **Textareas MultilÃ­nea para Preguntas:** Se cambiaron los campos de pregunta de `<input type="text">` a `<textarea rows={2} className="resize-none">` en el creador (`subir-curso`) y editor (`editar-curso`) de cursos, logrando que preguntas de gran longitud se ajusten automÃ¡ticamente a mÃºltiples renglones sin recortarse.
- **CorrecciÃ³n de Persistencia de Intentos:** Se corrigieron bugs de carga y actualizaciÃ³n de la base de datos para asegurar que los `intentos_permitidos` del examen final se carguen y persistan correctamente en el flujo de diseÃ±o y en el borrador de curso aprobado.

### ðŸ�¢ ExtensiÃ³n de Funciones a Rol InstituciÃ³n y Ajustes de Perfil (19 de Mayo de 2026)
- **Acceso Autorizado al Panel de Profesor:** Se modificÃ³ el `middleware.ts` y el renderizado del `Navbar.tsx` para otorgar acceso completo y transparente a las instituciones (`rol === 'institucion'`) a todas las rutas de `/profesor/*`, incluyendo carga de cursos, listado de alumnos y API de Stripe.
- **Perfil de InstituciÃ³n Completo:** Se actualizaron las pantallas de perfil (`app/perfil/page.tsx`) y financiero/colaboradores (`app/financiero/colaboradores/page.tsx`) para permitir a las instituciones validar su identidad, subir datos fiscales/bancarios y facturar comisiones bajo el mismo esquema de comisiones de colaboradores oficiales.
- **Compactador de Enlaces Supabase:** Se simplificÃ³ la visualizaciÃ³n de mÃ³dulos cargados en el editor de cursos, reemplazando la URL cruda de Supabase por un enlace limpio: `Actual: Ver archivo actual â†—`, previniendo desbordamientos horizontales en dispositivos mÃ³viles.

### ðŸ“œ Constancias Institucionales y ValidaciÃ³n (18 de Mayo de 2026)
- **Mejora en GeneraciÃ³n de PDF:** Se cambiÃ³ `html2canvas` por `html-to-image` en la constancia institucional para corregir problemas de renderizado en dispositivos mÃ³viles (celulares y tabletas).
- **Ajuste de DiseÃ±o de Constancia:** Se modificÃ³ la vista de detalles de la actividad para usar una disposiciÃ³n vertical (apilada) en lugar de horizontal, permitiendo que textos largos (como el nombre de la instituciÃ³n) ocupen todo el renglÃ³n y no desborden la hoja. TambiÃ©n se redujo el tamaÃ±o del sello institucional.
- **ValidaciÃ³n con Nombre de InstituciÃ³n:** Se agregÃ³ la visualizaciÃ³n del nombre de la instituciÃ³n en la pÃ¡gina de validaciÃ³n de constancias (`app/validar/page.tsx`) para constancias institucionales y registros de actividad.

### ðŸ“� RevisiÃ³n de ExÃ¡menes, PDF y ValidaciÃ³n de Intentos (17 de Mayo de 2026)
- **RevisiÃ³n de ExÃ¡menes para Profesores:** Se creÃ³ una nueva vista y API para que los profesores puedan revisar los resultados de los exÃ¡menes de sus alumnos, saltando las restricciones de RLS mediante una Server Action con privilegios de admin.
- **Descarga de Examen en PDF:** Se implementÃ³ la descarga del examen contestado por el alumno en formato PDF usando `html2pdf.js`, generando un HTML temporal con estilos para la exportaciÃ³n.
- **LÃ­mite de Intentos en ExÃ¡menes:** Se agregÃ³ el campo `intentos_permitidos` en la creaciÃ³n y ediciÃ³n de cursos (guardÃ¡ndose en el borrador) y se implementÃ³ la validaciÃ³n en la pantalla del examen para bloquear al alumno si ya aprobÃ³ o si agotÃ³ sus intentos.
- **Mejoras en Panel de Administrador:** Se aÃ±adiÃ³ un estado de carga (Loading) al botÃ³n de "Aprobar EdiciÃ³n" y se ampliÃ³ el ancho del grid de la tabla de cursos (`max-w-7xl`) para mejorar la visualizaciÃ³n.
- **CorrecciÃ³n de Errores de CompilaciÃ³n (TS):** Se solucionaron errores de tipado en `actions.ts` (asegurando booleano en `esCorrecta`) y en `page.tsx` de revisiÃ³n de examen (usando `as any` en las opciones de `html2pdf.js` para evitar incompatibilidades).

### ðŸ�·ï¸� ClasificaciÃ³n de Cursos y Filtros del CatÃ¡logo (09 de Mayo de 2026)
- **Atributo de CategorÃ­a en Cursos:** Se integrÃ³ la columna `categoria` en la tabla `ie_cursos` con valor predeterminado `'desarrollo'` para dar clasificaciÃ³n temÃ¡tica oficial a todos los cursos.
- **Formularios de CreaciÃ³n y EdiciÃ³n Actualizados:**
  - Se aÃ±adieron menÃºs de selecciÃ³n de categorÃ­as visuales y estilizados en la pÃ¡gina de **Subir Curso** (`app/profesor/subir-curso/page.tsx`) y de **Editar Curso** (`app/profesor/editar-curso/[id]/page.tsx`).
  - El sistema captura y persiste la categorÃ­a en borrador (cuando el curso estÃ¡ aprobado) y de forma directa cuando estÃ¡ en proceso de diseÃ±o/pendiente, manteniendo la integridad del flujo de revisiÃ³n.
- **PÃ­ldoras de Filtro Interactivas (Category Pills):**
  - Se diseÃ±Ã³ e implementÃ³ un bloque horizontal de pÃ­ldoras en la parte superior del catÃ¡logo del alumno (`app/dashboard/page.tsx`).
  - Cuenta con un diseÃ±o premium y adaptativo con micro-animaciones hover y colores representativos de marca: ðŸ§  Desarrollo Humano (PÃºrpura), ðŸ©º Salud y Medicina (Esmeralda), ðŸŽ¨ Arte y Cultura (Rosa), ðŸ’» TecnologÃ­a (Azul) y ðŸ“š EducaciÃ³n (Ã�mbar).
  - Las pÃ­ldoras reaccionan interactivamente conservando de forma transparente cualquier tÃ©rmino de bÃºsqueda textual (`q`) ingresado por el estudiante.
- **Insignias DinÃ¡micas en Tarjetas de Curso (CourseCard Badges):**
  - Se actualizÃ³ el componente `CourseCard` para renderizar el badge con la categorÃ­a temÃ¡tica respectiva del curso, usando una tipografÃ­a premium (Inter/Outfit) y bordes redondeados completos.
- **Despliegue y Pruebas Exitosas:**
  - VerificaciÃ³n de compilaciÃ³n de producciÃ³n con Next.js y TypeScript completado con Ã©xito (cÃ³digo de salida 0).
  - Cambios respaldados en Git y desplegados de manera inmediata a producciÃ³n en Vercel ([cursos-iedch.vercel.app](https://cursos-iedch.vercel.app)).

### ðŸ�¢ MÃ³dulo de Instituciones, Registro de Actividades y VerificaciÃ³n (08 de Mayo de 2026)
- **AsignaciÃ³n de Rol DinÃ¡mico:** Se adaptÃ³ el flujo de registro e inicio de sesiÃ³n para identificar automÃ¡ticamente correos institucionales de empresas u organizaciones, asignÃ¡ndoles el rol exclusivo de `institucion`.
- **Sistema de CrÃ©ditos de CortesÃ­a (Free Trial):** Se programÃ³ una regla de negocio que otorga automÃ¡ticamente un saldo de **3 crÃ©ditos gratis** a cualquier instituciÃ³n que ingrese por primera vez para registrar hasta 3 actividades acadÃ©micas libres de costo.
- **Formulario de Registro de Actividad:**
  - Registro con campos detallados: Nombre, Tipo de Actividad (Seminario, Curso, Taller, etc.), DuraciÃ³n Curricular, Fecha de EjecuciÃ³n, Facilitador/Instructor, UbicaciÃ³n y la InstituciÃ³n que acredita.
  - IntegraciÃ³n de carga de mÃºltiples evidencias fÃ­sicas (documentos PDF, imÃ¡genes JPG, PNG, etc.) almacenadas en un bucket dedicado de Supabase Storage (`actividades-evidencias`).
  - LÃ³gica adaptativa de checkout: Si el costo del registro de la actividad es de 0 crÃ©ditos (o free trial), el botÃ³n cambia automÃ¡ticamente a "Tomar Curso" / "Registrar Actividad", omitiendo opciones de pago con Tarjeta/Oxxo y flujos manuales de manera limpia.
- **Expediente de Actividades Institucionales:**
  - Panel interactivo de consulta para la instituciÃ³n donde visualiza sus actividades registradas con su estado, saldos en tiempo real y buscador inteligente.
  - Modal de **"Ver Detalle"** rediseÃ±ado desde cero bajo altos estÃ¡ndares estÃ©ticos (tarjetas interactivas en cuadrÃ­cula, micro-animaciones hover y paleta de colores Ã­ndigo/oro).
  - RemociÃ³n de paneles obsoletos de generaciÃ³n de alumnos/constancias individuales para simplificar el expediente de manera que el registro general sea el documento verificado directo.
  - Soporte de visualizaciÃ³n de evidencias de respaldo que permite abrir fotografÃ­as o PDFs adjuntos con un solo clic.
- **Constancias con QR y Validador DinÃ¡mico:**
  - Plantilla vertical de certificado institucional oficial con firmas de seguridad, logotipos de candados digitales y sello de agua.
  - GeneraciÃ³n de cÃ³digos QR adaptativos que resuelven dinÃ¡micamente la URL en base a `window.location.origin` (apunta a `localhost` en desarrollo y a `cursos-iedch.vercel.app` en producciÃ³n) facilitando pruebas mÃ³viles.
  - Motor de bÃºsqueda del validador optimizado para UUID de PostgreSQL: se reemplazÃ³ el filtro `ilike` por consultas de rangos de frontera binaria (`gte` y `lte`) permitiendo consultar folios parciales instantÃ¡neamente a nivel de base de datos sin errores de tipos.
  - Soporte extendido para folios de compra: el buscador ahora tambiÃ©n valida identificadores de inscripciones activas (`ie_compras` donde `pagado = true`), mostrando el nombre del alumno, curso, vigencia y detalles oficiales de la compra con Ã©xito.

---

## ðŸ“… Historial de Avances Anteriores

### ðŸŽ“ CertificaciÃ³n y Documentos (Marzo 2026)
- **UnificaciÃ³n de Componentes:** Se consolidÃ³ el cÃ³digo duplicado de la pÃ¡gina de certificados y constancias en un Ãºnico componente reutilizable: `CertificadoDocument.tsx`.
- **Ajustes de DiseÃ±o:** Se corrigiÃ³ el espaciado vertical en el encabezado de los certificados (eliminando el espacio en blanco innecesario) y se ajustÃ³ la posiciÃ³n de la lÃ­nea negra decorativa.
- **CorrecciÃ³n de PDF:** Se resolvieron errores de generaciÃ³n de PDF relacionados con `html2canvas`, especÃ­ficamente problemas de CORS con imÃ¡genes y lÃ­mites de tamaÃ±o del canvas, asegurando descargas fiables en producciÃ³n (Vercel).
- **Control de Acceso:** Se implementÃ³ una opciÃ³n para requerir el 100% del pago antes de permitir la descarga de la constancia.

### ðŸ’³ Pagos y Finanzas
- **Pasarela de Pago (Stripe):** Se finalizÃ³ el flujo de pagos con tarjeta, incluyendo la pre-carga automÃ¡tica del correo del usuario en el checkout de Stripe.
- **GestiÃ³n de Pagos:** Se mejorÃ³ la administraciÃ³n de pagos permitiendo aprobaciones manuales y distinguiendo entre abonos parciales y pagos totales.
- **Webhooks:** Se corrigieron problemas de redirecciÃ³n y procesamiento de webhooks de Stripe para asegurar que el estado del curso se actualice correctamente tras la compra.

### ðŸ“Š AdministraciÃ³n y Dashboard
- **AnÃ¡lisis de Datos:** Se integraron grÃ¡ficos y Dashboards analÃ­ticos tanto para el panel de Profesor como para el de Administrador.
- **GestiÃ³n de Cupones:** Se aÃ±adiÃ³ la funcionalidad de eliminar cupones obsoletos.
- **Interfaz de Usuario:** Se implementÃ³ desplazamiento horizontal en las tablas de datos para mejorar la usabilidad en pantallas pequeÃ±as.
- **EstandarizaciÃ³n:** Se unificÃ³ la terminologÃ­a en la interfaz (ej. "Obtener Constancia") para mantener la coherencia.

### ðŸ› ï¸� Correcciones TÃ©cnicas y Base de Datos
- **Registro de Usuarios:** Se actualizÃ³ el trigger de Supabase `handle_new_user` para manejar correctamente columnas `NOT NULL` y evitar errores durante el registro.
- **Sistema de ExÃ¡menes:** Se corrigiÃ³ la lÃ³gica de calificaciÃ³n para mapear correctamente las respuestas de los estudiantes con las opciones almacenadas en la base de datos (mapeo texto a letra).
- **Responsive Design:** Se reparÃ³ el menÃº de navegaciÃ³n mÃ³vil en el panel de profesor que no se desplegaba correctamente.

### ðŸ’° Rol Financiero y Reportes
- **Nuevo Rol 'Financiero':** Se agregÃ³ el rol exclusivo `financiero` para visualizar ingresos, restringiendo sus permisos en otras Ã¡reas administrativas para mayor seguridad.
- **PrecisiÃ³n de Ingresos (Stripe):** Se migrÃ³ la consulta de ventas de la vista del Profesor y de Finanzas para obtener los datos **directamente desde Stripe** en lugar de la base de datos local. Esto soluciona discrepancias con cupones de descuento y pagos parciales.
- **Filtro de Intentos de Pago (OXXO):** Se ajustaron las reglas de validaciÃ³n para excluir fichas de OXXO generadas pero no pagadas, previniendo duplicidad de ventas en los reportes (`payment_status === 'paid'`).
- **Dashboard Financiero Avanzado:** Se enriqueciÃ³ la tabla de transacciones aÃ±adiendo paginaciÃ³n (20 resultados por hoja), exportaciÃ³n de tabla a Excel (CSV), y filtros combinables por Profesor, Curso, Alumno y MÃ©todo de Pago. Adicionalmente, se asegurÃ³ que el tÃ­tulo de los cursos no se trunque.

### ðŸ’° Rol Financiero y Reportes (ContinuaciÃ³n)
- **AtribuciÃ³n de Comisiones:** Se implementÃ³ una lÃ³gica de cruce avanzada para referidos:
    - **Pagos Stripe:** El referido se extrae del metadata de la sesiÃ³n de Stripe, asegurando que solo se cuente si el cÃ³digo fue usado en el checkout especÃ­fico.
    - **Pagos Manuales:** Se introdujo una validaciÃ³n de ventana temporal (Â±48 horas) para asociar referidos de la base de datos con transferencias bancarias, evitando que pagos antiguos hereden referidos nuevos por error.
- **ValidaciÃ³n en Checkout:** Se aÃ±adiÃ³ un botÃ³n de "Verificar" en el flujo de compra que valida cÃ³digos de referido en tiempo real antes de proceder al pago, mejorando la experiencia del usuario y la integridad de los datos.
- **SincronizaciÃ³n de Datos (`referred_by`):** Se corrigiÃ³ el endpoint de verificaciÃ³n de checkout para persistir el cÃ³digo de referido desde Stripe hacia la base de datos local (`ie_compras`) tras un pago exitoso.
- **MÃ³dulo de Colaboradores:** Se habilitÃ³ el cÃ¡lculo de comisiones (30/40/20%) incluyendo tanto ventas de Stripe como pagos manuales, con filtros avanzados por colaborador, curso y periodo (Mes/AÃ±o).
- **Integridad de Reportes:** Se consolidÃ³ la regla de que solo sesiones con `payment_status: 'paid'` en Stripe (especialmente para OXXO) se contabilicen en los reportes de ventas y comisiones.

### ðŸ§¹ Limpieza y OptimizaciÃ³n Final
- **PrecisiÃ³n en Referidos Manuales:** Se sincronizÃ³ el Frontend y Backend para asegurar que los cÃ³digos de referido verificados se guarden correctamente en la base de datos al realizar pagos por transferencia/depÃ³sito, cerrando la brecha de atribuciÃ³n que existÃ­a fuera de Stripe.
- **AuditorÃ­a de Base de Datos:** Se realizÃ³ una limpieza profunda eliminando 21 registros de pagos manuales excedentes/duplicados que inflaban los reportes de comisiones de colaboradores.
- **SimplificaciÃ³n de Dashboard:** Se optimizÃ³ el Dashboard Financiero eliminando grÃ¡ficos y resÃºmenes redundantes para ofrecer una vista centrada en el listado detallado de transacciones y filtros de bÃºsqueda.

---
*Ãšltima actualizaciÃ³n: 20 de Mayo de 2026*

### ?? Restricción de Exámenes a Opción Múltiple
- **Uso exclusivo de Opción Múltiple:** Se eliminó la posibilidad de agregar preguntas de 'Respuesta Libre' en los módulos de creación y edición de cursos (subir-curso y editar-curso).
- **Validación en Extracción PDF:** Se actualizó la ruta de extracción de exámenes (parse-exam) para rechazar PDFs que contengan indicaciones de respuesta libre, retornando un error claro al profesor.
- **Actualización de Plantilla:** Se modificó la plantilla de ejemplo (ejemplo-examen.html), retirando los ejemplos de preguntas abiertas y añadiendo una nota explícita sobre el uso obligatorio y exclusivo de preguntas de opción múltiple.

---
*Última actualización: 4 de Julio de 2026*

### 🏢 Academias Reales del Profesor
- **Visualización Dinámica:** Se reemplazó el listado de academias "quemadas" (hardcodeadas) en el Dashboard del Profesor (`app/profesor/page.tsx`) por las academias reales obtenidas de la base de datos (`ie_academias`).
- **Métricas por Academia:** Se calculan dinámicamente el número de cursos de cada academia y la cantidad de alumnos inscritos en base a la categoría de los cursos (`ie_cursos`) y sus compras correspondientes (`ie_compras`).
- **Avatar Dinámico:** Se incorporó el renderizado del logo oficial de la academia (`logo_url`) o, en su defecto, un avatar con iniciales dinámicas y el color de marca asignado.
- **Página de Pasos de la Academia:** Se creó la nueva pantalla interactiva y responsiva `app/profesor/academias/[id]/page.tsx` para guiar al profesor a través de los pasos iniciales para empezar a enseñar (Paso 1: Crear grupo, Paso 2: Crear curso para grupo). Se enlazaron las academias del listado a esta vista.
- **Módulo de Grupos y Base de Datos:**
  - Se crearon las tablas `ie_grupos`, `ie_grupo_cursos` y `ie_grupo_alumnos` en PostgreSQL (documentadas en `crear_tabla_grupos.sql` e integradas en `esquema_produccion.sql`) junto con políticas RLS e índices de optimización.
  - Se implementó la pantalla de administración y listado de grupos en `app/profesor/academias/[id]/grupos/page.tsx`, con un modal funcional que permite crear grupos e insertarlos de forma real y dinámica en Supabase.
  - Se creó la pantalla de detalle del grupo (`app/profesor/academias/[id]/grupos/[grupoId]/page.tsx`) para la administración unificada de alumnos y cursos de cada grupo, permitiendo al profesor crear nuevos cursos para el grupo o asociar cursos existentes (mediante un modal de selección interactivo).
- **Eliminación Restrictiva de Academias y Grupos:**
  - **Eliminar Grupo:** Se añadió un botón de eliminación en la pantalla de detalle del grupo. Este botón se deshabilita si el grupo ya tiene cursos asociados en la tabla `ie_grupo_cursos`.
  - **Eliminar Academia:** Se añadió un botón en la pantalla principal de la academia que se deshabilita si existen cursos asociados a esta mediante sus grupos (tabla `ie_grupo_cursos`), solucionando el bloqueo que ocurría al comparar erróneamente por categorías globales.

---
*Última actualización: 7 de Julio de 2026*

### 🎓 Ajuste de Diseño en Constancia Digital (7 de Julio de 2026)
- **Alineación Vertical de Detalles:** Se redujo el margen superior (`mt-12` a `mt-5`) en el contenedor de los detalles del certificado (Valor curricular, Folio y Fecha) dentro de [CertificadoDocument.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoDocument.tsx) para subir visualmente la sección, equilibrando el espacio y reduciendo la distancia vacía respecto al título del curso.
- **Mejoras en Página de Validación (`/validar`):**
  - Se modificó la etiqueta `"Nombre del Curso"` por `"Capacitación"` para el tipo de resultado de cursos en [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/validar/page.tsx).
  - Se añadió la alineación justificada (`text-justify`) al renderizar las competencias en el validador de constancias.
  - Se cambió el texto del pie de página del validador para referenciar a "El Instituto Educativo de Especialdiades para la Conducta y el Desarrollo Humano S.C." en lugar de la entidad de acreditación global.

---
*Última actualización: 7 de Julio de 2026*

### 🧩 Límite de Puzles, Label de Video y Texto del Paso 4 (7 de Julio de 2026)
- **Incremento de Límite de Secuencia:** Se aumentó el límite máximo de preguntas configurables para la secuencia del puzle (Anagrama, Ahorcado y Ordenar Sílabas) de **5 a 10 preguntas**.
- **Actualización de Label de Video:** Se modificó el label del recurso tipo Video de `"Enlace del Video (YouTube o Vimeo)"` a `"Enlace del Video (YouTube, TikTok, Facebook, etc.)"` para hacerlo más descriptivo.
- **Actualización del Paso 4 (Stepper y Botones):** Se cambió el nombre de la sección `"Avisos y Notas"` a `"Avisos, Notas y Enviar a Revisión"` en el stepper e interfaces de navegación para dar mayor claridad sobre las acciones de ese paso.
- **Archivos Modificados:**
  - En la vista de creación: [subir-curso/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)
  - En la vista de edición: [editar-curso/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)

---
*Última actualización: 8 de Julio de 2026*

### 🎓 Tamaño de Fuente Dinámico en Nombres de Constancia (8 de Julio de 2026)
- **Ajuste Dinámico de Fuente para Nombres:** Se implementó una lógica de tamaño de fuente condicional en las tres plantillas de constancia/certificado para reducir proporcionalmente el tamaño del nombre del alumno de acuerdo con la cantidad de caracteres. Esto previene que nombres largos (como "JUAN MANUEL DE LA LUZ SIERRA") se trunquen con puntos suspensivos (`...`) debido a restricciones de ancho máximo y desborden el diseño horizontal de las plantillas.
- **Archivos Modificados:**
  - [CertificadoDocument.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoDocument.tsx) (Modelo 1)
  - [CertificadoModelo2.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo2.tsx) (Modelo 2)
  - [CertificadoModelo3.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo3.tsx) (Modelo 3)

---
*Última actualización: 9 de Julio de 2026*

### 🪪 Justificación de Texto en la Microcredencial (9 de Julio de 2026)
- **Texto Justificado en Descripción:** Se agregó la clase `text-justify` en el párrafo `<p>` de la sección "Descripción de la capacitación" en el componente `MicrocredencialDocument` para que el texto explicativo se presente plenamente justificado, mejorando la alineación visual y la estética premium del reverso de la microcredencial.
- **Archivos Modificados:**
  - [MicrocredencialDocument.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/MicrocredencialDocument.tsx)

---
*Última actualización: 9 de Julio de 2026*

### 📲 Corrección de Renderizado de Códigos QR (9 de Julio de 2026)
- **Migración a QRCodeSVG:** Se reemplazó el uso de `QRCodeCanvas` por `QRCodeSVG` en todos los componentes de visualización y descarga de certificados y microcredenciales. Esto corrige el problema por el cual el código QR no se mostraba (quedaba en blanco) en el navegador o al exportarse en PDF/imagen debido a limitaciones de renderizado en servidor (SSR) e incompatibilidades en la clonación del DOM con librerías como `html-to-image` y `html2canvas`.
- **Archivos Modificados:**
  - [CertificadoDocument.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoDocument.tsx)
  - [CertificadoModelo2.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo2.tsx)
  - [CertificadoModelo3.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CertificadoModelo3.tsx)
  - [MicrocredencialDocument.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/MicrocredencialDocument.tsx)

---
*Última actualización: 9 de Julio de 2026*

### 💾 Cambiar Texto de Botón a 'Guardar Borrador' (9 de Julio de 2026)
- **Cambio de texto en la interfaz:** Se renombró el texto de los botones de guardado parcial que llamaban a la función `guardarCurso(true)` (la cual guarda el curso como borrador) en las pestañas de información, módulos y examen final. Ahora el botón muestra el texto `"Guardar Borrador"` en lugar de `"Guardar Curso"`, brindando mayor claridad al usuario sobre la acción que se va a realizar.
- **Archivos Modificados:**
  - [subir-curso/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)
  - [editar-curso/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)

---
*Última actualización: 9 de Julio de 2026*

### 🖼️ Subida de Imagen de Portada y Vista Previa de Tarjeta de Curso (9 de Julio de 2026)
- **Imagen de Portada en Base de Datos:** Se creó el archivo de migración SQL [agregar_imagen_url_cursos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_imagen_url_cursos.sql) para añadir la columna `imagen_url` a la tabla `ie_cursos` de Supabase, y se actualizó el esquema general consolidado [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql).
- **Subida de Imagen en Formularios:** Se agregó una sección debajo del precio para subir una imagen de portada relacionada al curso (tanto en creación como en edición de cursos).
  - En la página de creación ([subir-curso/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)), la imagen se sube al storage bucket `cursos_contenido` al guardar/crear.
  - En la página de edición ([editar-curso/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)), la imagen se sube inmediatamente a través del bucket `cursos_contenido` al seleccionarla, para su persistencia en borradores.
- **Vista Previa Dinámica (Miniatura de Tarjeta):** Se incorporó una previsualización de la tarjeta de curso en miniatura que se actualiza en tiempo real de acuerdo con la imagen seleccionada, el título del curso y el precio ingresados por el profesor, respetando el diseño visual de la plataforma (título, autor con avatar, calificación demo de 4.9 con 5 estrellas, 240 alumnos demo y el precio formateado o "Gratis").
- **Archivos Modificados:**
  - [subir-curso/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)
  - [editar-curso/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)
  - [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql)
  - [agregar_imagen_url_cursos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_imagen_url_cursos.sql)

---
*Última actualización: 9 de Julio de 2026*

### 🎨 Vista de Tarjeta de Curso del Alumno y Detalle del Profesor (9 de Julio de 2026)
- **Imagen del Curso e Imagen por Defecto:** Se integró la imagen del curso en la parte derecha del contenido mediante un contenedor flexible (`flex gap-4 items-start justify-between`), usando `course.imagen_url` o en su defecto `/mundo.jpeg`. Para lograr máxima sutileza y elegancia, se configuró como una miniatura responsiva compacta (`w-20 h-20 sm:w-24 sm:h-24` para cursos normales y `w-24 h-24 sm:w-36 sm:h-36` para Super Cursos), lo que evita la saturación visual.
- **Información y Avatar del Profesor:** Se modificó la consulta en las vistas del alumno para unirse con la tabla `ie_profiles` a través de la relación de clave foránea `creado_por`. Ahora, el componente muestra la foto de perfil del profesor (o un icono de avatar por defecto si no está definida).
- **Precio Formateado:** Se integró la visualización del precio formateado en la parte inferior de la tarjeta, mostrando la palabra `"Gratuito"` si el precio es cero o indefinido.
- **Imagen en la Vista Detallada del Curso:** Se incorporó la visualización de la imagen del curso en la parte derecha de la sección de información detallada, estructurando el contenido en dos columnas responsivas (`flex-col md:flex-row`). Adicionalmente, se aplicó la justificación de texto (`text-justify`) en los bloques de Descripción, Beneficios y Competencias para lograr una lectura más limpia y premium.
- **Archivos Modificados:**
  - [CourseCard.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CourseCard.tsx)
  - [dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx)
  - [mis-cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/mis-cursos/page.tsx)
  - [cursos/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx)

---
*Última actualización: 12 de Julio de 2026*

### 🏢 Modal de Éxito en Creación de Academia (12 de Julio de 2026)
- **Flujo de Creación Modificado**: Se eliminó la redirección directa al subir curso o al panel del instructor al finalizar el paso 4 de "Crear Academia".
- **Modal de Felicitación**: Se diseñó e implementó un modal de éxito premium y responsivo que muestra un mensaje felicitando al instructor/institución con el nombre de su nueva academia (`"¡Felicidades! Creaste la academia: {nombre}"`).
- **Redirección de Cierre**: Al interactuar con el botón del modal, este redirige adecuadamente a la sección principal del instructor (`/profesor`).
- **Eliminación de Academias con Server Action**: Se detectó que las políticas RLS del lado del cliente impedían el borrado silenciosamente sin arrojar error (provocando redirección sin haber eliminado el registro). Se creó una Server Action (`eliminarAcademiaAction`) que ejecuta la eliminación de forma segura en el servidor usando privilegios `service_role` (evadiendo RLS) tras verificar que el usuario solicitante sea el creador legítimo del registro.
- **Corrección de Métricas Duplicadas en Academias**: Se identificó que la vista de lista de academias agrupaba los cursos globalmente por la **categoría** de la academia, lo que provocaba que todas las academias de una misma categoría mostraran las mismas métricas repetidas. Se corrigió para que consulte los grupos y las relaciones reales en la tabla `ie_grupo_cursos` de Supabase, obteniendo la cifra exacta y dinámica por academia.
- **Archivos Modificados**:
  - [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/institucion/crear/page.tsx)
  - [academias.ts](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/actions/academias.ts) (Nuevo)
  - [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/academias/%5Bid%5D/page.tsx)
  - [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx)

---
*Última actualización: 12 de Julio de 2026*

### 🧭 Corrección de Responsividad en Navbar y Visibilidad de Avatar (12 de Julio de 2026)
- **Problema de Espacio**: Con roles con más opciones (como Profesor/Instructor/Institución), el menú central se ensancha y desplazaba la sección derecha (el avatar) fuera de la pantalla en resoluciones medianas.
- **Ocultamiento de Texto en Medium Screens**: Se modificó la clase del contenedor de nombre y rol del usuario a `hidden lg:flex` para ocultar estos textos en pantallas de tamaño mediano (laptops/tablets) y asegurar que el avatar, el botón de inicio, la campana y salir quepan y se mantengan visibles sin desbordamiento.
- **Archivos Modificados**:
  - [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx)

---
*Última actualización: 12 de Julio de 2026*

### 🎨 Incorporación de Avatar en el Saludo de Bienvenida del Profesor (12 de Julio de 2026)
- **Unificación Visual**: Se añadió el avatar circular de perfil al lado del saludo de bienvenida `"¡Hola, {nombre}!"` en el cuerpo del dashboard del profesor, para que sea visualmente coherente con la cabecera de la vista de alumno.
- **Archivos Modificados**:
  - [page.tsx (Profesor)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx)

---
*Última actualización: 13 de Julio de 2026*

### 👥 Imagen de Grupo y Fallback por Defecto (13 de Julio de 2026)
- **Imagen en Base de Datos**: Se creó la migración [agregar_imagen_url_grupos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_imagen_url_grupos.sql) para agregar el campo `imagen_url` en la tabla `ie_grupos`. Se actualizaron los esquemas locales [crear_tabla_grupos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/crear_tabla_grupos.sql) y [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql) con este nuevo campo.
- **Formulario y Subida a Storage**: Se añadió un control de carga de archivos en el modal de "Crear Nuevo Grupo" con previsualización en tiempo real. Al enviar el formulario, el archivo se sube al bucket `perfiles` en Supabase Storage.
- **Fallback por Defecto**: Si no se selecciona un archivo, se almacena una URL de imagen ilustrativa por defecto para la representación del equipo.
- **Renderizado Dinámico**: Se modificó la vista de listado de grupos y la página de detalle individual del grupo para consultar el campo `imagen_url` y renderizar la imagen con bordes suavizados y aspecto premium.
- **Archivos Modificados**:
  - [grupos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/academias/%5Bid%5D/grupos/page.tsx)
  - [grupos/[grupoId]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/academias/%5Bid%5D/grupos/%5BgrupoId%5D/page.tsx)
  - [crear_tabla_grupos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/crear_tabla_grupos.sql)
  - [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql)
  - [agregar_imagen_url_grupos.sql](file:///c:/Users/sergi/.gemini/antigravity\scratch\CursosIEDCH/agregar_imagen_url_grupos.sql)
  - [run_migration_grupos_imagen.js](file:///c:/Users/sergi/.gemini/antigravity\scratch\CursosIEDCH/run_migration_grupos_imagen.js)

---
*Última actualización: 14 de Julio de 2026*

### 📝 Cambio de Etiqueta de Enlace de Video (14 de Julio de 2026)
- **Label Descriptivo**: Se cambió el texto del label del campo de video cuando se selecciona el tipo de recurso "video" en la creación y edición de cursos. Ahora indica: `"Enlace del Video (YouTube , Vimeo, Tiktok, Reels, etc. )"`.
- **Archivos Modificados**:
  - [page.tsx (Subir Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)
  - [page.tsx (Editar Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)

---
### 📋 Lista de Deseos "Mi lista" (14 de Julio de 2026)
- **Botón de Corazón Interactivo**: Se convirtió el componente [CourseCard.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CourseCard.tsx) en un Client Component y se le integró un botón de corazón en la esquina superior derecha con transiciones suaves, el cual se rellena de rosa/rojo (`fill-rose-550 text-rose-550`) cuando el curso está marcado en la lista de deseos.
- **Persistencia con LocalStorage**: El estado de los cursos deseados se almacena localmente en el navegador bajo la clave `ie_deseos`. Se implementó comunicación mediante eventos personalizados (`wishlist-updated`) para actualizar la UI en tiempo real a través de las diferentes pantallas.
- **Acceso en Barra de Navegación**: Se agregó la pestaña **"Mi lista"** con el icono `FolderHeart` de `lucide-react` en [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) para acceso en Desktop y en el menú móvil responsivo del alumno.
- **Página de Favoritos**: Se creó una nueva ruta en [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/deseos/page.tsx) que carga los IDs favoritos de `localStorage`, consulta los datos del curso aprobados y los renderiza en una cuadrícula premium. Cuenta con un estado vacío diseñado con ilustraciones minimalistas.
- **Archivos Modificados y Creados**:
  - [CourseCard.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CourseCard.tsx) (Modificado)
  - [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) (Modificado)
  - [page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/deseos/page.tsx) (Nuevo)


---
*Última actualización: 16 de Julio de 2026*

### 🔑 Acceso a Academias Públicas y Privadas para Alumnos (16 de Julio de 2026)
- **Base de Datos & Esquemas**:
  - Se creó el archivo de migración SQL [agregar_codigo_acceso_academias.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_codigo_acceso_academias.sql) para añadir el campo `codigo_acceso` (TEXT) a la tabla `ie_academias`.
  - Se actualizó el esquema general [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql) documentando la nueva columna en la definición de la tabla `ie_academias`.
- **Enlace de Dashboard a Academias**:
  - Se modificó la vista del alumno [page.tsx (Dashboard)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx) para que el botón "Ingresar" de las academias populares redirija directamente al detalle del portal en `/academias/[id]`.
- **Portal de Academia & Verificación de Código**:
  - Se creó el componente cliente [AcademyPortalClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/AcademyPortalClient.tsx) que gestiona el flujo de autenticación de códigos de acceso. Si la academia es privada (`publica = false`), el portal se bloquea tras un muro de código y requiere que el alumno ingrese la clave correspondiente (almacenándose de forma segura en `sessionStorage` tras su validación exitosa).
  - El portal recrea de forma fidedigna y premium el diseño del mockup: muestra banners personalizados, número de alumnos/cursos/grupos, herramienta de verificación de folios de constancias, listado dinámico de grupos asociados y listado de cursos aprobados vinculados a dichos grupos.
  - Se creó la ruta dinámica del lado del servidor [page.tsx (Detalle Academia)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/academias/%5Bid%5D/page.tsx) que obtiene la información de Supabase o provee datos mockup de demostración consistentes si es un ID demo.
- **Archivos Modificados y Creados**:
  - [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql)
  - [dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx)
  - [agregar_codigo_acceso_academias.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_codigo_acceso_academias.sql) (Nuevo)
  - [AcademyPortalClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/AcademyPortalClient.tsx) (Nuevo)
  - [academias/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/academias/%5Bid%5D/page.tsx) (Nuevo)

---
*Última actualización: 16 de Julio de 2026*

### 🏢 Código de Acceso para Academias Privadas y Logos de Redes Sociales (16 de Julio de 2026)
- **Generación Automática de Código**: Se implementó una lógica de generación de claves alfanuméricas aleatorias de 8 caracteres (`generateAccessCode`) en la creación de academias (`app/institucion/crear/page.tsx`).
- **Persistencia en Base de Datos**: Si la academia se configura como privada (el interruptor "Academia pública" está apagado), se genera este código y se guarda en la columna `codigo_acceso` de la tabla `ie_academias`. Si la academia es pública, se almacena como `null`.
- **Oculto en Formulario**: Al desactivar el interruptor de "pública", no se muestra el código de acceso en el formulario para evitar distracciones; la acción es silenciosa hasta el guardado.
- **Interfaz de Usuario (Modal de Éxito Premium)**: Se rediseñó el modal de felicitaciones para mostrar de forma elegante una sección con fondo e iconos destacados (de `lucide-react`) que contiene el código de acceso y permite al profesor copiarlo al portapapeles con un botón que responde visualmente al estado ("Copiar" -> "¡Copiado!").
- **Logotipos Oficiales de Redes Sociales y Web**: Se incorporaron logotipos vectoriales (SVG) oficiales a color para Facebook, Instagram, LinkedIn y YouTube en los botones selectores del Paso 3 del formulario. Adicionalmente, se incluyó el icono oficial de globo terráqueo a color junto con una máscara de protocolo (`https://`) en el input de Sitio Web.
- **Validación del Estudiante**: La clave almacenada en la base de datos se conecta de forma inmediata con el portal del estudiante en [AcademyPortalClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/AcademyPortalClient.tsx) para exigir el código antes de otorgar acceso.
- **Archivos Modificados**:
  - [crear/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/institucion/crear/page.tsx)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md)

### 🏢 Relación Directa Alumno - Academia e Inscripción Automática (16 de Julio de 2026)
- **Nueva Tabla `ie_academia_alumnos`**: Se creó el script SQL [crear_tabla_academia_alumnos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/crear_tabla_academia_alumnos.sql) para registrar de forma persistente e independiente la membresía de los alumnos en cada academia. Se agregaron políticas de RLS e índices de rendimiento.
- **Registro de Membresía Automático al Ingresar**: Se actualizó el componente cliente [AcademyPortalClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/AcademyPortalClient.tsx) para que, una vez concedido el acceso (sea público o tras ingresar la clave de acceso privada), se registre al alumno en la tabla `ie_academia_alumnos` de forma asíncrona y transparente.
- **Homogeneización de Contadores**:
  - Se modificó la pantalla principal del profesor ([profesor/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx)) para contar alumnos directamente desde `ie_academia_alumnos`.
  - Se modificó el portal de detalle de la academia ([academias/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/academias/%5Bid%5D/page.tsx)) para reflejar de forma exacta los alumnos usando esta misma tabla.
  - Se reestructuró la consulta de "Academias Populares" ([dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx)) reduciendo llamadas y obteniendo el orden por popularidad mediante la nueva tabla.
- **Archivos Modificados y Creados**:
  - [crear_tabla_academia_alumnos.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/crear_tabla_academia_alumnos.sql) (Nuevo)
  - [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql)
  - [AcademyPortalClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/AcademyPortalClient.tsx)
  - [profesor/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx)
  - [academias/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/academias/%5Bid%5D/page.tsx)
  - [dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md)

### 🎨 Iconos en la Selección de Tipo de Recurso de Cursos (16 de Julio de 2026)
- **Diseño Premium de Selectores**: Se rediseñó el selector de radio para el "Tipo de Recurso" en el formulario de creación (`app/profesor/subir-curso/page.tsx`) y edición (`app/profesor/editar-curso/[id]/page.tsx`) de cursos.
- **Implementación**: Se agregaron los iconos de Lucide correspondientes a cada formato (`Play` para VIDEO, `FileText` para PDF, `Presentation` para PPT, y `Code` para HTML) con estilos dinámicos de color y contenedores tipo chip (`bg-indigo-50 border-indigo-200`) que responden visualmente a la selección activa del usuario.
- **Archivos Modificados**:
  - [subir-curso/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx)
  - [editar-curso/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/editar-curso/%5Bid%5D/page.tsx)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md)
---
*Última actualización: 23 de Julio de 2026*

### 🚀 Implementación de Tutoriales Interactivos y Onboarding Multiruta (23 de Julio de 2026)
- **Instalación de Dependencia**: Se instaló la librería `driver.js` para proveer un sistema de onboarding interactivo animado y compatible con React 19.
- **Onboarding Multiruta Inteligente**: Se reestructuró [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) para leer `window.location.pathname` y cargar pasos específicos según la página:
  - **Dashboard y General**: Guía de notificaciones, menú central, perfil y tarjetas de cursos de forma adaptada al rol (colores temáticos específicos).
  - **Creador de Cursos (`/profesor/subir-curso`)**: Guía para los profesores sobre la estructuración de temarios, recuperación de borradores y guardado manual de avances.
  - **Persistencia**: Guarda estados separados en `localStorage` (`iedch_onboarding_completed` y `iedch_subir_curso_tour_completed`) para que ambos tours arranquen automáticamente solo la primera vez.
- **Selectores en Creador de Cursos**: Se modificó [page.tsx (Subir Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx) inyectando selectores estables a los componentes clave: `#tour-recuperar-borrador` (banner de recuperación de progreso anterior), `#tour-pasos-creacion` (etapas de creación en pestañas) e `#tour-guardar-borrador` (botón de guardado manual del borrador).
- **Integración en Barra de Navegación**: Se modificó [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) añadiendo IDs estables a los elementos principales (`#tour-navbar-links`, `#tour-subir-curso`, `#tour-subir-curso-movil`, `#tour-notificaciones`, `#tour-perfil`) e inyectando botones de lanzamiento manual (icono `HelpCircle` en Desktop y opción en el menú móvil).
- **Validación**: Se ejecutó `npm run build` con éxito en múltiples ocasiones, garantizando que el compilador de TypeScript y Next.js no detectan ningún error en las integraciones.
- **Archivos Modificados y Creados**:
  - [package.json](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/package.json) (Modificado)
  - [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) (Modificado)
  - [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) (Modificado)
  - [page.tsx (Subir Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/subir-curso/page.tsx) (Modificado)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md) (Modificado)
---
*Última actualización: 24 de Julio de 2026*

### 🚀 Tutorial Guiado en el Dashboard del Profesor (24 de Julio de 2026)
- **Selectores en Dashboard del Profesor**: Se modificó [page.tsx (Dashboard Profesor)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx) para integrar los selectores `#tour-crear-academia` (tarjeta de creación de academias), `#tour-crear-curso-dashboard` (tarjeta de creación de cursos) e `#tour-resumen-rapido` (sección del resumen rápido de métricas).
- **Tour Específico del Panel del Instructor**: Se reestructuró [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) para que, al detectar la ruta `/profesor` (o `/profesor/`), cargue un tutorial dedicado a los instructores/profesores. El tour explica las herramientas para crear academias y cursos, la visualización de métricas y las opciones de administración rápida del Navbar.
- **Control de Persistencia**: Se integró la persistencia en `localStorage` bajo la clave `iedch_profesor_dashboard_tour_completed` para evitar que el tour del panel principal se repita automáticamente.
- **Validación**: Se ejecutó `npm run build` con éxito, garantizando la compatibilidad del compilador y el correcto renderizado de todos los módulos.
- **Archivos Modificados**:
  - [page.tsx (Dashboard Profesor)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx) (Modificado)
  - [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) (Modificado)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md) (Modificado)

---
*Última actualización: 24 de Julio de 2026*

### 🚀 Tutorial Guiado en el Detalle del Curso para Alumnos (24 de Julio de 2026)
- **Selectores en Detalle del Curso**:
  - En [page.tsx (Detalle Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx) agregamos los selectores `#tour-informacion-curso` (tarjeta de datos generales del curso) e `#tour-opiniones-curso` (envolviendo las valoraciones).
  - En [CourseActions.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseActions.tsx) inyectamos los selectores `#tour-codigo-referido` (campo de referido opcional) e `#tour-metodos-pago` (rejilla con las opciones de inscripción/pago con tarjeta, transferencia, Oxxo y cupón).
- **Lógica en el Tour Multiruta**: Se reestructuró [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) para que, al detectar que la ruta inicia con `/cursos/` (descartando constancias, exámenes o contenidos internos), cargue un tutorial interactivo de adquisición enfocado en los selectores añadidos.
- **Persistencia**: Se almacena la finalización bajo la clave `iedch_curso_detail_tour_completed` en `localStorage`.
- **Validación**: Se ejecutó `npm run build` con éxito, garantizando que el compilador y TypeScript no encuentran ningún error en la integración.
- **Archivos Modificados**:
  - [page.tsx (Detalle Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx) (Modificado)
  - [CourseActions.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/CourseActions.tsx) (Modificado)
  - [OnboardingTour.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/OnboardingTour.tsx) (Modificado)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md) (Modificado)

---
*Última actualización: 24 de Julio de 2026*

### 🚀 Verificación de Usuarios y Palomita Azul (24 de Julio de 2026)
- **Base de Datos & Esquema**:
  - Se creó el archivo de migración SQL [agregar_verificado_usuarios.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_verificado_usuarios.sql) para agregar el campo `verificado` (BOOLEAN) a la tabla `ie_profiles`.
  - Se actualizó el esquema general [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql) documentando la nueva columna en la definición de la tabla `ie_profiles`.
- **Backend & APIs**:
  - Se creó el endpoint `/api/admin/usuarios/verificar/route.ts` para permitir a administradores cambiar el estado de verificación de usuarios con control de permisos de sesión.
  - Se modificó `/api/perfil/route.ts` para incluir la columna `verificado` en la consulta `select` del perfil actual.
- **Interfaz de Admin**:
  - Se actualizó [page.tsx (Admin Usuarios)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/admin/usuarios/page.tsx) agregando la columna "Verificación" con un selector combobox y llamando al endpoint respectivo al cambiar su valor. Se agregó una palomita azul SVG al lado del nombre de usuario en la lista si está verificado.
- **Propagación Visual**:
  - Se añadió la palomita azul de verificación (check azul SVG) en:
    - **Cabecera (Navbar)**: [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) (tanto en barra de escritorio como menú móvil).
    - **Catálogo de Cursos**: [CourseCard.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CourseCard.tsx), [page.tsx (Dashboard)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx) y [page.tsx (Mis Cursos)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/mis-cursos/page.tsx).
    - **Detalles del Curso**: [page.tsx (Detalle Curso)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx).
    - **Perfil de Usuario**: [page.tsx (Perfil)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/perfil/page.tsx).
    - **Panel del Profesor**: [page.tsx (Profesor)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx) (saludo de bienvenida).
    - **Revisión de Alumnos**: [page.tsx (Revisión Cuestionarios)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/revision-cuestionarios/page.tsx) and [RevisionCuestionariosClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/revision-cuestionarios/RevisionCuestionariosClient.tsx).
- **Archivos Modificados y Creados**:
  - [agregar_verificado_usuarios.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/agregar_verificado_usuarios.sql) (Nuevo)
  - [route.ts (Verificar API)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/api/admin/usuarios/verificar/route.ts) (Nuevo)
  - [esquema_produccion.sql](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/esquema_produccion.sql) (Modificado)
  - [route.ts (Perfil API)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/api/perfil/route.ts) (Modificado)
  - [page.tsx (Admin Usuarios)](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/admin/usuarios/page.tsx) (Modificado)
  - [CourseCard.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/CourseCard.tsx) (Modificado)
  - [dashboard/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/dashboard/page.tsx) (Modificado)
  - [mis-cursos/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/mis-cursos/page.tsx) (Modificado)
  - [cursos/[id]/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/cursos/%5Bid%5D/page.tsx) (Modificado)
  - [Navbar.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/components/Navbar.tsx) (Modificado)
  - [perfil/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/perfil/page.tsx) (Modificado)
  - [profesor/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/page.tsx) (Modificado)
  - [revision-cuestionarios/page.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/revision-cuestionarios/page.tsx) (Modificado)
  - [RevisionCuestionariosClient.tsx](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/app/profesor/revision-cuestionarios/RevisionCuestionariosClient.tsx) (Modificado)
  - [bitacora.md](file:///c:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/bitacora.md) (Modificado)
