# Bitácora de Avance - CursosIEDCH

Esta bitácora resume los avances realizados recientemente en el proyecto, organizados por áreas clave.

## 📅 Resumen de Avances Recientes (Marzo 2026)

### 🎓 Certificación y Documentos
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

---
*Última actualización: 29 de Marzo de 2026*
