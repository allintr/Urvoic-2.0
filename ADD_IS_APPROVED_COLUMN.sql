-- Add missing is_approved column to user table
-- Run this in Render's psql console to fix the "column user.is_approved does not exist" error

ALTER TABLE "user" ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
