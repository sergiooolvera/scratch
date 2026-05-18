-- Datos iniciales para Peluches
-- Asegúrate de haber corrido el schema.sql primero

-- Insertar Categorías
INSERT INTO pl_categories (name, slug) VALUES 
('Cumpleaños', 'cumpleanos'),
('Aniversarios', 'aniversarios'),
('Graduaciones', 'graduaciones'),
('Recién Nacidos', 'recien-nacidos'),
('San Valentín', 'san-valentin'),
('Día de las Madres', 'dia-madres'),
('Bautizos', 'bautizos'),
('Navidad', 'navidad');

-- Insertar algunos Productos
INSERT INTO pl_products (name, slug, description, price, stock, category_id, is_featured, sku, images) 
SELECT 
    'Oso de Peluche Abrazos', 
    'oso-abrazos', 
    'El compañero perfecto para dar abrazos suaves y llenos de alegría. Hecho con materiales hipoalergénicos.', 
    45.00, 
    50, 
    id, 
    true, 
    'PLU-O-001',
    '["https://lh3.googleusercontent.com/aida-public/AB6AXuCMEZycGzqBlDEey5gXFvpuTPlNNwgQDsS4a0l_sKtiPZJYqLnH6v7YR0Z04IyYkTi8epper4e3ieWCv04RTTVjd37az4VN4Vrd2eJ85NJo18mrYjOtmlkhlcpb3LsQuPcraFyyCPNq9koISnYFxhdf4288pHbqwl_hnVH2-nn3Aj6e-Ga3cyvV4jpl3bqsuKWnp1TrAocP7wMkJeg9SwLOgzMG23N1lPFlA2GLo08BDmsQ_1hxhmVzZ_XYOiMXzaifVXVcYKnh"]'::jsonb
FROM pl_categories WHERE slug = 'cumpleanos';

INSERT INTO pl_products (name, slug, description, price, stock, category_id, is_featured, sku, images) 
SELECT 
    'Conejito Saltos', 
    'conejito-saltos', 
    'Suave conejito de peluche con orejas largas, ideal para decorar o regalar.', 
    25.00, 
    30, 
    id, 
    true, 
    'PLU-C-001',
    '["https://lh3.googleusercontent.com/aida-public/AB6AXuAZl7ZLgos88uACePTQnwpPpGhjHWwsTy1Zt6OSb8qCEdSFj56a9oLwYvAXQreouIY5GH0EdpIgHh4jKetiODpS72QxVByFc8D_28_l2RfX3YqbIUO3cgq0R2fajI2tAHKrlk1hEvtWZXetlFKfsURIAV7OFiMinoFoJxckLWlckxuIVfB9CP4KDDhDORS8-I1CICeD_CSyFtCDYwRY7J__2yQP11acJwzJCOFmBZaHKZAVPrzlhNDtbcuwYbSl-0cJz_-hRTPy"]'::jsonb
FROM pl_categories WHERE slug = 'recien-nacidos';
