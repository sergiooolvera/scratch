/**
 * Servicio para integración real con Envia.com
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

export async function getShippingRates(destination: ShippingAddress): Promise<ShippingRate[]> {
  const apiKey = process.env.ENVIA_API_KEY;
  
  if (!apiKey) {
    console.error('ENVIA_API_KEY no está configurada en las variables de entorno.');
    return [];
  }

  const carriers = ['fedex', 'dhl', 'estafeta'];
  const rates: ShippingRate[] = [];

  // Datos de Origen (Debes cambiarlos por la dirección real de tu bodega/tienda)
  const origin = {
    name: "Volando al Universo",
    phone: "5555555555",
    street: "Av. Paseo de la Reforma 1",
    city: "Ciudad de México",
    state: "CDMX",
    country: "MX",
    postalCode: "06600"
  };

  // Envia.com requiere cotizar una paquetería a la vez
  for (const carrier of carriers) {
    try {
      const response = await fetch('https://api.envia.com/ship/rate/', {
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
            street: "Calle Conocida", // Envia requiere calle aunque sea cotización
            city: destination.city,
            state: destination.state,
            country: "MX",
            postalCode: destination.postal_code
          },
          packages: [
            {
              weight: 1, // 1 kg por defecto para peluches
              length: 30,
              width: 30,
              height: 30,
              declaredValue: 500 // Valor declarado estimado
            }
          ],
          shipment: {
            type: 1, // 1 = Paquete
            carrier: carrier
          }
        })
      });

      const result = await response.json();

      if (result.meta === 'done' && Array.isArray(result.data)) {
        result.data.forEach((service: any) => {
          rates.push({
            carrier: carrier.toUpperCase(),
            service_name: service.serviceName,
            price: Number(service.totalPrice),
            estimated_delivery: service.deliveryDescription || '3 a 5 días'
          });
        });
      } else {
        console.warn(`No se obtuvieron tarifas para ${carrier}:`, result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error(`Error al consultar tarifas para ${carrier}:`, error);
    }
  }

  return rates;
}
