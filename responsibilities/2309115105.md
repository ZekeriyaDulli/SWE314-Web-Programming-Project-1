# Responsibilities — [Matin's Student Number]

## Role: Data Engineer

### Contributions

- Co-designed the original MySQL database schema and relationships
- Curated and inserted the initial movie dataset (18 movies from OMDb)
- Wrote stored procedures for watch history and rating operations (`sp_rate_show`, `sp_mark_as_watched`, `sp_check_if_watched`, `sp_get_watch_history`)
- Created database views (`vw_shows_with_ratings`, `vw_user_watch_history`) for enriched data aggregation
- Handled bcrypt password hashing for the 8 seed users in `2- Insertions.sql`
- Wrote `db/4- Schema_Additions.sql` for the 4 new entities with sample tag data

### Key Technical Decisions

- `vw_shows_with_ratings` pre-aggregates `platform_avg` and `rating_count` to avoid repeated GROUP BY queries on the shows listing page
- `vw_user_watch_history` joins history with show details and user ratings for a single-query history page response
- Rating submission (`sp_rate_show`) automatically inserts a watch_history record — single procedure call handles both concerns
