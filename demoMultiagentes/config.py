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

def get_deepseek_client():
    """Retorna una instancia inicializada del cliente de DeepSeek vía la SDK de OpenAI."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    except Exception as e:
        print(f"[WARNING] Error al inicializar cliente de DeepSeek: {e}")
        return None

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

def generate_deepseek_content_with_retry(client, model, system_instruction, prompt, temperature=0.3, max_retries=4, initial_delay=5):
    """Envoltura para llamadas a la API de DeepSeek con reintentos exponenciales."""
    delay = initial_delay
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": prompt}
    ]
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e)
            if any(term in err_str for term in ["429", "503", "rate_limit", "overloaded"]):
                print(f"\n[Warning] Error temporal de API DeepSeek ({err_str[:80]}...). Esperando {delay}s antes de reintentar (Intento {i+1}/{max_retries})...")
                time.sleep(delay)
                delay *= 2
            else:
                raise e
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature
    )
    return response.choices[0].message.content

def generate_agent_response(system_instruction: str, prompt: str, temperature: float = 0.3) -> str:
    """Genera respuesta de agente colocando a DeepSeek como motor primario por defecto con fallback a Gemini."""
    deepseek_client = get_deepseek_client()
    
    # 1. Intentar con DeepSeek como motor principal
    if deepseek_client is not None:
        try:
            return generate_deepseek_content_with_retry(
                client=deepseek_client,
                model="deepseek-chat",
                system_instruction=system_instruction,
                prompt=prompt,
                temperature=temperature
            )
        except Exception as e:
            print(f"[Config API] Error en llamada a DeepSeek API ({e}). Probando fallback con Gemini...")

    # 2. Fallback con Gemini si DeepSeek no está disponible o falló
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



