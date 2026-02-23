-- Add images column to products table for multi-image support
ALTER TABLE "public"."products"
ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb;
