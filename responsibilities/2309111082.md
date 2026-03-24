# Responsibilities — [Göktüğ's Student Number]

## Role: Data Engineer

### Contributions

- Designed the original MySQL database schema (12 tables, 2 views)
- Wrote and tested all 27 stored procedures in `3- Procedures.sql`
- Created sample data insertions (`2- Insertions.sql`) with 18 movies, 8 users, 13 directors, 44 actors
- Built the ER diagram (`ER_Diagram_Final.mwb` / `.png`)
- Documented all stored procedure parameters and return shapes
- Assisted in proposing schema expansions (tags, collections)

### Key Technical Decisions

- Used `SIGNAL SQLSTATE '45000'` in stored procedures for business rule violations (duplicate emails, duplicate watchlist names) to propagate errors cleanly to the application layer
- Idempotent procedures (`sp_get_or_create_*`, `sp_map_show_*`) prevent duplicate relationship entries during OMDb sync
- Cascade deletes on all foreign keys ensure referential integrity when users or shows are removed
