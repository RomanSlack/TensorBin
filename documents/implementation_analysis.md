# TensorBin Implementation Analysis & Refined Plan

## Project Overview
TensorBin is a file hosting and sharing platform with advanced features like content moderation, search, and user quotas. The original plan is Docker-centric but we'll adapt it for local React + Python development.

## Key Insights from Original Plan

### Architecture Strengths
- **Microservices approach** with clear separation of concerns
- **Direct S3 uploads** to avoid API bottlenecks
- **Async processing** via Celery for heavy operations
- **Modern search** with Typesense
- **Security-first** with content moderation

### Critical Components
1. **FastAPI backend** - Authentication, file management, quotas
2. **React frontend** - File upload UI with progress tracking
3. **PostgreSQL** - User data, file metadata, tags
4. **Redis** - Job queue for async processing
5. **File storage** - Local filesystem initially, S3-compatible later
6. **Background workers** - Thumbnail generation, content scanning

## Refined Local Development Plan

### Phase 1: Core Infrastructure (Days 1-2)
**No Docker - Pure local development**

#### Backend Setup
- **FastAPI application** with SQLAlchemy ORM
- **PostgreSQL** installed locally via package manager
- **Redis** installed locally for job queuing
- **Alembic** for database migrations
- **JWT authentication** with simple email/password

#### Frontend Setup
- **React with Vite** for fast development
- **TanStack Query** for server state management
- **React Hook Form** for file uploads
- **Tailwind CSS** for styling
- **React Dropzone** for file upload UX

#### File Storage Strategy
- **Local filesystem** initially (`./uploads/` directory)
- **Structured by user ID and date** for organization
- **SHA256 validation** on upload completion
- **Symlink-based serving** through FastAPI static files

### Phase 2: Core Features (Days 3-5)

#### Authentication & User Management
```python
# Simple but complete auth system
- User registration/login
- JWT token management
- Password hashing with bcrypt
- Email verification (optional)
```

#### File Upload Pipeline
```javascript
// Frontend: Progressive enhancement approach
- Basic HTML file input (works without JS)
- React Dropzone enhancement
- Chunked upload support
- Progress tracking
- Error handling & retry
```

```python
# Backend: Streaming upload handling
- File validation (size, type, virus scan)
- SHA256 generation during upload
- Database record creation
- Background job queuing
```

#### Database Schema (Simplified)
```sql
-- Start minimal, expand as needed
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100),
  sha256 CHAR(64) UNIQUE NOT NULL,
  upload_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id),
  tag VARCHAR(100) NOT NULL,
  UNIQUE(file_id, tag)
);
```

### Phase 3: Advanced Features (Days 6-8)

#### Search Implementation
- **SQLite FTS** initially (simpler than Typesense for local dev)
- **Tag-based filtering** with autocomplete
- **Filename search** with fuzzy matching
- **Advanced filters** (file type, size, date)

#### Background Processing
```python
# Celery tasks for:
- Thumbnail generation (PIL/Pillow)
- File analysis (mime type detection)
- Virus scanning (ClamAV integration)
- Metadata extraction (exif, etc.)
```

#### Content Moderation
- **Basic file type validation**
- **Size limits by user tier**
- **Simple reporting system**
- **Admin interface** for manual review

### Phase 4: Production Readiness (Days 9-10)

#### Performance Optimization
- **Database indexing** for common queries
- **Caching strategy** with Redis
- **File serving optimization** (nginx-style sendfile)
- **Background job monitoring**

#### Security Hardening
- **Rate limiting** on API endpoints
- **File upload validation** (magic numbers, not just extensions)
- **CORS configuration** for production
- **Environment-based configuration**

## Development Strategy

### Technology Stack Choices

#### Backend
```python
# Core dependencies
fastapi[all]        # Web framework with automatic docs
sqlalchemy[asyncio] # ORM with async support
alembic            # Database migrations
psycopg2          # PostgreSQL driver
redis             # Caching and job queue
celery            # Background task processing
python-multipart  # File upload handling
passlib[bcrypt]   # Password hashing
python-jose       # JWT tokens
```

#### Frontend
```json
{
  "core": [
    "react",
    "vite", 
    "@tanstack/react-query",
    "react-hook-form",
    "react-dropzone"
  ],
  "ui": [
    "tailwindcss",
    "@headlessui/react",
    "lucide-react"
  ],
  "utils": [
    "axios",
    "date-fns",
    "clsx"
  ]
}
```

### Project Structure
```
/home/roman/TensorBin/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── tasks/           # Celery tasks
│   │   └── utils/           # Helper functions
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── vite.config.js
├── uploads/                 # Local file storage
└── scripts/                # Setup and utility scripts
```

### Key Implementation Decisions

#### 1. **File Upload Strategy**
- **Direct upload to backend** initially (simpler than presigned URLs)
- **Chunked upload support** for large files
- **Resume capability** using Range headers
- **Progress tracking** via WebSocket or polling

#### 2. **Authentication Flow**
- **JWT-based** with refresh tokens
- **Simple email/password** (no OAuth initially)
- **Role-based access control** (user, admin)

#### 3. **File Storage**
- **Local filesystem** with organized directory structure
- **SHA256-based deduplication** 
- **Soft delete** for user files
- **Background cleanup** for orphaned files

#### 4. **Search Implementation**
- **PostgreSQL full-text search** initially
- **Tag system** with many-to-many relationships
- **Filename and content-based search**
- **Future migration path** to Typesense/Elasticsearch

## Migration Path to Original Docker Plan

Once core functionality is working locally:

1. **Containerize services** one by one
2. **Replace local storage** with MinIO
3. **Add Traefik** for routing
4. **Implement presigned URLs** for direct S3 uploads
5. **Add Typesense** for advanced search
6. **Implement moderation pipeline**

## Next Steps

1. **Project initialization** - Set up directory structure
2. **Backend scaffolding** - FastAPI app with basic auth
3. **Database setup** - PostgreSQL with initial migrations
4. **Frontend setup** - React app with file upload
5. **Integration testing** - End-to-end file upload flow

This approach prioritizes getting a working system quickly while maintaining a clear path to the full Docker-based architecture described in the original plan.