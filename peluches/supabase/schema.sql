-- Configuración de tablas para el proyecto Peluches (Plushie Joy)
-- Prefijo: pl_

-- 1. Categorías
CREATE TABLE IF NOT EXISTS pl_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Productos
CREATE TABLE IF NOT EXISTS pl_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id UUID REFERENCES pl_categories(id),
    images JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    sku TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Perfiles de Usuario (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS pl_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Direcciones de Envío
CREATE TABLE IF NOT EXISTS pl_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Casa', -- Casa, Oficina, etc.
    full_name TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'México',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Pedidos
CREATE TABLE IF NOT EXISTS pl_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL,
    stripe_payment_intent_id TEXT,
    shipping_address_id UUID REFERENCES pl_addresses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Items del Pedido
CREATE TABLE IF NOT EXISTS pl_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES pl_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES pl_products(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10, 2) NOT NULL,
    custom_message TEXT, -- Para las tarjetas personalizadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE pl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_order_items ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURIDAD BÁSICAS

-- Categorías y Productos: Lectura pública, escritura solo admin (simulado aquí con roles o service role)
CREATE POLICY "Lectura pública de categorías" ON pl_categories FOR SELECT USING (true);
CREATE POLICY "Lectura pública de productos" ON pl_products FOR SELECT USING (true);

-- Perfiles: Usuario puede ver y editar su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil" ON pl_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden editar su propio perfil" ON pl_profiles FOR UPDATE USING (auth.uid() = id);

-- Direcciones: Usuario gestiona sus propias direcciones
CREATE POLICY "Usuarios gestionan sus propias direcciones" ON pl_addresses FOR ALL USING (auth.uid() = user_id);

-- Pedidos: Usuario ve sus propios pedidos
CREATE POLICY "Usuarios ven sus propios pedidos" ON pl_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios ven sus propios items de pedido" ON pl_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM pl_orders WHERE pl_orders.id = pl_order_items.order_id AND pl_orders.user_id = auth.uid())
);

-- Trigger para crear perfil automáticamente al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pl_profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
