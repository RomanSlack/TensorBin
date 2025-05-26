**One-page master build plan – local “single-laptop” edition**
Hand this doc to an AI coding agent; each numbered block is a discrete deliverable.

---

### 0 Prerequisites

| Tool                        | Why                         | Local install                            |
| --------------------------- | --------------------------- | ---------------------------------------- |
| **Docker + Docker-Compose** | isolate every micro-service | `sudo apt install docker docker-compose` |
| **Node ≥ 18**               | Next.js frontend            | `nvm install 18`                         |
| **Python 3.11**             | FastAPI & workers           | `pyenv install 3.11.9`                   |
| **Make**                    | one-shot dev commands       | already on Ubuntu                        |

---

### 1 Service inventory

| Service             | Image / Tech                | Port | Role                                 |
| ------------------- | --------------------------- | ---- | ------------------------------------ |
| **gateway**         | Traefik                     | 80   | TLS termination, routing, rate-limit |
| **frontend**        | Next.js (Vite if preferred) | 3000 | SSR site + upload widget             |
| **api**             | FastAPI + Uvicorn           | 8000 | auth, presigned URLs, quotas         |
| **db**              | Postgres 16                 | 5432 | users, assets, tags                  |
| **search**          | Typesense 0.25              | 8108 | full-text / tag search               |
| **queue**           | Redis 7                     | 6379 | job brokering                        |
| **worker**          | Python + Celery             | —    | thumbnails, CSAM scan                |
| **object-store**    | MinIO                       | 9000 | S3-compatible storage                |
| **moderation-dash** | React (simple SPA)          | 5173 | manual review panel                  |
| **adminer**         | Adminer                     | 8080 | DB inspection (dev only)             |

Everything runs in one `docker-compose.yml`.

---

### 2 Data flow in five sentences

1. Front-end calls **`POST /v1/assets/init`** → API verifies JWT & quota, returns S3 **presigned multipart URLs**.
2. Browser streams file directly to **MinIO** (no size limit, resumable via tus or AWS multipart).
3. Browser notifies API **`PATCH /v1/assets/complete`** → row inserted in Postgres, record kicked to **Celery** queue.
4. **worker** downloads once (internal network), runs OpenNSFW2 + PhotoDNA hash, generates 512 px thumbnail, updates Postgres, pushes searchable JSON to **Typesense**.
5. Downloads are **signed URLs** emitted by API; Traefik pipes them so the file never touches the API container.

---

### 3 Minimum schema (Postgres)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tier  SMALLINT DEFAULT 0,          -- 0 free, 1 creator, 2 power
  storage_used BIGINT DEFAULT 0
);

CREATE TABLE assets (
  id UUID PRIMARY KEY,
  owner      UUID REFERENCES users(id),
  sha256     CHAR(64) NOT NULL,
  filename   TEXT,
  size_bytes BIGINT,
  mime       TEXT,
  nsfw_score REAL,
  blocked    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tags (
  asset_id UUID REFERENCES assets(id),
  tag TEXT
);
CREATE INDEX ON tags(tag);
```

---

### 4 Key API endpoints

| Verb & path              | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `POST /auth/login`       | magic-link / OAuth                                  |
| `GET  /me`               | quota & subscription tier                           |
| `POST /assets/init`      | request multipart URLs, returns `upload_id` & parts |
| `PATCH /assets/complete` | finalise after upload                               |
| `GET  /assets/{id}`      | metadata & signed download link                     |
| `GET  /search?q=`        | proxy to Typesense                                  |
| `POST /report`           | user reports (CSAM etc.)                            |
| `GET  /admin/queue`      | mod dashboard JSON feed                             |

---

### 5 Docker-Compose skeleton

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: devpass }
    volumes: [ "pg:/var/lib/postgresql/data" ]

  object:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    volumes: [ "minio:/data" ]
    ports: [ "9000:9000", "9001:9001" ]

  search:
    image: typesense/typesense:0.25.2
    environment: { TYPESENSE_API_KEY: devkey }

  redis:
    image: redis:7

  api:
    build: ./services/api
    environment:
      DATABASE_URL: postgres://postgres:devpass@db:5432/postgres
      OBJECT_ENDPOINT: http://object:9000
      TYPESENSE_KEY: devkey
      REDIS_URL: redis://redis:6379/0
    depends_on: [ db, object, search, redis ]

  worker:
    build: ./services/worker
    environment: same_as_api
    depends_on: [ api ]

  frontend:
    build: ./frontend
    depends_on: [ api ]

  gateway:
    image: traefik:v3.0
    command: --providers.docker --api.insecure=true
    ports: [ "80:80" ]
volumes: { pg: {}, minio: {} }
```

---

### 6 Local dev workflow

```bash
git clone your-repo
cp .env.example .env          # set secrets
docker-compose up -d          # spin entire stack
npm run dev --prefix frontend # hot-reload UI
```

Uploads now hit `http://localhost` and store files inside the MinIO volume.

---

### 7 Must-have UX details

* **Uppy + Tus** or **React-Dropzone** with S3 multipart plugin – shows live % progress, supports 10 GB+ files, auto-resume.
* Asset page inline thumbnail + copy-to-clipboard download link.
* Search bar with fuzzy tag type-ahead (Typesense instant search).
* Profile page: storage used vs quota, upgrade button (dummy).

---

### 8 Moderation & safety stub

* worker calls **PhotoDNA** hash set (local cache) and OpenNSFW2.
* if probability(child) > 0.3 or tag hits blacklist → `blocked = true`, email admins.
* `/admin` SPA lists blocked or reported assets, one-click delete or unblock.

---

### 9 Local → production checklist

1. Swap MinIO for Backblaze B2 or R2 (just change endpoint + creds).
2. Replace Traefik with Cloudflare Tunnel or Nginx Ingress if moving to K8s.
3. Add Stripe / PaymentCloud subscription webhook → tier update.
4. Turn on Cloudflare Image Resizing & cache rules for thumbnails.
5. Enable automatic Postgres backups (pgBackRest).

---

### 10 Run-ready definition

* `docker-compose up` succeeds, `GET /healthz` returns 200 from every container.
* Upload ≥ 10 GB file, download it, see correct SHA256.
* Search by tag returns asset in < 200 ms.
* Report flow marks asset as blocked in DB.

If those pass, hand the repo to the coding agent for full implementation.
