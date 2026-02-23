-- Products seed data matching ABC_Bullion_Photos
-- Image URLs reference paths within Supabase storage bucket after uploading ABC_Bullion_Photos folder
-- Prerequisites: Run seed/add_images_column.sql first if the images column doesn't exist
-- Run: DELETE FROM products; then run this INSERT

-- Delete dependent rows first (foreign key constraints)
DELETE FROM "public"."price_locks";
DELETE FROM "public"."products";

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES

-- =============================================
-- GOLD CAST BARS
-- =============================================
(gen_random_uuid(), '0.5oz ABC Gold Cast Bar', 'Half troy ounce (15.55g) 99.99% pure cast gold bar', '0', 'AUD', '0.5oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/0.5oz_ABC_Gold_Cast_Bar_9999/GABG00.50.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/0.5oz_ABC_Gold_Cast_Bar_9999/GABG00.50_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/0.5oz_ABC_Gold_Cast_Bar_9999/GABG00.50_3.jpg"]',
  'true', 'XAU', null, 15.55, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '1oz ABC Gold Cast Bar', '1 troy ounce (31.1g) 99.99% pure cast gold bar', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/1oz_ABC_Gold_Cast_Bar_9999/GABG01.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/1oz_ABC_Gold_Cast_Bar_9999/GABG01_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/1oz_ABC_Gold_Cast_Bar_9999/GABG01_3.jpg"]',
  'true', 'XAU', null, 31.1, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '2oz ABC Gold Cast Bar', '2 troy ounces (62.2g) 99.99% pure cast gold bar', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/2oz_ABC_Gold_Cast_Bar_9999/GABG02.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/2oz_ABC_Gold_Cast_Bar_9999/GABG02_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/2oz_ABC_Gold_Cast_Bar_9999/GABG02_3.jpg"]',
  'true', 'XAU', null, 62.2, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '5oz ABC Gold Cast Bar', '5 troy ounces (155.5g) 99.99% pure cast gold bar', '0', 'AUD', '5oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/5oz_ABC_Gold_Cast_Bar_9999/GABG05.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/5oz_ABC_Gold_Cast_Bar_9999/GABG05_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/5oz_ABC_Gold_Cast_Bar_9999/GABG05_3.jpg"]',
  'true', 'XAU', null, 155.5, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '10oz ABC Gold Cast Bar', '10 troy ounces (311g) 99.99% pure cast gold bar', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/10oz_ABC_Gold_Cast_Bar_9999/GABG10.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/10oz_ABC_Gold_Cast_Bar_9999/GABG10_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/10oz_ABC_Gold_Cast_Bar_9999/GABG10_3.jpg"]',
  'true', 'XAU', null, 311, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '37.5g ABC Gold Cast Luong', '37.5 gram (Luong) 99.99% pure cast gold bar', '0', 'AUD', '37.5g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/37.5g_ABC_Gold_Cast_Luong_9999/GABGLUO.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/37.5g_ABC_Gold_Cast_Luong_9999/GABGLUO_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/37.5g_ABC_Gold_Cast_Luong_9999/GABGLUO_3.jpg"]',
  'true', 'XAU', null, 37.5, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '50g ABC Gold Cast Bar', '50 gram 99.99% pure cast gold bar', '0', 'AUD', '50g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/50g_ABC_Gold_Cast_Bar_9999/GABG1.6075.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/50g_ABC_Gold_Cast_Bar_9999/GABG1.6075_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/50g_ABC_Gold_Cast_Bar_9999/GABG1.6075_3.jpg"]',
  'true', 'XAU', null, 50, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '100g ABC Gold Cast Bar', '100 gram 99.99% pure cast gold bar', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/100g_ABC_Gold_Cast_Bar_9999/GABG3.215.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/100g_ABC_Gold_Cast_Bar_9999/GABG3.215_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/100g_ABC_Gold_Cast_Bar_9999/GABG3.215_3.jpg"]',
  'true', 'XAU', null, 100, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '250g ABC Gold Cast Bar', '250 gram 99.99% pure cast gold bar', '0', 'AUD', '250g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/250g_ABC_Gold_Cast_Bar_9999/GABG8.038.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/250g_ABC_Gold_Cast_Bar_9999/GABG8.038_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/250g_ABC_Gold_Cast_Bar_9999/GABG8.038_3.jpg"]',
  'true', 'XAU', null, 250, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '500g ABC Gold Cast Bar', '500 gram 99.99% pure cast gold bar', '0', 'AUD', '500g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/500g_ABC_Gold_Cast_Bar_9999/GABG16.075.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/500g_ABC_Gold_Cast_Bar_9999/GABG16.075_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/500g_ABC_Gold_Cast_Bar_9999/GABG16.075_3.jpg"]',
  'true', 'XAU', null, 500, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '1kg ABC Gold Cast Bar', '1 kilogram 99.99% pure cast gold bar', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/1kg_ABC_Gold_Cast_Bar_9999/GABG32.15.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/1kg_ABC_Gold_Cast_Bar_9999/GABG32.15_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/1kg_ABC_Gold_Cast_Bar_9999/GABG32.15_3.jpg"]',
  'true', 'XAU', null, 1000, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '400oz ABC Gold Bar', '400 troy ounces (12.44kg) 99.99% pure gold bar', '0', 'AUD', '400oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/400oz_ABC_Gold_Bar_9999/GABG400.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/400oz_ABC_Gold_Bar_9999/GABG400_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/400oz_ABC_Gold_Bar_9999/GABG400_3.jpg"]',
  'true', 'XAU', null, 12440, 'cast', 'ABC Bullion'),

(gen_random_uuid(), 'Tael ABC Gold 37.5g', '37.5 gram (Tael) 99.99% pure cast gold bar', '0', 'AUD', '37.5g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/Tael_ABC_Gold_37.5g_9999/GABGTAEL.jpg',
  '["ABC_Bullion_Photos/Gold_Cast_Bars/Tael_ABC_Gold_37.5g_9999/GABGTAEL_2.jpg","ABC_Bullion_Photos/Gold_Cast_Bars/Tael_ABC_Gold_37.5g_9999/GABGTAEL_3.jpg"]',
  'true', 'XAU', null, 37.5, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '1oz Gold Bullion Pool Allocated', '1 troy ounce pool allocated gold bullion', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Cast_Bars/1oz_Gold_Bullion_Pool_Allocated/GMAGOLDBARS.jpg',
  '[]',
  'true', 'XAU', null, 31.1, 'pool', 'ABC Bullion'),

-- =============================================
-- GOLD COINS
-- =============================================
(gen_random_uuid(), '0.5oz ABC Gold Southern Cross Coin', 'Half troy ounce 99.99% pure gold Southern Cross coin', '0', 'AUD', '0.5oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Coins/0.5oz_ABC_Gold_Southern_Cross_Coin_9999/GAGS00.50.jpg',
  '["ABC_Bullion_Photos/Gold_Coins/0.5oz_ABC_Gold_Southern_Cross_Coin_9999/GAGS00.50_2.jpg","ABC_Bullion_Photos/Gold_Coins/0.5oz_ABC_Gold_Southern_Cross_Coin_9999/GAGS00.50_3.jpg","ABC_Bullion_Photos/Gold_Coins/0.5oz_ABC_Gold_Southern_Cross_Coin_9999/GAGS00.50_4.jpg"]',
  'true', 'XAU', null, 15.55, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz ABC Lunar Horse Gold Coin', '1 troy ounce 99.99% pure gold Lunar Horse coin', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Horse_Gold_Coin/GLHAC01.jpg',
  '["ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Horse_Gold_Coin/GLHAC01_2.jpg","ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Horse_Gold_Coin/GLHAC01_3.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz ABC Lunar Snake Gold Coin', '1 troy ounce 99.99% pure gold Lunar Snake coin', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Snake_Gold_Coin/GLSAC01.jpg',
  '["ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Snake_Gold_Coin/GLSAC01_2.jpg","ABC_Bullion_Photos/Gold_Coins/1oz_ABC_Lunar_Snake_Gold_Coin/GLSAC01_3.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'ABC Bullion'),

-- =============================================
-- GOLD MINTED TABLETS
-- =============================================
(gen_random_uuid(), '1g ABC Gold Minted Tablet', '1 gram 99.99% pure minted gold tablet', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/1g_ABC_Gold_Minted_Tablet_9999/GABGT04.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/1g_ABC_Gold_Minted_Tablet_9999/GABGT04_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/1g_ABC_Gold_Minted_Tablet_9999/GABGT04_3.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/1g_ABC_Gold_Minted_Tablet_9999/GABGT04_4.jpg"]',
  'true', 'XAU', null, 1, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '10g ABC Gold Minted Tablet', '10 gram 99.99% pure minted gold tablet', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/10g_ABC_Gold_Minted_Tablet_9999/GABGT02.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/10g_ABC_Gold_Minted_Tablet_9999/GABGT02_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/10g_ABC_Gold_Minted_Tablet_9999/GABGT02_3.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/10g_ABC_Gold_Minted_Tablet_9999/GABGT02_4.jpg"]',
  'true', 'XAU', null, 10, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '20g ABC Gold Minted Tablet', '20 gram 99.99% pure minted gold tablet', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/20g_ABC_Gold_Minted_Tablet_9999/GABGT05.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/20g_ABC_Gold_Minted_Tablet_9999/GABGT05_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/20g_ABC_Gold_Minted_Tablet_9999/GABGT05_3.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/20g_ABC_Gold_Minted_Tablet_9999/GABGT05_4.jpg"]',
  'true', 'XAU', null, 20, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '1oz ABC Gold Minted Tablet', '1 troy ounce (31.1g) 99.99% pure minted gold tablet', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/1oz_ABC_Gold_Minted_Tablet_9999/GABGT01.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/1oz_ABC_Gold_Minted_Tablet_9999/GABGT01_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/1oz_ABC_Gold_Minted_Tablet_9999/GABGT01_3.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/1oz_ABC_Gold_Minted_Tablet_9999/GABGT01_4.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '100g ABC Gold Minted Tablet', '100 gram 99.99% pure minted gold tablet', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/100g_ABC_Gold_Minted_Tablet_9999/GABGT07.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/100g_ABC_Gold_Minted_Tablet_9999/GABGT07_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/100g_ABC_Gold_Minted_Tablet_9999/GABGT07_3.jpg"]',
  'true', 'XAU', null, 100, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '20x1g CombiBar Gold Minted', '20 x 1 gram (20g total) 99.99% pure gold CombiBar', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Gold_Minted_Tablets/20x1g_CombiBar_Gold_Minted_9999/GABGT08C.jpg',
  '["ABC_Bullion_Photos/Gold_Minted_Tablets/20x1g_CombiBar_Gold_Minted_9999/GABGT08C_2.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/20x1g_CombiBar_Gold_Minted_9999/GABGT08C_3.jpg","ABC_Bullion_Photos/Gold_Minted_Tablets/20x1g_CombiBar_Gold_Minted_9999/GABGT08C_4.jpg"]',
  'true', 'XAU', null, 20, 'minted', 'ABC Bullion'),

-- =============================================
-- PLATINUM MINTED TABLETS
-- =============================================
(gen_random_uuid(), '1oz ABC Platinum Minted Tablet', '1 troy ounce (31.1g) 99.95% pure minted platinum tablet', '0', 'AUD', '1oz', 'Platinum', '99.95%', '5.0',
  'ABC_Bullion_Photos/Platinum_Minted/1oz_ABC_Platinum_Minted_Tablet_9995/PTABC01.jpg',
  '["ABC_Bullion_Photos/Platinum_Minted/1oz_ABC_Platinum_Minted_Tablet_9995/PTABC01_2.jpg","ABC_Bullion_Photos/Platinum_Minted/1oz_ABC_Platinum_Minted_Tablet_9995/PTABC01_3.jpg","ABC_Bullion_Photos/Platinum_Minted/1oz_ABC_Platinum_Minted_Tablet_9995/PTABC01_4.jpg"]',
  'true', 'XPT', null, 31.1, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '50g ABC Platinum Minted Tablet', '50 gram 99.95% pure minted platinum tablet', '0', 'AUD', '50g', 'Platinum', '99.95%', '5.0',
  'ABC_Bullion_Photos/Platinum_Minted/50g_ABC_Platinum_Minted_Tablet_9995/PTABC02.jpg',
  '["ABC_Bullion_Photos/Platinum_Minted/50g_ABC_Platinum_Minted_Tablet_9995/PTABC02_2.jpg","ABC_Bullion_Photos/Platinum_Minted/50g_ABC_Platinum_Minted_Tablet_9995/PTABC02_3.jpg","ABC_Bullion_Photos/Platinum_Minted/50g_ABC_Platinum_Minted_Tablet_9995/PTABC02_4.jpg"]',
  'true', 'XPT', null, 50, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '500g ABC Platinum Minted Tablet', '500 gram 99.95% pure minted platinum tablet', '0', 'AUD', '500g', 'Platinum', '99.95%', '5.0',
  'ABC_Bullion_Photos/Platinum_Minted/500g_ABC_Platinum_Minted_Tablet_9995/PTABC05.jpg',
  '["ABC_Bullion_Photos/Platinum_Minted/500g_ABC_Platinum_Minted_Tablet_9995/PTABC05_2.jpg","ABC_Bullion_Photos/Platinum_Minted/500g_ABC_Platinum_Minted_Tablet_9995/PTABC05_3.jpg","ABC_Bullion_Photos/Platinum_Minted/500g_ABC_Platinum_Minted_Tablet_9995/PTABC05_4.jpg"]',
  'true', 'XPT', null, 500, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '1kg ABC Platinum Minted Tablet', '1 kilogram 99.95% pure minted platinum tablet', '0', 'AUD', '1kg', 'Platinum', '99.95%', '5.0',
  'ABC_Bullion_Photos/Platinum_Minted/1kg_ABC_Platinum_Minted_Tablet_9995/PTABC06.jpg',
  '["ABC_Bullion_Photos/Platinum_Minted/1kg_ABC_Platinum_Minted_Tablet_9995/PTABC06_2.jpg"]',
  'true', 'XPT', null, 1000, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '50x1g CombiBar ABC Platinum', '50 x 1 gram (50g total) 99.95% pure platinum CombiBar', '0', 'AUD', '50g', 'Platinum', '99.95%', '5.0',
  'ABC_Bullion_Photos/Platinum_Minted/50x1g_CombiBar_ABC_Platinum_9995/PTABC04C.jpg',
  '["ABC_Bullion_Photos/Platinum_Minted/50x1g_CombiBar_ABC_Platinum_9995/PTABC04C_2.jpg","ABC_Bullion_Photos/Platinum_Minted/50x1g_CombiBar_ABC_Platinum_9995/PTABC04C_3.jpg","ABC_Bullion_Photos/Platinum_Minted/50x1g_CombiBar_ABC_Platinum_9995/PTABC04C_4.jpg","ABC_Bullion_Photos/Platinum_Minted/50x1g_CombiBar_ABC_Platinum_9995/PTABC04C_5.jpg"]',
  'true', 'XPT', null, 50, 'minted', 'ABC Bullion'),

-- =============================================
-- ROYAL MINT GOLD MINTED BARS (Britannia)
-- =============================================
(gen_random_uuid(), '10g Britannia Gold Minted Bar', '10 gram 99.99% pure Britannia gold minted bar by The Royal Mint', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Royal_Mint_Tablets/10g_Britannia_Gold_Minted_Bar_9999/GBRIT0.3215.jpg',
  '["ABC_Bullion_Photos/Royal_Mint_Tablets/10g_Britannia_Gold_Minted_Bar_9999/GBRIT0.3215_2.jpg","ABC_Bullion_Photos/Royal_Mint_Tablets/10g_Britannia_Gold_Minted_Bar_9999/GBRIT0.3215_3.jpg"]',
  'true', 'XAU', null, 10, 'minted', 'The Royal Mint'),

(gen_random_uuid(), '20g Britannia Gold Minted Bar', '20 gram 99.99% pure Britannia gold minted bar by The Royal Mint', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Royal_Mint_Tablets/20g_Britannia_Gold_Minted_Bar_9999/GBRIT0.643.jpg',
  '["ABC_Bullion_Photos/Royal_Mint_Tablets/20g_Britannia_Gold_Minted_Bar_9999/GBRIT0.643_2.jpg","ABC_Bullion_Photos/Royal_Mint_Tablets/20g_Britannia_Gold_Minted_Bar_9999/GBRIT0.643_3.jpg","ABC_Bullion_Photos/Royal_Mint_Tablets/20g_Britannia_Gold_Minted_Bar_9999/GBRIT0.643_4.jpg"]',
  'true', 'XAU', null, 20, 'minted', 'The Royal Mint'),

(gen_random_uuid(), '1oz Britannia Gold Minted Bar', '1 troy ounce (31.1g) 99.99% pure Britannia gold minted bar by The Royal Mint', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Royal_Mint_Tablets/1oz_Britannia_Gold_Minted_Bar_9999/GBRIT01.jpg',
  '["ABC_Bullion_Photos/Royal_Mint_Tablets/1oz_Britannia_Gold_Minted_Bar_9999/GBRIT01_2.jpg","ABC_Bullion_Photos/Royal_Mint_Tablets/1oz_Britannia_Gold_Minted_Bar_9999/GBRIT01_3.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'The Royal Mint'),

(gen_random_uuid(), '50g Britannia Gold Minted Bar', '50 gram 99.99% pure Britannia gold minted bar by The Royal Mint', '0', 'AUD', '50g', 'Gold', '99.99%', '5.0',
  'ABC_Bullion_Photos/Royal_Mint_Tablets/50g_Britannia_Gold_Minted_Bar_9999/GBRIT1.6075.jpg',
  '["ABC_Bullion_Photos/Royal_Mint_Tablets/50g_Britannia_Gold_Minted_Bar_9999/GBRIT1.6075_2.jpg","ABC_Bullion_Photos/Royal_Mint_Tablets/50g_Britannia_Gold_Minted_Bar_9999/GBRIT1.6075_3.jpg"]',
  'true', 'XAU', null, 50, 'minted', 'The Royal Mint'),

-- =============================================
-- SILVER CAST BARS
-- =============================================
(gen_random_uuid(), '5oz ABC Silver Cast Bar', '5 troy ounces (155.5g) 99.95% pure cast silver bar', '0', 'AUD', '5oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Cast_Bars/5oz_ABC_Silver_Cast_Bar_9995/SABC05.jpg',
  '["ABC_Bullion_Photos/Silver_Cast_Bars/5oz_ABC_Silver_Cast_Bar_9995/SABC05_2.jpg","ABC_Bullion_Photos/Silver_Cast_Bars/5oz_ABC_Silver_Cast_Bar_9995/SABC05_3.jpg"]',
  'true', 'XAG', null, 155.5, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '10oz ABC Silver Cast Bar', '10 troy ounces (311g) 99.95% pure cast silver bar', '0', 'AUD', '10oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Cast_Bars/10oz_ABC_Silver_Cast_Bar_9995/SABC10.jpg',
  '["ABC_Bullion_Photos/Silver_Cast_Bars/10oz_ABC_Silver_Cast_Bar_9995/SABC10_2.jpg","ABC_Bullion_Photos/Silver_Cast_Bars/10oz_ABC_Silver_Cast_Bar_9995/SABC10_3.jpg"]',
  'true', 'XAG', null, 311, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '500g ABC Silver Cast Bar', '500 gram 99.95% pure cast silver bar', '0', 'AUD', '500g', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Cast_Bars/500g_ABC_Silver_Cast_Bar_9995/SABC16.075.jpg',
  '["ABC_Bullion_Photos/Silver_Cast_Bars/500g_ABC_Silver_Cast_Bar_9995/SABC16.075_2.jpg","ABC_Bullion_Photos/Silver_Cast_Bars/500g_ABC_Silver_Cast_Bar_9995/SABC16.075_3.jpg"]',
  'true', 'XAG', null, 500, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '1kg ABC Silver Cast Bar', '1 kilogram 99.95% pure cast silver bar', '0', 'AUD', '1kg', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Cast_Bars/1kg_ABC_Silver_Cast_Bar_9995/SABC32.15.jpg',
  '["ABC_Bullion_Photos/Silver_Cast_Bars/1kg_ABC_Silver_Cast_Bar_9995/SABC32.15_2.jpg","ABC_Bullion_Photos/Silver_Cast_Bars/1kg_ABC_Silver_Cast_Bar_9995/SABC32.15_3.jpg"]',
  'true', 'XAG', null, 1000, 'cast', 'ABC Bullion'),

(gen_random_uuid(), '1oz Silver Bullion Pool Allocated', '1 troy ounce pool allocated silver bullion', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Cast_Bars/1oz_Silver_Bullion_Pool_Allocated/SMASILVERBARS.jpg',
  '[]',
  'true', 'XAG', null, 31.1, 'pool', 'ABC Bullion'),

-- =============================================
-- SILVER COINS
-- =============================================
(gen_random_uuid(), '1oz ABC Silver Southern Cross Coin', '1 troy ounce 99.95% pure silver Southern Cross coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_Coin/SFT01.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_Coin/SFT01_2.jpg","ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_Coin/SFT01_3.jpg","ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_Coin/SFT01_4.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz ABC Silver Southern Cross High Relief', '1 troy ounce 99.95% pure silver Southern Cross high relief coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_High_Relief/SFTHR01.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_High_Relief/SFTHR01_2.jpg","ABC_Bullion_Photos/Silver_Coins/1oz_ABC_Silver_Southern_Cross_High_Relief/SFTHR01_3.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Kangaroo', '1 troy ounce 99.95% pure silver Untamed Landscapes Kangaroo coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kangaroo_1oz/sabculkang01.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kangaroo_1oz/sabculkang01_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Kangaroo Blisterpack', '1 troy ounce 99.95% pure silver Untamed Landscapes Kangaroo coin in blisterpack', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kangaroo_1oz_Blisterpack/SABCULKANG02.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kangaroo_1oz_Blisterpack/SABCULKANG02_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), 'Untamed Landscapes Kangaroo Monster Box', '250 x 1oz (250 troy ounces) 99.95% pure silver Untamed Landscapes Kangaroo coins', '0', 'AUD', '250oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kangaroo_Monster_Box/SABCULKANG03.jpg',
  '[]',
  'true', 'XAG', null, 7775, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Kiwi Blisterpack', '1 troy ounce 99.95% pure silver Untamed Landscapes Kiwi coin in blisterpack', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kiwi_1oz_Blisterpack/SABCULKIWI02.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Kiwi_1oz_Blisterpack/SABCULKIWI02_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Sailfish', '1 troy ounce 99.95% pure silver Untamed Landscapes Sailfish coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Sailfish_1oz/SABCULSAIL01.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Sailfish_1oz/SABCULSAIL01_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Sailfish Blisterpack', '1 troy ounce 99.95% pure silver Untamed Landscapes Sailfish coin in blisterpack', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Sailfish_1oz_Blisterpack/SABCULSAIL02.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Sailfish_1oz_Blisterpack/SABCULSAIL02_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), 'Untamed Landscapes Sailfish Monster Box', '250 x 1oz (250 troy ounces) 99.95% pure silver Untamed Landscapes Sailfish coins', '0', 'AUD', '250oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Sailfish_Monster_Box/SABCULSAIL03.jpg',
  '[]',
  'true', 'XAG', null, 7775, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Thorny Lizard', '1 troy ounce 99.95% pure silver Untamed Landscapes Thorny Lizard coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Thorny_Lizard_1oz/SABCULLIZARD01.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Thorny_Lizard_1oz/SABCULLIZARD01_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '1oz Untamed Landscapes Thorny Lizard Blisterpack', '1 troy ounce 99.95% pure silver Untamed Landscapes Thorny Lizard coin in blisterpack', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Thorny_Lizard_Blisterpack/SABCULLIZARD02.jpg',
  '["ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Thorny_Lizard_Blisterpack/SABCULLIZARD02_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), 'Untamed Landscapes Thorny Lizard Monster Box', '250 x 1oz (250 troy ounces) 99.95% pure silver Untamed Landscapes Thorny Lizard coins', '0', 'AUD', '250oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Coins/Untamed_Landscapes_Thorny_Lizard_Monster_Box/SABCULLIZARD03.jpg',
  '[]',
  'true', 'XAG', null, 7775, 'coin', 'ABC Bullion'),

-- =============================================
-- SILVER EUREKA RANGE
-- =============================================
(gen_random_uuid(), '1oz Silver Eureka Coin', '1 troy ounce 99.95% pure silver Eureka coin', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Eureka_Range/1oz_Silver_Eureka_Coin_9995/SEURC01.jpg',
  '["ABC_Bullion_Photos/Silver_Eureka_Range/1oz_Silver_Eureka_Coin_9995/SEURC01_2.jpg"]',
  'true', 'XAG', null, 31.1, 'coin', 'ABC Bullion'),

(gen_random_uuid(), '5oz Silver Eureka Minted Bar', '5 troy ounces (155.5g) 99.95% pure silver Eureka minted bar', '0', 'AUD', '5oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Eureka_Range/5oz_Silver_Eureka_Minted_Bar_9995/SEURC05.jpg',
  '["ABC_Bullion_Photos/Silver_Eureka_Range/5oz_Silver_Eureka_Minted_Bar_9995/SEURC05_2.jpg"]',
  'true', 'XAG', null, 155.5, 'minted', 'ABC Bullion'),

(gen_random_uuid(), '10oz Silver Eureka Minted Bar', '10 troy ounces (311g) 99.95% pure silver Eureka minted bar', '0', 'AUD', '10oz', 'Silver', '99.95%', '5.0',
  'ABC_Bullion_Photos/Silver_Eureka_Range/10oz_Silver_Eureka_Minted_Bar_9995/SEURC10.jpg',
  '["ABC_Bullion_Photos/Silver_Eureka_Range/10oz_Silver_Eureka_Minted_Bar_9995/SEURC10_2.jpg"]',
  'true', 'XAG', null, 311, 'minted', 'ABC Bullion');
