'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Category } from '@/types/database'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadProductImage } from '@/app/actions/inventory'
import { supabase } from '@/lib/supabase'

export default function AdminInventory() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [view, setView] = useState<'lista' | 'crear' | 'editar'>('lista')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    sku: '',
    is_featured: false,
    image_url: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const role = session?.user.user_metadata?.role
      
      if (!session || (role !== 'admin' && role !== 'gestor')) {
        alert('Acceso denegado. No tienes permisos para acceder a esta sección.')
        window.location.href = '/'
        return
      }
      
      setCheckingAuth(false)
      fetchCategories()
      fetchProducts()
    }
    
    checkAuth()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error: any) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error: any) {
      console.error('Error al cargar productos:', error)
    }
    setLoading(false)
  }

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category_id: product.category_id,
      sku: product.sku || '',
      is_featured: product.is_featured || false,
      image_url: product.images?.[0] || ''
    })
    setFile(null)
    setView('editar')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let imageUrl = formData.image_url

    if (file) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      try {
        imageUrl = await uploadProductImage(uploadFormData)
      } catch (error: any) {
        alert('Error al subir imagen: ' + error.message)
        setLoading(false)
        return
      }
    }
    
    const productData = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-'),
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category_id: formData.category_id,
      sku: formData.sku,
      is_featured: formData.is_featured,
      images: imageUrl ? [imageUrl] : (selectedProduct?.images || ['https://via.placeholder.com/600'])
    }

    try {
      if (view === 'crear') {
        await createProduct(productData)
        alert('¡Producto guardado con éxito!')
        resetForm()
        fetchProducts()
        setView('lista')
      } else if (view === 'editar') {
        await updateProduct(selectedProduct.id, productData)
        alert('¡Producto actualizado con éxito!')
        resetForm()
        fetchProducts()
        setView('lista')
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  const handleDeleteClick = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProduct(id)
        alert('Producto eliminado')
        fetchProducts()
      } catch (error: any) {
        alert('Error al eliminar: ' + error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      sku: '',
      is_featured: false,
      image_url: ''
    })
    setFile(null)
    setSelectedProduct(null)
  }

  // Filtrado de productos
  const filteredProducts = products.filter(prod => {
    const matchesName = prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategoryFilter ? prod.category_id === selectedCategoryFilter : true
    return matchesName && matchesCategory
  })

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-primary animate-pulse">Verificando credenciales...</div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      
      <main className="w-full px-4 md:px-10 lg:px-16 py-10 min-h-screen">
        
        {view === 'lista' ? (
          <>
            {/* Header Lista */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-sm font-bold mb-3 tracking-wide">ADMINISTRACIÓN</span>
                <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Inventario de Productos</h1>
                <p className="text-on-surface-variant mt-2 text-lg">Gestiona el catálogo de peluches, dulces y flores.</p>
              </div>
              <div>
                <button 
                  onClick={() => { resetForm(); setView('crear'); }}
                  className="px-8 py-3 rounded-full bg-primary text-on-primary font-bold custom-shadow-tier-1 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Nuevo Producto
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input 
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full pl-12 pr-5 py-3 rounded-full bg-white border border-surface-variant ring-2 ring-transparent focus:ring-primary focus:border-primary transition-all text-on-surface outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <select 
                  className="w-full px-5 py-3 rounded-full bg-white border border-surface-variant ring-2 ring-transparent focus:ring-primary focus:border-primary transition-all text-on-surface outline-none appearance-none"
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-white rounded-xl shadow-sm border border-surface-variant overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm">
                    <th className="p-4 font-bold">Producto</th>
                    <th className="p-4 font-bold">Categoría</th>
                    <th className="p-4 font-bold">Precio</th>
                    <th className="p-4 font-bold">Stock</th>
                    <th className="p-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-on-surface-variant">Cargando productos...</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-on-surface-variant">No se encontraron productos.</td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => (
                      <tr key={prod.id} className="border-t border-surface-variant hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img 
                            src={prod.images?.[0] || 'https://via.placeholder.com/50'} 
                            alt={prod.name} 
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-bold text-on-surface">{prod.name}</div>
                            <div className="text-xs text-on-surface-variant">SKU: {prod.sku || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{prod.pl_categories?.name || 'Sin categoría'}</td>
                        <td className="p-4 font-bold text-primary">${prod.price}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${prod.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {prod.stock} unid.
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(prod)}
                              className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center hover:scale-110 transition-transform"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(prod.id)}
                              className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center hover:scale-110 transition-transform"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Formulario (Crear o Editar) */
          <form onSubmit={handleSubmit}>
            {/* Header Form */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-sm font-bold mb-3 tracking-wide">ADMINISTRACIÓN</span>
                <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">
                  {view === 'crear' ? 'Alta de Nuevo Producto' : 'Edición de Producto'}
                </h1>
                <p className="text-on-surface-variant mt-2 text-lg">
                  {view === 'crear' ? 'Crea la magia agregando nuevos peluches.' : `Editando: ${selectedProduct?.name}`}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { resetForm(); setView('lista'); }}
                  className="px-6 py-3 rounded-full border-2 border-outline text-on-surface font-bold hover:bg-surface-variant transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 rounded-full bg-primary text-on-primary font-bold custom-shadow-tier-1 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  {loading ? 'Guardando...' : view === 'crear' ? 'Guardar Producto' : 'Actualizar Producto'}
                </button>
              </div>
            </div>

            {/* Form Layout: Bento Grid Style */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <section className="bg-white p-8 rounded-lg shadow-sm border border-surface-variant">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">Información General</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Nombre del Producto</label>
                      <input 
                        required
                        className="w-full px-5 py-4 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none" 
                        placeholder="Ej: Osito Cariñoso" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Descripción</label>
                      <textarea 
                        required
                        className="w-full px-5 py-4 rounded-lg bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none" 
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Categoría</label>
                        <select 
                          required
                          className="w-full px-5 py-4 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none appearance-none"
                          value={formData.category_id}
                          onChange={e => setFormData({...formData, category_id: e.target.value})}
                        >
                          <option value="">Selecciona una categoría</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">SKU</label>
                        <input 
                          className="w-full px-5 py-4 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none" 
                          placeholder="PLU-O-001"
                          value={formData.sku}
                          onChange={e => setFormData({...formData, sku: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    {/* Campo de Imagen (URL o Archivo) */}
                    <div className="group">
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Imagen del Producto</label>
                      <div className="flex flex-col gap-4">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={e => setFile(e.target.files?.[0] || null)}
                          className="text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary-container/80 file:cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-on-surface-variant whitespace-nowrap">O ingresa una URL:</span>
                          <input 
                            className="flex-grow px-5 py-3 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none text-sm" 
                            placeholder="Ej: /images/templates/dia-madres-1.png" 
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                          />
                        </div>
                        {formData.image_url && (
                          <div className="mt-2">
                            <span className="text-xs text-on-surface-variant">Vista previa actual:</span>
                            <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-surface-variant mt-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-8 rounded-lg shadow-sm border border-surface-variant">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">Precio y Existencias</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Precio ($)</label>
                      <input 
                        required
                        type="number" step="0.01"
                        className="w-full px-5 py-4 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none font-bold" 
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Stock</label>
                      <input 
                        required
                        type="number"
                        className="w-full px-5 py-4 rounded-full bg-surface-container-low border-none ring-2 ring-transparent focus:ring-primary focus:bg-white transition-all text-on-surface outline-none" 
                        placeholder="50"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <section className="bg-secondary p-8 rounded-lg custom-shadow-tier-2 text-white">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">visibility</span>
                    Visibilidad
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span>Destacar en portada</span>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                        className={`w-12 h-6 rounded-full relative cursor-pointer flex items-center p-1 transition-colors ${formData.is_featured ? 'bg-primary' : 'bg-white/20'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.is_featured ? 'ml-auto' : ''}`}></div>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </>
  )
}
