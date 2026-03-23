create database movie_archive;
use movie_archive;

create table users (
	user_id int auto_increment primary key,
    first_name varchar (50) NOT NULL,
    last_name varchar (50) NOT NULL,
    email varchar (50) NOT NULL unique,
    password_hash varchar (255) NOT NULL,
    created_at datetime NOT NULL
);

create table shows (
	show_id int auto_increment primary key,
    imdb_id VARCHAR(20) NOT NULL UNIQUE,
    title varchar (200) NULL,
    release_year int DEFAULT 1900,
    duration_minutes int DEFAULT 0,
    imdb_rating decimal(3,1) DEFAULT 0.0,
    plot text,
    poster_url VARCHAR(500) NULL,
    added_at datetime,
    unique (title, release_year),
    INDEX idx_poster_url (poster_url)
);

-- Add type discriminator and season count to shows
ALTER TABLE shows
    ADD COLUMN show_type VARCHAR(10) NOT NULL DEFAULT 'movie' AFTER imdb_id,
    ADD COLUMN total_seasons INT DEFAULT NULL AFTER duration_minutes;


create table genres (
	genre_id int auto_increment primary key,
    name varchar (50) NOT NULL unique
);

create table show_genres (
	show_id int NOT NULL,
    genre_id int NOT NULL,
    primary key (show_id, genre_id),
    foreign key (show_id) references shows(show_id) ON DELETE CASCADE,
    foreign key (genre_id) references genres(genre_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    tag_id  INT          AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS show_tags (
    show_id             INT      NOT NULL,
    tag_id              INT      NOT NULL,
    tagged_by_user_id   INT      NOT NULL,
    tagged_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (show_id, tag_id, tagged_by_user_id),
    FOREIGN KEY (show_id)           REFERENCES shows(show_id)  ON DELETE CASCADE,
    FOREIGN KEY (tag_id)            REFERENCES tags(tag_id)    ON DELETE CASCADE,
    FOREIGN KEY (tagged_by_user_id) REFERENCES users(user_id)  ON DELETE CASCADE
);

create table directors (
	director_id int auto_increment primary key,
    full_name varchar (100) NOT NULL
);

create table show_directors (
	show_id int NOT NULL,
    director_id int NOT NULL,
    primary key (show_id, director_id),
    foreign key (show_id) references shows(show_id) ON DELETE CASCADE,
    foreign key (director_id) references directors(director_id) ON DELETE CASCADE
);

create table actors (
	actor_id int auto_increment primary key,
    full_name varchar (100) NOT NULL
);

create table show_actors (
	show_id int NOT NULL,
    actor_id int NOT NULL,
    primary key (show_id, actor_id),
    foreign key (show_id) references shows(show_id) ON DELETE CASCADE,
    foreign key (actor_id) references actors(actor_id) ON DELETE CASCADE
);

create table watchlists (
	watchlist_id int auto_increment primary key,
    user_id int NOT NULL,
    name varchar (100) NOT NULL,
    description TEXT NULL,
    created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    foreign key (user_id) references users(user_id) ON DELETE CASCADE
);

create table watchlist_items (
	watchlist_id int NOT NULL,
    show_id int NOT NULL,
    added_at datetime NOT NULL,
    primary key (watchlist_id, show_id),
    foreign key (watchlist_id) references watchlists (watchlist_id) ON DELETE CASCADE, 
    foreign key (show_id) references shows(show_id) ON DELETE CASCADE
);

create table user_ratings (
	rating_id int auto_increment primary key,
    user_id int NOT NULL,
    show_id int NOT NULL,
    rating int NOT NULL check (rating between 1 and 10),
    review_text text default null,
    rated_at datetime NOT NULL,
	unique (user_id, show_id),
	foreign key (user_id) references users (user_id) ON DELETE CASCADE,
    foreign key (show_id) references shows (show_id) ON DELETE CASCADE
);

create table watch_history (
	history_id int auto_increment primary key,
    user_id int NOT NULL,
    show_id int NOT NULL,
    watched_at timestamp default current_timestamp NOT NULL,
    foreign key (user_id) references users(user_id) ON DELETE CASCADE,
    foreign key (show_id) references shows(show_id) ON DELETE CASCADE
);

CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_watch_history_show ON watch_history(show_id);

ALTER TABLE watch_history
    ADD UNIQUE KEY uq_watch_history_user_show (user_id, show_id);

-- ── TV Show support: show_type, total_seasons, seasons, episodes ──────────────
-- Seasons (one row per season of a TV series)
CREATE TABLE IF NOT EXISTS seasons (
    season_id     INT AUTO_INCREMENT PRIMARY KEY,
    show_id       INT NOT NULL,
    season_number INT NOT NULL,
    episode_count INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_show_season (show_id, season_number),
    FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE
);

-- Episodes (one row per episode, linked to a season)
CREATE TABLE IF NOT EXISTS episodes (
    episode_id     INT AUTO_INCREMENT PRIMARY KEY,
    season_id      INT NOT NULL,
    episode_number INT NOT NULL,
    title          VARCHAR(500) NOT NULL DEFAULT 'TBA',
    air_date       DATE DEFAULT NULL,
    imdb_rating    DECIMAL(3,1) DEFAULT NULL,
    imdb_id        VARCHAR(20) DEFAULT NULL,
    UNIQUE KEY uq_season_episode (season_id, episode_number),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE CASCADE
);