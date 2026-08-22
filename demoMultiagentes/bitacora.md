# Bitácora de Desarrollo - Ejemplo Multiagentes

Este proyecto es un ejemplo práctico y educativo de un sistema multiagente autónomo en Python, utilizando la API de Gemini.

## [2026-07-02] Cambio de Enfoque a Pronosticador Deportivo
- **Nueva Meta**: Desarrollar un pronosticador de eventos deportivos usando multiagentes autónomos.
- **Decisión de Diseño**: Patrón Orquestador con tres agentes:
  1. **Analista Estadístico**: Revisa historial de partidos, estadísticas de goles/puntos y rendimiento de los equipos.
  2. **Analista de Noticias/Contexto**: Evalúa lesiones, suspensiones, localía y estado anímico/noticias recientes.
  3. **Pronosticador**: Consolida los reportes previos para emitir un pronóstico final de probabilidad y resultado estimado.
- **Tecnologías**: Python, SDK oficial `google-genai`.

## [2026-07-02] Implementación Completada
- **Archivos Creados**:
  - `requirements.txt`: Dependencias del sistema.
  - `config.py`: Cliente global de la API.
  - `agents/stats_analyst.py`: Agente de estadísticas (usa Google Search).
  - `agents/news_analyst.py`: Agente de noticias (usa Google Search).
  - `agents/predictor.py`: Agente consolidador de pronósticos.
  - `orchestrator.py`: Orquestador principal de flujo.
  - `.env`: Archivo de configuración de variables de entorno.
## [2026-07-06] Implementación de Calibración de Riesgos y Agente "Abogado del Diablo"
- **Problema Detectado**: Alucinaciones deportivas, sesgo de favoritismo (optimismo ingenuo) y falta de validación de alineaciones oficiales.
- **Mejoras Aplicadas**:
  1. **Actualización de Prompts**: Se obligó al Analista Estadístico a buscar cuotas de apuestas reales de mercado (odds) y al Analista de Noticias a corroborar la existencia real del partido, fechas vigentes y convocatorias de estrellas.
  2. **Nuevo Agente**: Se creó `DevilAdvocateAgent` (`agents/devil_advocate.py`) enfocado en Red Teaming, escaneo de alucinaciones, análisis del underdog y calibración a la baja de probabilidades sobre-estimadas.
  3. **Lógica de Orquestación y Predicción**: Se modificó `orchestrator.py` y `predictor.py` para generar primero una predicción preliminar, someterla a la crítica del Abogado del Diablo, y luego emitir un Veredicto Final Calibrado.
- **Resultado del Test (Dodgers vs. Padres)**: El sistema detectó exitosamente que no había juego programado para la fecha consultada, detectó una asignación incorrecta de lanzador (Buehler asignado a Padres), bajó drásticamente el nivel de confianza de la predicción a **BAJO**, y ajustó las probabilidades del 62% a un 51%-49% realista.

## [2026-07-06] Consolidación de Arquitectura de 3 Fases y Feedback Loop
- **Problema Detectado**: Picos de demanda (error 503) y limitaciones de cuota diaria del Free Tier de Gemini (20 peticiones diarias por modelo) agotaban la API rápidamente con las 7 llamadas originales.
- **Mejoras Aplicadas**:
  1. **Consolidación de Agentes**: Unificación de `StatsAnalyst`, `NewsAnalyst` y `MarketAnalyst` en un único `UnifiedAnalystAgent` (`agents/unified_analyst.py`).
  2. **Persistencia SQLite**: Creación de `predictions.db` (`utils/database.py`) para registrar todas las predicciones en estado `PENDING`.
  3. **Auto-Corrección y Aprendizaje**: Implementación de `resolve_predictions.py` para cerrar partidos jugados (HIT/MISS) y alimentar un historial de lecciones pasadas inyectado en el predictor final.
  4. **Motor de Reintentos de API**: Envoltura en `config.py` para capturar errores 429 (cuota) y 503 (servidor saturado) con pausas exponenciales de espera.
  5. **Extracción Local**: Eliminación del extractor redundante de Gemini, extrayendo metadatos numéricos localmente mediante expresiones regulares del reporte final del predictor.
- **Resultado**: El sistema corre de manera robusta y transparente, reduciendo el consumo de cuota diaria en un 55% y recuperándose automáticamente ante sobrecargas del servidor de Gemini.

## [2026-08-21] Migración Total a DeepSeek como Motor Principal
- **Requerimiento del Usuario**: Convertir **DeepSeek (`deepseek-chat`)** en la API principal obligatoria para **todos los agentes** del proyecto.
- **Mejoras Aplicadas**:
  1. **Motor Unificado en `config.py`**:
     - Se creó la función `generate_agent_response()`, la cual canaliza automáticamente todas las peticiones a la API de DeepSeek (`https://api.deepseek.com`) como primera opción prioritaria.
  2. **Refactorización de Agentes**:
     - `UnifiedAnalystAgent` ([`agents/unified_analyst.py`](file:///c:/Users/sergi/.gemini/antigravity/scratch/demoMultiagentes/agents/unified_analyst.py)): Migrado a DeepSeek como motor primario.
     - `DevilAdvocateAgent` ([`agents/devil_advocate.py`](file:///c:/Users/sergi/.gemini/antigravity/scratch/demoMultiagentes/agents/devil_advocate.py)): Migrado a DeepSeek como motor primario.
     - `PredictorAgent` ([`agents/predictor.py`](file:///c:/Users/sergi/.gemini/antigravity/scratch/demoMultiagentes/agents/predictor.py)): Migrado a DeepSeek como motor primario en predicción preliminar y final.
  3. **Visualización y Veredicto Sintetizado**:
     - Todos los agentes realizan su análisis interno a profundidad vía DeepSeek y presentan el veredicto final sintetizado al inicio del reporte.





