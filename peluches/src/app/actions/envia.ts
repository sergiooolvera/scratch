'use server'

/**
 * Server Action para integración con Envia.com
 * Se ejecuta en el servidor para evitar problemas de CORS en el navegador.
 */

export interface ShippingAddress {
  postal_code: string;
  city: string;
  state: string;
}

export interface ShippingRate {
  carrier: string;
  service_name: string;
  price: number;
  estimated_delivery: string;
}

const stateMapping: { [key: string]: string } = {
  'ciudad de méxico': 'DF',
  'cdmx': 'DF',
  'distrito federal': 'DF',
  'nuevo león': 'NL',
  'jalisco': 'JC',
  'estado de méxico': 'EM',
  'edomex': 'EM'
};

function mapState(state: string): string {
  const normalized = state.toLowerCase().trim();
  return stateMapping[normalized] || state.substring(0, 2).toUpperCase();
}

export async function getShippingRates(destination: ShippingAddress): Promise<{ rates: ShippingRate[], debug: any }> {
  // Limpiamos comillas por si acaso se guardaron con ellas en el .env
  const apiKey = process.env.ENVIA_API_KEY?.replace(/"/g, '');
  
  if (!apiKey) {
    console.error('ENVIA_API_KEY no está configurada en las variables de entorno.');
    return { rates: [], debug: 'Falta API Key' };
  }

  const carriers = ['fedex', 'dhl', 'estafeta'];
  const rates: ShippingRate[] = [];
  const debug: any = {};

  const mappedState = mapState(destination.state);

  // Datos de Origen (Acortados para evitar el error de longitud)
  const origin = {
    name: "Volando",
    phone: "5555555555",
    street: "Reforma 1",
    city: "CDMX",
    state: "CX", // Código de estado corto
    country: "MX",
    postalCode: "06600"
  };

  for (const carrier of carriers) {
    try {
      // Usamos la URL de pruebas porque el token viene del ambiente de pruebas (shipping-test.envia.com)
      const response = await fetch('https://api-test.envia.com/ship/rate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          origin,
          destination: {
            name: "Cliente",
            phone: "5555555555",
            street: "Calle Conocida",
            city: destination.city,
            state: mappedState,
            country: "MX",
            postalCode: destination.postal_code
          },
          packages: [
            {
              content: "Peluches",
              amount: 1,
              type: "box",
              dimensions: {
                length: 30,
                width: 30,
                height: 30
              },
              weight: 1,
              declaredValue: 500,
              weightUnit: "KG",
              lengthUnit: "CM"
            }
          ],
          shipment: {
            type: 1,
            carrier: carrier
          }
        })
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
        debug[carrier] = result;
      } catch (e) {
        debug[carrier] = { error: 'La respuesta no es JSON', body: text };
        continue;
      }

      if (result.meta === 'rate' && Array.isArray(result.data)) {
        result.data.forEach((service: any) => {
          rates.push({
            carrier: carrier.toUpperCase(),
            service_name: service.serviceDescription || service.service,
            price: Number(service.totalPrice),
            estimated_delivery: service.deliveryEstimate || '3 a 5 días'
          });
        });
      }
    } catch (error: any) {
      debug[carrier] = { error: error.message };
    }
  }

  return { rates, debug };
}
