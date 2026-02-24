-- Palladium products seed data matching ABC_Bullion_Photos/Palladium
-- Prerequisites: Run seed/add_images_column.sql first if the images column doesn't exist

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES

-- =============================================
-- PALLADIUM
-- =============================================
(gen_random_uuid(), 'Valcambi 50g Palladium Minted Bar', '50 gram 99.95% pure palladium minted bar by Valcambi', '0', 'AUD', '50g', 'Palladium', '99.95%', '5.0',
  'ABC_Bullion_Photos/Palladium/50g_Valcambi_Palladium_Minted_Bar_9995/PDVAL1.675.jpg',
  '["ABC_Bullion_Photos/Palladium/50g_Valcambi_Palladium_Minted_Bar_9995/PDVAL1.675_2.jpg","ABC_Bullion_Photos/Palladium/50g_Valcambi_Palladium_Minted_Bar_9995/PDVAL1.675_3.jpg","ABC_Bullion_Photos/Palladium/50g_Valcambi_Palladium_Minted_Bar_9995/PDVAL1.675_4.jpg","ABC_Bullion_Photos/Palladium/50g_Valcambi_Palladium_Minted_Bar_9995/PDVAL1.675_5.jpg"]',
  'true', 'XPD', null, 50, 'minted', 'Valcambi'),

(gen_random_uuid(), 'Valcambi 100g Palladium Minted Bar', '100 gram 99.95% pure palladium minted bar by Valcambi', '0', 'AUD', '100g', 'Palladium', '99.95%', '5.0',
  'ABC_Bullion_Photos/Palladium/100g_Valcambi_Palladium_Minted_Bar_9995/PDVAL3.215.jpg',
  '["ABC_Bullion_Photos/Palladium/100g_Valcambi_Palladium_Minted_Bar_9995/PDVAL3.215_2.jpg","ABC_Bullion_Photos/Palladium/100g_Valcambi_Palladium_Minted_Bar_9995/PDVAL3.215_3.jpg","ABC_Bullion_Photos/Palladium/100g_Valcambi_Palladium_Minted_Bar_9995/PDVAL3.215_4.jpg","ABC_Bullion_Photos/Palladium/100g_Valcambi_Palladium_Minted_Bar_9995/PDVAL3.215_5.jpg"]',
  'true', 'XPD', null, 100, 'minted', 'Valcambi'),

(gen_random_uuid(), 'Valcambi 500g Palladium Minted Bar', '500 gram 99.95% pure palladium minted bar by Valcambi', '0', 'AUD', '500g', 'Palladium', '99.95%', '5.0',
  'ABC_Bullion_Photos/Palladium/500g_Valcambi_Palladium_Minted_Bar_9995/PDVAL16.075.jpg',
  '["ABC_Bullion_Photos/Palladium/500g_Valcambi_Palladium_Minted_Bar_9995/PDVAL16.075_2.jpg","ABC_Bullion_Photos/Palladium/500g_Valcambi_Palladium_Minted_Bar_9995/PDVAL16.075_3.jpg"]',
  'true', 'XPD', null, 500, 'minted', 'Valcambi'),

(gen_random_uuid(), 'Valcambi 1kg Palladium Minted Bar', '1 kilogram 99.95% pure palladium minted bar by Valcambi', '0', 'AUD', '1kg', 'Palladium', '99.95%', '5.0',
  'ABC_Bullion_Photos/Palladium/1kg_Valcambi_Palladium_Minted_Bar_9995/PDVAL32.15.jpg',
  '["ABC_Bullion_Photos/Palladium/1kg_Valcambi_Palladium_Minted_Bar_9995/PDVAL32.15_2.jpg","ABC_Bullion_Photos/Palladium/1kg_Valcambi_Palladium_Minted_Bar_9995/PDVAL32.15_3.jpg"]',
  'true', 'XPD', null, 1000, 'minted', 'Valcambi'),

(gen_random_uuid(), 'ABC Palladium Pool Allocated 1oz', '1 troy ounce pool allocated palladium bullion', '0', 'AUD', '1oz', 'Palladium', '99.95%', '5.0',
  'ABC_Bullion_Photos/Palladium/1oz_Palladium_Bullion_Pool_Allocated/PALDMETALOZ.jpg',
  '[]',
  'true', 'XPD', null, 31.1, 'pool', 'ABC Bullion');
