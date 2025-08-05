-- ============================================================================
-- INSERT DEFAULT DATA
-- Purpose: Insert roles, categories, and other default data
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 
 '{"patients": ["create", "read", "update", "delete", "export"], "tests": ["create", "read", "update", "delete", "export"], "bookings": ["create", "read", "update", "delete", "export"], "users": ["create", "read", "update", "delete", "manage_roles"], "analytics": ["read", "export", "advanced"], "settings": ["read", "update", "system"], "audit": ["read", "export"]}'),
('admin', 'Administrator', 'System administration with most permissions', 
 '{"patients": ["create", "read", "update", "delete", "export"], "tests": ["create", "read", "update", "delete", "export"], "bookings": ["create", "read", "update", "delete", "export"], "users": ["create", "read", "update"], "analytics": ["read", "export"], "settings": ["read", "update"], "audit": ["read"]}'),
('doctor', 'Doctor', 'Medical professional with patient and test access', 
 '{"patients": ["create", "read", "update", "export"], "tests": ["create", "read", "update", "export"], "bookings": ["create", "read", "update"], "analytics": ["read"], "settings": ["read"]}'),
('technician', 'Technician', 'Lab technician with test management access', 
 '{"patients": ["read"], "tests": ["create", "read", "update"], "bookings": ["read", "update"], "analytics": ["read"]}'),
('receptionist', 'Receptionist', 'Basic patient and booking management', 
 '{"patients": ["create", "read", "update"], "bookings": ["create", "read", "update"], "analytics": ["read"]}')
ON CONFLICT (name) DO NOTHING;

-- Insert allergen categories
INSERT INTO public.allergen_categories (name, description, display_order) VALUES
('MITE', 'Dust mites and related allergens', 1),
('POLLENS', 'Various pollen allergens', 2),
('TREES', 'Tree pollen allergens', 3),
('FUNGI', 'Fungal allergens', 4),
('DUST MIX', 'Mixed dust allergens', 5),
('EPITHELIA', 'Animal epithelial allergens', 6),
('INSECTS', 'Insect allergens', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert allergens (43 predefined allergens)
INSERT INTO public.allergens (sno, category_id, name) VALUES
-- MITE
(1, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'D. farinae'),
(2, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'D. pteronyssinus'),
(3, (SELECT id FROM public.allergen_categories WHERE name = 'MITE'), 'Blomia sp.'),

-- POLLENS
(4, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cyanodon dactylon'),
(5, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cenchrus barbatus'),
(6, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Zea mays'),
(7, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Rye Grass'),
(8, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Meadow fescue/E. Plantain'),
(9, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Kentucky Blue Grass'),
(10, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Timothy Grass'),
(11, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cyperus rotundus'),
(12, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Typha angustata'),
(13, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Short Ragweed'),
(14, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'P. hysterophorus'),
(15, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Amaranthus spinosus'),
(16, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Chenopodium alba'),
(17, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Mugwort'),
(18, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Ricinus communis'),
(19, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Brassica nigra'),
(20, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Mustard / Russian Thistle'),
(21, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Cannabis sativa'),
(22, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Nettle'),
(23, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Acacia arabica'),
(24, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Prosopis juliflora'),
(25, (SELECT id FROM public.allergen_categories WHERE name = 'POLLENS'), 'Birch / Robinia'),

-- TREES
(26, (SELECT id FROM public.allergen_categories WHERE name = 'TREES'), 'Poplar / Eucalyptus'),

-- FUNGI
(27, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Aspergillus fumigatus'),
(28, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Aspergillus niger'),
(29, (SELECT id FROM public.allergen_categories WHERE name = 'FUNGI'), 'Alternaria alternata'),

-- DUST MIX
(30, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'House Dust'),
(31, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Saw Dust (Wood)'),
(32, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Grain Dust (Rice)'),
(33, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Grain Dust (Wheat)'),
(34, (SELECT id FROM public.allergen_categories WHERE name = 'DUST MIX'), 'Hay Dust'),

-- EPITHELIA
(35, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Cat Epithelia'),
(36, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Dog Epithelia'),
(37, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Chicken Feather'),
(38, (SELECT id FROM public.allergen_categories WHERE name = 'EPITHELIA'), 'Sheep''s Wool'),

-- INSECTS
(39, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Cockroach'),
(40, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Honey Bee'),
(41, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Red Ant'),
(42, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Mosquito'),
(43, (SELECT id FROM public.allergen_categories WHERE name = 'INSECTS'), 'Wasp')
ON CONFLICT (sno) DO NOTHING; 