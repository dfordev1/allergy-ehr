-- Insert all allergens from the specified format

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