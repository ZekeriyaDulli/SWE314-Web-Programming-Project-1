-- ============================================
-- MOVIE ARCHIVE - DATABASE PROCEDURES
-- ============================================

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS sp_get_all_shows;
DROP PROCEDURE IF EXISTS sp_get_most_recent_shows;
DROP PROCEDURE IF EXISTS sp_get_show_details;
DROP PROCEDURE IF EXISTS sp_get_show_genres;
DROP PROCEDURE IF EXISTS sp_get_show_ratings;
DROP PROCEDURE IF EXISTS sp_get_user_watchlists;
DROP PROCEDURE IF EXISTS sp_get_watchlist_details;
DROP PROCEDURE IF EXISTS sp_get_watchlist_shows;
DROP PROCEDURE IF EXISTS sp_create_user;
DROP PROCEDURE IF EXISTS sp_get_user_by_email;
DROP PROCEDURE IF EXISTS sp_update_poster_url;
DROP PROCEDURE IF EXISTS sp_get_watch_history;
DROP PROCEDURE IF EXISTS sp_check_if_watched;
DROP PROCEDURE IF EXISTS sp_get_filtered_shows;
DROP PROCEDURE IF EXISTS sp_get_all_genres;
DROP PROCEDURE IF EXISTS sp_get_or_create_director;
DROP PROCEDURE IF EXISTS sp_get_or_create_actor;
DROP PROCEDURE IF EXISTS sp_get_or_create_genre;
DROP PROCEDURE IF EXISTS sp_map_show_genre;
DROP PROCEDURE IF EXISTS sp_map_show_actor;
DROP PROCEDURE IF EXISTS sp_map_show_director;

DROP VIEW IF EXISTS vw_shows_with_ratings;
DROP VIEW IF EXISTS vw_user_watch_history;

-- ============================================
-- PROCEDURES - RATINGS & WATCH HISTORY
-- ============================================

-- Rate show (also marks as watched)
DELIMITER //
CREATE PROCEDURE sp_rate_show(
    IN p_user_id INT,
    IN p_show_id INT,
    IN p_rating INT,
    IN p_review_text TEXT
)
BEGIN
    -- Insert rating
    INSERT INTO user_ratings (user_id, show_id, rating, review_text, rated_at)
    VALUES (p_user_id, p_show_id, p_rating, p_review_text, NOW());
    
    -- Mark as watched (ignore if already exists)
    INSERT IGNORE INTO watch_history (user_id, show_id, watched_at)
    VALUES (p_user_id, p_show_id, NOW());
END //
DELIMITER ;

-- Mark as watched
DELIMITER //
CREATE PROCEDURE sp_mark_as_watched(
    IN p_user_id INT,
    IN p_show_id INT
)
BEGIN
    INSERT IGNORE INTO watch_history (user_id, show_id, watched_at)
    VALUES (p_user_id, p_show_id, NOW());
END //
DELIMITER ;

-- ============================================
-- PROCEDURES - WATCHLISTS
-- ============================================

-- Create watchlist
DELIMITER //
CREATE PROCEDURE sp_create_watchlist(
    IN p_user_id INT,
    IN p_name VARCHAR(100),
    IN p_description TEXT,
    OUT p_watchlist_id INT
)
BEGIN
    -- Check for duplicate name
    IF EXISTS (SELECT 1 FROM watchlists WHERE user_id = p_user_id AND name = p_name) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Watchlist with this name already exists';
    END IF;
    
    INSERT INTO watchlists (user_id, name, description, created_at)
    VALUES (p_user_id, p_name, p_description, NOW());
    
    SET p_watchlist_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Delete watchlist
DELIMITER //
CREATE PROCEDURE sp_delete_watchlist(
    IN p_watchlist_id INT,
    IN p_user_id INT
)
BEGIN
    -- Verify ownership
    IF NOT EXISTS (SELECT 1 FROM watchlists WHERE watchlist_id = p_watchlist_id AND user_id = p_user_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Watchlist not found or unauthorized';
    END IF;
    
    -- Delete items first
    DELETE FROM watchlist_items WHERE watchlist_id = p_watchlist_id;
    
    -- Delete watchlist
    DELETE FROM watchlists WHERE watchlist_id = p_watchlist_id;
END //
DELIMITER ;

-- Add to watchlist
DELIMITER //
CREATE PROCEDURE sp_add_to_watchlist(
    IN p_watchlist_id INT,
    IN p_show_id INT
)
BEGIN
    -- Check if already exists
    IF NOT EXISTS (
        SELECT 1 FROM watchlist_items 
        WHERE watchlist_id = p_watchlist_id AND show_id = p_show_id
    ) THEN
        INSERT INTO watchlist_items (watchlist_id, show_id, added_at)
        VALUES (p_watchlist_id, p_show_id, NOW());
    END IF;
END //
DELIMITER ;

-- Remove from watchlist
DELIMITER //
CREATE PROCEDURE sp_remove_from_watchlist(
    IN p_watchlist_id INT,
    IN p_show_id INT
)
BEGIN
    DELETE FROM watchlist_items
    WHERE watchlist_id = p_watchlist_id AND show_id = p_show_id;
END //
DELIMITER ;

-- ============================================
-- PROCEDURES - SHOWS
-- ============================================

DELIMITER $$
CREATE PROCEDURE sp_insert_show_if_not_exists(
    IN p_imdb_id VARCHAR(20),
    OUT p_was_inserted INT
)
BEGIN
    DECLARE existing_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO existing_count
    FROM shows 
    WHERE imdb_id = p_imdb_id;
    
    IF existing_count = 0 THEN
        INSERT INTO shows (imdb_id, added_at)
        VALUES (p_imdb_id, NOW());
        SET p_was_inserted = 1;
    ELSE
        SET p_was_inserted = 0;
    END IF;
END$$
DELIMITER ;
