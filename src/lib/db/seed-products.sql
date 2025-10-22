-- Seed data for Australian National Bullion products
-- Production-ready bullion products with realistic pricing and specifications

INSERT INTO products (name, description, price, currency, weight, category, purity, rating, image, stock)
VALUES
    -- Gold Bars
    (
        '1oz Gold Bar - Perth Mint',
        'Premium 1 troy ounce gold bar from The Perth Mint. Features the iconic Swan design and comes with an assay certificate. Ideal for investors seeking quality and liquidity.',
        2850.00,
        'AUD',
        '1 oz',
        'gold_bars',
        '99.99%',
        '4.9',
        '/images/products/gold-bar-1oz-perth.jpg',
        true
    ),
    (
        '10oz Gold Bar - ABC Bullion',
        'Ten troy ounce gold bar manufactured by ABC Bullion. Stamped with weight, purity and serial number. Comes in protective packaging.',
        28200.00,
        'AUD',
        '10 oz',
        'gold_bars',
        '99.99%',
        '4.8',
        '/images/products/gold-bar-10oz-abc.jpg',
        true
    ),
    (
        '100g Gold Bar - Perth Mint',
        'Cast gold bar weighing 100 grams from The Perth Mint. Features tamper-evident packaging and full documentation.',
        9150.00,
        'AUD',
        '100 g',
        'gold_bars',
        '99.99%',
        '4.9',
        '/images/products/gold-bar-100g-perth.jpg',
        true
    ),
    (
        '1kg Gold Bar - ABC Bullion',
        'Premium 1 kilogram gold bar from ABC Bullion. London Good Delivery standard. Includes certificate of authenticity.',
        91500.00,
        'AUD',
        '1 kg',
        'gold_bars',
        '99.99%',
        '5.0',
        '/images/products/gold-bar-1kg-abc.jpg',
        true
    ),

    -- Gold Coins
    (
        'Australian Kangaroo 1oz Gold Coin',
        'Official Australian gold bullion coin featuring the iconic kangaroo design. Legal tender with face value of $100 AUD. Highly liquid worldwide.',
        2880.00,
        'AUD',
        '1 oz',
        'gold_coins',
        '99.99%',
        '4.9',
        '/images/products/gold-coin-kangaroo-1oz.jpg',
        true
    ),
    (
        'Australian Lunar Series Gold Coin 1oz',
        'Perth Mint Lunar Series coin celebrating the Chinese zodiac. Limited mintage collector piece with investment value.',
        2920.00,
        'AUD',
        '1 oz',
        'gold_coins',
        '99.99%',
        '5.0',
        '/images/products/gold-coin-lunar-1oz.jpg',
        true
    ),
    (
        'American Gold Eagle 1oz',
        'Official United States Mint gold bullion coin. One of the most recognized gold coins worldwide.',
        2900.00,
        'AUD',
        '1 oz',
        'gold_coins',
        '91.67%',
        '4.8',
        '/images/products/gold-coin-eagle-1oz.jpg',
        true
    ),
    (
        'Canadian Gold Maple Leaf 1oz',
        'Royal Canadian Mint gold coin featuring the maple leaf. Renowned for exceptional purity and security features.',
        2890.00,
        'AUD',
        '1 oz',
        'gold_coins',
        '99.99%',
        '4.9',
        '/images/products/gold-coin-maple-1oz.jpg',
        true
    ),

    -- Silver Bars
    (
        '1oz Silver Bar - Perth Mint',
        'One troy ounce silver bar from The Perth Mint. Perfect for small investors and gifting.',
        42.00,
        'AUD',
        '1 oz',
        'silver_bars',
        '99.9%',
        '4.7',
        '/images/products/silver-bar-1oz-perth.jpg',
        true
    ),
    (
        '10oz Silver Bar - ABC Bullion',
        'Ten troy ounce silver bar manufactured by ABC Bullion. Excellent value for money.',
        410.00,
        'AUD',
        '10 oz',
        'silver_bars',
        '99.9%',
        '4.8',
        '/images/products/silver-bar-10oz-abc.jpg',
        true
    ),
    (
        '1kg Silver Bar - Perth Mint',
        'Cast silver bar weighing 1 kilogram (32.15 oz). Popular choice for serious investors.',
        1320.00,
        'AUD',
        '1 kg',
        'silver_bars',
        '99.9%',
        '4.9',
        '/images/products/silver-bar-1kg-perth.jpg',
        true
    ),
    (
        '5kg Silver Bar - ABC Bullion',
        'Large 5 kilogram silver bar offering lowest premiums over spot price. Ideal for bulk investment.',
        6500.00,
        'AUD',
        '5 kg',
        'silver_bars',
        '99.9%',
        '4.8',
        '/images/products/silver-bar-5kg-abc.jpg',
        true
    ),

    -- Silver Coins
    (
        'Australian Kookaburra 1oz Silver Coin',
        'Perth Mint silver coin with annual kookaburra design. Legal tender and highly collectible.',
        48.00,
        'AUD',
        '1 oz',
        'silver_coins',
        '99.99%',
        '4.8',
        '/images/products/silver-coin-kookaburra-1oz.jpg',
        true
    ),
    (
        'Australian Kangaroo 1oz Silver Coin',
        'Official Australian silver bullion coin featuring kangaroo. Recognized worldwide.',
        46.00,
        'AUD',
        '1 oz',
        'silver_coins',
        '99.99%',
        '4.7',
        '/images/products/silver-coin-kangaroo-1oz.jpg',
        true
    ),
    (
        'American Silver Eagle 1oz',
        'United States Mint silver coin. Most popular silver bullion coin globally.',
        50.00,
        'AUD',
        '1 oz',
        'silver_coins',
        '99.9%',
        '4.9',
        '/images/products/silver-coin-eagle-1oz.jpg',
        true
    ),
    (
        'Canadian Silver Maple Leaf 1oz',
        'Royal Canadian Mint silver coin with advanced security features and exceptional purity.',
        47.00,
        'AUD',
        '1 oz',
        'silver_coins',
        '99.99%',
        '4.8',
        '/images/products/silver-coin-maple-1oz.jpg',
        true
    ),

    -- Platinum Products
    (
        '1oz Platinum Bar - Perth Mint',
        'One troy ounce platinum bar from The Perth Mint. Rare and valuable precious metal investment.',
        1450.00,
        'AUD',
        '1 oz',
        'platinum_bars',
        '99.95%',
        '4.7',
        '/images/products/platinum-bar-1oz-perth.jpg',
        true
    ),
    (
        'Australian Platinum Koala 1oz Coin',
        'Perth Mint platinum coin featuring the koala. Annual design changes make it collectible.',
        1480.00,
        'AUD',
        '1 oz',
        'platinum_coins',
        '99.95%',
        '4.8',
        '/images/products/platinum-coin-koala-1oz.jpg',
        true
    ),

    -- Palladium Products
    (
        '1oz Palladium Bar - ABC Bullion',
        'One troy ounce palladium bar. Industrial and investment metal with strong demand.',
        1620.00,
        'AUD',
        '1 oz',
        'palladium_bars',
        '99.95%',
        '4.6',
        '/images/products/palladium-bar-1oz-abc.jpg',
        true
    ),

    -- Special/Premium Items
    (
        'Australian Sovereign Gold Coin',
        'Historic gold sovereign featuring King Charles III. Legal tender with numismatic and bullion value.',
        680.00,
        'AUD',
        '7.98 g',
        'gold_coins',
        '91.67%',
        '4.9',
        '/images/products/gold-coin-sovereign.jpg',
        true
    ),
    (
        'Gold Bullion Mixed Lot 10x 1oz',
        'Ten assorted 1 oz gold coins from various international mints. Great portfolio diversification.',
        28600.00,
        'AUD',
        '10 oz',
        'gold_coins',
        '99.99%',
        '4.8',
        '/images/products/gold-mixed-lot-10oz.jpg',
        false
    ),
    (
        'Silver Bullion Mixed Lot 100x 1oz',
        'One hundred assorted 1 oz silver coins from various mints. Excellent bulk investment.',
        4700.00,
        'AUD',
        '100 oz',
        'silver_coins',
        '99.9%',
        '4.7',
        '/images/products/silver-mixed-lot-100oz.jpg',
        true
    );

-- Note: Image paths are placeholders. Actual product images should be placed in public/images/products/
-- Prices are indicative and should be updated based on current spot prices plus premiums
