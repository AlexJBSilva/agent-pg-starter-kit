# Agent PG Starter Kit

A PostgreSQL-backed API layer for the **Agent Starter Kit** framework. This service provides structured database access to personas, rules, and skills while maintaining compatibility with the original Markdown-based framework.

## Features

- **Database-First Design** — PostgreSQL for reliable, queryable storage
- **MD File Sync** — Auto-parse and sync from git-tracked Markdown files
- **RESTful API** — Query personas, rules, and skills via HTTP
- **Fallback Support** — Graceful degradation to MD files if DB unavailable
- **Version Control** — Track framework updates and changes over time
- **Zero-Breaking Changes** — Agent Starter Kit MD files remain the source of truth

## Architecture

```
agent-pg-starter-kit/
├── src/
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL schema
│   │   ├── migrations/          # Migration scripts
│   │   └── connection.ts        # Database connection pool
│   ├── parser/
│   │   ├── personas.ts          # Parse personas from MD
│   │   ├── rules.ts             # Parse rules from MD
│   │   ├── skills.ts            # Parse skills from MD
│   │   └── frontmatter.ts       # YAML frontmatter parser
│   ├── sync/
│   │   └── index.ts             # Sync engine: MD → PostgreSQL
│   ├── api/
│   │   ├── routes/
│   │   │   ├── personas.ts
│   │   │   ├── rules.ts
│   │   │   └── skills.ts
│   │   ├── middleware/
│   │   │   └── error.ts
│   │   └── server.ts
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Setup

```bash
# Clone this repo
git clone https://github.com/AlexJBSilva/agent-pg-starter-kit.git
cd agent-pg-starter-kit

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:init

# Parse and sync framework files
npm run sync

# Start API server
npm run dev
```

### 3. Docker Compose (Optional)

```bash
docker-compose up -d
npm run db:init
npm run sync
npm run dev
```

## API Endpoints

### Personas

```bash
# List all personas
GET /api/personas

# Get single persona
GET /api/personas/:id

# Search personas
GET /api/personas?search=architect

# Get persona with dependencies (skills, rules it uses)
GET /api/personas/:id/dependencies
```

### Rules

```bash
# List all rules (optional: filter by type or scope)
GET /api/rules
GET /api/rules?type=commandment&scope=coding

# Get single rule
GET /api/rules/:id

# Search rules
GET /api/rules?search=commit
```

### Skills

```bash
# List all skills
GET /api/skills

# Get single skill
GET /api/skills/:id

# Get skill with references (which personas use it)
GET /api/skills/:id/references

# Search skills
GET /api/skills?search=memory
```

## Configuration

### .env

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agent_kit
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Framework paths
FRAMEWORK_PATH=../agent-starter-kit/.agents
FRAMEWORK_REPO_URL=https://github.com/ntorga/agent-starter-kit.git

# API
PORT=3000
NODE_ENV=development

# Sync
AUTO_SYNC_ON_STARTUP=true
SYNC_INTERVAL_MS=3600000
```

## Sync Workflow

The sync engine:

1. **Parses** Markdown files (personas, rules, skills)
2. **Extracts** frontmatter (YAML metadata)
3. **Validates** against schema
4. **Upserts** into PostgreSQL
5. **Tracks** versions and timestamps
6. **Logs** changes and conflicts

**Detection:**
- New files → Insert
- Modified files (content hash changed) → Update with version bump
- Deleted files → Mark as archived (not hard-deleted for audit trail)

## Data Flow

```
┌─────────────────────────┐
│  Agent Starter Kit      │
│  (Markdown files)       │
└────────────┬────────────┘
             │
             │ File System
             │
┌────────────▼────────────┐
│  Sync Engine            │
│  (Parse & Validate)     │
└────────────┬────────────┘
             │
             │ INSERT/UPDATE
             │
┌────────────▼────────────┐
│  PostgreSQL Database    │
│  (Structured Storage)   │
└────────────┬────────────┘
             │
             │ Query
             │
┌────────────▼────────────┐
│  RESTful API            │
│  (Fast Access)          │
└────────────┬────────────┘
             │
             │ HTTP
             │
┌────────────▼────────────┐
│  AI Agents / Clients    │
└─────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Run sync
npm run sync

# Build for production
npm run build

# Lint
npm run lint

# Database operations
npm run db:init
npm run db:migrate
npm run db:rollback
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

---

**Note**: This project depends on the original [Agent Starter Kit](https://github.com/ntorga/agent-starter-kit) framework.
