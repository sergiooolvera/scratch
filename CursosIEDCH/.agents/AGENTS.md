# Reglas del Proyecto

## Gestión de Ramas y Despliegue
- Al iniciar cada conversación o tarea, se debe trabajar en la rama `staging` y utilizar el archivo de variables de entorno `.env.local`.
- Cuando el usuario solicite subir a producción, los cambios deben subirse/fusionarse a la rama `main` y desplegarse en Vercel.

## Optimización y Estructura de Base de Datos
- Al crear nuevas tablas o agregar relaciones/claves foráneas (`FOREIGN KEY`), se deben definir e implementar siempre índices de rendimiento (`CREATE INDEX IF NOT EXISTS ...`) sobre las columnas correspondientes.
- Toda nueva migración o cambio en el esquema debe quedar registrado en los archivos SQL correspondientes y actualizar el esquema general (`esquema_produccion.sql`) para asegurar que todos los ambientes (desarrollo y producción) compartan el mismo nivel de optimización.
