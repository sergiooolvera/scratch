'use client'

import { useState } from 'react'
import { getShippingRates } from '@/app/actions/envia'

export default function TestEnvia() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      // Usamos un código postal de prueba (Reforma, CDMX)
      const { rates, debug } = await getShippingRates({
        postal_code: '06600',
        city: 'CDMX',
        state: 'DF'
      })
      setResult({ rates, debug })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-primary mb-4">Herramienta de Diagnóstico: Envia.com</h1>
      <p className="text-on-surface-variant mb-6">Usa este botón para probar la conexión con Envia.com desde el servidor.</p>
      
      <button 
        onClick={handleTest}
        className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
        ) : 'Probar Conexión'}
      </button>
      
      {result && (
        <div className="mt-8">
          <h2 className="font-bold mb-2">Resultado de la API:</h2>
          <pre className="bg-surface-container-high p-6 rounded-xl text-xs overflow-auto max-h-[400px] font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
