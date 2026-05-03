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

### 💰 Rol Financiero y Reportes
- **Nuevo Rol 'Financiero':** Se agregó el rol exclusivo `financiero` para visualizar ingresos, restringiendo sus permisos en otras áreas administrativas para mayor seguridad.
- **Precisión de Ingresos (Stripe):** Se migró la consulta de ventas de la vista del Profesor y de Finanzas para obtener los datos **directamente desde Stripe** en lugar de la base de datos local. Esto soluciona discrepancias con cupones de descuento y pagos parciales.
- **Filtro de Intentos de Pago (OXXO):** Se ajustaron las reglas de validación para excluir fichas de OXXO generadas pero no pagadas, previniendo duplicidad de ventas en los reportes (`payment_status === 'paid'`).
- **Dashboard Financiero Avanzado:** Se enriqueció la tabla de transacciones añadiendo paginación (20 resultados por hoja), exportación de tabla a Excel (CSV), y filtros combinables por Profesor, Curso, Alumno y Método de Pago. Adicionalmente, se aseguró que el título de los cursos no se trunque.

### 📢 Sistema de Referidos y Precisión Financiera (Mayo 2026)
- **Atribución de Comisiones:** Se implementó una lógica de cruce avanzada para referidos:
    - **Pagos Stripe:** El referido se extrae del metadata de la sesión de Stripe, asegurando que solo se cuente si el código fue usado en el checkout específico.
    - **Pagos Manuales:** Se introdujo una validación de ventana temporal (±48 horas) para asociar referidos de la base de datos con transferencias bancarias, evitando que pagos antiguos hereden referidos nuevos por error.
- **Validación en Checkout:** Se añadió un botón de "Verificar" en el flujo de compra que valida códigos de referido en tiempo real antes de proceder al pago, mejorando la experiencia del usuario y la integridad de los datos.
- **Sincronización de Datos (`referred_by`):** Se corrigió el endpoint de verificación de checkout para persistir el código de referido desde Stripe hacia la base de datos local (`ie_compras`) tras un pago exitoso.
- **Módulo de Colaboradores:** Se habilitó el cálculo de comisiones (30/40/20%) incluyendo tanto ventas de Stripe como pagos manuales, con filtros avanzados por colaborador, curso y periodo (Mes/Año).
- **Integridad de Reportes:** Se consolidó la regla de que solo sesiones con `payment_status: 'paid'` en Stripe (especialmente para OXXO) se contabilicen en los reportes de ventas y comisiones.

### 🧹 Limpieza y Optimización Final (03 de Mayo de 2026)
- **Precisión en Referidos Manuales:** Se sincronizó el Frontend y Backend para asegurar que los códigos de referido verificados se guarden correctamente en la base de datos al realizar pagos por transferencia/depósito, cerrando la brecha de atribución que existía fuera de Stripe.
- **Auditoría de Base de Datos:** Se realizó una limpieza profunda eliminando 21 registros de pagos manuales excedentes/duplicados que inflaban los reportes de comisiones de colaboradores.
- **Simplificación de Dashboard:** Se optimizó el Dashboard Financiero eliminando gráficos y resúmenes redundantes para ofrecer una vista centrada en el listado detallado de transacciones y filtros de búsqueda.

---
*Última actualización: 03 de Mayo de 2026*
