# Tradely — Production-Hardened Stock Trading Platform

Tradely is a full-stack, production-hardened stock trading platform built on the **MERN** architecture. It provides an institutional-style trading experience featuring real-time market simulation, advanced risk-management order types (Market, Limit, Stop-Loss, Trailing Stop, OCO), persistent user watchlists, atomic balance/share reservations with MongoDB multi-document transactions, private WebSocket execution notifications, and containerized deployment readiness.

> **Note:** Tradely is an educational simulation and portfolio platform. It does not execute real financial transactions and should not be used for real-money trading.

---

## 🚀 Key Architecture & Capabilities

### Core Features (Phases 1–8)
- 🔐 **Multi-User Isolation & Auth**: JWT-based session management using secure, HttpOnly, SameSite cookies with strict user isolation.
- ⚡ **Real-Time Market Data**: In-memory simulation tick generator emitting live prices via Socket.IO.
- 🛒 **Advanced Order Execution Engine**:
  - **MARKET**: Instant execution at current market prices.
  - **LIMIT**: Bid/ask matching against live price feeds.
  - **STOP_MARKET & STOP_LIMIT**: Server-side threshold evaluation and conditional trigger transitions.
  - **TRAILING_STOP**: Dynamic price tracking with automatic high-water-mark adjustments.
  - **OCO (One-Cancels-the-Other)**: Dual-bracket orders with a dedicated group schema, shared atomic reservation, and race-safe claiming.
- 🛡️ **Atomic Reservation & Concurrency Safety**: MongoDB ACID transactions with optimistic locking and retry handling for transient write conflicts. Zero double-spend or negative balance states.
- 📊 **Portfolio Analytics & Watchlist**: User-specific persistent watchlists ($addToSet/$pull safe mutations), real-time realized/unrealized P&L, and asset allocation breakdown with missing-quote safeguards.
- 🛡️ **Production Hardening (DevOps & Security)**:
  - Helmet security headers and strict CORS origin enforcement.
  - Request body payload limiting (`1mb`) to mitigate DoS vectors.
  - In-memory sliding-window rate limiting on sensitive authentication routes (`RateLimit-*` and `Retry-After` standard headers).
  - Production error masking (suppression of stack traces and database internals on 500 errors).
  - Structured zero-dependency JSON logging with automated redaction of sensitive credentials (`password`, `token`, `secret`, `cookie`, `mongo_uri`).
  - Liveness (`GET /health`) and database-backed Readiness (`GET /ready`) probes.
  - Idempotent, promise-awaited graceful shutdown handling `SIGTERM`/`SIGINT` with a 10s fallback guard.
  - Multi-stage Alpine Docker images with non-root runtime users.
  - Docker Compose orchestrating Backend, Frontend, Dashboard, and local MongoDB services.
  - GitHub Actions CI workflow with MongoDB 7.0 service container and build validations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js 20 LTS, Express 5, Mongoose 9, Socket.IO 4, Helmet, Bcryptjs, JSONWebToken, Dotenv |
| **Frontend (Landing/Auth)** | React 19, Vite 8, React Router 7, Axios, Material UI |
| **Dashboard (Trading Terminal)** | React 19, Vite 8, React Router 7, Axios, Material UI, Chart.js, Socket.IO Client |
| **Database** | MongoDB 7.0+ (Replica Set required for ACID transactions) |
| **DevOps & Containers** | Docker (Multi-stage builds), Docker Compose, Nginx (Alpine), GitHub Actions CI |

---

## 📂 Project Structure

```text
tradely/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection, env validation, trust proxy config
│   │   ├── controllers/        # Express route controllers (auth, orders, health, etc.)
│   │   ├── middleware/         # Helmet, CORS, RateLimiter, RequestLogger, ErrorHandler
│   │   ├── models/             # Mongoose models (User, Order, OcoGroup, Holding, Watchlist)
│   │   ├── routes/             # Public and protected API route declarations
│   │   ├── schemas/            # Schemas with compound and unique indexes
│   │   ├── services/           # Order engine, market simulation, analytics, watchlist
│   │   ├── utils/              # Structured logger, AppError, transaction helper
│   │   ├── app.js              # Express app wiring
│   │   ├── server.js           # Server lifecycle & graceful shutdown
│   │   └── socket.js           # Socket.IO WebSocket management
│   ├── Dockerfile              # Production Node.js multi-stage container
│   ├── test_phase8_runner.js   # Automated integration and hardening test suite
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # Landing page, authentication UI, and pricing
│   ├── src/
│   ├── nginx.conf              # Production Nginx reverse proxy / static server
│   ├── Dockerfile              # Multi-stage Vite build to Nginx
│   ├── .env.example
│   └── package.json
│
├── dashboard/                  # Trading terminal, charts, watchlist, and order execution
│   ├── src/
│   ├── nginx.conf              # Production Nginx static server
│   ├── Dockerfile              # Multi-stage Vite build to Nginx
│   ├── .env.example
│   └── package.json
│
├── .github/workflows/ci.yml    # Continuous Integration pipeline
├── docker-compose.yml          # Local multi-service orchestration
└── README.md
```

---

## ⚙️ Environment Configuration

Copy the sample environment files before running the application:

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env

# Dashboard configuration
cp dashboard/.env.example dashboard/.env
```

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | HTTP port for the backend service | `8000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGO_URI` | MongoDB connection URI (must support transactions) | `mongodb://localhost:27017/tradely` |
| `JWT_SECRET` | Secret key for JWT signing (**Min 32 characters**) | *Generated strong secret* |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `FRONTEND_URL` | URL of the frontend web application | `http://localhost:5173` |
| `DASHBOARD_URL` | URL of the trading dashboard application | `http://localhost:5174` |
| `ALLOWED_ORIGINS` | Comma-delimited list of permitted CORS origins | `http://localhost:5173,http://localhost:5174` |
| `TRUST_PROXY` | Reverse proxy trust hops (`0` for direct, `1` behind proxy) | `0` |
| `COOKIE_SECURE` | Enforce secure HTTPS flag on auth cookies | `false` (in dev), `true` (in prod) |
| `COOKIE_SAME_SITE` | Cookie cross-site policy (`lax` or `none`) | `lax` |

> [!IMPORTANT]
> **Vite Build-Time Variables**: Frontend and Dashboard are compiled to static assets served by Nginx. `VITE_*` environment variables are baked in at build time. When building Docker images, pass them as `--build-arg` values (already configured in `docker-compose.yml`).

---

## 🐳 Running with Docker Compose

To launch the complete platform locally in a production-like containerized topology:

```bash
docker compose up --build
```

### Exposed Services:
- **Frontend (Landing/Auth)**: `http://localhost:5173`
- **Dashboard (Trading Terminal)**: `http://localhost:5174`
- **Backend API**: `http://localhost:8000`
- **MongoDB**: `localhost:27017`

To gracefully shut down containers:
```bash
docker compose down
```

---

## 🧪 Testing & Verification

Tradely includes a comprehensive test suite that validates production hardening, security configurations, and Phase 1–7 regression:

```bash
cd backend
npm test
```

### Test Coverage includes:
- **Structured JSON Logger**: Automatic redaction of sensitive credentials in strings and nested objects.
- **Cookie Security**: Dynamic `httpOnly`, `secure`, and `sameSite` policy evaluation.
- **Sliding-Window Rate Limiter**: Quota enforcement (20 req/15min) and standard `RateLimit-*` / `Retry-After` headers.
- **Error Masking**: 500 error sanitization and stack-trace suppression under `NODE_ENV=production`.
- **Health & Readiness**: `GET /health` process liveness and `GET /ready` MongoDB dependency verification.
- **Trading Lifecycle**: Atomic reservation lock-in, OCO group win/cancel claims, and dynamic portfolio analytics.

---

## 🛡️ Enterprise Production Operational Prerequisites

While the Tradely codebase is production-hardened and deployment-ready, deploying into live financial or enterprise environments requires the following infrastructure-level configurations:

1. **TLS / SSL Termination**: Deploy behind a managed Load Balancer (e.g., AWS ALB, Cloudflare, or Ingress Controller) with automated certificate renewals (Let's Encrypt / ACM).
2. **Reverse Proxy Trust**: Set `TRUST_PROXY=1` (or specific subnet CIDR) when routing through Cloudflare/ALB so Express resolves client IPs accurately for rate limiting.
3. **External Secret Management**: Store `JWT_SECRET` and `MONGO_URI` in an enterprise key vault (AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets) rather than plain-text environment files.
4. **Distributed Rate Limiting**: In multi-replica container deployments (Kubernetes / ECS), replace the in-memory rate-limiting map with a shared Redis cluster (`rate-limit-redis`).
5. **MongoDB High Availability**: Utilize a managed MongoDB Replica Set (Atlas or self-hosted multi-node replica set) to ensure high availability and distributed transactions.
6. **Centralized Log Aggregation**: Ingest backend JSON log output into Datadog, Grafana Loki, or AWS CloudWatch for anomaly detection and alerting.

---

## 👨‍💻 Author

**Avishek Amin**
- GitHub: [@AvishekAmin](https://github.com/AvishekAmin)
- Repository: [Tradely](https://github.com/AvishekAmin/tradely)

---

## ⭐ License

This project is licensed under the ISC License.
