CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL DEFAULT '',
    username VARCHAR(32) UNIQUE,
    session_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar_letter VARCHAR(4) NOT NULL DEFAULT '?',
    avatar_color VARCHAR(100) NOT NULL DEFAULT 'from-blue-400 to-cyan-500',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_members (
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chat_members_user ON chat_members(user_id);
