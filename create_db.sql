CREATE DATABASE autoservice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autoservice_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON autoservice_db.* TO 'autoservice_user'@'localhost';
FLUSH PRIVILEGES;