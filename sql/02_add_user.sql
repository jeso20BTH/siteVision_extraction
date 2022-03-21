-- Removes user if exists
SET @drop_user = CONCAT("DROP USER IF EXISTS '", @user, "'@'%'");
PREPARE drop_user_stmt FROM @drop_user;
EXECUTE drop_user_stmt;
DEALLOCATE PREPARE drop_user_stmt;

-- Creates user with username user and password pass
SET @create_user = CONCAT("CREATE USER '", @user, "'@'%' IDENTIFIED BY '", @pass, "'");
PREPARE create_user_stmt FROM @create_user;
EXECUTE create_user_stmt;
DEALLOCATE PREPARE create_user_stmt;


-- Gives user all rights on exjobb database
SET @grant_user = CONCAT("GRANT ALL PRIVILEGES ON `", @db, "`.* TO '", @user, "'@'%'");
PREPARE grant_user_stmt FROM @grant_user;
EXECUTE grant_user_stmt;
DEALLOCATE PREPARE grant_user_stmt;


FLUSH PRIVILEGES;
