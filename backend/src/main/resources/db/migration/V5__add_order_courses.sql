-- Add course_ids column to orders table to snapshot purchased courses
ALTER TABLE orders ADD COLUMN course_ids TEXT;
