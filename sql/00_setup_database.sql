--
-- Reset the database
--

SOURCE variables.sql

source 01_create_database.sql;

SET @use_db = CONCAT('USE ', @db);
PREPARE use_stmt FROM @use_db;
EXECUTE use_stmt;
DEALLOCATE PREPARE use_stmt;

-- USE exjobb;

SOURCE 02_add_user.sql;
SOURCE 03_create_tables.sql;

-- SHOW TABLES;
