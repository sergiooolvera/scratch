# Bitácora de Avance - CursosIEDCH

Esta bitácora resume los avances realizados recientemente en el proyecto, organizados por áreas clave.

## 📅 Resumen de Avances Recientes (Mayo 2026)

### 📜 Certificados y Constancias Responsivos en Móviles (20 de Mayo de 2026)
- **Visualización Unificada y Adaptativa:** Se creó el componente cliente inteligente `ResponsiveCertificateWrapper.tsx` que mide el ancho de pantalla del dispositivo y aplica una transformación vectorial matemática (`transform: scale`) con ajuste colapsable de altura en tiempo real.
- **Integración de Constancias y Certificados:** Se integró el wrapper en las páginas de **Certificado de Cursos** (`app/cursos/[id]/certificado/page.tsx`), **Constancia de Cursos** (`app/cursos/[id]/constancia/page.tsx`) y **Constancia de Actividad Institucional** (`app/institucion/constancia/[id]/page.tsx`), permitiendo que se encojan al 100% de la pantalla del celular sin desbordarse, manteniendo el PDF de descarga en máxima resolución de escritorio (A4).

### ✏️ Inputs Numéricos y Preguntas Multilínea en Exámenes (20 de Mayo de 2026)
- **Eliminación del Cero en Inputs Numéricos:** Se actualizaron los estados y validaciones en los inputs de parámetros de examen (calificación mínima, tiempo límite, intentos permitidos y límite de cambios de pantalla) para permitir borrar el campo de forma natural (estado `number | ''`) y proveer valores por defecto seguros en el servidor en caso de enviarse vacíos.
- **Textareas Multilínea para Preguntas:** Se cambiaron los campos de pregunta de `<input type="text">` a `<textarea rows={2} className="resize-none">` en el creador (`subir-curso`) y editor (`editar-curso`) de cursos, logrando que preguntas de gran longitud se ajusten automáticamente a múltiples renglones sin recortarse.
- **Corrección de Persistencia de Intentos:** Se corrigieron bugs de carga y actualización de la base de datos para asegurar que los `intentos_permitidos` del examen final se carguen y persistan correctamente en el flujo de diseño y en el borrador de curso aprobado.

### 🏢 Extensión de Funciones a Rol Institución y Ajustes de Perfil (19 de Mayo de 2026)
- **Acceso Autorizado al Panel de Profesor:** Se modificó el `middleware.ts` y el renderizado del `Navbar.tsx` para otorgar acceso completo y transparente a las instituciones (`rol === 'institucion'`) a todas las rutas de `/profesor/*`, incluyendo carga de cursos, listado de alumnos y API de Stripe.
- **Perfil de Institución Completo:** Se actualizaron las pantallas de perfil (`app/perfil/page.tsx`) y financiero/colaboradores (`app/financiero/colaboradores/page.tsx`) para permitir a las instituciones validar su identidad, subir datos fiscales/bancarios y facturar comisiones bajo el mismo esquema de comisiones de colaboradores oficiales.
- **Compactador de Enlaces Supabase:** Se simplificó la visualización de módulos cargados en el editor de cursos, reemplazando la URL cruda de Supabase por un enlace limpio: `Actual: Ver archivo actual ↗`, previniendo desbordamientos horizontales en dispositivos móviles.

### 📜 Constancias Institucionales y Validación (18 de Mayo de 2026)
- **Mejora en Generación de PDF:** Se cambió `html2canvas` por `html-to-image` en la constancia institucional para corregir problemas de renderizado en dispositivos móviles (celulares y tabletas).
- **Ajuste de Diseño de Constancia:** Se modificó la vista de detalles de la actividad para usar una disposición vertical (apilada) en lugar de horizontal, permitiendo que textos largos (como el nombre de la institución) ocupen todo el renglón y no desborden la hoja. También se redujo el tamaño del sello institucional.
- **Validación con Nombre de Institución:** Se agregó la visualización del nombre de la institución en la página de validación de constancias (`app/validar/page.tsx`) para constancias institucionales y registros de actividad.

### 📝 Revisión de Exámenes, PDF y Validación de Intentos (17 de Mayo de 2026)
- **Revisión de Exámenes para Profesores:** Se creó una nueva vista y API para que los profesores puedan revisar los resultados de los exámenes de sus alumnos, saltando las restricciones de RLS mediante una Server Action con privilegios de admin.
- **Descarga de Examen en PDF:** Se implementó la descarga del examen contestado por el alumno en formato PDF usando `html2pdf.js`, generando un HTML temporal con estilos para la exportación.
- **Límite de Intentos en Exámenes:** Se agregó el campo `intentos_permitidos` en la creación y edición de cursos (guardándose en el borrador) y se implementó la validación en la pantalla del examen para bloquear al alumno si ya aprobó o si agotó sus intentos.
- **Mejoras en Panel de Administrador:** Se añadió un estado de carga (Loading) al botón de "Aprobar Edición" y se amplió el ancho del grid de la tabla de cursos (`max-w-7xl`) para mejorar la visualización.
- **Corrección de Errores de Compilación (TS):** Se solucionaron errores de tipado en `actions.ts` (asegurando booleano en `esCorrecta`) y en `page.tsx` de revisión de examen (usando `as any` en las opciones de `html2pdf.js` para evitar incompatibilidades).

### 🏷️ Clasificación de Cursos y Filtros del Catálogo (09 de Mayo de 2026)
- **Atributo de Categoría en Cursos:** Se integró la columna `categoria` en la tabla `ie_cursos` con valor predeterminado `'desarrollo'` para dar clasificación temática oficial a todos los cursos.
- **Formularios de Creación y Edición Actualizados:**
  - Se añadieron menús de selección de categorías visuales y estilizados en la página de **Subir Curso** (`app/profesor/subir-curso/page.tsx`) y de **Editar Curso** (`app/profesor/editar-curso/[id]/page.tsx`).
  - El sistema captura y persiste la categoría en borrador (cuando el curso está aprobado) y de forma directa cuando está en proceso de diseño/pendiente, manteniendo la integridad del flujo de revisión.
- **Píldoras de Filtro Interactivas (Category Pills):**
  - Se diseñó e implementó un bloque horizontal de píldoras en la parte superior del catálogo del alumno (`app/dashboard/page.tsx`).
  - Cuenta con un diseño premium y adaptativo con micro-animaciones hover y colores representativos de marca: 🧠 Desarrollo Humano (Púrpura), 🩺 Salud y Medicina (Esmeralda), 🎨 Arte y Cultura (Rosa), 💻 Tecnología (Azul) y 📚 Educación (Ámbar).
  - Las píldoras reaccionan interactivamente conservando de forma transparente cualquier término de búsqueda textual (`q`) ingresado por el estudiante.
- **Insignias Dinámicas en Tarjetas de Curso (CourseCard Badges):**
  - Se actualizó el componente `CourseCard` para renderizar el badge con la categoría temática respectiva del curso, usando una tipografía premium (Inter/Outfit) y bordes redondeados completos.
- **Despliegue y Pruebas Exitosas:**
  - Verificación de compilación de producción con Next.js y TypeScript completado con éxito (código de salida 0).
  - Cambios respaldados en Git y desplegados de manera inmediata a producción en Vercel ([cursos-iedch.vercel.app](https://cursos-iedch.vercel.app)).

### 🏢 Módulo de Instituciones, Registro de Actividades y Verificación (08 de Mayo de 2026)
- **Asignación de Rol Dinámico:** Se adaptó el flujo de registro e inicio de sesión para identificar automáticamente correos institucionales de empresas u organizaciones, asignándoles el rol exclusivo de `institucion`.
- **Sistema de Créditos de Cortesía (Free Trial):** Se programó una regla de negocio que otorga automáticamente un saldo de **3 créditos gratis** a cualquier institución que ingrese por primera vez para registrar hasta 3 actividades académicas libres de costo.
- **Formulario de Registro de Actividad:**
  - Registro con campos detallados: Nombre, Tipo de Actividad (Seminario, Curso, Taller, etc.), Duración Curricular, Fecha de Ejecución, Facilitador/Instructor, Ubicación y la Institución que acredita.
  - Integración de carga de múltiples evidencias físicas (documentos PDF, imágenes JPG, PNG, etc.) almacenadas en un bucket dedicado de Supabase Storage (`actividades-evidencias`).
  - Lógica adaptativa de checkout: Si el costo del registro de la actividad es de 0 créditos (o free trial), el botón cambia automáticamente a "Tomar Curso" / "Registrar Actividad", omitiendo opciones de pago con Tarjeta/Oxxo y flujos manuales de manera limpia.
- **Expediente de Actividades Institucionales:**
  - Panel interactivo de consulta para la institución donde visualiza sus actividades registradas con su estado, saldos en tiempo real y buscador inteligente.
  - Modal de **"Ver Detalle"** rediseñado desde cero bajo altos estándares estéticos (tarjetas interactivas en cuadrícula, micro-animaciones hover y paleta de colores índigo/oro).
  - Remoción de paneles obsoletos de generación de alumnos/constancias individuales para simplificar el expediente de manera que el registro general sea el documento verificado directo.
  - Soporte de visualización de evidencias de respaldo que permite abrir fotografías o PDFs adjuntos con un solo clic.
- **Constancias con QR y Validador Dinámico:**
  - Plantilla vertical de certificado institucional oficial con firmas de seguridad, logotipos de candados digitales y sello de agua.
  - Generación de códigos QR adaptativos que resuelven dinámicamente la URL en base a `window.location.origin` (apunta a `localhost` en desarrollo y a `cursos-iedch.vercel.app` en producción) facilitando pruebas móviles.
  - Motor de búsqueda del validador optimizado para UUID de PostgreSQL: se reemplazó el filtro `ilike` por consultas de rangos de frontera binaria (`gte` y `lte`) permitiendo consultar folios parciales instantáneamente a nivel de base de datos sin errores de tipos.
  - Soporte extendido para folios de compra: el buscador ahora también valida identificadores de inscripciones activas (`ie_compras` donde `pagado = true`), mostrando el nombre del alumno, curso, vigencia y detalles oficiales de la compra con éxito.

---

## 📅 Historial de Avances Anteriores

### 🎓 Certificación y Documentos (Marzo 2026)
- **Unificación de Componentes:** Se consolidó el código duplicado de la página de certificados y constancias en un único componente reutilizable: `CertificadoDocument.tsx`.
- **Ajustes de Diseño:** Se corrigió el espaciado vertical en el encabezado de los certificados (eliminando el espacio en blanco innecesario) y se ajustó la posición de la línea negra decorativa.
- **Corrección de PDF:** Se resolvieron errores de generación de PDF relacionados con `html2canvas`, específicamente problemas de CORS con imágenes y límites de tamaño del canvas, asegurando descargas fiables en producción (Vercel).
- **Control de Acceso:** Se implementó una opción para requerir el 100% del pago antes de permitir la descarga de la constancia.

### 💳 Pagos y Finanzas
- **Pasarela de Pago (Stripe):** Se finalizó el flujo de pagos con tarjeta, incluyendo la pre-carga automática del correo del usuario en el checkout de Stripe.
- **Gestión de Pagos:** Se mejoró la administración de pagos permitiendo aprobaciones manuales y distinguiendo entre abonos parciales y pagos totales.
- **Webhooks:** Se corrigieron problemas de redirección y procesamiento de webhooks de Stripe para asegurar que el estado del curso se actualice correctamente tras la compra.

### 📊 Administración y Dashboard
- **Análisis de Datos:** Se integraron gráficos y Dashboards analíticos tanto para el panel de Profesor como para el de Administrador.
- **Gestión de Cupones:** Se añadió la funcionalidad de eliminar cupones obsoletos.
- **Interfaz de Usuario:** Se implementó desplazamiento horizontal en las tablas de datos para mejorar la usabilidad en pantallas pequeñas.
- **Estandarización:** Se unificó la terminología en la interfaz (ej. "Obtener Constancia") para mantener la coherencia.

### 🛠️ Correcciones Técnicas y Base de Datos
- **Registro de Usuarios:** Se actualizó el trigger de Supabase `handle_new_user` para manejar correctamente columnas `NOT NULL` y evitar errores durante el registro.
- **Sistema de Exámenes:** Se corrigió la lógica de calificación para mapear correctamente las respuestas de los estudiantes con las opciones almacenadas en la base de datos (mapeo texto a letra).
- **Responsive Design:** Se reparó el menú de navegación móvil en el panel de profesor que no se desplegaba correctamente.

### 💰 Rol Financiero y Reportes
- **Nuevo Rol 'Financiero':** Se agregó el rol exclusivo `financiero` para visualizar ingresos, restringiendo sus permisos en otras áreas administrativas para mayor seguridad.
- **Precisión de Ingresos (Stripe):** Se migró la consulta de ventas de la vista del Profesor y de Finanzas para obtener los datos **directamente desde Stripe** en lugar de la base de datos local. Esto soluciona discrepancias con cupones de descuento y pagos parciales.
- **Filtro de Intentos de Pago (OXXO):** Se ajustaron las reglas de validación para excluir fichas de OXXO generadas pero no pagadas, previniendo duplicidad de ventas en los reportes (`payment_status === 'paid'`).
- **Dashboard Financiero Avanzado:** Se enriqueció la tabla de transacciones añadiendo paginación (20 resultados por hoja), exportación de tabla a Excel (CSV), y filtros combinables por Profesor, Curso, Alumno y Método de Pago. Adicionalmente, se aseguró que el título de los cursos no se trunque.

### 💰 Rol Financiero y Reportes (Continuación)
- **Atribución de Comisiones:** Se implementó una lógica de cruce avanzada para referidos:
    - **Pagos Stripe:** El referido se extrae del metadata de la sesión de Stripe, asegurando que solo se cuente si el código fue usado en el checkout específico.
    - **Pagos Manuales:** Se introdujo una validación de ventana temporal (±48 horas) para asociar referidos de la base de datos con transferencias bancarias, evitando que pagos antiguos hereden referidos nuevos por error.
- **Validación en Checkout:** Se añadió un botón de "Verificar" en el flujo de compra que valida códigos de referido en tiempo real antes de proceder al pago, mejorando la experiencia del usuario y la integridad de los datos.
- **Sincronización de Datos (`referred_by`):** Se corrigió el endpoint de verificación de checkout para persistir el código de referido desde Stripe hacia la base de datos local (`ie_compras`) tras un pago exitoso.
- **Módulo de Colaboradores:** Se habilitó el cálculo de comisiones (30/40/20%) incluyendo tanto ventas de Stripe como pagos manuales, con filtros avanzados por colaborador, curso y periodo (Mes/Año).
- **Integridad de Reportes:** Se consolidó la regla de que solo sesiones con `payment_status: 'paid'` en Stripe (especialmente para OXXO) se contabilicen en los reportes de ventas y comisiones.

### 🧹 Limpieza y Optimización Final
- **Precisión en Referidos Manuales:** Se sincronizó el Frontend y Backend para asegurar que los códigos de referido verificados se guarden correctamente en la base de datos al realizar pagos por transferencia/depósito, cerrando la brecha de atribución que existía fuera de Stripe.
- **Auditoría de Base de Datos:** Se realizó una limpieza profunda eliminando 21 registros de pagos manuales excedentes/duplicados que inflaban los reportes de comisiones de colaboradores.
- **Simplificación de Dashboard:** Se optimizó el Dashboard Financiero eliminando gráficos y resúmenes redundantes para ofrecer una vista centrada en el listado detallado de transacciones y filtros de búsqueda.

---
*Última actualización: 20 de Mayo de 2026*
