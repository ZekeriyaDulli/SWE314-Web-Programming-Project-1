-- create database movie_archive;
USE movie_archive;

-- First insert base data from your original script
INSERT INTO users (first_name, last_name, email, password_hash, created_at) VALUES
('Alice', 'Johnson', 'alice.johnson@gmail.com', '$2a$12$zmbQQnls3o6XydFDERp0DO.1FY0IX5.4bDB3NJF57C7VhyLy9UgRu', '2021-04-12'), 	-- password for all users users is in the format "FirstnameLastName" ex "AliceJohnson"
('Michael', 'Brown', 'Michael.Brown@gmail.com', '$2a$12$WajEXIgUC21rUPBEpn.Yj.uZ44z9MMJdjym9VpjCN6l1W93aPT/cC', '2019-09-05'),
('Robert', 'Davis', 'Robert.Davis@gmail.com', '$2a$12$gtpJkEFwK/cVc18rcq8ypuwDz4RM/igxRF8OSCMyxFDY1yPRhYDau', '2023-01-30'),
('Sara', 'Lee', 'Sara.Lee@gmail.com', '$2a$12$cpzGd5IsC5fzBrp4r8ullewDSTtiz3UC.jg/TnKAejxBPBCV3PaVC', '2025-07-18'),
('David', 'Wilson', 'David.Wilson@gmail.com', '$2a$12$ORH0K8AZCwxnO9KOjV3jROQ8fvnMteBlni/8D2XpfYo4kL4opI0i.', '2024-02-23'),
('James', 'Taylor', 'James.Taylor@gmail.com', '$2a$12$pmI6BbSTGxILcfyVeTzffup75bDnue1JN.jQWN6fTVZtlC0X8klu.', '2024-05-16'),
('Max', 'Miller', 'Max.Miller@gmail.com', '$2a$12$FVq7NWmifZJQGCY7H2j75O2yuVLICS4WH8GAuHTCnmuFAbPuTDpvy', '2024-05-16'),
('Admin', '', 'admin@movie.archive.com', '$2a$12$wJo0H0/E/.g9jsuOJVhYWe7V3TuRkEf/NfQaIfJuNdkzwko5mb9Zi', '2018-04-12');		-- admin password is "admin.movie.archive"

-- Insert all shows including the new ones
INSERT INTO shows (title, release_year, duration_minutes, plot, imdb_rating, imdb_id, added_at) VALUES
-- Original shows
('The Equalizer', 2014, 132, 'A man who believes he has put his mysterious past behind him cannot stand idly by when he meets a young girl under the control of violent Russian gangsters.', 7.3, 'tt0455944', '2025-11-23'),
('Edge of Tomorrow', 2014, 113, 'A man fighting in a war against aliens must relive the same day every time he dies until he can find a way to stop their power source with the help of an elite soldier.', 7.9, 'tt1631867', '2025-11-23'),
('Knives Out', 2019, 130, 'When renowned crime novelist Harlan Thrombey is found dead at his estate just after his 85th birthday, the inquisitive Detective Benoit Blanc is mysteriously enlisted to investigate.', 7.9, 'tt8946378', '2025-11-23'),
('The Gray Man', 2022, 129, 'When the CIA''s most skilled operative, whose true identity is known to none, accidentally uncovers dark agency secrets, a psychopathic former colleague puts a bounty on his head.', 6.5, 'tt1649418', '2025-11-23'),
('Jungle Cruise', 2021, 127, 'Based on Disneyland''s theme park ride where a small riverboat takes a group of travelers through a jungle filled with dangerous animals and supernatural elements.', 6.5, 'tt0870154', '2025-11-23'),
('The Equalizer 3', 2023, 109, 'Robert McCall finds himself at home in Southern Italy but he discovers his friends are under the control of local crime bosses. As events turn deadly, McCall knows what he has to do: become his friends'' protector by taking on the mafia.', 6.8, "tt17024450", '2025-11-23'),
('Jumanji: Welcome to the Jungle', 2017, 119, 'Four teenagers are sucked into a magical video game, and the only way they can escape is to work together to finish the game.', 6.9, "tt2283362", '2025-11-23'),
('The Fall Guy', 2024, 126, 'A stuntman must track down a missing movie star, solve a conspiracy and try to win back the love of his life while still doing his day job.', 6.8, "tt1684562", '2025-11-23'),
('Free Guy', 2021, 115, 'A bank teller discovers he is actually a background player in an open-world video game and decides to become the hero of his own story.', 7.1, "tt6264654", '2025-11-23'),
('Dune: Part One', 2021, 155, 'Feature adaptation of Frank Herbert''s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset and most vital element in the galaxy.', 8.0, 'tt1160419', '2025-11-23'),
('Inception', 2010, 148, 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 8.8, 'tt1375666', '2025-11-23'),
('Dune: Part Two', 2024, 166, 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future only he can foresee.', 8.4, "tt15239678", '2025-11-23'),
('Interstellar', 2014, 169, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 8.7, 'tt0816692', '2025-11-23'),
('The Batman', 2022, 176, 'Batman ventures into Gotham’s underworld when a sadistic killer leaves behind a trail of cryptic clues.', 7.8, 'tt1877830', NOW()),
('Tenet', 2020, 150, 'Armed with only one word, Tenet, a secret agent fights for the survival of the entire world.', 7.3, 'tt6723592', NOW()),
('Oppenheimer', 2023, 180, 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 8.4, 'tt15398776', NOW()),
('Blade Runner 2049', 2017, 164, 'A young blade runner discovers a long-buried secret that leads him to track down former blade runner Rick Deckard.', 8.0, 'tt1856101', NOW()),
('John Wick', 2014, 101, 'An ex-hitman comes out of retirement to track down the gangsters that killed his dog.', 7.4, 'tt2911666', NOW());

-- Insert all genres
INSERT IGNORE INTO genres (name) VALUES
('Action'),
('Adventure'),
('Sci-Fi'),
('Comedy'),
('Drama'),
('Mystery'),
('Crime'),
('Thriller');

-- Insert all directors (combined from both scripts)
INSERT IGNORE INTO directors (full_name) VALUES
('Matt Reeves'),
('Christopher Nolan'),
('Doug Liman'),
('David Leitch'),
('Shawn Levy'),
('Denis Villeneuve'),
('Antoine Fuqua'),
('Rian Johnson'),
('Robert Rodriguez'),
('Joe Russo'),
('Anthony Russo'),
('Jaume Collet-Serra'),
('Jake Kasdan'),
('Chad Stahelski');

-- Insert all actors (combined from both scripts)
INSERT IGNORE INTO actors (full_name) VALUES
('Robert Pattinson'),
('Zoë Kravitz'),
('Paul Dano'),
('John David Washington'),
('Elizabeth Debicki'),
('Cillian Murphy'),
('Emily Blunt'),
('Ryan Gosling'),
('Harrison Ford'),
('Ana de Armas'),
('Keanu Reeves'),
('Michael Nyqvist'),
('Willem Dafoe'),
('Tom Cruise'),
('Bill Paxton'),
('Aaron Taylor-Johnson'),
('Ryan Reynolds'),
('Jodie Comer'),
('Taika Waititi'),
('Timothée Chalamet'),
('Zendaya'),
('Rebecca Ferguson'),
('Oscar Isaac'),
('Leonardo DiCaprio'),
('Joseph Gordon-Levitt'),
('Elliot Page'),
('Matthew McConaughey'),
('Anne Hathaway'),
('Jessica Chastain'),
('Denzel Washington'),
('Dakota Fanning'),
('Eugenio Mastrandrea'),
('Marton Csokas'),
('Chloë Grace Moretz'),
('Daniel Craig'),
('Chris Evans'),
('Rosa Salazar'),
('Christoph Waltz'),
('Jennifer Connelly'),
('Dwayne Johnson'),
('Edgar Ramírez'),
('Kevin Hart'),
('Jack Black');

-- Now map shows to genres (combining both scripts)
-- First, insert original show_genres mappings
INSERT IGNORE INTO show_genres (show_id, genre_id) VALUES
-- Show 1: The Equalizer
(1, 1), (1, 7), (1, 8),
-- Show 2: Edge of Tomorrow
(2, 1), (2, 2), (2, 3),
-- Show 3: Knives Out
(3, 4), (3, 5), (3, 7),
-- Show 4: The Gray Man
(4, 1), (4, 6), (4, 8),
-- Show 5: Jungle Cruise
(5, 1), (5, 2), (5, 4),
-- Show 6: The Equalizer 3
(6, 1), (6, 7), (6, 8),
-- Show 7: Jumanji: Welcome to the Jungle
(7, 1), (7, 2), (7, 4),
-- Show 8: The Fall Guy
(8, 1), (8, 4), (8, 5),
-- Show 9: Free Guy
(9, 1), (9, 2), (9, 4),
-- Show 10: Dune: Part One
(10, 1), (10, 2), (10, 5),
-- Show 11: Inception
(11, 1), (11, 2), (11, 3),
-- Show 12: Dune: Part Two
(12, 1), (12, 2), (12, 5),
-- Show 13: Interstellar
(13, 2), (13, 5), (13, 3);

-- Now add genre mappings for the new shows (14-18)
INSERT INTO show_genres (show_id, genre_id)
SELECT s.show_id, g.genre_id
FROM shows s, genres g
WHERE
    (s.title = 'The Batman' AND g.name IN ('Action', 'Crime', 'Drama'))
    OR (s.title = 'Tenet' AND g.name IN ('Action', 'Sci-Fi', 'Thriller'))
    OR (s.title = 'Oppenheimer' AND g.name IN ('Drama'))
    OR (s.title = 'Blade Runner 2049' AND g.name IN ('Sci-Fi', 'Drama'))
    OR (s.title = 'John Wick' AND g.name IN ('Action', 'Thriller'));

-- Map shows to directors (combining both scripts)
-- First, original show_directors mappings
INSERT IGNORE INTO show_directors (show_id, director_id) VALUES
(1, 7),  -- The Equalizer -> Antoine Fuqua (id 7)
(2, 3),  -- Edge of Tomorrow -> Doug Liman (id 3)
(3, 8),  -- Knives Out -> Rian Johnson (id 8)
(4, 10), -- The Gray Man -> Joe Russo (id 10)
(4, 11), -- The Gray Man -> Anthony Russo (id 11)
(5, 12), -- Jungle Cruise -> Jaume Collet-Serra (id 12)
(6, 7),  -- The Equalizer 3 -> Antoine Fuqua (id 7)
(7, 13), -- Jumanji -> Jake Kasdan (id 13)
(8, 4),  -- The Fall Guy -> David Leitch (id 4)
(9, 5),  -- Free Guy -> Shawn Levy (id 5)
(10, 6), -- Dune: Part One -> Denis Villeneuve (id 6)
(11, 2), -- Inception -> Christopher Nolan (id 2)
(12, 6), -- Dune: Part Two -> Denis Villeneuve (id 6)
(13, 2); -- Interstellar -> Christopher Nolan (id 2)

-- Now add director mappings for the new shows (14-18)
INSERT INTO show_directors (show_id, director_id)
SELECT s.show_id, d.director_id
FROM shows s, directors d
WHERE
    (s.title = 'The Batman' AND d.full_name = 'Matt Reeves')
    OR (s.title = 'Tenet' AND d.full_name = 'Christopher Nolan')
    OR (s.title = 'Oppenheimer' AND d.full_name = 'Christopher Nolan')
    OR (s.title = 'Blade Runner 2049' AND d.full_name = 'Denis Villeneuve')
    OR (s.title = 'John Wick' AND d.full_name = 'Chad Stahelski');

-- Map shows to actors (combining both scripts)
-- First, original show_actors mappings
INSERT IGNORE INTO show_actors (show_id, actor_id) VALUES
-- Show 1: The Equalizer
(1, 30), (1, 34), (1, 35),
-- Show 2: Edge of Tomorrow
(2, 14), (2, 7), (2, 15),
-- Show 3: Knives Out
(3, 36), (3, 37), (3, 10),
-- Show 4: The Gray Man
(4, 8), (4, 37), (4, 10),
-- Show 5: Jungle Cruise
(5, 40), (5, 7), (5, 42),
-- Show 6: The Equalizer 3
(6, 30), (6, 32), (6, 33),
-- Show 7: Jumanji: Welcome to the Jungle
(7, 40), (7, 43), (7, 44),
-- Show 8: The Fall Guy
(8, 8), (8, 7), (8, 16),
-- Show 9: Free Guy
(9, 17), (9, 18), (9, 19),
-- Show 10: Dune: Part One
(10, 20), (10, 22), (10, 23),
-- Show 11: Inception
(11, 24), (11, 25), (11, 26),
-- Show 12: Dune: Part Two
(12, 20), (12, 21), (12, 22),
-- Show 13: Interstellar
(13, 27), (13, 28), (13, 29);

-- Now add actor mappings for the new shows (14-18)
INSERT INTO show_actors (show_id, actor_id)
SELECT s.show_id, a.actor_id
FROM shows s, actors a
WHERE
    (s.title = 'The Batman' AND a.full_name IN ('Robert Pattinson', 'Zoë Kravitz', 'Paul Dano'))
    OR (s.title = 'Tenet' AND a.full_name IN ('John David Washington', 'Robert Pattinson', 'Elizabeth Debicki'))
    OR (s.title = 'Oppenheimer' AND a.full_name IN ('Cillian Murphy', 'Emily Blunt'))
    OR (s.title = 'Blade Runner 2049' AND a.full_name IN ('Ryan Gosling', 'Harrison Ford', 'Ana de Armas'))
    OR (s.title = 'John Wick' AND a.full_name IN ('Keanu Reeves', 'Michael Nyqvist', 'Willem Dafoe'));

-- Insert watchlists
INSERT INTO watchlists (user_id, name, description) VALUES
(1, 'Favorites', NULL),
(1, 'Watch Later', NULL),
(2, 'Top Picks', NULL),
(3, 'Sci-Fi', NULL),
(3, 'Documentaries', NULL),
(4, 'Popular', NULL),
(4, 'Recommendations', NULL),
(5, 'Classics', NULL),
(5, 'Top Rated', NULL),
(6, 'Highlights', NULL),
(6, 'Comedy', NULL);

-- Insert watchlist items (only using shows 1-13 from original)
INSERT INTO watchlist_items (watchlist_id, show_id, added_at) VALUES
-- Watchlist 1
(1, 1, CURRENT_DATE),
(1, 2, CURRENT_DATE),
(1, 3, CURRENT_DATE),
-- Watchlist 2
(2, 4, CURRENT_DATE),
(2, 5, CURRENT_DATE),
(2, 6, CURRENT_DATE),
-- Watchlist 3
(3, 7, CURRENT_DATE),
(3, 8, CURRENT_DATE),
(3, 9, CURRENT_DATE),
-- Watchlist 4
(4, 8, CURRENT_DATE),
(4, 6, CURRENT_DATE),
(4, 5, CURRENT_DATE),
-- Watchlist 5
(5, 9, CURRENT_DATE),
(5, 1, CURRENT_DATE),
(5, 2, CURRENT_DATE),
-- Watchlist 6
(6, 4, CURRENT_DATE),
(6, 9, CURRENT_DATE),
(6, 8, CURRENT_DATE),
-- Watchlist 7
(7, 1, CURRENT_DATE),
(7, 4, CURRENT_DATE),
(7, 7, CURRENT_DATE),
-- Watchlist 8
(8, 2, CURRENT_DATE),
(8, 5, CURRENT_DATE),
(8, 8, CURRENT_DATE),
-- Watchlist 9
(9, 3, CURRENT_DATE),
(9, 6, CURRENT_DATE),
(9, 9, CURRENT_DATE),
-- Watchlist 10
(10, 10, CURRENT_DATE),
(10, 13, CURRENT_DATE),
(10, 1, CURRENT_DATE),
-- Watchlist 11
(11, 11, CURRENT_DATE),
(11, 8, CURRENT_DATE),
(11, 9, CURRENT_DATE),
-- Watchlist 12
(12, 12, CURRENT_DATE),
(12, 10, CURRENT_DATE),
(12, 11, CURRENT_DATE);

-- Insert user ratings (only using shows 1-12 from original)
INSERT INTO user_ratings (user_id, show_id, rating, review_text, rated_at) VALUES
-- User 1
(1, 1, 10, 'Great show!', CURRENT_DATE),
(1, 2, 8, 'Nice to watch.', CURRENT_DATE),
-- User 2
(2, 3, 8, 'Good overall.', CURRENT_DATE),
(2, 4, 6, 'Not bad.', CURRENT_DATE),
-- User 3
(3, 5, 10, 'Loved it.', CURRENT_DATE),
(3, 6, 8, 'Pretty good.', CURRENT_DATE),
-- User 4
(4, 7, 6, 'Okay show.', CURRENT_DATE),
(4, 8, 8, 'Enjoyed it.', CURRENT_DATE),
-- User 5
(5, 9, 10, 'Excellent!', CURRENT_DATE),
(5, 10, 8, 'Good watch.', CURRENT_DATE),
-- User 6
(6, 11, 6, 'It was fine.', CURRENT_DATE),
(6, 12, 8, 'Nice one.', CURRENT_DATE);

-- Insert watching history (only using shows 1-12 from original)
INSERT INTO watch_history (user_id, show_id, watched_at) VALUES
-- User 1
(1, 1, CURRENT_DATE),
(1, 2, CURRENT_DATE),
-- User 2
(2, 3, CURRENT_DATE),
(2, 4, CURRENT_DATE),
-- User 3
(3, 5, CURRENT_DATE),
(3, 6, CURRENT_DATE),
-- User 4
(4, 7, CURRENT_DATE),
(4, 8, CURRENT_DATE),
-- User 5
(5, 9, CURRENT_DATE),
(5, 10, CURRENT_DATE),
-- User 6
(6, 11, CURRENT_DATE),
(6, 12, CURRENT_DATE);

INSERT IGNORE INTO tags (name) VALUES
    ('Must Watch'),
    ('Mind-Bending'),
    ('Family-Friendly'),
    ('Rewatchable'),
    ('Overrated'),
    ('Hidden Gem'),
    ('Based on True Story'),
    ('Award Winner');

-- Verification queries
-- SELECT '=== Shows ===' AS 'Check';
-- SELECT show_id, title, imdb_id FROM shows;

-- SELECT '=== Shows with Genres ===' AS 'Check';
-- SELECT s.title, GROUP_CONCAT(g.name ORDER BY g.name) as genres
-- FROM shows s
-- JOIN show_genres sg ON sg.show_id = s.show_id
-- JOIN genres g ON g.genre_id = sg.genre_id
-- GROUP BY s.show_id, s.title
-- ORDER BY s.show_id;

-- SELECT '=== Shows with Directors ===' AS 'Check';
-- SELECT s.title, GROUP_CONCAT(d.full_name ORDER BY d.full_name) as directors
-- FROM shows s
-- JOIN show_directors sd ON sd.show_id = s.show_id
-- JOIN directors d ON d.director_id = sd.director_id
-- GROUP BY s.show_id, s.title
-- ORDER BY s.show_id;

-- SELECT '=== Shows with Actors ===' AS 'Check';
-- SELECT s.title, GROUP_CONCAT(a.full_name ORDER BY a.full_name) as actors
-- FROM shows s
-- JOIN show_actors sa ON sa.show_id = s.show_id
-- JOIN actors a ON a.actor_id = sa.actor_id
-- GROUP BY s.show_id, s.title
-- ORDER BY s.show_id;

-- SELECT '=== Users ===' AS 'Check';
-- SELECT user_id, first_name, last_name, email FROM users;

-- SELECT '=== Watchlists ===' AS 'Check';
-- SELECT watchlist_id, user_id, name FROM watchlists;

-- SELECT '=== Total Counts ===' AS 'Check';
-- SELECT 
--     (SELECT COUNT(*) FROM shows) as total_shows,
--     (SELECT COUNT(*) FROM genres) as total_genres,
--     (SELECT COUNT(*) FROM directors) as total_directors,
--     (SELECT COUNT(*) FROM actors) as total_actors,
--     (SELECT COUNT(*) FROM users) as total_users,
--     (SELECT COUNT(*) FROM watchlists) as total_watchlists;