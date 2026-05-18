import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Product, Category } from '@/types/database'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const categoryImages: { [key: string]: string } = {
  'aniversarios': '/images/ocasiones/aniversarios.png',
  'bautizos': '/images/ocasiones/bautizos.png',
  'cumpleanos': '/images/ocasiones/cumpleanos.png',
  'dia-madres': '/images/ocasiones/dia-madres.png',
  'graduaciones': '/images/ocasiones/graduaciones.png',
  'navidad': '/images/ocasiones/navidad.png',
  'recien-nacidos': '/images/ocasiones/recien-nacidos.png',
  'san-valentin': '/images/ocasiones/san-valentin.png',
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch category
  const { data: category, error } = await supabase
    .from('pl_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  console.log('Category Fetch:', { slug, category, error })

  if (!category) {
    return (
      <>
        <Navbar />
        <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20 flex flex-col items-center justify-center text-center min-h-[500px]">
          <span className="material-symbols-outlined text-8xl text-primary/30 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
          <h1 className="text-4xl font-black text-on-surface mb-2">Estamos trabajando en esta sección</h1>
          <p className="text-on-surface-variant text-lg mb-8">Muy pronto tendremos los mejores peluches para esta categoría.</p>
          <Link href="/" className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold bouncy-hover custom-shadow-tier-1">
            Explorar otras categorías
          </Link>
          
          {/* Debug info en chiquito antes del footer */}
          <div className="mt-32 text-xs text-on-surface-variant/20 max-w-2xl text-left border-t border-outline-variant/10 pt-4">
            <p>Debug Info: Slug <span className="font-mono">{slug}</span> no encontrado en la base de datos.</p>
            {error && <p className="font-mono mt-1">Supabase: {error.message}</p>}
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Fetch products for this category
  const { data: products } = await supabase
    .from('pl_products')
    .select('*')
    .eq('category_id', category.id)

  // Mock templates for this category (fallback)
  const templates = [
    { id: 1, name: 'Plantilla Clásica', price: 350, image: `/images/templates/${slug}-1.png`, slug: `${slug}-1` },
    { id: 2, name: 'Plantilla Premium', price: 550, image: `/images/templates/${slug}-2.png`, slug: `${slug}-2` },
    { id: 3, name: 'Plantilla Dulce', price: 280, image: `/images/templates/${slug}-3.png`, slug: `${slug}-3` },
  ]

  const itemsToRender = (products && products.length > 0)
    ? products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || 'https://via.placeholder.com/600',
        slug: p.slug
      }))
    : templates;

  return (
    <>
      <Navbar />
      
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-24 space-y-12">
        {/* Header */}
        <div className="relative bg-surface-container rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6 min-h-[200px]">
          {categoryImages[category.slug] && (
            <img 
              src={categoryImages[category.slug]} 
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply"
            />
          )}
          <div className="relative z-10 p-8 md:p-12">
            <h1 className="font-display text-4xl md:text-5xl font-black text-on-surface mb-2">{category.name}</h1>
            <p className="text-on-surface-variant text-lg">Descubre los mejores detalles para esta ocasión.</p>
          </div>
          <div className="relative z-10 md:mr-12 text-sm text-on-surface-variant bg-surface px-4 py-2 rounded-full border border-outline-variant m-6 md:m-0">
            {itemsToRender.length} Diseños Disponibles
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {itemsToRender.map((item) => (
            <div 
              key={item.id}
              className="bg-surface-container-lowest custom-shadow-tier-1 rounded-xl p-4 flex flex-col group hover-lift border border-transparent hover:border-primary-container"
            >
              <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4 bg-surface-container-low">
                <img 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={item.image}
                />
              </div>
              <h3 className="font-display text-lg text-on-surface mb-1">{item.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="font-body text-primary font-bold">Desde ${item.price}</p>
                <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded-full">
                  Personalizable
                </span>
              </div>
              <Link 
                href={`/producto/${item.slug}`}
                className="mt-4 bg-primary text-on-primary font-black px-4 py-3 rounded-full text-sm hover:scale-105 transition-all duration-300 ambient-shadow-hover bouncy-hover flex items-center justify-center gap-2"
              >
                Seleccionar y Diseñar
                <span className="material-symbols-outlined text-[18px]">brush</span>
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  )
}
