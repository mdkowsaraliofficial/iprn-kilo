-- 0001c_add_password_hash.sql
ALTER TABLE users ADD COLUMN password_hash TEXT;
