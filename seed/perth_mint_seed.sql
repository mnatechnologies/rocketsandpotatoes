-- Perth Mint products seed data matching Perth_Mint_Photos
-- Prerequisites: Run seed/add_images_column.sql first if the images column doesn't exist

INSERT INTO "public"."products" ("id", "name", "description", "price", "currency", "weight", "category", "purity", "rating", "image_url", "images", "stock", "metal_type", "price_per_gram", "weight_grams", "form_type", "brand") VALUES

-- =============================================
-- BULLION COINS - GOLD
-- =============================================

-- Australian Kangaroo Series
(gen_random_uuid(), 'Australian Kangaroo 2026 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Australian Kangaroo bullion coin, 2026 release', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1oz-gold-bullion-coin/01-2026-australian-kangaroo-1oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1oz-gold-bullion-coin/02-2026-australian-kangaroo-1oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1oz-gold-bullion-coin/03-2026-australian-kangaroo-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2026 1/4oz Gold Coin', '1/4 troy ounce (7.78g) 99.99% pure gold Australian Kangaroo bullion coin, 2026 release', '0', 'AUD', '1/4oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-4oz-gold-bullion-coin/07-2026-australian-kangaroo-1_4oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-4oz-gold-bullion-coin/08-2026-australian-kangaroo-1_4oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-4oz-gold-bullion-coin/09-2026-australian-kangaroo-1_4oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 7.78, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2026 1/10oz Gold Coin', '1/10 troy ounce (3.11g) 99.99% pure gold Australian Kangaroo bullion coin, 2026 release', '0', 'AUD', '1/10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-10oz-gold-bullion-coin/10-2026-australian-kangaroo-1_10oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-10oz-gold-bullion-coin/11-2026-australian-kangaroo-1_10oz-gold-bullion-coin-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-10oz-gold-bullion-coin/12-2026-australian-kangaroo-1_10oz-gold-bullion-coin-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 3.11, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2026 1 Kilo Gold Coin', '1 kilogram 99.99% pure gold Australian Kangaroo bullion coin, 2026 release', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-kilo-gold-bullion-coin/08-2026-australian-kangaroo-1kilo-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-kilo-gold-bullion-coin/09-2026-australian-kangaroo-1kilo-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2026-1-kilo-gold-bullion-coin/10-2026-australian-kangaroo-1kilo-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 1000, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2025 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Australian Kangaroo bullion coin, 2025 release', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1oz-gold-bullion-coin/01-2025-auskangaroo-gold-1oz-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1oz-gold-bullion-coin/02-2025-auskangaroo-gold-1oz-bullion-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1oz-gold-bullion-coin/03-2025-auskangaroo-gold-1oz-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2025 1/2oz Gold Coin', '1/2 troy ounce (15.55g) 99.99% pure gold Australian Kangaroo bullion coin, 2025 release', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-2oz-gold-bullion-coin/04-2025-auskangaroo-gold-1_2oz-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-2oz-gold-bullion-coin/05-2025-auskangaroo-gold-1_2oz-bullion-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-2oz-gold-bullion-coin/06-2025-auskangaroo-gold-1_2oz-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 15.55, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2025 1/4oz Gold Coin', '1/4 troy ounce (7.78g) 99.99% pure gold Australian Kangaroo bullion coin, 2025 release', '0', 'AUD', '1/4oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-4oz-gold-bullion-coin/07-2025-auskangaroo-gold-1_4oz-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-4oz-gold-bullion-coin/08-2025-auskangaroo-gold-1_4oz-bullion-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-4oz-gold-bullion-coin/09-2025-auskangaroo-gold-1_4oz-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 7.78, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2025 1 Kilo Gold Coin', '1 kilogram 99.99% pure gold Australian Kangaroo bullion coin, 2025 release', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-kilo-gold-bullion-coin/06-2025-australian-kangaroo-1kilo-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-kilo-gold-bullion-coin/07-2025-australian-kangaroo-1kilo-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2025-1-kilo-gold-bullion-coin/08-2024-auskangaroo-gold-1kilo-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 1000, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo 2024 1 Kilo Gold Coin', '1 kilogram 99.99% pure gold Australian Kangaroo bullion coin, 2024 release', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2024-1-kilo-gold-bullion-coin/01-2024-auskangaroo-gold-1kilo-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2024-1-kilo-gold-bullion-coin/02-2024-auskangaroo-gold-1kilo-bullion-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kangaroo-2024-1-kilo-gold-bullion-coin/03-2024-auskangaroo-gold-1kilo-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 1000, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kangaroo Mother & Baby 2023 2oz Gold Coin', '2 troy ounce (62.2g) 99.99% pure gold Australian Kangaroo Mother & Baby bullion coin, 2023 release', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/2023-aust-kangaroo-mother-baby-2oz-gold-bullion-coin/01-2023--australian-kangaroo-mother--baby--2oz-gold-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/2023-aust-kangaroo-mother-baby-2oz-gold-bullion-coin/02-2023--australian-kangaroo-mother--baby--2oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/2023-aust-kangaroo-mother-baby-2oz-gold-bullion-coin/03-2023--australian-kangaroo-mother--baby--2oz-gold-bullion--obverse-highres.jpg"]',
  'true', 'XAU', null, 62.2, 'coin', 'Perth Mint'),

-- Australian Lunar Series III
(gen_random_uuid(), 'Lunar III Year of the Horse 2026 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Lunar Series III Year of the Horse coin, 2026', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin/01-lunar-series-iii-yot-horse-2026-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin/02-lunar-series-iii-yot-horse-2026-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin/03-lunar-series-iii-yot-horse-2026-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Horse 2026 1oz Gold Coin (Dragon Privy)', '1 troy ounce (31.1g) 99.99% pure gold Lunar Series III Year of the Horse coin with dragon privy mark, 2026', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin-with-dragon-privy/04-2026-lunar-yot-horse-1oz-gold-with-dragon-privy-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin-with-dragon-privy/05-2026-lunar-yot-horse-1oz-gold-with-dragon-privy-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1oz-gold-bullion-coin-with-dragon-privy/06-2026-lunar-yot-horse-1oz-gold-with-dragon-privy-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Horse 2026 1/2oz Gold Coin', '1/2 troy ounce (15.55g) 99.99% pure gold Lunar Series III Year of the Horse coin, 2026', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-2oz-gold-bullion-coin/01-lunar-series-iii-yot-horse-2026-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-2oz-gold-bullion-coin/02-lunar-series-iii-yot-horse-2026-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-2oz-gold-bullion-coin/06-lunar-series-iii-yot-horse-2026-1_2oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 15.55, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Horse 2026 1/10oz Gold Coin', '1/10 troy ounce (3.11g) 99.99% pure gold Lunar Series III Year of the Horse coin, 2026', '0', 'AUD', '1/10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-10oz-gold-bullion-coin/01-lunar-series-iii-yot-horse-2026-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-10oz-gold-bullion-coin/02-lunar-series-iii-yot-horse-2026-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-10oz-gold-bullion-coin/08-lunar-series-iii-yot-horse-2026-1_10oz-gold-bullion-coin--obverse-highres.jpg"]',
  'true', 'XAU', null, 3.11, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Horse 2026 1/20oz Gold Coin', '1/20 troy ounce (1.56g) 99.99% pure gold Lunar Series III Year of the Horse coin, 2026', '0', 'AUD', '1/20oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-20oz-gold-bullion-coin/01-lunar-series-iii-yot-horse-2026-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-20oz-gold-bullion-coin/02-lunar-series-iii-yot-horse-2026-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-1-20oz-gold-bullion-coin/09-lunar-series-iii-yot-horse-2026-1_20oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 1.56, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Horse 2026 10oz Gold Coin', '10 troy ounce (311g) 99.99% pure gold Lunar Series III Year of the Horse coin, 2026', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-10oz-gold-bullion-coin/01-lunar-series-iii-yot-horse-2026-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-10oz-gold-bullion-coin/02-lunar-series-iii-yot-horse-2026-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2026-year-of-the-horse-10oz-gold-bullion-coin/05-lunar-series-iii-yot-horse-2026-10oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 311, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Snake 2025 1oz Gold Coin (Dragon Privy)', '1 troy ounce (31.1g) 99.99% pure gold Lunar Series III Year of the Snake coin with dragon privy mark, 2025', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1oz-gold-bullion-coin-dragon-privy/04-2025-yot-snake-1oz-gold-coin-with-dragon-privy-mark-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1oz-gold-bullion-coin-dragon-privy/05-2025-yot-snake-1oz-gold-coin-with-dragon-privy-mark-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1oz-gold-bullion-coin-dragon-privy/06-2025-yot-snake-1oz-gold-coin-with-dragon-privy-mark-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Snake 2025 2oz Gold Coin', '2 troy ounce (62.2g) 99.99% pure gold Lunar Series III Year of the Snake coin, 2025', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-2oz-gold-bullion-coin/01-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-2oz-gold-bullion-coin/02-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-2oz-gold-bullion-coin/04-2025-lunar-series-iii-year-of-the-snake-2oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 62.2, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Snake 2025 1/2oz Gold Coin', '1/2 troy ounce (15.55g) 99.99% pure gold Lunar Series III Year of the Snake coin, 2025', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-2oz-gold-bullion-coin/01-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-2oz-gold-bullion-coin/02-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-2oz-gold-bullion-coin/06-2025-lunar-series-iii-year-of-the-snake-1_2oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 15.55, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Snake 2025 1/4oz Gold Coin', '1/4 troy ounce (7.78g) 99.99% pure gold Lunar Series III Year of the Snake coin, 2025', '0', 'AUD', '1/4oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-4oz-gold-bullion-coin/01-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-4oz-gold-bullion-coin/02-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-1-4oz-gold-bullion-coin/07-2025-lunar-series-iii-year-of-the-snake-1_4oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 7.78, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Snake 2025 10oz Gold Coin', '10 troy ounce (311g) 99.99% pure gold Lunar Series III Year of the Snake coin, 2025', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-10oz-gold-bullion-coin/01-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-10oz-gold-bullion-coin/02-2025-lunar-series-iii-year-of-the-snake-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2025-year-of-the-snake-10oz-gold-bullion-coin/05-2025-lunar-series-iii-year-of-the-snake-10oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 311, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Dragon 2024 1oz Gold Coin (Dragon Privy)', '1 troy ounce (31.1g) 99.99% pure gold Lunar Series III Year of the Dragon coin with dragon privy mark, 2024', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-1oz-gold-bullion-coin-dragon-privy-mark/03-2024-year-of-the-dragon-1oz-gold-coin-with-dragon-privy-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-1oz-gold-bullion-coin-dragon-privy-mark/04-2024-year-of-the-dragon-1oz-gold-coin-with-dragon-privy-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-1oz-gold-bullion-coin-dragon-privy-mark/05-2024-yearofthedragon-gold-bullion-1oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Dragon 2024 2oz Gold Coin', '2 troy ounce (62.2g) 99.99% pure gold Lunar Series III Year of the Dragon coin, 2024', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-2oz-gold-bullion-coin/01-2024-yearofthedragon-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-2oz-gold-bullion-coin/02-2024-yearofthedragon-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-2oz-gold-bullion-coin/04-2024-yearofthedragon-gold-bullion-2oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 62.2, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Dragon 2024 1/2oz Gold Coin', '1/2 troy ounce (15.55g) 99.99% pure gold Lunar Series III Year of the Dragon coin, 2024', '0', 'AUD', '1/2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/2024-lunar-iii-dragon-1-2oz-gold-bullion-coin/01-2024-yearofthedragon-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/2024-lunar-iii-dragon-1-2oz-gold-bullion-coin/02-2024-yearofthedragon-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/2024-lunar-iii-dragon-1-2oz-gold-bullion-coin/06-2024-yearofthedragon-gold-bullion-1_2oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 15.55, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Dragon 2024 10oz Gold Coin', '10 troy ounce (311g) 99.99% pure gold Lunar Series III Year of the Dragon coin, 2024', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-10oz-gold-bullion-coin/01-2024-yearofthedragon-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-10oz-gold-bullion-coin/02-2024-yearofthedragon-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-2024-year-of-the-dragon-10oz-gold-bullion-coin/03-2024-yearofthedragon-gold-bullion-10oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 311, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Rabbit 2023 2oz Gold Coin', '2 troy ounce (62.2g) 99.99% pure gold Lunar Series III Year of the Rabbit coin, 2023', '0', 'AUD', '2oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-2oz-gold-bullion-coin/01-2023-yearoftherabbit-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-2oz-gold-bullion-coin/02-2023-yearoftherabbit-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-2oz-gold-bullion-coin/04-2023-yearoftherabbit-gold-bullion-2oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 62.2, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Lunar III Year of the Rabbit 2023 1/4oz Gold Coin', '1/4 troy ounce (7.78g) 99.99% pure gold Lunar Series III Year of the Rabbit coin, 2023', '0', 'AUD', '1/4oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-1-4oz-gold-bullion-coin/01-2023-yearoftherabbit-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-1-4oz-gold-bullion-coin/02-2023-yearoftherabbit-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-lunar-series-iii-year-of-the-rabbit-2023-1-4oz-gold-bullion-coin/07-2023-yearoftherabbit-gold-bullion-1_4oz-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 7.78, 'coin', 'Perth Mint'),

-- Chinese Myths and Legends
(gen_random_uuid(), 'Chinese Myths Double Phoenix 2026 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Chinese Myths and Legends Double Phoenix coin, 2026', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-double-phoenix-2026-1oz-gold-bullion-coin/01-3830-2026-double-phoenix-1oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-double-phoenix-2026-1oz-gold-bullion-coin/02-3830-2026-double-phoenix-1oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-double-phoenix-2026-1oz-gold-bullion-coin/03-3830-2026-double-phoenix-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Chinese Myths Dragon and Koi 2024 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Chinese Myths and Legends Dragon and Koi coin, 2024', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-dragon-and-koi-2024-1oz-gold-bullion-coin/01-2024-dragon--koi-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-dragon-and-koi-2024-1oz-gold-bullion-coin/02-2024-dragon--koi-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-dragon-and-koi-2024-1oz-gold-bullion-coin/03-2024-dragon--koi-1oz-gold-bullion-coin-obverse-hig.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Chinese Myths Four Guardians 2025 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Chinese Myths and Legends Four Guardians coin, 2025', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-four-guardians-2025-1oz-gold-bullion-coin/01-2024-chinese-myths--legends-four-mythical-guardians-1oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-four-guardians-2025-1oz-gold-bullion-coin/02-2024-chinese-myths--legends-four-mythical-guardians-1oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/chinese-myths-and-legends-four-guardians-2025-1oz-gold-bullion-coin/03-2024-chinese-myths--legends-four-mythical-guardians-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

-- Other Bullion Coins
(gen_random_uuid(), 'Australian Emu 2025 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Australian Emu bullion coin, 2025', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-emu-2025-1oz-gold-bullion-coin/04-2025-australian-emu-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-emu-2025-1oz-gold-bullion-coin/05-2025-australian-emu-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-emu-2025-1oz-gold-bullion-coin/06-2025-australian-emu-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Koala 2024 1/10oz Gold Coin', '1/10 troy ounce (3.11g) 99.99% pure gold Australian Koala bullion coin, 2024', '0', 'AUD', '1/10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-koala-2024-1-10oz-gold-bullion-coin/01-2024-australian-koala-1_10oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-koala-2024-1-10oz-gold-bullion-coin/02-2024-australian-koala-1_10oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-koala-2024-1-10oz-gold-bullion-coin/03-2024-australian-koala-1_10oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 3.11, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Australian Kookaburra 2026 1/10oz Gold Coin', '1/10 troy ounce (3.11g) 99.99% pure gold Australian Kookaburra bullion coin, 2026', '0', 'AUD', '1/10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/australian-kookaburra-2026-1-10oz-gold-bullion-coin/01-3937-australian-kookaburra-2026-1_10oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/australian-kookaburra-2026-1-10oz-gold-bullion-coin/02-3937-australian-kookaburra-2026-1_10oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/australian-kookaburra-2026-1-10oz-gold-bullion-coin/03-3937-australian-kookaburra-2026-1_10oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 3.11, 'coin', 'Perth Mint'),

(gen_random_uuid(), '225th Anniversary Proclamation Pillar Dollar 2025 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold 225th Anniversary of Australian Proclamation Coins Pillar Dollar coin, 2025', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/225th-anniversary-of-australian-proclamation-coins-pillar-dollar-2025-1oz-gold-bullion-coin/01-2025-225th-anni-australia-proclamation-1oz-gold-bullion-coin-on-edge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/225th-anniversary-of-australian-proclamation-coins-pillar-dollar-2025-1oz-gold-bullion-coin/02-2025-225th-anni-australia-proclamation-1oz-gold-bullion-coin-straight-on-highres.jpg","Perth_Mint_Photos/Bullion Coins/225th-anniversary-of-australian-proclamation-coins-pillar-dollar-2025-1oz-gold-bullion-coin/03-2025-225th-anni-australia-proclamation-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Dragon 2024 1oz Gold Rectangular Coin', '1 troy ounce (31.1g) 99.99% pure gold rectangular Dragon bullion coin, 2024', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/dragon-2024-1oz-gold-rectangular-bullion-coin/05-2024-rectangulardragon-1oz-gold-bullion-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/dragon-2024-1oz-gold-rectangular-bullion-coin/06-2024-rectangulardragon-1oz-gold-bullion-strighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/dragon-2024-1oz-gold-rectangular-bullion-coin/07-2024-rectangulardragon-1oz-gold-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

-- Super Pit Series
(gen_random_uuid(), 'Super Pit 2024 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Super Pit bullion coin, 2024', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/super-pit-2024-1oz-gold-bullion-coin/05-2024-super-pit-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/super-pit-2024-1oz-gold-bullion-coin/06-2024-super-pit-1oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/super-pit-2024-1oz-gold-bullion-coin/07-2024-super-pit-1oz-gold-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Super Pit 2024 5oz Gold Coin', '5 troy ounce (155.5g) 99.99% pure gold Super Pit bullion coin, 2024', '0', 'AUD', '5oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/super-pit-2024-5oz-gold-bullion-coin/08-2024-super-pit-5oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/super-pit-2024-5oz-gold-bullion-coin/09-2024-super-pit-5oz-gold-bullion-coin-straighton-highres.jpg","Perth_Mint_Photos/Bullion Coins/super-pit-2024-5oz-gold-bullion-coin/10-2024-super-pit-5oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 155.5, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Super Pit 2023 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Super Pit bullion coin, 2023', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/super-pit-2023-1oz-gold-bullion-coin/04-2023-superpit-1oz-gold-bullion-coin-onedge-highres.jpg',
  '["Perth_Mint_Photos/Bullion Coins/super-pit-2023-1oz-gold-bullion-coin/05-2023-superpit-1oz-gold-bullion-coin-straighton-highres_1.jpg","Perth_Mint_Photos/Bullion Coins/super-pit-2023-1oz-gold-bullion-coin/06-2023-superpit-1oz-gold-bullion-coin-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

(gen_random_uuid(), 'Welcome Nugget 2024 1oz Gold Coin', '1 troy ounce (31.1g) 99.99% pure gold Welcome Nugget bullion coin, 2024', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Bullion Coins/welcome-nugget-2024-1oz-gold-bullion-coin/01-welcome-nugget-2024-1oz-gold-bullion-coin-on-edge-highres1.jpg',
  '["Perth_Mint_Photos/Bullion Coins/welcome-nugget-2024-1oz-gold-bullion-coin/02-welcome-nugget-2024-1oz-gold-bullion-coin-straight-on-highres1.jpg","Perth_Mint_Photos/Bullion Coins/welcome-nugget-2024-1oz-gold-bullion-coin/03-welcome-nugget-2024-1oz-gold-bullion-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'coin', 'Perth Mint'),

-- =============================================
-- CAST BARS - GOLD
-- =============================================
(gen_random_uuid(), 'Perth Mint 1oz Gold Cast Bar', '1 troy ounce (31.1g) 99.99% pure gold cast bar by Perth Mint', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/perth-mint-1oz-gold-cast-bar/01-perth-mint-bar-1oz-gold_onside.jpg',
  '["Perth_Mint_Photos/Cast Bars/perth-mint-1oz-gold-cast-bar/02-perth-mint-bar-1oz-gold_front.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-1oz-gold-cast-bar/03-perth-mint-bar-1oz-gold_front.jpg"]',
  'true', 'XAU', null, 31.1, 'cast', 'Perth Mint'),

(gen_random_uuid(), 'Perth Mint 5oz Gold Cast Bar', '5 troy ounce (155.5g) 99.99% pure gold cast bar by Perth Mint', '0', 'AUD', '5oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/perth-mint-5-oz-gold-cast-bar/13-2025-gold-cast-bar_5oz-onedge-highres.jpg',
  '["Perth_Mint_Photos/Cast Bars/perth-mint-5-oz-gold-cast-bar/14-2025-gold-cast-bar_5oz-front-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-5-oz-gold-cast-bar/15-2025-gold-cast-bar_5oz-back-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-5-oz-gold-cast-bar/16-2025-gold-cast-bar_5oz-angle-highres.jpg"]',
  'true', 'XAU', null, 155.5, 'cast', 'Perth Mint'),

(gen_random_uuid(), 'Perth Mint 10oz Gold Cast Bar', '10 troy ounce (311g) 99.99% pure gold cast bar by Perth Mint', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/perth-mint-10oz-gold-cast-bar/09-2025-gold-cast-bar_10oz-onedge-highres.jpg',
  '["Perth_Mint_Photos/Cast Bars/perth-mint-10oz-gold-cast-bar/10-2025-gold-cast-bar_10oz-front-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-10oz-gold-cast-bar/11-2025-gold-cast-bar_10oz-back-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-10oz-gold-cast-bar/12-2025-gold-cast-bar_10oz-angle-highres.jpg"]',
  'true', 'XAU', null, 311, 'cast', 'Perth Mint'),

(gen_random_uuid(), 'Perth Mint 100g Gold Cast Bar', '100 gram 99.99% pure gold cast bar by Perth Mint', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/perth-mint-100g-gold-cast-bar/05-2025-gold-cast-bar_100g-onedge-highres.jpg',
  '["Perth_Mint_Photos/Cast Bars/perth-mint-100g-gold-cast-bar/06-2025-gold-cast-bar_100g-front-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-100g-gold-cast-bar/07-2025-gold-cast-bar_100g-back-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-100g-gold-cast-bar/08-2025-gold-cast-bar_100g-angle-highres.jpg"]',
  'true', 'XAU', null, 100, 'cast', 'Perth Mint'),

(gen_random_uuid(), 'Perth Mint 1 Kilo Gold Cast Bar', '1 kilogram 99.99% pure gold cast bar by Perth Mint', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/1-kilo-gold-cast-bar/01-1-kilo-gold-cast-bar-onedge-feb26.jpg',
  '["Perth_Mint_Photos/Cast Bars/1-kilo-gold-cast-bar/02-1-kilo-gold-cast-bar-straight-on-feb26.jpg","Perth_Mint_Photos/Cast Bars/1-kilo-gold-cast-bar/03-1-kilo-gold-cast-bar-mood-shot-1-feb26.jpg"]',
  'true', 'XAU', null, 1000, 'cast', 'Perth Mint'),

(gen_random_uuid(), 'Australian Origin 1 Kilo Gold Cast Bar', '1 kilogram 99.99% pure Australian origin gold cast bar by Perth Mint', '0', 'AUD', '1kg', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/australian-origin-1-kilo-gold-cast-bar/dscf7979_w.jpg',
  '["Perth_Mint_Photos/Cast Bars/australian-origin-1-kilo-gold-cast-bar/dscf7985.jpg","Perth_Mint_Photos/Cast Bars/australian-origin-1-kilo-gold-cast-bar/dscf7988.jpg","Perth_Mint_Photos/Cast Bars/australian-origin-1-kilo-gold-cast-bar/dscf7989.jpg"]',
  'true', 'XAU', null, 1000, 'cast', 'Perth Mint'),

-- CAST BARS - SILVER
(gen_random_uuid(), 'Perth Mint 1 Kilo Silver Cast Bar', '1 kilogram 99.99% pure silver cast bar by Perth Mint', '0', 'AUD', '1kg', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Cast Bars/perth-mint-1-kilo-silver-cast-bar/01-1-kilo-silver-cast-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Cast Bars/perth-mint-1-kilo-silver-cast-bar/02-1-kilo-silver-cast-bar-straight-on-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-1-kilo-silver-cast-bar/03-1-kilo-silver-cast-bar-obverse-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-1-kilo-silver-cast-bar/04-1-kilo-silver-cast-bar-mood-shot-highres.jpg","Perth_Mint_Photos/Cast Bars/perth-mint-1-kilo-silver-cast-bar/05-1-kilo-silver-cast-bar-full-packaging1-highres.jpg"]',
  'true', 'XAG', null, 1000, 'cast', 'Perth Mint'),

-- =============================================
-- MINTED BARS - GOLD
-- =============================================

-- Kangaroo Minted Gold Bars
(gen_random_uuid(), 'Kangaroo 1g Minted Gold Bar', '1 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-1g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-1g-minted-gold-bar/01-gold-mintedbar-1g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1g-minted-gold-bar/02-gold-mintedbar-1g-packaging-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1g-minted-gold-bar/03.jpg"]',
  'true', 'XAU', null, 1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 5g Minted Gold Bar', '5 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-5g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-5g-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-5g-minted-gold-bar/03-gold-mintedbar-5g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-5g-minted-gold-bar/04-gold-mintedbar-5g-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 5, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 10g Minted Gold Bar', '10 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '10g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-10g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-10g-minted-gold-bar/02-gold-mintedbar-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-10g-minted-gold-bar/03-gold-mintedbar-10g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-10g-minted-gold-bar/04-gold-mintedbar-10g-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 10, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 20g Minted Gold Bar', '20 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '20g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-20g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-20g-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-20g-minted-gold-bar/05-gold-mintedbar-20g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-20g-minted-gold-bar/06-gold-mintedbar-20g-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 20, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 50g Minted Gold Bar', '50 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '50g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-50g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-50g-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-50g-minted-gold-bar/09-gold-mintedbar-50g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-50g-minted-gold-bar/10-gold-mintedbar-50g-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 50, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 100g Minted Gold Bar', '100 gram 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '100g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-100g-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-100g-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-100g-minted-gold-bar/11-gold-mintedbar-100g-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-100g-minted-gold-bar/12-gold-mintedbar-100g-packgaing-obverse-highres.jpg"]',
  'true', 'XAU', null, 100, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 1oz Minted Gold Bar', '1 troy ounce (31.1g) 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-gold-bar/07-gold-mintedbar-1oz-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-gold-bar/08-gold-mintedbar-1oz-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Kangaroo 10oz Minted Gold Bar', '10 troy ounce (311g) 99.99% pure minted gold bar with Kangaroo design by Perth Mint', '0', 'AUD', '10oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-10oz-minted-gold-bar/01-gold-mintedbar-obverse-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-10oz-minted-gold-bar/02-gold-mintedbar-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-10oz-minted-gold-bar/03-gold-mintedbar-10oz-packaging-reverse-highres.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-10oz-minted-gold-bar/04-gold-mintedbar-10oz-packaging-obverse-highres.jpg"]',
  'true', 'XAU', null, 311, 'minted', 'Perth Mint'),

-- Lakshmi Minted Gold Bars
(gen_random_uuid(), 'Lakshmi 1g Gold Minted Bar', '1 gram 99.99% pure gold minted bar with Lakshmi design by Perth Mint', '0', 'AUD', '1g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lakshmi-1g-gold-minted-bar/01-lakshmi-1g-gold-minted-bar--incard-front-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lakshmi-1g-gold-minted-bar/02-lakshmi-1g-gold-minted-bar-onedge-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-1g-gold-minted-bar/03-lakshmi-1g-gold-minted-bar--straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-1g-gold-minted-bar/04-lakshmi-1g-gold-minted-bar--obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-1g-gold-minted-bar/05-lakshmi-1g-gold-minted-bar--incard-back-highres.jpg"]',
  'true', 'XAU', null, 1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lakshmi 5g Gold Minted Bar', '5 gram 99.99% pure gold minted bar with Lakshmi design by Perth Mint', '0', 'AUD', '5g', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lakshmi-5g-gold-minted-bar/01-lakshmi-5g-gold-minted-bar--incard-front-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lakshmi-5g-gold-minted-bar/02-lakshmi-5g-gold-minted-bar-onedge-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-5g-gold-minted-bar/03-lakshmi-5g-gold-minted-bar--straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-5g-gold-minted-bar/04-lakshmi-5g-gold-minted-bar--obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lakshmi-5g-gold-minted-bar/05-lakshmi-5g-gold-minted-bar--incard-back-highres.jpg"]',
  'true', 'XAU', null, 5, 'minted', 'Perth Mint'),

-- Lunar Minted Gold Bars
(gen_random_uuid(), 'Lunar Dragon 1oz Gold Minted Bar', '1 troy ounce (31.1g) 99.99% pure gold Lunar Dragon minted bar by Perth Mint', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-gold-minted-bar/01-dragon-2024--lunar-1oz-gold-minted-bar--on-edge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-gold-minted-bar/02-dragon-2024--lunar-1oz-gold-minted-bar--straight-on-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-gold-minted-bar/03-dragon-2024--lunar-1oz-gold-minted-bar--obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-gold-minted-bar/04-dragon-2024--lunar-1oz-gold-minted-bar--in-packaging-front-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-gold-minted-bar/05-dragon-2024--lunar-1oz-gold-minted-bar--in-packaging-back-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Snake 1oz Gold Minted Bar', '1 troy ounce (31.1g) 99.99% pure gold Lunar Snake minted bar by Perth Mint, 2025', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-gold-minted-bar/06-2025-snake-1oz-gold-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-gold-minted-bar/07-2025-snake-1oz-gold-minted-bar-straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-gold-minted-bar/08-2025--snake-1oz-gold-minted-bar-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-gold-minted-bar/09-2025-snake-1oz-gold-minted-bar-incard-front-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-gold-minted-bar/10-2025-snake-1oz-gold-minted-bar-incard-back-highres-updated.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Horse 1oz Gold Minted Bar', '1 troy ounce (31.1g) 99.99% pure gold Lunar Horse minted bar by Perth Mint, 2026', '0', 'AUD', '1oz', 'Gold', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-horse-1oz-gold-minted-bar/06-2026-lunar-horse-1oz-gold-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-horse-1oz-gold-minted-bar/07-2026-lunar-horse-1oz-gold-minted-bar-straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-horse-1oz-gold-minted-bar/08-2026-lunar--horse-1oz-gold-minted-bar-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-horse-1oz-gold-minted-bar/09-2026-lunar-horse-1oz-gold-minted-bar-incard-front-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-horse-1oz-gold-minted-bar/10-2026-lunar-horse-1oz-gold-minted-bar-incard-back-highres.jpg"]',
  'true', 'XAU', null, 31.1, 'minted', 'Perth Mint'),

-- MINTED BARS - SILVER
(gen_random_uuid(), 'Kangaroo 1oz Minted Silver Bars in Tube', '1 troy ounce (31.1g) 99.99% pure minted silver bars with Kangaroo design in tube by Perth Mint', '0', 'AUD', '1oz', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-silver-bars-in-tube/02-kangaroo-minted-bar-in-tubes-1oz-silver_straighton.jpg',
  '["Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-silver-bars-in-tube/03-kangaroo-minted-bar-in-tubes-1oz-silver_reverse.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-silver-bars-in-tube/04-kangaroo-minted-bar-in-tubes-1oz-silver_intube.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-silver-bars-in-tube/05-kangaroo-minted-bar-in-tubes-1oz-silver_intube.jpg","Perth_Mint_Photos/Minted Bars/kangaroo-1oz-minted-silver-bars-in-tube/06-kangaroo-minted-bar-in-tubes-1oz-silver_monsterbox.jpg"]',
  'true', 'XAG', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Dragon 1oz Silver Minted Bar in Pouch', '1 troy ounce (31.1g) 99.99% pure silver Lunar Dragon minted bar in pouch by Perth Mint', '0', 'AUD', '1oz', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-pouch/01-2024-rectangulardragon-1oz-silver-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-pouch/02-2024-rectangulardragon-1oz-silver-minted-bar-strighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-pouch/03-2024-rectangulardragon-1oz-silver-minted-bar-obverse-highres.jpg"]',
  'true', 'XAG', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Dragon 1oz Silver Minted Bar in Tube', '1 troy ounce (31.1g) 99.99% pure silver Lunar Dragon minted bar in tube by Perth Mint', '0', 'AUD', '1oz', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-tube/01-2024-rectangulardragon-1oz-silver-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-tube/02-2024-rectangulardragon-1oz-silver-minted-bar-strighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-tube/03-2024-rectangulardragon-1oz-silver-minted-bar-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-dragon-1oz-silver-minted-bar-in-tube/04-2024-rectangulardragon-1oz-silver-minted-bar-incase-highres.jpg"]',
  'true', 'XAG', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Snake 1oz Silver Minted Bar in Pouch', '1 troy ounce (31.1g) 99.99% pure silver Lunar Snake minted bar in pouch by Perth Mint, 2025', '0', 'AUD', '1oz', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bar-in-pouch/01-2025-snake-1oz-silver-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bar-in-pouch/02-2025-snake-1oz-silver-minted-bar-straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bar-in-pouch/03-2025-snake-1oz-silver-minted-bar-obverse-highres.jpg"]',
  'true', 'XAG', null, 31.1, 'minted', 'Perth Mint'),

(gen_random_uuid(), 'Lunar Snake 1oz Silver Minted Bars in Tube', '1 troy ounce (31.1g) 99.99% pure silver Lunar Snake minted bars in tube by Perth Mint, 2025', '0', 'AUD', '1oz', 'Silver', '99.99%', '5.0',
  'Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bars-in-tube/01-2025-snake-1oz-silver-minted-bar-onedge-highres.jpg',
  '["Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bars-in-tube/02-2025-snake-1oz-silver-minted-bar-straighton-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bars-in-tube/03-2025-snake-1oz-silver-minted-bar-obverse-highres.jpg","Perth_Mint_Photos/Minted Bars/lunar-snake-1oz-silver-minted-bars-in-tube/04-2025-snake-1oz-silver-minted-bar-incase-highres.jpg"]',
  'true', 'XAG', null, 31.1, 'minted', 'Perth Mint');
