import os
import time
from dotenv import load_dotenv
from google import genai

# Cargar variables de entorno del archivo .env si existe
load_dotenv()

# Verificar claves
gemini_key = os.getenv("GEMINI_API_KEY")
deepseek_key = os.getenv("DEEPSEEK_API_KEY")

if not gemini_key:
    print("[WARNING] GEMINI_API_KEY no encontrada en las variables de entorno.")

def get_gemini_client():
    """Retorna una instancia inicializada del cliente de Gemini."""
    return genai.Client()

def get_primary_llm_client():
    """Retorna el cliente principal (DeepSeek u OpenAI) y la configuración del modelo correspondiente."""
    deepseek_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    # Si es clave de OpenAI (comienza con sk-proj-)
    if deepseek_key.startswith("sk-proj-") or openai_key.startswith("sk-proj-"):
        try:
            from openai import OpenAI
            key = deepseek_key if deepseek_key.startswith("sk-proj-") else openai_key
            print("[Config API] Usando motor principal OpenAI (gpt-4o-mini)...")
            return OpenAI(api_key=key), "gpt-4o-mini", "openai"
        except Exception as e:
            print(f"[WARNING] Error al inicializar cliente de OpenAI: {e}")

    # Si es clave nativa de DeepSeek
    if deepseek_key and not deepseek_key.startswith("sk-proj-"):
        try:
            from openai import OpenAI
            print("[Config API] Usando motor principal DeepSeek (deepseek-chat)...")
            return OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com"), "deepseek-chat", "deepseek"
        except Exception as e:
            print(f"[WARNING] Error al inicializar cliente de DeepSeek: {e}")

def generate_content_with_retry(client, model, contents, config, max_retries=4, initial_delay=5):
    """Envoltura para generate_content de Gemini con reintentos exponenciales ante rate limit (429) o sobrecarga de servidor (503)."""
    delay = initial_delay
    for i in range(max_retries):
        try:
            return client.models.generate_content(model=model, contents=contents, config=config)
        except Exception as e:
            err_str = str(e)
            if any(term in err_str for term in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                print(f"\n[Warning] Error temporal de API Gemini ({err_str[:80]}...). Esperando {delay}s antes de reintentar (Intento {i+1}/{max_retries})...")
                time.sleep(delay)
                delay *= 2
            else:
                raise e
    return client.models.generate_content(model=model, contents=contents, config=config)


def generate_agent_response(system_instruction: str, prompt: str, temperature: float = 0.3) -> str:
    """Genera respuesta de agente colocando al motor principal (DeepSeek/OpenAI) como primario por defecto con fallback a Gemini."""
    client, model_name, provider = get_primary_llm_client()
    
    # 1. Intentar con el motor principal
    if client is not None:
        try:
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Config API] Error en llamada a {provider} API ({e}). Probando fallback con Gemini...")

    print("[Config API] ⚠️  No se detectó clave de DeepSeek/OpenAI válida en .env. Usando fallback con Gemini...")

    # 2. Fallback con Gemini si el motor principal no está disponible o falló
    gemini_client = get_gemini_client()
    try:
        response = generate_content_with_retry(
            client=gemini_client,
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature
            )
        )
        return response.text
    except Exception as e:
        print(f"[Config API] Error al consultar Gemini: {e}")
        return f"Error al generar respuesta del agente: {str(e)}"




