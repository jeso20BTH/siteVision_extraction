--
-- Removes the tables in the correct order to avoid errors, due to foreign keys.
--
DROP TABLE IF EXISTS child;
DROP TABLE IF EXISTS created_by;
DROP TABLE IF EXISTS published_by;
DROP TABLE IF EXISTS last_modified_by;
DROP TABLE IF EXISTS last_published_by;
DROP TABLE IF EXISTS page;
DROP TABLE IF EXISTS user;

--
-- Create the tables
--

-- Create table: page
CREATE TABLE page
(
    id INT NOT NULL AUTO_INCREMENT,
    jcr_id VARCHAR(50) NOT NULL,
    display_name VARCHAR(500),
    parent_id VARCHAR(100),
    parent_name VARCHAR(300),
    uri VARCHAR(600),
    url VARCHAR(600),
    creation_date DATETIME,
    publish_date DATETIME,
    last_modified_date DATETIME,
    last_publish_date DATETIME,
    html LONGTEXT,
    is_root TINYINT NOT NULL DEFAULT 0,
    page_object LONGTEXT,

    PRIMARY KEY (id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: user
CREATE TABLE user
(
    id INT NOT NULL AUTO_INCREMENT,
    jcr_id VARCHAR(200),
    name VARCHAR(200),
    mail VARCHAR(200),

    PRIMARY KEY (id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: created_by.
CREATE TABLE created_by
(
    page_id INT NOT NULL,
    user_id INT NOT NULL,

    FOREIGN KEY (page_id) REFERENCES page(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: published_by.
CREATE TABLE published_by
(
    page_id INT NOT NULL,
    user_id INT NOT NULL,

    FOREIGN KEY (page_id) REFERENCES page(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: last_modified_by.
CREATE TABLE last_modified_by
(
    page_id INT NOT NULL,
    user_id INT NOT NULL,

    FOREIGN KEY (page_id) REFERENCES page(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: last_published_by.
CREATE TABLE last_published_by
(
    page_id INT NOT NULL,
    user_id INT NOT NULL,

    FOREIGN KEY (page_id) REFERENCES page(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;

-- Create table: child.
CREATE TABLE child
(
    parent_id INT NOT NULL,
    parent_jcr_id VARCHAR(50) NOT NULL,
    child_id VARCHAR(50) NOT NULL,

    FOREIGN KEY (parent_id) REFERENCES page(id)
)
ENGINE INNODB
CHARSET utf8
COLLATE utf8_swedish_ci
;
