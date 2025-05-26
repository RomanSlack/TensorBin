# TensorBin V0 - Setup and Run Guide

## Overview

TensorBin V0 is a complete file sharing platform with async upload/download capabilities, user authentication, file search, and background processing. This guide will help you set up and run the entire system locally.

## Architecture

- **Backend**: FastAPI with SQLAlchemy ORM, PostgreSQL database, Redis for caching and job queues
- **Frontend**: Next.js 15 with React, TypeScript, Tailwind CSS
- **Background Processing**: Celery workers for async file processing
- **File Storage**: Local filesystem with organized directory structure
- **Authentication**: JWT-based with refresh tokens

## Prerequisites

### System Requirements
- **Node.js** ≥ 18.x
- **Python** 3.11+
- **PostgreSQL** 12+
- **Redis** 6+

### Linux/Ubuntu Installation
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-pip python3.11-venv

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server
```

### macOS Installation
```bash
# Using Homebrew
brew install node python@3.11 postgresql redis

# Start services
brew services start postgresql
brew services start redis
```

## Database Setup

### 1. Create PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE tensorbin;
CREATE USER tensorbin WITH PASSWORD 'tensorbin';
GRANT ALL PRIVILEGES ON DATABASE tensorbin TO tensorbin;
\q
```

### 2. Start Redis
```bash
# Linux
sudo systemctl start redis
sudo systemctl enable redis

# macOS (if using Homebrew)
brew services start redis
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd /home/roman/TensorBin/backend
```

### 2. Create Python Virtual Environment
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file if needed:
```env
DATABASE_URL=postgresql+asyncpg://tensorbin:tensorbin@localhost:5432/tensorbin
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10737418240
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.gif,.pdf,.txt,.zip,.tar,.gz,.mp4,.mp3,.doc,.docx
ENVIRONMENT=development
```

### 5. Run Database Migrations
```bash
alembic upgrade head
```

### 6. Start the Backend Server
```bash
# Development mode with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
python -m app.main
```

The API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### 7. Start Background Workers (Optional)
In a new terminal:
```bash
cd /home/roman/TensorBin/backend
source venv/bin/activate
celery -A app.tasks.celery_app worker --loglevel=info
```

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd /home/roman/TensorBin/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Environment is already configured in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 4. Start Development Server
```bash
npm run dev
```

The frontend will be available at: http://localhost:3000

## Usage Guide

### 1. User Registration
1. Go to http://localhost:3000
2. Click "Sign Up" or navigate to http://localhost:3000/auth/register
3. Enter email and password (minimum 6 characters)
4. You'll be automatically logged in and redirected to the dashboard

### 2. File Upload
1. In the dashboard, use the drag-and-drop area or click to select files
2. Optionally add tags (comma-separated)
3. Files up to 10GB are supported
4. Upload progress is shown in real-time

### 3. File Management
- **View files**: All uploaded files are listed with metadata
- **Search files**: Use the search bar to find files by name or tags
- **Download files**: Click the download button on any file
- **Delete files**: Click the trash icon to delete files

### 4. Search Features
- **Text search**: Search by filename
- **Tag filtering**: Filter by specific tags
- **File type filtering**: Filter by MIME type
- **Advanced filters**: Use the filter button for more options

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info

### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/` - List user files (paginated)
- `GET /api/v1/files/search` - Search files
- `GET /api/v1/files/{id}` - Get file metadata
- `GET /api/v1/files/{id}/download` - Download file
- `DELETE /api/v1/files/{id}` - Delete file

## File Storage Structure

Files are stored in the following structure:
```
uploads/
├── {user_id}/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── 20240101_120000_document.pdf
│   │   │   └── thumbnails/
│   │   │       └── 20240101_120000_document_thumb.jpg
│   │   └── 02/
│   └── 2025/
```

## Performance Features

### Async Architecture
- **FastAPI**: Fully async web framework
- **AsyncPG**: Async PostgreSQL driver
- **Background processing**: Celery for heavy operations
- **Concurrent uploads**: Multiple files can be uploaded simultaneously

### Scalability
- **Database indexing**: Optimized queries for file search
- **Connection pooling**: Efficient database connections
- **Redis caching**: Fast session and data caching
- **Pagination**: Efficient large dataset handling

## Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password hashing**: bcrypt for secure password storage
- **File validation**: MIME type and extension checking
- **Rate limiting**: Built-in FastAPI rate limiting
- **CORS configuration**: Secure cross-origin requests

## Troubleshooting

### Common Issues

#### Backend Issues
1. **Database connection error**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database and user exist

2. **Redis connection error**:
   - Ensure Redis is running
   - Check REDIS_URL in .env

3. **Import errors**:
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

#### Frontend Issues
1. **API connection error**:
   - Ensure backend is running on port 8000
   - Check NEXT_PUBLIC_API_URL in .env.local

2. **Build errors**:
   - Run `npm install` to install dependencies
   - Check Node.js version (≥18)

#### File Upload Issues
1. **File too large**:
   - Check MAX_FILE_SIZE in backend .env
   - Default limit is 10GB

2. **File type not allowed**:
   - Check ALLOWED_EXTENSIONS in backend .env

### Logs
- **Backend logs**: Check terminal running uvicorn
- **Worker logs**: Check terminal running celery worker
- **Frontend logs**: Check browser console and terminal

## Production Deployment

### Backend
1. Set `ENVIRONMENT=production` in .env
2. Use production database credentials
3. Set strong SECRET_KEY
4. Use production WSGI server (gunicorn)
5. Set up reverse proxy (nginx)

### Frontend
1. Run `npm run build` for production build
2. Use `npm start` or deploy to Vercel/Netlify
3. Update API_URL for production backend

### Database
1. Enable backups
2. Set up monitoring
3. Optimize PostgreSQL settings
4. Use connection pooling

## Development Notes

### Code Structure
- **Backend**: Modular structure with services, routers, models
- **Frontend**: Component-based React with TypeScript
- **Database**: Alembic migrations for schema management
- **Background tasks**: Celery for async processing

### Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Additional Features for Future Iterations
- Docker containerization
- S3-compatible storage (MinIO)
- Advanced search (Typesense)
- Content moderation
- User quotas and billing
- Team collaboration features

## Support

For issues and questions:
1. Check this documentation
2. Review error logs
3. Check API documentation at http://localhost:8000/docs
4. Ensure all services are running correctly