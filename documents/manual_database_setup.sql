-- TensorBin Database Manual Setup
-- Run these commands in PostgreSQL to create the database schema manually
-- Alternative to running alembic migrations

-- Connect to the tensorbin database
\c tensorbin;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tier INTEGER NOT NULL DEFAULT 0,
    storage_used BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create files table
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) UNIQUE NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    sha256 VARCHAR(64) UNIQUE NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    nsfw_score REAL DEFAULT 0.0,
    blocked BOOLEAN NOT NULL DEFAULT false,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id),
    tag VARCHAR(100) NOT NULL,
    UNIQUE(file_id, tag)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_filename ON files(filename);
CREATE INDEX idx_files_sha256 ON files(sha256);
CREATE INDEX idx_files_upload_status ON files(upload_status);
CREATE INDEX idx_files_blocked ON files(blocked);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_tags_file_id ON tags(file_id);
CREATE INDEX idx_tags_tag ON tags(tag);

-- Verify tables were created
\dt

-- Show table structure
\d users
\d files
\d tags