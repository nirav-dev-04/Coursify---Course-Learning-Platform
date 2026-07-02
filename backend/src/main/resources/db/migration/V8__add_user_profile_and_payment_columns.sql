-- Add profile fields to users table
ALTER TABLE users ADD COLUMN headline VARCHAR(255);
ALTER TABLE users ADD COLUMN biography TEXT;
ALTER TABLE users ADD COLUMN language VARCHAR(50) DEFAULT 'English';
ALTER TABLE users ADD COLUMN website_url VARCHAR(255);
ALTER TABLE users ADD COLUMN facebook_url VARCHAR(255);
ALTER TABLE users ADD COLUMN instagram_url VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);

-- Add payment method fields to orders table
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN payment_details VARCHAR(255);
