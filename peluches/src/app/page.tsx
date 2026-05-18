import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Category, Product } from '@/types/database'

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

export const revalidate = 3600 // Revalidar cada hora

export default async function Home() {
  // Fetch categories
  const { data: categories } = await supabase
    .from('pl_categories')
    .select('*')
    .order('name')

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from('pl_products')
    .select('*, pl_categories(name)')
    .eq('is_featured', true)
    .limit(3)

  return (
    <>
      <Navbar />

      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-24 space-y-24">
        {/* Hero Section */}
        <section className="relative w-full rounded-xl overflow-hidden bg-primary-fixed flex items-center min-h-[600px] ambient-shadow">
          <img
            alt="Hero plushie"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-40 mix-blend-multiply"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu1uEkPEHMw4aNLNeSLhdBmKS74mLvEXr8k0U5UJ_f6EmK9mGFajc7K-iFQvGMzpHNSLc0bDHmCfNXYeC_0yc5l5oIi9lH2KYUZSBtOmvsSKsd-5XA97UsjxI52WSgEoZ5D0kGSOfDQ0ojzN9WDrbdCmP81ZT87gaOxGQKhGyQoIxjblx66Aw8Xqy3rZ30xBtWkLr2ZnkbhjgmP5OrFPP8RduFU3bWiuN5PCGaxUcnakpMuA0OW_39RaQs5vVizVsgGWxcXD68"
          />
          <div className="relative z-10 p-8 md:p-20 max-w-2xl bg-white/90 backdrop-blur-xl rounded-xl m-6 md:m-12 border border-white/50 ambient-shadow">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-sm mb-8 shadow-md">
              <span className="material-symbols-outlined text-[18px] animate-pulse">MLBV</span>
              NUEVA COLECCIÓN
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-black text-on-surface mb-6 leading-tight tracking-tight">
              Regalos que abrazan el alma.
            </h1>
            <p className="text-xl text-on-surface-variant mb-10 max-w-lg leading-relaxed">
              Descubre nuestra nueva línea Candy: peluches ultra suaves diseñados para llenar de alegría y color cada rincón de tu vida.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary text-on-primary px-10 py-5 rounded-full font-bold text-lg hover:bg-on-primary-fixed-variant transition-all ambient-shadow-hover bouncy-hover">
                Ver Colección
              </button>
              <button className="bg-secondary-container text-on-secondary-container px-10 py-5 rounded-full font-bold text-lg hover:bg-secondary-fixed-dim transition-all bouncy-hover">
                Regalos Express
              </button>
            </div>
          </div>
        </section>

        {/* Occasion Categories */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-4xl md:text-5xl font-black text-on-surface">Explora por Ocasión</h2>
            <p className="text-lg text-on-surface-variant">Cada momento tiene su compañero perfecto. Encuentra el tuyo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories?.map((category: Category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group relative rounded-xl overflow-hidden bg-surface-container aspect-[4/5] flex flex-col justify-end ambient-shadow-hover bouncy-hover border-4 border-transparent hover:border-primary/20"
              >
                {categoryImages[category.slug] ? (
                  <img
                    src={categoryImages[category.slug]}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-primary/20"></div> /* Fallback color */
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 p-6">
                  <div className="bg-surface/95 backdrop-blur-md p-5 rounded-lg w-full border border-outline-variant flex justify-between items-center group-hover:-translate-y-2 transition-transform duration-300">
                    <h3 className="text-2xl font-black text-primary">{category.name}</h3>
                    <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {category.slug === 'cumpleanos' ? 'cake' : category.slug === 'aniversarios' ? 'favorite' : 'celebration'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-4xl font-black text-on-surface">Destacados del Mes</h2>
              <p className="text-lg text-on-surface-variant">Nuestros peluches más queridos, listos para un nuevo hogar.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="bg-surface-container-lowest custom-shadow-tier-1 rounded-xl p-4 flex flex-col group hover-lift border border-transparent hover:border-primary-container"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4 bg-surface-container-low">
                    {product.images?.[0] && (
                      <img
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={product.images[0]}
                      />
                    )}
                  </div>
                  <h3 className="font-display text-lg text-on-surface mb-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="font-body text-primary font-bold">${product.price}</p>
                    <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded-full">
                      {product.pl_categories?.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interactive Experience Section */}
        <section className="bg-secondary-container/30 rounded-xl p-8 md:p-20 flex flex-col md:flex-row items-center gap-16 border border-secondary-container ambient-shadow relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl"></div>
          <div className="flex-1 space-y-8 relative z-10">
            <span className="inline-block px-5 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-sm tracking-wider uppercase">
              Build-A-Friend
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-on-surface leading-tight">Crea tu propio compañero ideal</h2>
            <p className="text-xl text-on-surface-variant leading-relaxed">
              Personaliza cada detalle: desde el color del pelaje hasta el mensaje oculto en su interior. Una experiencia mágica para un regalo que durará toda la vida.
            </p>
            <div className="pt-4">
              <button className="bg-primary text-on-primary font-black px-12 py-5 rounded-full text-lg hover:scale-105 transition-all duration-300 ambient-shadow-hover bouncy-hover inline-flex items-center gap-3">
                Comenzar Personalización
                <span className="material-symbols-outlined">magic_button</span>
              </button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative group">
            <div className="aspect-[4/3] rounded-xl bg-white p-4 relative z-10 ambient-shadow border border-outline-variant/30 group-hover:rotate-2 transition-transform duration-500">
              <img
                alt="Personalización de peluches"
                className="w-full h-full object-cover rounded-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD58hCmd4gC8oXQ25XuBlkNTvI2daRLjcXUMHo1cjvDkhIMdR6F_O3auAXlVpqwDYhGq7e4QaPln5XXZKQyAlYRSZQrttUG7_nrLc5qsfrZYlVJKgDaNSTnXnLYCE8n2B5ph7mxp2m5V1PWbr9aMlrNtmlLFhjwdZCM_2w7tjzBTUIzL6SpsYf1PZZHQClsTenpdV0Lm72WGFHI8Uh3XjRnGaktivNuVUNrifzDgsFXlcStfu6E1A6MA9pi9C8SnHMVkACtqSPv"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full blur-2xl opacity-40 animate-pulse"></div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-4xl font-black text-on-surface">Historias de Alegría</h2>
            <p className="text-lg text-on-surface-variant">Lo que dicen nuestros clientes sobre sus nuevos amigos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-outline-variant/30 ambient-shadow space-y-4">
              <div className="flex gap-1 text-primary">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="italic text-on-surface-variant">"El regalo perfecto para mi sobrina. La calidad es increíble y el color rosa Candy es simplemente precioso. ¡Le encantó!"</p>
              <div className="flex items-center gap-3 pt-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">ML</div>
                <div>
                  <p className="font-bold text-on-surface">María López</p>
                  <p className="text-sm text-on-surface-variant">Mamá feliz</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-outline-variant/30 ambient-shadow space-y-4">
              <div className="flex gap-1 text-secondary">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="italic text-on-surface-variant">"Personalizar mi peluche fue una experiencia muy divertida. El envío fue súper rápido y llegó empacado de maravilla."</p>
              <div className="flex items-center gap-3 pt-4">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold">RG</div>
                <div>
                  <p className="font-bold text-on-surface">Roberto Gómez</p>
                  <p className="text-sm text-on-surface-variant">Cliente fiel</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-outline-variant/30 ambient-shadow space-y-4">
              <div className="flex gap-1 text-tertiary">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="italic text-on-surface-variant">"Nunca había visto peluches tan suaves. Compré uno para mi graduación y se ha convertido en mi amuleto de la suerte."</p>
              <div className="flex items-center gap-3 pt-4">
                <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary font-bold">AS</div>
                <div>
                  <p className="font-bold text-on-surface">Ana Silva</p>
                  <p className="text-sm text-on-surface-variant">Graduada 2024</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating Chatbot FAB */}
      <button aria-label="Open Chat" className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-on-primary rounded-xl shadow-2xl flex items-center justify-center hover:-translate-y-2 transition-all duration-300 bouncy-hover z-50 group focus:outline-none focus:ring-8 focus:ring-primary-container">
        <span className="material-symbols-outlined text-[36px] group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full border-4 border-surface shadow-lg"></span>
      </button>
    </>
  )
}
