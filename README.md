# GitHub Profile Analyzer 🔍

A production-ready REST API that fetches, analyzes, and stores GitHub user profiles. It computes insights such as **top programming languages**, **most starred repository**, and **total stars** across all public repos.

---

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Runtime      | Node.js 18+                             |
| Framework    | Express.js                              |
| Database     | MySQL 8+ (via `mysql2` with promises)   |
| HTTP Client  | Axios                                   |
| Security     | Helmet, CORS, express-rate-limit        |
| Config       | dotenv                                  |
| Dev Tooling  | Nodemon                                 |

---

## Prerequisites

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0 (running locally or via a managed service)
- **npm** (ships with Node.js)
- A **GitHub Personal Access Token** *(optional, but recommended to avoid rate limits)*

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/github-analyzer.git
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

Open `.env` and update the values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer
GITHUB_TOKEN=your_optional_github_pat
```

### 4. Create the database

```bash
mysql -u root -p < schema.sql
```

This creates the `github_analyzer` database and the `profiles` table.

### 5. Start the server

**Development** (auto-reload):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

---

## API Endpoints

### Health Check

```
GET /health
```

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{ "status": "ok", "timestamp": "2026-06-17T12:00:00.000Z" }
```

---

### Analyze a GitHub Profile

```
POST /api/analyze/:username
```

Fetches live data from GitHub, computes insights, and creates or updates the profile in the database.

```bash
curl -X POST http://localhost:3000/api/analyze/torvalds
```

**Response (201 Created):**

```json
{
  "message": "Profile created",
  "profile": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "followers": 230000,
    "top_languages": [{ "language": "C", "count": 5 }],
    "most_starred_repo": "linux",
    "total_stars": 190000,
    "..."
  }
}
```

**Response (200 OK)** — if the profile already exists:

```json
{
  "message": "Profile updated (re-analyzed)",
  "profile": { "..." }
}
```

---

### List All Profiles (Paginated)

```
GET /api/profiles?page=1&limit=10
```

```bash
curl "http://localhost:3000/api/profiles?page=1&limit=10"
```

**Response:**

```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "data": [ { "..." }, { "..." } ]
}
```

---

### Get a Single Profile

```
GET /api/profiles/:username
```

```bash
curl http://localhost:3000/api/profiles/torvalds
```

**404 Response** (if not analyzed yet):

```json
{ "error": "Profile not found. Use POST /api/analyze/:username first." }
```

---

### Delete a Profile

```
DELETE /api/profiles/:username
```

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

**Response:**

```json
{ "message": "Profile deleted successfully" }
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200),
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(200),
  email VARCHAR(200),
  company VARCHAR(200),
  blog VARCHAR(300),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  top_languages JSON,
  most_starred_repo VARCHAR(200),
  most_starred_repo_stars INT DEFAULT 0,
  total_stars INT DEFAULT 0,
  account_created_at DATETIME,
  github_updated_at DATETIME,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reanalyzed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

The full DDL (including `CREATE DATABASE`) is in [`schema.sql`](schema.sql).

---

## GitHub Token (Optional)

Without a token the GitHub API allows **60 requests/hour** per IP. With a token you get **5,000 requests/hour**.

### How to generate a token

1. Go to [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a descriptive name (e.g., `github-analyzer`)
4. No scopes are required — public data access is sufficient
5. Click **Generate token** and copy the value
6. Paste it into your `.env` file as `GITHUB_TOKEN`

---

## Postman Collection

A ready-to-import Postman collection is included at [`postman_collection.json`](postman_collection.json).

1. Open Postman → **Import** → select the file
2. The collection uses a `{{base_url}}` variable (defaults to `http://localhost:3000`)
3. All 5 endpoints are pre-configured

---

## Deployment Notes

This API can be deployed to any Node.js hosting platform. Here are some free-tier-friendly options:

| Service                        | Node.js | MySQL                   |
| ------------------------------ | ------- | ----------------------- |
| [Railway](https://railway.app) | ✅       | ✅ (managed add-on)     |
| [Render](https://render.com)   | ✅       | Use PlanetScale / Aiven |
| [Fly.io](https://fly.io)       | ✅       | Use PlanetScale / Aiven |

**Tips:**

- Set all `.env` variables as **environment variables** in your hosting dashboard
- Use `npm start` as the start command
- Make sure your MySQL instance is accessible from the deployment region
- Run `schema.sql` against your production database before the first deploy

---

## Project Structure

```
github-analyzer/
├── src/
│   ├── config/
│   │   └── db.js                # MySQL connection pool
│   ├── controllers/
│   │   └── profileController.js # Route handlers (thin)
│   ├── routes/
│   │   └── profileRoutes.js     # Route definitions
│   ├── services/
│   │   └── githubService.js     # GitHub API calls + insights
│   └── app.js                   # Express app entry point
├── schema.sql                   # Full DB schema
├── postman_collection.json      # Postman v2.1 collection
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## License

ISC
