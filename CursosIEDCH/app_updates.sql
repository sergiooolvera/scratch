-- 1. Actualizar la tabla ie_profiles con los campos de validación e información institucional
ALTER TABLE ie_profiles 
  ADD COLUMN IF NOT EXISTS clave_cct TEXT,
  ADD COLUMN IF NOT EXISTS fotografia_perfil TEXT,
  ADD COLUMN IF NOT EXISTS telefono_contacto_2 TEXT,
  ADD COLUMN IF NOT EXISTS correo_adicional TEXT,
  ADD COLUMN IF NOT EXISTS profesion_especialidad TEXT,
  ADD COLUMN IF NOT EXISTS institucion_labora TEXT,
  ADD COLUMN IF NOT EXISTS estado_municipio TEXT,
  ADD COLUMN IF NOT EXISTS cedula_profesional TEXT,
  ADD COLUMN IF NOT EXISTS constancia_situacion_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS rfc TEXT,
  ADD COLUMN IF NOT EXISTS aceptacion_servicios BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identidad_validada BOOLEAN DEFAULT FALSE;

-- 1.1 Actualizar el constraint de roles permitidos para incluir institucion e instructor
ALTER TABLE ie_profiles DROP CONSTRAINT IF EXISTS ie_profiles_rol_check;
ALTER TABLE ie_profiles ADD CONSTRAINT ie_profiles_rol_check 
  CHECK (rol IN ('alumno', 'profesor', 'vendedor', 'admin', 'financiero', 'institucion', 'instructor'));

-- 2. Crear tabla de configuración para precios institucionales
CREATE TABLE IF NOT EXISTS ie_config_planes_institucion (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    label TEXT
);

-- Insertar valores iniciales
INSERT INTO ie_config_planes_institucion (key, value, label) VALUES
    ('individual_precio', 50, 'Precio Constancia Individual'),
    ('pro_precio', 400, 'Precio Plan PRO mensual'),
    ('pro_cantidad', 10, 'Cantidad constancias PRO'),
    ('ultra_precio', 3000, 'Precio Plan ULTRA mensual'),
    ('ultra_cantidad', 100, 'Cantidad constancias ULTRA'),
    ('vigencia_meses', 3, 'Vigencia de paquetes en meses')
ON CONFLICT (key) DO NOTHING;

-- 3. Crear tabla de créditos y planes de instituciones
CREATE TABLE IF NOT EXISTS ie_institucion_creditos (
    user_id UUID PRIMARY KEY REFERENCES ie_profiles(id) ON DELETE CASCADE,
    creditos_restantes INTEGER DEFAULT 0,
    plan_actual TEXT DEFAULT 'ninguno',
    pago_recurrente BOOLEAN DEFAULT FALSE,
    fecha_compra TIMESTAMP WITH TIME ZONE,
    vence_en TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en ie_institucion_creditos
ALTER TABLE ie_institucion_creditos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver sus propios creditos" ON ie_institucion_creditos
    FOR SELECT USING (auth.uid() = user_id);
-- (Asumimos permisos admin si es necesario para update/insert, temporalmente se puede usar service role para escrituras)

-- 4. Crear tabla de actividades de institución
CREATE TABLE IF NOT EXISTS ie_actividad_institucion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ie_profiles(id) ON DELETE CASCADE,
    nombre_actividad TEXT NOT NULL,
    tipo_actividad TEXT NOT NULL,
    duracion TEXT NOT NULL,
    fecha_ejecucion DATE NOT NULL,
    ubicacion TEXT,
    autor TEXT NOT NULL,
    institucion_acredita TEXT DEFAULT 'INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CONDUCTA Y EL DESARROLLO HUMANO S.C.',
    fotos TEXT[],
    videos TEXT[],
    pagado_con_credito BOOLEAN DEFAULT FALSE,
    pago_metodo TEXT,
    pago_estado TEXT DEFAULT 'pendiente',
    monto_pagado NUMERIC,
    comprobante_pago TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en ie_actividad_institucion
ALTER TABLE ie_actividad_institucion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instituciones pueden leer sus actividades" ON ie_actividad_institucion
    FOR SELECT USING (auth.uid() = user_id);
-- Permitir lectura pública de actividades validadas para el verificador de códigos QR
-- Permitir lectura pública de actividades validadas para el verificador de códigos QR
CREATE POLICY "Publico puede leer actividades aprobadas" ON ie_actividad_institucion
    FOR SELECT USING (pago_estado = 'completado' OR pagado_con_credito = true);

-- 4.5 Crear tabla de alumnos/constancias por actividad
CREATE TABLE IF NOT EXISTS ie_actividad_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actividad_id UUID REFERENCES ie_actividad_institucion(id) ON DELETE CASCADE,
    nombre_alumno TEXT NOT NULL,
    correo_alumno TEXT,
    folio_constancia TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE ie_actividad_alumnos ENABLE ROW LEVEL SECURITY;
-- Instituciones leen sus propios alumnos de la actividad
CREATE POLICY "Instituciones pueden leer sus alumnos" ON ie_actividad_alumnos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ie_actividad_institucion 
            WHERE id = ie_actividad_alumnos.actividad_id AND user_id = auth.uid()
        )
    );
CREATE POLICY "Publico puede validar constancias" ON ie_actividad_alumnos
    FOR SELECT USING (true);

-- 5. Crear tabla de progreso de módulos de alumnos
CREATE TABLE IF NOT EXISTS ie_progreso_modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    curso_id UUID NOT NULL REFERENCES ie_cursos(id) ON DELETE CASCADE,
    modulo_id TEXT NOT NULL,
    visto BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, curso_id, modulo_id)
);

-- Habilitar RLS en ie_progreso_modulos
ALTER TABLE ie_progreso_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alumnos pueden leer y escribir su progreso" ON ie_progreso_modulos
    FOR ALL USING (auth.uid() = user_id);

-- 6. Actualizar el trigger de handle_new_user()
-- Este trigger suele estar en la DB, lo reemplazamos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.ie_profiles (id, nombre, apellido_paterno, apellido_materno, email, rol, telefono, clave_cct)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', 'Usuario'), 
    new.raw_user_meta_data->>'apellido_paterno',
    new.raw_user_meta_data->>'apellido_materno',
    new.email, 
    COALESCE(new.raw_user_meta_data->>'rol', 'alumno'),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'clave_cct'
  );
  
  -- Si el rol es institucion, inicializar sus creditos en 0
  IF COALESCE(new.raw_user_meta_data->>'rol', 'alumno') = 'institucion' THEN
    INSERT INTO public.ie_institucion_creditos (user_id, creditos_restantes, plan_actual)
    VALUES (new.id, 0, 'ninguno');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Actualizar Políticas de RLS en ie_cursos para el rol 'instructor'
-- Ejecuta esto en Supabase > SQL Editor para permitir que los Instructores creen y gestionen sus propios cursos.

-- Habilitar RLS en ie_cursos si no está habilitado
ALTER TABLE public.ie_cursos ENABLE ROW LEVEL SECURITY;

-- Eliminar de forma limpia cualquier política existente en ie_cursos para evitar colisiones
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ie_cursos' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ie_cursos', r.policyname);
    END LOOP;
END $$;

-- Crear políticas nuevas y unificadas para ie_cursos
CREATE POLICY "Permitir lectura publica de cursos" ON public.ie_cursos
    FOR SELECT USING (true);

CREATE POLICY "Permitir crear cursos a admin, profesor e instructor" ON public.ie_cursos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_profiles
            WHERE id = auth.uid() AND rol IN ('admin', 'profesor', 'instructor')
        )
    );

CREATE POLICY "Permitir editar cursos propios o como admin" ON public.ie_cursos
    FOR UPDATE USING (
        auth.uid() = creado_por OR 
        EXISTS (
            SELECT 1 FROM public.ie_profiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Permitir eliminar cursos propios o como admin" ON public.ie_cursos
    FOR DELETE USING (
        auth.uid() = creado_por OR 
        EXISTS (
            SELECT 1 FROM public.ie_profiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );


-- 8. Actualizar Políticas de RLS en ie_curso_modulos, ie_examenes e ie_preguntas
-- Habilitar RLS en tablas secundarias
ALTER TABLE public.ie_curso_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_examenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ie_preguntas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes en ie_curso_modulos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ie_curso_modulos' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ie_curso_modulos', r.policyname);
    END LOOP;
END $$;

-- Crear nuevas políticas para ie_curso_modulos
CREATE POLICY "Permitir lectura publica de modulos" ON public.ie_curso_modulos
    FOR SELECT USING (true);

CREATE POLICY "Permitir insertar modulos a creador de curso o admin" ON public.ie_curso_modulos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir editar modulos a creador de curso o admin" ON public.ie_curso_modulos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir eliminar modulos a creador de curso o admin" ON public.ie_curso_modulos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );


-- Eliminar políticas existentes en ie_examenes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ie_examenes' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ie_examenes', r.policyname);
    END LOOP;
END $$;

-- Crear nuevas políticas para ie_examenes
CREATE POLICY "Permitir lectura autenticados de examenes" ON public.ie_examenes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir insertar examenes a creador de curso o admin" ON public.ie_examenes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir editar examenes a creador de curso o admin" ON public.ie_examenes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir eliminar examenes a creador de curso o admin" ON public.ie_examenes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ie_cursos
            WHERE ie_cursos.id = curso_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );


-- Eliminar políticas existentes en ie_preguntas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'ie_preguntas' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ie_preguntas', r.policyname);
    END LOOP;
END $$;

-- Crear nuevas políticas para ie_preguntas
CREATE POLICY "Permitir lectura autenticados de preguntas" ON public.ie_preguntas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir insertar preguntas a creador de examen o admin" ON public.ie_preguntas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ie_examenes
            JOIN public.ie_cursos ON ie_cursos.id = ie_examenes.curso_id
            WHERE ie_examenes.id = examen_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir editar preguntas a creador de examen o admin" ON public.ie_preguntas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ie_examenes
            JOIN public.ie_cursos ON ie_cursos.id = ie_examenes.curso_id
            WHERE ie_examenes.id = examen_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );

CREATE POLICY "Permitir eliminar preguntas a creador de examen o admin" ON public.ie_preguntas
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ie_examenes
            JOIN public.ie_cursos ON ie_cursos.id = ie_examenes.curso_id
            WHERE ie_examenes.id = examen_id AND (ie_cursos.creado_por = auth.uid() OR EXISTS (
                SELECT 1 FROM public.ie_profiles WHERE id = auth.uid() AND rol = 'admin'
            ))
        )
    );


-- Otorgar accesos explícitos
GRANT ALL ON TABLE public.ie_cursos TO authenticated;
GRANT ALL ON TABLE public.ie_cursos TO service_role;
GRANT ALL ON TABLE public.ie_curso_modulos TO authenticated;
GRANT ALL ON TABLE public.ie_curso_modulos TO service_role;
GRANT ALL ON TABLE public.ie_examenes TO authenticated;
GRANT ALL ON TABLE public.ie_examenes TO service_role;
GRANT ALL ON TABLE public.ie_preguntas TO authenticated;
GRANT ALL ON TABLE public.ie_preguntas TO service_role;


-- 5. Crear tabla de valoraciones/comentarios de cursos (ie_reviews)
CREATE TABLE IF NOT EXISTS public.ie_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.ie_cursos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.ie_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(curso_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.ie_reviews ENABLE ROW LEVEL SECURITY;

-- Crear políticas
DROP POLICY IF EXISTS "Permitir lectura publica de valoraciones" ON public.ie_reviews;
CREATE POLICY "Permitir lectura publica de valoraciones" ON public.ie_reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insertar valoraciones a usuarios autenticados" ON public.ie_reviews;
CREATE POLICY "Permitir insertar valoraciones a usuarios autenticados" ON public.ie_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Permitir actualizar/eliminar su propia valoracion" ON public.ie_reviews;
CREATE POLICY "Permitir actualizar/eliminar su propia valoracion" ON public.ie_reviews
    FOR ALL USING (auth.uid() = user_id);

-- Otorgar accesos
GRANT ALL ON TABLE public.ie_reviews TO authenticated;
GRANT ALL ON TABLE public.ie_reviews TO service_role;

