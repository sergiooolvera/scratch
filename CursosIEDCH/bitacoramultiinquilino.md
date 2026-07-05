# Bitácora de Implementación Multi-Inquilino

Este documento registra el objetivo general, la arquitectura planificada y el progreso de las tareas para implementar el soporte multi-inquilino (multi-tenancy) con subdominios dinámicos en la plataforma educativa.

## Objetivo General
Permitir que diferentes instituciones (ej. `conalep.grupoegac.com`) tengan su propio espacio exclusivo con aislamiento de datos completo, personalización de funciones y branding, mientras que el dominio principal (`cursos.grupoegac.com`) opera de forma independiente.

---

## Plan de Trabajo y Estado de Tareas

### 1. Configuración de DNS e Infraestructura (Vercel y Dominios)
El objetivo es permitir que cualquier subdominio apunte a la misma aplicación de Next.js.
- [ ] **Wildcard DNS**: Configurar un registro CNAME de tipo comodín (`*.grupoegac.com`) en el proveedor de dominios apuntando a Vercel (`cname.vercel-dns.com`).
- [ ] **Configuración en Vercel**: Añadir el dominio comodín `*.grupoegac.com` en la sección de *Domains* del proyecto en Vercel.

### 2. Detección y Enrutamiento en Next.js (El Middleware)
Identificar el subdominio dinámicamente en el borde (Edge) y reescribir la ruta internamente.
- [ ] **Extraer el Host**: Obtener el nombre del host desde las cabeceras de la petición (`request.headers.get("host")`).
- [ ] **Extraer el Subdominio**: Aislar el subdominio (ej. de `conalep.grupoegac.com` a `conalep`). Definir `cursos` como el inquilino principal o por defecto.
- [ ] **Reescritura de Rutas (URL Rewriting)**: Implementar la reescritura interna en `middleware.ts` hacia `/_tenants/[tenant]/...` para mantener la URL limpia en el navegador del usuario.

### 3. Modelo de Datos y Aislamiento (Base de Datos)
Modificar la base de datos de PostgreSQL/Supabase para aislar los datos por inquilino.
- [ ] **Tabla de Inquilinos (`tenants`)**: Crear la tabla para registrar cada escuela o instancia.
  ```sql
  CREATE TABLE tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      subdomain VARCHAR(255) UNIQUE NOT NULL,
      settings JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  ```
- [ ] **Relación con Tablas Existentes**: Añadir la columna `tenant_id` a las tablas que requieren aislamiento:
  - [ ] `cursos`
  - [ ] `profiles`
  - [ ] `compras`
  - [ ] `examenes`
  - [ ] Otras tablas relevantes (lecciones, etc.).
- [ ] **Filtrado de Consultas**: Implementar el filtrado estricto por `tenant_id` en las consultas API y base de datos según el subdominio detectado.
- [ ] **Políticas RLS en Supabase**: Configurar Row Level Security (RLS) para asegurar que ningún usuario pueda acceder a datos de otro inquilino.

### 4. Personalización de Funcionalidades (Gratuito vs. Pago)
Controlar las características activas de cada inquilino mediante la columna `settings` (JSONB) de la tabla `tenants`.
- [ ] **Definir Esquema de `settings`**: Configurar los accesos en el JSON (ej. `features.instructor_free`, `features.allow_custom_branding`).
- [ ] **Lógica en Frontend (React/Next.js)**: Leer las configuraciones del inquilino actual para habilitar o deshabilitar componentes (ej. omitir pasarela de pagos para instructores en Conalep).
- [ ] **Personalización de Interfaz (Branding)**: Adaptar colores y logos del sitio web de acuerdo al inquilino activo.

---

## Historial de Actualizaciones y Progreso
- **2026-06-23**: Creación de la bitácora de tareas multi-inquilino basándose en la propuesta arquitectónica inicial.
