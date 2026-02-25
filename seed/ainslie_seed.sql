-- Ainslie products seed data matching Ainslie_Photos
-- Prerequisites: Run seed/add_images_column.sql first if the images column doesn't exist

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES

-- =============================================
-- AINSLIE GOLD BULLION (Cast)
-- =============================================
(gen_random_uuid(), 'Ainslie 1/2oz Gold Bullion', '1/2 troy ounce (15.55g) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1-2oz-ainslie-gold-bullion/GB-05oz-AB-12oz-Ainslie-Gold-Bullion2.jpg',
  '[]',
  'true', 'XAU', null, 15.55, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1oz Gold Bullion', '1 troy ounce (31.1g) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1oz-ainslie-gold-bullion/GB-1oz-AB-1oz-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 31.1, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 2oz Gold Bullion', '2 troy ounce (62.2g) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/2oz-ainslie-gold-bullion/GB-2oz-AB-2oz-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 62.2, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 5oz Gold Bullion', '5 troy ounce (155.5g) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '5oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/5oz-ainslie-gold-bullion/GB-5oz-AB-5oz-Ainslie-Gold-Bullion2.jpg',
  '[]',
  'true', 'XAU', null, 155.5, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 50g Gold Bullion', '50 gram 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '50g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/50g-ainslie-gold-bullion/GB-50g-AB-50g-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 50, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 100g Gold Bullion', '100 gram 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/100g-ainslie-gold-bullion/GB-100g-AB-100g-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 100, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 250g Gold Bullion', '250 gram 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '250g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/250g-ainslie-gold-bullion/GB-250g-AB-250g-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 250, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 500g Gold Bullion', '500 gram 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '500g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/500g-ainslie-gold-bullion/GB-500g-AB-500g-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 500, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1kg Gold Bullion', '1 kilogram 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1kg-ainslie-gold-bullion/GB-1kg-AB-1kg-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 1000, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 10oz Gold Bullion', '10 troy ounce (311g) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/10oz-ainslie-gold-bullion/GB-10oz-AB-10oz-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 311, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie Luong 37.5g Gold Bullion', '37.5 gram (Luong) 99.99% pure cast gold bullion bar by Ainslie', '0', 'AUD', '37.5g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/37-5g-ainslie-gold-luong-bullion/GB-375G-AB-LUONG-375g-Ainslie-Gold-Luong-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 37.5, 'cast', 'Ainslie'),

-- =============================================
-- AINSLIE MINTED GOLD BARS
-- =============================================
(gen_random_uuid(), 'Ainslie 1g Minted Gold Bar', '1 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1g-ainslie-minted-gold-bar/GM-1g-AB-1g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 1, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 5g Minted Gold Bar', '5 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/5g-ainslie-minted-gold-bar/GM-5g-AB-5g-Ainslie-Minted-Gold-Bar1.jpg',
  '[]',
  'true', 'XAU', null, 5, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 10g Minted Gold Bar', '10 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/10g-ainslie-minted-gold-bar/GM-10g-AB-10g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 10, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 20g Minted Gold Bar', '20 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/20g-ainslie-minted-gold-bar/GM-20g-AB-NEW-20g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 20, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 50g Minted Gold Bar', '50 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '50g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/50g-ainslie-minted-gold-bar/GM-50g-AB-50g-Ainslie-Gold-Bullion.jpg',
  '[]',
  'true', 'XAU', null, 50, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 100g Minted Gold Bar', '100 gram 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/100g-ainslie-minted-gold-bar/GM-100g-AB-100g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 100, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1oz Minted Gold Bar', '1 troy ounce (31.1g) 99.99% pure minted gold bar by Ainslie', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1oz-ainslie-minted-gold-bar/GM-1oz-AB-1oz-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 31.1, 'minted', 'Ainslie'),

-- =============================================
-- AINSLIE DIWALI MINTED GOLD BARS
-- =============================================
(gen_random_uuid(), 'Ainslie Diwali 1g Minted Gold Bar', '1 gram 99.99% pure Diwali edition minted gold bar by Ainslie', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1g-ainslie-minted-gold-bar-diwali/GM-1g-AB-Diwali-1g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 1, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie Diwali 5g Minted Gold Bar', '5 gram 99.99% pure Diwali edition minted gold bar by Ainslie', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/5g-ainslie-minted-gold-bar-diwali/GM-5g-AB-Diwali-5g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 5, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie Diwali 10g Minted Gold Bar', '10 gram 99.99% pure Diwali edition minted gold bar by Ainslie', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/10g-ainslie-minted-gold-bar-diwali/GM-10g-AB-Diwali-10g-Ainslie-Minted-Gold-Bar.jpg',
  '[]',
  'true', 'XAU', null, 10, 'minted', 'Ainslie'),

-- =============================================
-- AINSLIE MINTED GOLD ROUND
-- =============================================
(gen_random_uuid(), 'Ainslie 1/4oz Minted Gold Round', '1/4 troy ounce (7.78g) 99.99% pure minted gold round by Ainslie', '0', 'AUD', '1/4oz', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/1-4oz-ainslie-minted-gold-round/GM-025oz-Round-AB-1-4oz-Ainslie-Gold-Round-NEW.jpg',
  '[]',
  'true', 'XAU', null, 7.78, 'coin', 'Ainslie'),

-- =============================================
-- AINSLIE MINTED PLATINUM BAR
-- =============================================
(gen_random_uuid(), 'Ainslie 1oz Minted Platinum Bar', '1 troy ounce (31.1g) 99.95% pure minted platinum bar by Ainslie', '0', 'AUD', '1oz', 'Platinum', '99.95%', '5.0',
  'Ainslie_Photos/1oz-ainslie-minted-platinum-bar/PB-1oz-AB-1oz-Ainslie-Minted-Platinum-bar.jpg',
  '[]',
  'true', 'XPT', null, 31.1, 'minted', 'Ainslie'),

-- =============================================
-- AINSLIE SILVER BULLION (Cast)
-- =============================================
(gen_random_uuid(), 'Ainslie 1/2kg Silver Bullion', '500 gram 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '500g', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1-2kg-ainslie-silver-bullion/SB-05kg-AB-500g-Ainslie-Silver-Bullion-v2.jpg',
  '[]',
  'true', 'XAG', null, 500, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 5oz Silver Bullion', '5 troy ounce (155.5g) 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '5oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/5oz-ainslie-silver-bullion/SB-5oz-AB-cast-5oz-Ainslie-Silver-Bullion.jpg',
  '[]',
  'true', 'XAG', null, 155.5, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 10oz Silver Bullion', '10 troy ounce (311g) 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '10oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/10oz-ainslie-silver-bullion/SB-10oz-AB-cast-10oz-Ainslie-Silver-Bullion.jpg',
  '[]',
  'true', 'XAG', null, 311, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 100oz Silver Bullion', '100 troy ounce (3.11kg) 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '100oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/100oz-ainslie-silver-bullion/SB-100oz-AB-cast-SB-100oz-AB-cast-Ainslie-1kg-Silver-Bullion-003.jpg',
  '[]',
  'true', 'XAG', null, 3110, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1kg Silver Bullion', '1 kilogram 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '1kg', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1kg-ainslie-silver-bullion/SB-1kg-AB-cast-SB-1kg-AB-cast-Ainslie-1kg-Silver-Bullion-003.jpg',
  '[]',
  'true', 'XAG', null, 1000, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 5kg Silver Bullion', '5 kilogram 99.95% pure cast silver bullion bar by Ainslie', '0', 'AUD', '5kg', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/5kg-ainslie-silver-bullion/SB-5kg-AB-cast-5kg-Ainslie-Silver-Bullion.jpg',
  '[]',
  'true', 'XAG', null, 5000, 'cast', 'Ainslie'),

-- =============================================
-- AINSLIE SILVER STACKER BARS
-- =============================================
(gen_random_uuid(), 'Ainslie 10oz Silver Stacker Bar', '10 troy ounce (311g) 99.95% pure silver stacker bar by Ainslie', '0', 'AUD', '10oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/10oz-ainslie-silver-stacker-bar/SB-10oz-AB-stacker-SB-10oz-AB-stacker-10oz-Ainslie-Silver-Stacker-Bar.jpg',
  '[]',
  'true', 'XAG', null, 311, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 100oz Silver Stacker Bar', '100 troy ounce (3.11kg) 99.95% pure silver stacker bar by Ainslie', '0', 'AUD', '100oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/100oz-ainslie-silver-stacker-bar/SB-100oz-AB-stacker-100oz-Ainslie-Silver-Stacker.jpg',
  '[]',
  'true', 'XAG', null, 3110, 'cast', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1kg Silver Stacker Bar', '1 kilogram 99.95% pure silver stacker bar by Ainslie', '0', 'AUD', '1kg', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1kg-ainslie-silver-stacker-bar/SB-1kg-AB-stacker-SB-1kg-AB-STACKER-Ainslie-1kg-Silver-Bullion-003.jpg',
  '[]',
  'true', 'XAG', null, 1000, 'cast', 'Ainslie'),

-- =============================================
-- AINSLIE MINTED SILVER BARS
-- =============================================
(gen_random_uuid(), 'Ainslie 1oz Minted Silver Bar', '1 troy ounce (31.1g) 99.95% pure minted silver bar by Ainslie', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1oz-ainslie-minted-silver-bar/SM-1oz-AB-1oz-Ainslie-Minted-Silver-Bar.jpg',
  '[]',
  'true', 'XAG', null, 31.1, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 5oz Minted Silver Bar', '5 troy ounce (155.5g) 99.95% pure minted silver bar by Ainslie', '0', 'AUD', '5oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/5oz-ainslie-minted-silver-bar/SM-5oz-AB-5oz-Ainslie-Minted-Silver-Bar.jpg',
  '[]',
  'true', 'XAG', null, 155.5, 'minted', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 10oz Minted Silver Bar', '10 troy ounce (311g) 99.95% pure minted silver bar by Ainslie', '0', 'AUD', '10oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/10oz-ainslie-minted-silver-bar/SM-10oz-AB-10oz-Ainslie-Minted-Silver-Bar.jpg',
  '[]',
  'true', 'XAG', null, 311, 'minted', 'Ainslie'),

-- =============================================
-- AINSLIE MINTED SILVER ROUNDS
-- =============================================
(gen_random_uuid(), 'Ainslie 1oz Minted Silver Round', '1 troy ounce (31.1g) 99.95% pure minted silver round by Ainslie', '0', 'AUD', '1oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1oz-ainslie-minted-silver-round/SM-1oz-Round-AB-ainslieround.jpg',
  '[]',
  'true', 'XAG', null, 31.1, 'coin', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1/2oz Minted Silver Round', '1/2 troy ounce (15.55g) 99.95% pure minted silver round by Ainslie', '0', 'AUD', '1/2oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1-2oz-ainslie-minted-silver-round/SM-05oz-Round-AB-Ainslie-Minted-Round-combined.jpg',
  '[]',
  'true', 'XAG', null, 15.55, 'coin', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1/10oz Minted Silver Round (Tube of 15)', '15 x 1/10oz (1.5oz total) 99.95% pure minted silver rounds in tube by Ainslie', '0', 'AUD', '1.5oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1-10th-oz-ainslie-minted-silver-round-tube-of-15/SM-01oz-Round-AB-15-20241-10oz-AINSLIESilverRound-15Tube-compressed.jpg',
  '[]',
  'true', 'XAG', null, 46.65, 'coin', 'Ainslie'),

(gen_random_uuid(), 'Ainslie 1/10oz Minted Silver Round (Tube of 40)', '40 x 1/10oz (4oz total) 99.95% pure minted silver rounds in tube by Ainslie', '0', 'AUD', '4oz', 'Silver', '99.95%', '5.0',
  'Ainslie_Photos/1-10th-oz-ainslie-minted-silver-round-tube-of-40/SM-01oz-Round-AB-40-20241-10oz-AINSLIESilverRound-40Tube-compressed.jpg',
  '[]',
  'true', 'XAG', null, 124.4, 'coin', 'Ainslie'),

-- =============================================
-- FINE GOLD GRANULES
-- =============================================
(gen_random_uuid(), 'Ainslie Fine Gold Granules 10g with Certificate', '10 gram 99.99% pure fine gold granules with certificate of authenticity by Ainslie', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'Ainslie_Photos/fine-gold-granules-10g-w-certificate/FGG-10g-Cert-Fine-Gold-Granules---10g-w-certificate.jpg',
  '[]',
  'true', 'XAU', null, 10, 'cast', 'Ainslie');
