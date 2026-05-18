const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const vars = {};
lines.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    vars[parts[0].trim()] = parts[1].trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get category IDs
  const { data: categories } = await supabase
    .from('pl_categories')
    .select('id, slug')
    .in('slug', ['dia-madres', 'cumpleanos']);

  console.log('Categories found:', categories);

  const diaMadres = categories.find(c => c.slug === 'dia-madres');
  const cumpleanos = categories.find(c => c.slug === 'cumpleanos');

  const products = [];

  if (diaMadres) {
    products.push(
      {
        name: 'Plantilla Clásica Mamá',
        slug: 'dia-madres-1',
        description: 'Arreglo clásico para el Día de las Madres.',
        price: 350,
        stock: 50,
        category_id: diaMadres.id,
        sku: 'DM-001',
        images: ['/images/templates/dia-madres-1.png']
      },
      {
        name: 'Diseño Premium Mamá',
        slug: 'dia-madres-2',
        description: 'Arreglo premium para el Día de las Madres.',
        price: 450,
        stock: 30,
        category_id: diaMadres.id,
        sku: 'DM-002',
        images: ['/images/templates/dia-madres-2.png']
      },
      {
        name: 'Detalle Especial Mamá',
        slug: 'dia-madres-3',
        description: 'Detalle especial para el Día de las Madres.',
        price: 280,
        stock: 20,
        category_id: diaMadres.id,
        sku: 'DM-003',
        images: ['/images/templates/dia-madres-3.png']
      }
    );
  }

  if (cumpleanos) {
    products.push(
      {
        name: 'Oso de Peluche Cumpleaños',
        slug: 'cumpleanos-1',
        description: 'Oso de peluche con pastel de cumpleaños.',
        price: 350,
        stock: 50,
        category_id: cumpleanos.id,
        sku: 'CUM-001',
        images: ['/images/templates/cumpleanos-1.png']
      },
      {
        name: 'Set de Regalo Cumpleaños',
        slug: 'cumpleanos-2',
        description: 'Set de regalo con peluche y globos.',
        price: 450,
        stock: 30,
        category_id: cumpleanos.id,
        sku: 'CUM-002',
        images: ['/images/templates/cumpleanos-2.png']
      },
      {
        name: 'Detalle Dulce Cumpleaños',
        slug: 'cumpleanos-3',
        description: 'Peluche con letrero de Feliz Cumpleaños.',
        price: 280,
        stock: 20,
        category_id: cumpleanos.id,
        sku: 'CUM-003',
        images: ['/images/templates/cumpleanos-3.png']
      }
    );
  }

  if (products.length > 0) {
    const { error } = await supabase.from('pl_products').insert(products);
    if (error) console.error('Error inserting products:', error);
    else console.log('Products inserted successfully!');
  } else {
    console.log('No categories found to insert products.');
  }
}

run();
