-- Execute this in the Supabase SQL Editor to update the trigger that handles new user registrations.
-- It ensures that the newly split fields (apellido_paterno and apellido_materno) are moved from user metadata to the ie_profiles table.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.ie_profiles (
    id, 
    email, 
    nombre, 
    apellido_paterno, 
    apellido_materno, 
    rol
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'nombre', 
    new.raw_user_meta_data->>'apellido_paterno', 
    new.raw_user_meta_data->>'apellido_materno', 
    'alumno' -- Default role
  );
  RETURN new;
END;
$function$;
