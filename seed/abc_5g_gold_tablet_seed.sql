-- Seed: ABC 5g Gold Minted Tablet
-- NOTE: Using 1g tablet image as placeholder — replace image paths once 5g photos are uploaded

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES
(gen_random_uuid(), 'ABC 5g Gold Minted Tablet', '5 gram 99.99% pure minted gold tablet', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/5g_ABC_Gold_Minted_Tablet_9999/GABGT08_3.png',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/5g_ABC_Gold_Minted_Tablet_9999/GABGT08_3.png","ABC_Bullion_Photos/Gold_Minted_Tablets/5g_ABC_Gold_Minted_Tablet_9999/GABGT08_4.png","ABC_Bullion_Photos/Gold_Minted_Tablets/5g_ABC_Gold_Minted_Tablet_9999/GABGT08.png","ABC_Bullion_Photos/Gold_Minted_Tablets/5g_ABC_Gold_Minted_Tablet_9999/GABGT08_2.png"]',
  'true', 'XAU', null, 5, 'minted', 'ABC Bullion');
