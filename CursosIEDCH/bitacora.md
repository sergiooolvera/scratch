# Bitácora de Avance - CursosIEDCH

Esta bitácora resume los avances realizados recientemente en el proyecto, organizados por áreas clave.

## 🚀 Resumen de Avances Recientes (Julio 2026)

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
