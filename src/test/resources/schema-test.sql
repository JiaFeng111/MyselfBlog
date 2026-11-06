CREATE TABLE IF NOT EXISTS essay_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120),
    essay TEXT,
    author VARCHAR(50),
    status INT,
    create_time TIMESTAMP,
    update_time TIMESTAMP
);
