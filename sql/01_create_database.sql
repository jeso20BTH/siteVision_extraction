--
-- Creates the database
--

-- -- Removes the database, if it exists
SET @d = CONCAT('DROP DATABASE IF EXISTS ', @db);
PREPARE stmt1 FROM @d;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- -- Creates the database exjobb;
SET @c = CONCAT('CREATE DATABASE IF NOT EXISTS ', @db);
PREPARE stmt2 FROM @c;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
