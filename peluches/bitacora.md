# Bitácora de Desarrollo - Plushie Joy (Peluches)

## 2026-05-15
- **Inicio del proyecto**: Creación de la estructura base con Next.js (TypeScript, Tailwind, App Router).
- **Configuración de Credenciales**: Importación de llaves de Supabase y Stripe desde el proyecto CursosIEDCH.
- **Análisis de Estilos**: Revisión de los archivos generados por Stitch para mantener la consistencia visual (Paleta de colores Candy, tipografía DM Sans).
- **Renombramiento**: Cambio de nombre a "Volando al Universo" (configurable vía `.env.local`).
- **Gestión de Direcciones**: Implementación de CRUD completo de direcciones en el perfil del usuario.
- **Mega Menú**: Creación de un menú desplegable dividido con imágenes generadas por IA para las 4 secciones principales.
- **Imágenes de Ocasiones**: Generación y asignación de imágenes de IA para las 8 categorías en la página de inicio.
- **Página de Categorías**: Creación de una plantilla dinámica (`/categoria/[slug]`) con rejilla de plantillas y precio base, lista para personalización.
- **Depuración**: Solución de errores de consulta en Supabase y restricciones de componentes de servidor (RSC).

## 2026-05-17
- **Inventario Admin**: Se transformó la página de inventario en una lista completa con opciones de crear, editar y eliminar.
- **Filtros de Inventario**: Se agregaron filtros por nombre y categoría en tiempo real.
- **Supabase Storage**: Se implementó la subida de imágenes directamente a un bucket de Supabase Storage (`products`).
- **Persistencia de Plantillas**: Se insertaron los diseños generados por IA en la base de datos como productos reales para que sean editables.
- **Página de Categorías Dinámica**: Se actualizó para que lea los productos de la base de datos en lugar de un arreglo fijo.

## 2026-05-18
- **Integración con Envia.com**: Creación de Server Action para cotizar envíos en tiempo real con FedEx, DHL y Estafeta (ambiente de pruebas).
- **Stripe Checkout**: Conexión exitosa de las tarifas de Envia.com con las opciones de envío de Stripe Checkout (limitado a las 5 más baratas para cumplir límites de Stripe).
- **Mapeo de Estados**: Creación de un traductor de estados (ej. "Ciudad de México" a "DF") para evitar errores de validación en la API de Envia.
- **Panel de Pedidos**: Creación de la página `/admin/pedidos` para que los gestores puedan ver las órdenes pagadas y gestionar las guías.
- **Simulación de Pedidos**: Botón en el panel de administración para simular la creación de un pedido exitoso saltándose las reglas RLS desde el servidor (para pruebas en localhost).
- **Webhook de Stripe**: Actualización para guardar el ID de la dirección y capturar cuál paquetería eligió el cliente.

### Tareas Pendientes
- [x] Configurar `tailwind.config.ts` con los colores y espaciados de Stitch.
- [x] Instalar dependencias necesarias (`@supabase/supabase-js`, `stripe`, `lucide-react`, `clsx`, `tailwind-merge`).
- [x] Crear cliente de Supabase.
- [x] Migrar la página de inicio desde `code.html`.
- [x] Migrar el resto de las páginas (Detalle de producto e Inventario avanzadas).
- [x] Conectar componentes con tablas de la base de datos (`pl_`).
- [x] Implementar lógica de Carrito de Compras (Zustand + Persistencia).
- [x] Configurar Stripe para pagos.
- [x] Logística/Paquetería: Investigar e implementar la conexión con Envia.com.

### Ideas para Fase 2
- **Multi-ciudad**: Asociar productos a ciudades específicas (estilo EnvíaFlores) cuando el negocio crezca y tenga aliados locales.
- **Automatización de Guías**: Conectar el botón "Generar Guía" de la administración para que de verdad descuente saldo y genere el PDF en Envia.com.

---

### Plan para Próxima Sesión
- [ ] Definir si se implementará la generación automática de guías en Envia.com (Opción A) o se queda manual (Opción B).
- [ ] Limpiar páginas de prueba (`/test-envia` y `/api/test-db`) si ya no son necesarias.

