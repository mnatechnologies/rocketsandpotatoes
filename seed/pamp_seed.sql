-- PAMP products seed data matching PAMP_Photos
-- These products use stock='false' - they require "Contact to Order" instead of direct purchase
-- Prerequisites: Run seed/add_images_column.sql first if the images column doesn't exist

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES

-- =============================================
-- PAMP LADY FORTUNA GOLD MINTED BARS
-- =============================================
(gen_random_uuid(), 'PAMP Lady Fortuna 1g Gold Minted Bar', '1 gram 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/1g-pamp-lady-fortuna-gold-minted-bar/100633-Front.jpg',
  '["PAMP_Photos/1g-pamp-lady-fortuna-gold-minted-bar/100633-Back.jpg","PAMP_Photos/1g-pamp-lady-fortuna-gold-minted-bar/100633-Packing-front.jpg","PAMP_Photos/1g-pamp-lady-fortuna-gold-minted-bar/100633-Packing-back.jpg"]',
  'false', 'XAU', null, 1, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 2.5g Gold Minted Bar', '2.5 gram 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '2.5g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/2-5g-pamp-lady-fortuna-gold-minted-bar/100215-Front.jpg',
  '["PAMP_Photos/2-5g-pamp-lady-fortuna-gold-minted-bar/100215-Back.jpg","PAMP_Photos/2-5g-pamp-lady-fortuna-gold-minted-bar/100215-Packing-front.jpg","PAMP_Photos/2-5g-pamp-lady-fortuna-gold-minted-bar/100215-Packing-back.jpg"]',
  'false', 'XAU', null, 2.5, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 5g Gold Minted Bar', '5 gram 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/5g-pamp-lady-fortuna-gold-minted-bar/100203-Front.jpg',
  '["PAMP_Photos/5g-pamp-lady-fortuna-gold-minted-bar/100203-Back.jpg","PAMP_Photos/5g-pamp-lady-fortuna-gold-minted-bar/100203-Packing-front.jpg","PAMP_Photos/5g-pamp-lady-fortuna-gold-minted-bar/100203-Packing-back.jpg"]',
  'false', 'XAU', null, 5, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 10g Gold Minted Bar', '10 gram 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/10g-pamp-lady-fortuna-gold-minted-bar/100118-Main.jpg',
  '["PAMP_Photos/10g-pamp-lady-fortuna-gold-minted-bar/100118-Back.jpg","PAMP_Photos/10g-pamp-lady-fortuna-gold-minted-bar/100118-Packing-front.jpg","PAMP_Photos/10g-pamp-lady-fortuna-gold-minted-bar/100118-Packing-back.jpg"]',
  'false', 'XAU', null, 10, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 20g Gold Minted Bar', '20 gram 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/20g-pamp-lady-fortuna-gold-minted-bar/100087-Main.jpg',
  '["PAMP_Photos/20g-pamp-lady-fortuna-gold-minted-bar/100832-Back.jpg","PAMP_Photos/20g-pamp-lady-fortuna-gold-minted-bar/100087-Packing-front.jpg","PAMP_Photos/20g-pamp-lady-fortuna-gold-minted-bar/100087-Packing-back.jpg"]',
  'false', 'XAU', null, 20, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 1/2oz Gold Minted Bar', '1/2 troy ounce (15.55g) 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/1-2oz-pamp-lady-fortuna-gold-minted-bar/100210-Front.jpg',
  '["PAMP_Photos/1-2oz-pamp-lady-fortuna-gold-minted-bar/100210-Back.jpg","PAMP_Photos/1-2oz-pamp-lady-fortuna-gold-minted-bar/100210-Packing-front.jpg","PAMP_Photos/1-2oz-pamp-lady-fortuna-gold-minted-bar/100210-Packing-back.jpg"]',
  'false', 'XAU', null, 15.55, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Lady Fortuna 1oz Gold Minted Bar', '1 troy ounce (31.1g) 99.99% pure gold Lady Fortuna minted bar by PAMP Suisse', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/1oz-pamp-lady-fortuna-gold-minted-bar/100195-Front.jpg',
  '["PAMP_Photos/1oz-pamp-lady-fortuna-gold-minted-bar/100195-Back.jpg","PAMP_Photos/1oz-pamp-lady-fortuna-gold-minted-bar/100195-Carbon-Neutral-Reverse.png","PAMP_Photos/1oz-pamp-lady-fortuna-gold-minted-bar/100195-Packaging-Reverse.jpg"]',
  'false', 'XAU', null, 31.1, 'minted', 'PAMP Suisse'),

-- =============================================
-- PAMP ROSA GOLD MINTED BARS
-- =============================================
(gen_random_uuid(), 'PAMP Rosa 1g Gold Minted Bar', '1 gram 99.99% pure gold Rosa minted bar by PAMP Suisse', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/1g-pamp-rosa-gold-minted-bar/1017192093-Front.png',
  '["PAMP_Photos/1g-pamp-rosa-gold-minted-bar/1017192093-Back.png","PAMP_Photos/1g-pamp-rosa-gold-minted-bar/1017192093-Main.png","PAMP_Photos/1g-pamp-rosa-gold-minted-bar/1017192093-Obverse.png"]',
  'false', 'XAU', null, 1, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Rosa 2.5g Gold Minted Bar', '2.5 gram 99.99% pure gold Rosa minted bar by PAMP Suisse', '0', 'AUD', '2.5g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/2-5g-pamp-rosa-gold-minted-bar/1017192094-Front.png',
  '["PAMP_Photos/2-5g-pamp-rosa-gold-minted-bar/1017192093-Front.png","PAMP_Photos/2-5g-pamp-rosa-gold-minted-bar/1017192094-Main.png","PAMP_Photos/2-5g-pamp-rosa-gold-minted-bar/1017192094-Obverse.png"]',
  'false', 'XAU', null, 2.5, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Rosa 5g Gold Minted Bar', '5 gram 99.99% pure gold Rosa minted bar by PAMP Suisse', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/5g-pamp-rosa-gold-minted-bar/1017192072.png',
  '["PAMP_Photos/5g-pamp-rosa-gold-minted-bar/100566-Bar-Rose.png","PAMP_Photos/5g-pamp-rosa-gold-minted-bar/1017192072-2.png","PAMP_Photos/5g-pamp-rosa-gold-minted-bar/1017192072-3.png"]',
  'false', 'XAU', null, 5, 'minted', 'PAMP Suisse'),

(gen_random_uuid(), 'PAMP Rosa 20g Gold Minted Bar', '20 gram 99.99% pure gold Rosa minted bar by PAMP Suisse', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'PAMP_Photos/20g-pamp-rosa-gold-minted-bar/1017192074-Main.png',
  '["PAMP_Photos/20g-pamp-rosa-gold-minted-bar/1017192074-Obverse.png","PAMP_Photos/20g-pamp-rosa-gold-minted-bar/1017192074-certi-main.png","PAMP_Photos/20g-pamp-rosa-gold-minted-bar/1017192074-certi-obverse.png"]',
  'false', 'XAU', null, 20, 'minted', 'PAMP Suisse');
