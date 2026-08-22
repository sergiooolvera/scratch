# Bitácora de Desarrollo - CursosIEDCH

## Fecha: 2026-08-21
### Tarea: Resolución de Error de Build ("Import map: aliased to relative './components/landing/Testimonials'")

#### Diagnóstico del Problema:
- **Causa Raíz:** En `app/page.tsx` se importó el componente `Testimonials` (y otros componentes de la landing) mediante `@/components/landing/Testimonials`.
- Los nuevos archivos de componentes en `components/landing/`, las imágenes en `public/images/` y las pruebas E2E en `e2e/landing.spec.ts` fueron creados localmente pero estaban como **archivos sin rastrear (untracked files)** en Git.
- Al intentar ejecutar la compilación remota / despliegue en Vercel o desde el repositorio remoto, Next.js no encontraba la ruta del módulo `components/landing/Testimonials` al no estar commiteados en el repositorio.

#### Acciones Realizadas:
1. **Verificación de Compilación Local:** Se ejecutó `npm run build` localmente y la compilación de Next.js finalizó exitosamente.
2. **Ajuste de Pruebas E2E (Playwright):**
   - Se ajustó el selector del logo en [`e2e/courses.spec.ts`](file:///C:/Users/sergi/.gemini/antigravity/scratch/CursosIEDCH/e2e/courses.spec.ts) a `img[alt*="Logo"]` para coincidir con `alt="Logo EGAC"`.
   - Se ejecutaron las pruebas E2E con `npx playwright test`, validando que las 28 pruebas pasaron sin ningún error.
3. **Instrucciones para Despliegue:**
   - Agregar los archivos a Git (`git add components/landing/ public/images/ e2e/landing.spec.ts`).
   - Confirmar los cambios con commit y push a la rama `staging`.
