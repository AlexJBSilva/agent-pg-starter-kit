-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  preferred_model VARCHAR(50),
  model_tier VARCHAR(20) NOT NULL,
  humor VARCHAR(20),
  identity TEXT NOT NULL,
  playbook TEXT NOT NULL,
  handoff TEXT NOT NULL,
  red_lines TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('commandment', 'edict', 'counsel')),
  scope VARCHAR(100) NOT NULL,
  statement TEXT NOT NULL,
  rationale TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE
);

-- Persona-Rule relationships (many-to-many)
CREATE TABLE IF NOT EXISTS persona_rules (
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, rule_id)
);

-- Persona-Skill relationships (many-to-many)
CREATE TABLE IF NOT EXISTS persona_skills (
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, skill_id)
);

-- Sync log for tracking changes
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('persona', 'rule', 'skill')),
  entity_id UUID,
  entity_name VARCHAR(255),
  action VARCHAR(20) NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'archive')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personas_name ON personas(name);
CREATE INDEX IF NOT EXISTS idx_personas_archived ON personas(archived);
CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_rules_scope ON rules(scope);
CREATE INDEX IF NOT EXISTS idx_rules_archived ON rules(archived);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_archived ON skills(archived);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_personas_fts ON personas USING GIN(to_tsvector('english', name || ' ' || short_description));
CREATE INDEX IF NOT EXISTS idx_rules_fts ON rules USING GIN(to_tsvector('english', name || ' ' || statement));
CREATE INDEX IF NOT EXISTS idx_skills_fts ON skills USING GIN(to_tsvector('english', name || ' ' || description));
