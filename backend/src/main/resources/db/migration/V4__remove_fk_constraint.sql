-- Drop the foreign key constraint that references the lectures table
ALTER TABLE lecture_progress DROP CONSTRAINT fk_progress_lecture;
