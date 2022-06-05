-- Install: mysql -h <hostname> -u <username> -p < db-install.sql
CREATE DATABASE IF NOT EXISTS poll_app;
USE poll_app;


CREATE TABLE IF NOT EXISTS sessions (
  session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
  expires int(11) unsigned NOT NULL,
  data mediumtext COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
);

CREATE TABLE IF NOT EXISTS questions (
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(300) NOT NULL,
    session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
    id int NOT NULL AUTO_INCREMENT,
    question_id int NOT NULL,
    name VARCHAR(300) NOT NULL,
    counter int DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users_answers (
    session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
    answer_id int NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);
