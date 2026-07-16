-- =========================================================================
-- ESQUEMA DE BASE DE DATOS DE PRODUCCIÓN - CURSOS IEDCH
-- Generado para clonación y ambiente de desarrollo
-- =========================================================================

-- 1. Habilitar extensiones necesarias para UUIDs y Criptografía
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- CREACIÓN DE TABLAS BASE (Sin dependencias de llaves foráneas inmediatas)
-- =========================================================================

-- Tabla de perfiles de usuarios (Enlaza con auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.ie_profiles (
    id uuid NOT NULL PRIMARY KEY,
    nombre text NOT NULL,
    rol text NOT NULL DEFAULT 'alumno'::text,
    created_at timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true,
    apellido_paterno text,
    apellido_materno text,
    referral_code text,
    telefono text,
    banco text,
    clabe text,
    datos_bancarios_capturados boolean DEFAULT false,
    solicitud_cambio_datos boolean DEFAULT false,
    clave_cct text,
    fotografia_perfil text,
    telefono_contacto_2 text,
    correo_adicional text,
    profesion_especialidad text,
    institucion_labora text,
    estado_municipio text,
    cedula_profesional text,
    constancia_situacion_fiscal text,
    rfc text,
    aceptacion_servicios boolean DEFAULT false,
    identidad_validada boolean DEFAULT false,
    limite_generaciones_gamma integer DEFAULT 3,
    solicitud_mas_intentos_gamma boolean DEFAULT false,
    permisos_adminjr jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT ie_profiles_rol_check CHECK (rol IN ('alumno', 'profesor', 'vendedor', 'admin', 'financiero', 'institucion', 'instructor'))
);

-- Tabla de Cursos
CREATE TABLE IF NOT EXISTS public.ie_cursos (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo text NOT NULL,
    descripcion text,
    beneficios text,
    duracion text,
    precio numeric NOT NULL DEFAULT 0.0,
    instructor text,
    logo_url text,
    imagen_url text,
    curso_url text,
    estado text NOT NULL DEFAULT 'pendiente'::text,
    creado_por uuid,
    created_at timestamp with time zone DEFAULT now(),
    url_contenido text,
    requiere_examen boolean DEFAULT false,
    url_examen text,
    vigencia_anos integer NOT NULL DEFAULT 3,
    cambios_pendientes jsonb,
    requiere_pago_completo boolean DEFAULT false,
    reunion_url text,
    nota_profesor text,
    porcentaje_profesor numeric DEFAULT 40,
    es_super_curso boolean DEFAULT false,
    categoria text DEFAULT 'desarrollo'::text,
    bloquear_avance boolean DEFAULT false,
    requiere_tareas_avance boolean DEFAULT false,
    requiere_examen_avance boolean DEFAULT false,
    mostrar_examen_final boolean DEFAULT true,
    mostrar_constancia boolean DEFAULT true,
    mostrar_revision_examen boolean DEFAULT false,
    modalidad text DEFAULT 'abierta'::text,
    limite_inscripcion date,
    mostrar_calificacion_constancia boolean DEFAULT true,
    mostrar_logo_constancia boolean DEFAULT false,
    plantilla_constancia text DEFAULT 'modelo1'::text,
    aplicar_iva boolean DEFAULT false,
    competencias text
);

-- Tabla de Configuración de Comisiones
CREATE TABLE IF NOT EXISTS public.ie_config_comisiones (
    key text NOT NULL PRIMARY KEY,
    value numeric NOT NULL,
    descripcion text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de Configuración de Planes de Instituciones
CREATE TABLE IF NOT EXISTS public.ie_config_planes_institucion (
    key text NOT NULL PRIMARY KEY,
    value numeric NOT NULL,
    label text
);

-- =========================================================================
-- CREACIÓN DE TABLAS SECUNDARIAS
-- =========================================================================

-- Actividades de Institución
CREATE TABLE IF NOT EXISTS public.ie_actividad_institucion (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    nombre_actividad text NOT NULL,
    tipo_actividad text NOT NULL,
    duracion text NOT NULL,
    fecha_ejecucion date NOT NULL,
    ubicacion text,
    autor text NOT NULL,
    institucion_acredita text DEFAULT 'INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CONDUCTA Y EL DESARROLLO HUMANO S.C.'::text,
    fotos text[], -- Mapeado de tipo ARRAY
    videos text[], -- Mapeado de tipo ARRAY
    pagado_con_credito boolean DEFAULT false,
    pago_metodo text,
    pago_estado text DEFAULT 'pendiente'::text,
    monto_pagado numeric,
    comprobante_pago text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Alumnos por Actividad
CREATE TABLE IF NOT EXISTS public.ie_actividad_alumnos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    actividad_id uuid,
    nombre_alumno text NOT NULL,
    correo_alumno text,
    folio_constancia text UNIQUE DEFAULT upper(substr(md5((random())::text), 1, 8)),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Compras de Cursos
CREATE TABLE IF NOT EXISTS public.ie_compras (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    curso_id uuid NOT NULL,
    pagado boolean NOT NULL DEFAULT false,
    fecha_compra timestamp with time zone DEFAULT now(),
    pago_completo boolean DEFAULT false,
    monto_pagado numeric,
    referred_by uuid
);

-- Constancias Emitidas
CREATE TABLE IF NOT EXISTS public.ie_constancias (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    curso_id uuid NOT NULL,
    url_pdf text,
    fecha_generacion timestamp with time zone DEFAULT now()
);

-- Módulos de los Cursos
CREATE TABLE IF NOT EXISTS public.ie_curso_modulos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid NOT NULL,
    titulo text NOT NULL,
    url_contenido text NOT NULL,
    orden integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    requiere_cuestionario boolean DEFAULT false
);

-- Preguntas de Cuestionarios por Módulo
CREATE TABLE IF NOT EXISTS public.ie_cuestionario_preguntas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    modulo_id uuid NOT NULL,
    pregunta text NOT NULL,
    orden integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Respuestas de Cuestionarios por Alumno
CREATE TABLE IF NOT EXISTS public.ie_cuestionario_respuestas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pregunta_id uuid NOT NULL,
    user_id uuid NOT NULL,
    respuesta text NOT NULL,
    calificacion character varying,
    feedback text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    responded_at timestamp with time zone
);

-- Cupones de Descuento
CREATE TABLE IF NOT EXISTS public.ie_cupones (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo text NOT NULL,
    descuento_porcentaje integer NOT NULL,
    activo boolean DEFAULT true,
    usos_disponibles integer,
    fecha_creacion timestamp with time zone DEFAULT timezone('utc'::text, now()),
    curso_id uuid
);

-- Historial de Cambios en Cursos
CREATE TABLE IF NOT EXISTS public.ie_curso_historial (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    curso_id uuid,
    modificado_por uuid,
    detalles_cambio text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Exámenes por Curso o Módulo
CREATE TABLE IF NOT EXISTS public.ie_examenes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid NOT NULL,
    min_aprobacion integer NOT NULL DEFAULT 80,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    tiempo_limite integer,
    seguridad_aumentada boolean DEFAULT false,
    max_cambios_pantalla integer DEFAULT 3,
    intentos_permitidos integer DEFAULT 3,
    modulo_id uuid
);

-- Exámenes presentados por el usuario (Historial simplificado)
CREATE TABLE IF NOT EXISTS public.ie_examenes_usuario (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    curso_id uuid NOT NULL,
    calificacion numeric NOT NULL DEFAULT 0,
    aprobado boolean NOT NULL DEFAULT false,
    fecha timestamp with time zone DEFAULT now()
);

-- Generaciones de Diapositivas IA (Gamma)
CREATE TABLE IF NOT EXISTS public.ie_gamma_generations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid NOT NULL,
    curso_id uuid,
    modulo_id uuid,
    prompt text NOT NULL,
    num_slides integer NOT NULL DEFAULT 10,
    formato character varying NOT NULL,
    gamma_url text,
    export_url text,
    descargado boolean DEFAULT false,
    utilizado boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    credits_used integer DEFAULT 0,
    titulo text
);

-- Créditos de Instituciones
CREATE TABLE IF NOT EXISTS public.ie_institucion_creditos (
    user_id uuid NOT NULL PRIMARY KEY,
    creditos_restantes integer DEFAULT 0,
    plan_actual text DEFAULT 'ninguno'::text,
    pago_recurrente boolean DEFAULT false,
    fecha_compra timestamp with time zone,
    vence_en timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Recursos adicionales de los Módulos
CREATE TABLE IF NOT EXISTS public.ie_modulo_recursos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    modulo_id uuid NOT NULL,
    titulo character varying NOT NULL,
    url_contenido text NOT NULL,
    orden integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    descargable boolean DEFAULT false
);

-- Notificaciones del Sistema
CREATE TABLE IF NOT EXISTS public.ie_notificaciones (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id uuid NOT NULL,
    actor_id uuid,
    tipo text NOT NULL,
    mensaje text NOT NULL,
    enlace text,
    leida boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Solicitudes de Pago Manual
CREATE TABLE IF NOT EXISTS public.ie_pagos_manuales (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    curso_id uuid,
    comprobante_url text NOT NULL,
    estado text DEFAULT 'pendiente'::text,
    notas text,
    fecha_solicitud timestamp with time zone DEFAULT timezone('utc'::text, now()),
    fecha_revision timestamp with time zone,
    metodo_pago text DEFAULT 'transferencia'::text,
    referred_by uuid
);

-- Preguntas de Exámenes
CREATE TABLE IF NOT EXISTS public.ie_preguntas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    examen_id uuid NOT NULL,
    pregunta text NOT NULL,
    opcion_a text NOT NULL,
    opcion_b text NOT NULL,
    opcion_c text NOT NULL,
    opcion_d text NOT NULL,
    respuesta_correcta text NOT NULL,
    orden integer NOT NULL DEFAULT 1,
    tipo_pregunta character varying NOT NULL DEFAULT 'opcion_multiple'::character varying
);

-- Foro / Preguntas y Respuestas de Alumnos en Cursos
CREATE TABLE IF NOT EXISTS public.ie_preguntas_respuestas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid,
    user_id uuid,
    pregunta text NOT NULL,
    respuesta text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    responded_at timestamp with time zone
);

-- Progreso del Alumno por Módulo
CREATE TABLE IF NOT EXISTS public.ie_progreso_modulos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    curso_id uuid NOT NULL,
    modulo_id text NOT NULL,
    visto boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ie_progreso_modulos_user_id_curso_id_modulo_id_key UNIQUE (user_id, curso_id, modulo_id)
);

-- Resultados de Exámenes Detallados
CREATE TABLE IF NOT EXISTS public.ie_resultados_examenes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    examen_id uuid NOT NULL,
    calificacion integer NOT NULL,
    aprobado boolean NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    url_constancia text,
    respuestas_detalle jsonb DEFAULT '{}'::jsonb
);

-- Reseñas y Calificaciones de Cursos
CREATE TABLE IF NOT EXISTS public.ie_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curso_id uuid,
    user_id uuid,
    rating integer NOT NULL,
    comentario text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ie_reviews_curso_id_user_id_key UNIQUE (curso_id, user_id),
    CONSTRAINT ie_reviews_rating_check CHECK ((rating >= 1) AND (rating <= 5))
);


-- =========================================================================
-- DEFINICIÓN DE RELACIONES Y LLAVES FORÁNEAS (FOREIGN KEYS)
-- =========================================================================

-- Relaciones de ie_profiles
-- Nota: id típicamente referencia a auth.users(id) en Supabase, lo agregamos como referencia externa segura si existe.
ALTER TABLE public.ie_profiles 
    ADD CONSTRAINT fk_profiles_auth FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Relaciones de ie_cursos
ALTER TABLE public.ie_cursos
    ADD CONSTRAINT fk_cursos_creador FOREIGN KEY (creado_por) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Relaciones de ie_actividad_institucion
ALTER TABLE public.ie_actividad_institucion
    ADD CONSTRAINT fk_actividad_institucion_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Relaciones de ie_actividad_alumnos
ALTER TABLE public.ie_actividad_alumnos
    ADD CONSTRAINT fk_actividad_alumnos_actividad FOREIGN KEY (actividad_id) REFERENCES public.ie_actividad_institucion(id) ON DELETE CASCADE;

-- Relaciones de ie_compras
ALTER TABLE public.ie_compras
    ADD CONSTRAINT fk_compras_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_compras_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_compras_referrer FOREIGN KEY (referred_by) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Relaciones de ie_constancias
ALTER TABLE public.ie_constancias
    ADD CONSTRAINT fk_constancias_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_constancias_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE;

-- Relaciones de ie_curso_modulos
ALTER TABLE public.ie_curso_modulos
    ADD CONSTRAINT fk_modulos_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE;

-- Relaciones de ie_cuestionario_preguntas
ALTER TABLE public.ie_cuestionario_preguntas
    ADD CONSTRAINT fk_cuestionario_preguntas_modulo FOREIGN KEY (modulo_id) REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE;

-- Relaciones de ie_cuestionario_respuestas
ALTER TABLE public.ie_cuestionario_respuestas
    ADD CONSTRAINT fk_cuestionario_respuestas_pregunta FOREIGN KEY (pregunta_id) REFERENCES public.ie_cuestionario_preguntas(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_cuestionario_respuestas_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Relaciones de ie_cupones
ALTER TABLE public.ie_cupones
    ADD CONSTRAINT fk_cupones_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE SET NULL;

-- Relaciones de ie_curso_historial
ALTER TABLE public.ie_curso_historial
    ADD CONSTRAINT fk_historial_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_historial_usuario FOREIGN KEY (modificado_por) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Relaciones de ie_examenes
ALTER TABLE public.ie_examenes
    ADD CONSTRAINT fk_examenes_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_examenes_modulo FOREIGN KEY (modulo_id) REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE;

-- Relaciones de ie_examenes_usuario
ALTER TABLE public.ie_examenes_usuario
    ADD CONSTRAINT fk_examenes_usuario_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_examenes_usuario_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE;

-- Relaciones de ie_gamma_generations
ALTER TABLE public.ie_gamma_generations
    ADD CONSTRAINT fk_gamma_profile FOREIGN KEY (profile_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_gamma_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_gamma_modulo FOREIGN KEY (modulo_id) REFERENCES public.ie_curso_modulos(id) ON DELETE SET NULL;

-- Relaciones de ie_institucion_creditos
ALTER TABLE public.ie_institucion_creditos
    ADD CONSTRAINT fk_creditos_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Relaciones de ie_modulo_recursos
ALTER TABLE public.ie_modulo_recursos
    ADD CONSTRAINT fk_recursos_modulo FOREIGN KEY (modulo_id) REFERENCES public.ie_curso_modulos(id) ON DELETE CASCADE;

-- Relaciones de ie_notificaciones
ALTER TABLE public.ie_notificaciones
    ADD CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_notificaciones_actor FOREIGN KEY (actor_id) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Relaciones de ie_pagos_manuales
ALTER TABLE public.ie_pagos_manuales
    ADD CONSTRAINT fk_pagos_manuales_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pagos_manuales_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pagos_manuales_referrer FOREIGN KEY (referred_by) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Relaciones de ie_preguntas
ALTER TABLE public.ie_preguntas
    ADD CONSTRAINT fk_preguntas_examen FOREIGN KEY (examen_id) REFERENCES public.ie_examenes(id) ON DELETE CASCADE;

-- Relaciones de ie_preguntas_respuestas
ALTER TABLE public.ie_preguntas_respuestas
    ADD CONSTRAINT fk_preguntas_respuestas_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_preguntas_respuestas_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Relaciones de ie_progreso_modulos
ALTER TABLE public.ie_progreso_modulos
    ADD CONSTRAINT fk_progreso_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_progreso_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE;

-- Relaciones de ie_resultados_examenes
ALTER TABLE public.ie_resultados_examenes
    ADD CONSTRAINT fk_resultados_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_resultados_examen FOREIGN KEY (examen_id) REFERENCES public.ie_examenes(id) ON DELETE CASCADE;

-- Relaciones de ie_reviews
ALTER TABLE public.ie_reviews
    ADD CONSTRAINT fk_reviews_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Tabla de comentarios y sugerencias
CREATE TABLE IF NOT EXISTS public.ie_comentarios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text,
    email text,
    mensaje text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    user_id uuid
);

-- Relaciones de ie_comentarios
ALTER TABLE public.ie_comentarios
    ADD CONSTRAINT fk_comentarios_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE SET NULL;

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_ie_comentarios_user_id ON public.ie_comentarios(user_id);
CREATE INDEX IF NOT EXISTS idx_ie_comentarios_created_at ON public.ie_comentarios(created_at);

-- Tabla de Academias
CREATE TABLE IF NOT EXISTS public.ie_academias (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creado_por uuid NOT NULL,
    nombre text NOT NULL,
    descripcion character varying(300) NOT NULL,
    categoria text NOT NULL,
    logo_url text,
    banner_url text,
    color_principal text DEFAULT '#6366f1',
    mensaje_bienvenida character varying(300),
    publica boolean DEFAULT true,
    permitir_inscripciones boolean DEFAULT true,
    certificados_automaticos boolean DEFAULT true,
    foro_discusion boolean DEFAULT false,
    correo_contacto text NOT NULL,
    telefono_contacto text,
    sitio_web text,
    redes_sociales jsonb DEFAULT '{}'::jsonb,
    color_palette integer DEFAULT 0,
    subdominio text UNIQUE NOT NULL,
    registro_abierto boolean DEFAULT true,
    requiere_aprobacion boolean DEFAULT false,
    codigo_acceso text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relaciones de ie_academias
ALTER TABLE public.ie_academias
    ADD CONSTRAINT fk_academias_creado_por FOREIGN KEY (creado_por) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Índices de rendimiento para ie_academias
CREATE INDEX IF NOT EXISTS idx_ie_academias_creado_por ON public.ie_academias(creado_por);
CREATE INDEX IF NOT EXISTS idx_ie_academias_subdominio ON public.ie_academias(subdominio);

-- Tabla de Grupos
CREATE TABLE IF NOT EXISTS public.ie_grupos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    academia_id uuid NOT NULL,
    creado_por uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    imagen_url text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relaciones de ie_grupos
ALTER TABLE public.ie_grupos
    ADD CONSTRAINT fk_grupos_academia FOREIGN KEY (academia_id) REFERENCES public.ie_academias(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_grupos_creador FOREIGN KEY (creado_por) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Índices de rendimiento para ie_grupos
CREATE INDEX IF NOT EXISTS idx_ie_grupos_academia_id ON public.ie_grupos(academia_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupos_creado_por ON public.ie_grupos(creado_por);

-- Tabla de Relación Cursos - Grupos
CREATE TABLE IF NOT EXISTS public.ie_grupo_cursos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    grupo_id uuid NOT NULL,
    curso_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_grupo_curso UNIQUE (grupo_id, curso_id)
);

-- Relaciones de ie_grupo_cursos
ALTER TABLE public.ie_grupo_cursos
    ADD CONSTRAINT fk_grupo_cursos_grupo FOREIGN KEY (grupo_id) REFERENCES public.ie_grupos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_grupo_cursos_curso FOREIGN KEY (curso_id) REFERENCES public.ie_cursos(id) ON DELETE CASCADE;

-- Índices de rendimiento para ie_grupo_cursos
CREATE INDEX IF NOT EXISTS idx_ie_grupo_cursos_grupo_id ON public.ie_grupo_cursos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupo_cursos_curso_id ON public.ie_grupo_cursos(curso_id);

-- Tabla de Relación Alumnos - Grupos
CREATE TABLE IF NOT EXISTS public.ie_grupo_alumnos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    grupo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_grupo_alumno UNIQUE (grupo_id, user_id)
);

-- Relaciones de ie_grupo_alumnos
ALTER TABLE public.ie_grupo_alumnos
    ADD CONSTRAINT fk_grupo_alumnos_grupo FOREIGN KEY (grupo_id) REFERENCES public.ie_grupos(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_grupo_alumnos_user FOREIGN KEY (user_id) REFERENCES public.ie_profiles(id) ON DELETE CASCADE;

-- Índices de rendimiento para ie_grupo_alumnos
CREATE INDEX IF NOT EXISTS idx_ie_grupo_alumnos_grupo_id ON public.ie_grupo_alumnos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_ie_grupo_alumnos_user_id ON public.ie_grupo_alumnos(user_id);



