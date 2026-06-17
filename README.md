# GitHub Profile Analyzer API 

A production-ready REST API that fetches, analyzes, and stores GitHub user profiles using the GitHub Public API and MySQL.

🚀 **Live API:** <https://github-analyzer-production-f606.up.railway.app>
📁 **Repository:** <https://github.com/Himanshugulhane27/github-analyzer>

---

## Features

- 🔎 Fetch any public GitHub user's profile by username
- 📊 Compute insights — top 5 languages, most starred repo, total stars across all repos
- 🗄️ Store and re-analyze profiles in MySQL with timestamps
- 📄 Paginated list of all analyzed profiles
- 🔒 Rate limiting (100 req/15min), CORS, and security headers via Helmet
- ⚡ Optional GitHub PAT for 5,000 req/hr (vs 60 without token)

---

## Production Features

- RESTful API design with consistent JSON responses
- MySQL connection pooling via `mysql2`
- Centralized error handling middleware
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet security headers
- Environment variable configuration via dotenv
- Re-analysis timestamps (`last_reanalyzed_at`)
- Parameterized SQL queries (no string concatenation)
- Trust proxy support for Railway/reverse proxy deployments

---

## Architecture

```
Client
  ↓
Express API (Node.js)
  ↓              ↓
GitHub API     MySQL Database
(fetch data)   (store insights)
```

### Request Flow — POST /api/analyze/:username

```
POST /api/analyze/torvalds
        ↓
Fetch user profile from GitHub API
        ↓
Fetch all repos from GitHub API
        ↓
Compute insights (top languages, total stars, most starred repo)
        ↓
INSERT or UPDATE in MySQL
        ↓
Return profile JSON
```

---

## Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Runtime      | Node.js 18+                           |
| Framework    | Express.js                            |
| Database     | MySQL 8+ via `mysql2` (promise-based) |
| HTTP Client  | Axios                                 |
| Security     | Helmet, CORS, express-rate-limit      |
| Config       | dotenv                                |
| Dev Tooling  | Nodemon                               |

---

## API Endpoints

| Method   | Endpoint                  | Description                        | Status Codes  |
| -------- | ------------------------- | ---------------------------------- | ------------- |
| `POST`   | `/api/analyze/:username`  | Fetch from GitHub and store/update | 201, 200, 404 |
| `GET`    | `/api/profiles`           | List all profiles (paginated)      | 200           |
| `GET`    | `/api/profiles/:username` | Get a single stored profile        | 200, 404      |
| `DELETE` | `/api/profiles/:username` | Delete a profile from database     | 200, 404      |
| `GET`    | `/health`                 | Health check                       | 200           |

---

## API Documentation

### Health Check

```
GET /health
```

```bash
curl https://github-analyzer-production-f606.up.railway.app/health
```

**Response — 200 OK:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-17T12:00:00.000Z"
}
```

---

### Analyze a GitHub Profile

```
POST /api/analyze/:username
```

Fetches live data from GitHub, computes insights, and creates or updates the profile in the database.

```bash
curl -X POST https://github-analyzer-production-f606.up.railway.app/api/analyze/torvalds
```

**Response — 201 Created (new profile):**

```json
{
  "message": "Profile created",
  "profile": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "bio": null,
    "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
    "location": "Portland, OR",
    "company": "Linux Foundation",
    "public_repos": 12,
    "public_gists": 1,
    "followers": 307748,
    "following": 0,
    "top_languages": [
      { "language": "C", "count": 10 },
      { "language": "C++", "count": 1 },
      { "language": "OpenSCAD", "count": 1 }
    ],
    "most_starred_repo": "linux",
    "most_starred_repo_stars": 236725,
    "total_stars": 249181,
    "account_created_at": "2011-09-03T15:26:22.000Z",
    "analyzed_at": "2026-06-17T08:31:16.000Z",
    "last_reanalyzed_at": null
  }
}
```

**Response — 200 OK (re-analyzed):**

```json
{
  "message": "Profile updated (re-analyzed)",
  "profile": { "...same structure with updated last_reanalyzed_at..." }
}
```

**Response — 404 Not Found:**

```json
{ "error": "GitHub user not found" }
```

---

### List All Profiles (Paginated)

```
GET /api/profiles?page=1&limit=10
```

```bash
curl "https://github-analyzer-production-f606.up.railway.app/api/profiles?page=1&limit=10"
```

**Response — 200 OK:**

```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "data": [
    { "id": 1, "username": "torvalds", "name": "Linus Torvalds", "followers": 307748 }
  ]
}
```

---

### Get a Single Profile

```
GET /api/profiles/:username
```

```bash
curl https://github-analyzer-production-f606.up.railway.app/api/profiles/torvalds
```

**Response — 200 OK:** Full profile object (same structure as analyze response)

**Response — 404 Not Found:**

```json
{ "error": "Profile not found. Use POST /api/analyze/:username first." }
```

---

### Delete a Profile

```
DELETE /api/profiles/:username
```

```bash
curl -X DELETE https://github-analyzer-production-f606.up.railway.app/api/profiles/torvalds
```

**Response — 200 OK:**

```json
{ "message": "Profile deleted successfully" }
```

**Response — 404 Not Found:**

```json
{ "error": "Profile not found" }
```

---

## Error Responses

| Status | Description                                      |
| ------ | ------------------------------------------------ |
| 400    | Invalid request or missing parameters            |
| 404    | GitHub user not found or profile not in database |
| 429    | Too many requests (rate limit exceeded)          |
| 500    | Internal server error                            |

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- MySQL ≥ 8.0
- npm (ships with Node.js)

### 1. Clone the repository

```bash
git clone https://github.com/Himanshugulhane27/github-analyzer.git
cd github-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer
GITHUB_TOKEN=your_optional_github_pat
```

### 4. Create the database and table

```bash
mysql -u root -p < schema.sql
```

### 5. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

API is available at `http://localhost:3000`

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  username                VARCHAR(100) NOT NULL UNIQUE,
  name                    VARCHAR(200),
  bio                     TEXT,
  avatar_url              VARCHAR(500),
  location                VARCHAR(200),
  email                   VARCHAR(200),
  company                 VARCHAR(200),
  blog                    VARCHAR(300),
  public_repos            INT DEFAULT 0,
  public_gists            INT DEFAULT 0,
  followers               INT DEFAULT 0,
  following               INT DEFAULT 0,
  top_languages           JSON,
  most_starred_repo       VARCHAR(200),
  most_starred_repo_stars INT DEFAULT 0,
  total_stars             INT DEFAULT 0,
  account_created_at      DATETIME,
  github_updated_at       DATETIME,
  analyzed_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reanalyzed_at      TIMESTAMP NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Full DDL including `CREATE DATABASE` is in [`schema.sql`](schema.sql).

---

## GitHub Token 

| Without Token | With Token     |
| ------------- | -------------- |
| 60 req/hour   | 5,000 req/hour |

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a name — no scopes needed for public data
4. Paste it in `.env` as `GITHUB_TOKEN`

---

## Postman Collection

A ready-to-import collection is included at [`postman_collection.json`](postman_collection.json).

1. Open Postman → **Import** → select the file
2. Set the `{{base_url}}` variable to `https://github-analyzer-production-f606.up.railway.app`
3. All 5 endpoints are pre-configured and ready to run

---

## Deployment (Railway)

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **MySQL** database service
4. Set all environment variables in the Variables tab
5. Run `schema.sql` in Railway's MySQL Query tab
6. Generate a public domain under Settings → Networking

| Service                        | Node.js | MySQL                   |
| ------------------------------ | ------- | ----------------------- |
| [Railway](https://railway.app) | ✅       | ✅ Managed add-on       |
| [Render](https://render.com)   | ✅       | Use PlanetScale / Aiven |
| [Fly.io](https://fly.io)       | ✅       | Use PlanetScale / Aiven |

---

## Future Enhancements

- Redis caching for repeated profile lookups
- GitHub contribution graph analytics
- Repository activity trends over time
- Docker + docker-compose setup
- Swagger / OpenAPI documentation
- Webhook support for auto re-analysis

---

## Project Structure

```
github-analyzer/
├── src/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/
│   │   └── profileController.js  # Thin route handlers
│   ├── routes/
│   │   └── profileRoutes.js      # Route definitions
│   ├── services/
│   │   └── githubService.js      # GitHub API calls + insights logic
│   └── app.js                    # Express entry point
├── schema.sql                    # Full DB schema export
├── postman_collection.json       # Postman v2.1 collection
├── .env.example                  # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---
