'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getProducts() {
  const { data, error } = await supabaseAdmin
    .from('pl_products')
    .select('*, pl_categories(name)')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data
}

export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('pl_categories')
    .select('*')
  
  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(productData: any) {
  const { data, error } = await supabaseAdmin
    .from('pl_products')
    .insert([productData])
  
  if (error) throw new Error(error.message)
  return data
}

export async function updateProduct(id: string, productData: any) {
  const { data, error } = await supabaseAdmin
    .from('pl_products')
    .update(productData)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id: string) {
  const { data, error } = await supabaseAdmin
    .from('pl_products')
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  return data
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('No se proporcionó ningún archivo')
  
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  
  const { data, error } = await supabaseAdmin
    .storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
    
  if (error) throw new Error('Error al subir imagen: ' + error.message)
  
  const { data: publicUrl } = supabaseAdmin
    .storage
    .from('products')
    .getPublicUrl(fileName)
    
  return publicUrl.publicUrl
}
