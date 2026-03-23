-- Trailer Feature
-- Stores the YouTube video ID (e.g. 'dQw4w9WgXcQ') for each show's trailer.
-- Run this after the existing schema files (1–4).

ALTER TABLE shows
    ADD COLUMN trailer_url VARCHAR(20) DEFAULT NULL;
