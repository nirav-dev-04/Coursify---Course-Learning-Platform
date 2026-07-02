-- Add gifting columns to orders table
ALTER TABLE orders ADD COLUMN is_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN recipient_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN recipient_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN delivery_date VARCHAR(255);
ALTER TABLE orders ADD COLUMN gift_message TEXT;
