-- CommentRank Relational Database Schema
-- Optimized for high-throughput comment analytics and strict Meta compliance

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facebook_id VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Secure Facebook Auth Credentials Storage
CREATE TABLE IF NOT EXISTS facebook_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_fb UNIQUE (user_id)
);

-- Connected Facebook Pages (Page Tokens are required by Graph API to read Page Post comments)
CREATE TABLE IF NOT EXISTS facebook_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    page_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    tasks TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_page_user UNIQUE (user_id, page_id)
);

-- Analyses History
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_url TEXT NOT NULL,
    meta_post_id VARCHAR(128) NOT NULL,
    total_comments INT DEFAULT 0,
    unique_commenters INT DEFAULT 0,
    top_commenter_name VARCHAR(255),
    top_commenter_count INT DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    execution_time_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated Commenters per Analysis
CREATE TABLE IF NOT EXISTS analysis_commenters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    commenter_id VARCHAR(128) NOT NULL,
    commenter_name VARCHAR(255) NOT NULL,
    comment_count INT NOT NULL DEFAULT 1,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    last_comment_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_analysis_commenter UNIQUE (analysis_id, commenter_id)
);

-- Winner / Giveaway Records
CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    commenter_id VARCHAR(128) NOT NULL,
    commenter_name VARCHAR(255) NOT NULL,
    selection_type VARCHAR(50) NOT NULL CHECK (selection_type IN ('most_comments', 'random_uniform', 'random_weighted')),
    qualifying_comments INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit and API Usage Logs (for Admin Dashboard & Meta Rate Limiting monitoring)
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    rate_limit_usage INT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commenters_analysis_count ON analysis_commenters(analysis_id, comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_winners_analysis ON winners(analysis_id);
