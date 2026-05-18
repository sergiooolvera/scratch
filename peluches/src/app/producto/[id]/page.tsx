import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { notFound } from 'next/navigation'
import ProductOptions from '@/components/ProductOptions'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params

  const { data: dbProduct } = await supabase
    .from('pl_products')
    .select('*, pl_categories(name)')
    .eq('slug', slug)
    .single()

  let product = dbProduct;

  if (!product) {
    // Fallback para productos de prueba (mock)
    const parts = slug.split('-');
    const id = parts.pop();
    const categorySlug = parts.join('-');
    
    product = {
      id: slug,
      name: `Plantilla Especial (${categorySlug})`,
      price: 350,
      description: 'Este es un producto de prueba generado porque aún no hay productos en la base de datos. Incluye el peluche y la personalización.',
      images: [`/images/templates/${categorySlug}-${id}.png`],
      pl_categories: { name: categorySlug === 'dia-madres' ? 'Día de las Madres' : categorySlug }
    };
  }

  return (
    <>
      <Navbar />
      
      <main className="flex-grow pt-8 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-label text-outline mb-8">
          <Link className="hover:text-primary transition-colors" href="/">Inicio</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="hover:text-primary transition-colors">{product.pl_categories?.name}</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface-container-lowest custom-shadow-tier-1 rounded-xl p-4 relative overflow-hidden aspect-square md:aspect-[4/3] flex items-center justify-center group">
              <img 
                alt={product.name} 
                className="rounded-lg object-cover w-full h-full" 
                src={product.images?.[0] || 'https://via.placeholder.com/600'}
              />
              <button className="absolute inset-0 m-auto w-16 h-16 bg-surface-container-lowest/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
              {product.is_featured && (
                <div className="absolute top-8 left-8 bg-error-container text-on-error-container font-label text-sm px-4 py-2 rounded-full transform -rotate-3 shadow-md">
                  DESTACADO
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {product.images?.map((img: string, idx: number) => (
                <button key={idx} className={`flex-shrink-0 w-24 h-24 bg-surface-container-lowest custom-shadow-tier-1 rounded-lg p-2 snap-start ${idx === 0 ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50 transition-all'}`}>
                  <img alt={`${product.name} thumbnail ${idx}`} className="rounded-DEFAULT object-cover w-full h-full" src={img}/>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-on-surface mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="font-display text-4xl text-primary font-bold">${product.price}</span>
              </div>
              <p className="mt-4 font-body text-on-surface-variant leading-relaxed">
                {product.description}
              </p>
            </div>

            <ProductOptions product={product} />

            {/* Guarantees */}
            <div className="flex items-center justify-between py-6 border-t border-outline-variant/30 mt-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                <span className="font-label text-xs text-on-surface-variant">Envío Rápido</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label text-xs text-on-surface-variant">Calidad Premium</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                <span className="font-label text-xs text-on-surface-variant">Empaque Listo</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}
