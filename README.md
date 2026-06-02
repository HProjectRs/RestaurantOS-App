# RestaurantOS 🍽️

A full-featured bilingual (AR/EN) restaurant & café management system.

## Features
- **POS System** — Order management, table management, split bills, holds
- **Kitchen Display System (KDS)** — Real-time order display for kitchen staff
- **Menu Manager** — Categories, items, modifiers, image uploads
- **Table Management** — QR codes, occupancy tracking, reservations
- **Stripe Payments** — Secure card payments, webhook handling, refunds
- **Employee Management** — Shifts, attendance, payroll, role-based access
- **Analytics & Reports** — Sales, expenses, orders, performance
- **WiFi Portal** — Voucher-based guest WiFi management
- **Loyalty Program** — Points, rewards, customer tracking
- **Offline Mode** — Queue operations when offline, sync on reconnect
- **Bilingual** — Full Arabic/English interface

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TypeScript, Zustand |
| Database | PostgreSQL (prod), SQLite (dev) |
| ORM | Prisma |
| Auth | JWT + Refresh Tokens |
| Payments | Stripe |
| Real-time | Socket.IO |
| Caching | Redis (optional) |
| Validation | Zod |
| Monitoring | Sentry, Winston |
| Docs | Swagger/OpenAPI |

## Quick Start

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Setup
```bash
# Clone & install
cd server && npm install
cd ../client && npm install

# Setup database (SQLite for dev)
cd ../server
cp .env.example .env
npm run db:setup:sqlite
```

### 2. Environment Variables
```bash
# server/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-min-32-chars"
REFRESH_SECRET="your-refresh-secret-min-32-chars"
FRONTEND_URL="http://localhost:5173"
PORT=3001

# Stripe (optional for dev)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoring (optional)
SENTRY_DSN="https://..."
LOG_LEVEL="info"
```

### 3. Run
```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client
cd client && npm run dev
```

### 4. Access
- Client: http://localhost:5173
- API: http://localhost:3001/api
- Docs: http://localhost:3001/api/docs
- Health: http://localhost:3001/api/health

## Deployment

### Docker (Recommended)
```bash
docker build -t restaurantos-server -f server/Dockerfile .
docker build -t restaurantos-client -f client/Dockerfile .

docker-compose up -d
```

### Manual (Production)
```bash
# Build
cd server && npm run build
cd ../client && npm run build

# Run
cd server && NODE_ENV=production node dist/index.js
```

### Database Migrations
```bash
# Production
cd server && DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Development
cd server && npm run prisma:push:sqlite
```

## API Documentation

Full Swagger/OpenAPI docs at `/api/docs` when server is running.

### Critical Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate (email/password) |
| POST | `/api/auth/register` | Register new business |
| POST | `/api/orders` | Create order (transactional) |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/menu` | List menu items |
| POST | `/api/payments/create-intent` | Create Stripe payment |
| POST | `/api/payments/webhook` | Stripe webhook (⚠️ raw body) |
| GET | `/api/health` | Health check |

### Stripe Webhook Setup
⚠️ **Critical**: The webhook endpoint MUST receive raw body.

```bash
# In Stripe Dashboard:
# 1. Developers > Webhooks > Add endpoint
# 2. URL: https://yourdomain.com/api/payments/webhook
# 3. Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
# 4. Copy signing secret to STRIPE_WEBHOOK_SECRET
```

## Testing

```bash
# Run all tests
cd server && npm test

# Run with coverage
cd server && npm run test:coverage

# Watch mode
cd server && npm run test:watch
```

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema
│   └── schema.sqlite.prisma   # SQLite dev schema
└── src/
    ├── index.ts               # Express app entry
    ├── services/
    │   └── orderService.ts    # Order business logic
    ├── middleware/
    │   ├── auth.ts            # JWT authentication
    │   ├── validate.ts        # Zod validation
    │   ├── logger.ts          # Winston structured logging
    │   ├── sanitize.ts        # XSS prevention
    │   ├── rateLimiter.ts     # Rate limiting
    │   ├── optimisticLock.ts  # Retry middleware
    │   └── auditLog.ts       # Audit trail
    ├── routes/
    │   ├── payments.ts        # Stripe integration
    │   ├── orders.ts          # Order management
    │   ├── menu.ts            # Menu CRUD + images
    │   ├── tables.ts          # Table management
    │   └── ...               # Other routes
    ├── sockets/
    │   └── index.ts           # Socket.IO handlers
    ├── sentry.ts              # Error monitoring
    ├── swagger.ts             # API documentation
    └── schemas.ts             # Zod validation schemas

client/
└── src/
    ├── store/                 # Zustand state management
    ├── components/            # Reusable UI components
    ├── pages/                 # Route pages
    ├── hooks/                 # Custom React hooks
    ├── workers/               # Offline queue + sync
    └── services/              # API client
```

## Troubleshooting

### Stripe Webhook Not Processing
**Symptom**: Orders created but payment not recorded

**Check**:
1. Raw body middleware is BEFORE `express.json()` in `index.ts`
2. `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Endpoint URL is publicly accessible
4. Server logs for signature verification errors

### WebSocket Memory Leaks
**Symptom**: RAM usage increases over time

**Fixed**: Each disconnect calls `removeAllListeners()`. Orphan cleanup runs every 30s. Per-user connection limit = 5.

### Race Conditions on Table Occupation
**Fixed**: Optimistic locking via `version` field + `updateMany` with version check + transaction.

### Database Connection Issues
```bash
# Check connection
curl http://localhost:3001/api/health

# Reset dev database
cd server && npm run db:reset
```

## Security

- ✅ HTTPS enforced in production
- ✅ Helmet security headers (HSTS, CSP, X-Frame-Options)
- ✅ CORS whitelisted to FRONTEND_URL
- ✅ Rate limiting on auth (10/15min) and API (100/15min)
- ✅ Input validation via Zod on all mutation endpoints
- ✅ Mass assignment protection (explicit field whitelists)
- ✅ Image upload MIME + content verification
- ✅ Stripe webhook signature verification
- ✅ JWT tokens with refresh rotation
- ✅ SQL injection prevention via Prisma parameterized queries
- ✅ XSS prevention via middleware sanitization
- ✅ No stack traces in production

## Monitoring

- **Sentry** — Error tracking, performance monitoring, release tracking
- **Winston** — Structured JSON logging, file rotation, console colorized output
- **Health Endpoints** — `/api/health`, database connectivity checks
- **Socket Stats** — Periodic logging of connections, users, orphan cleanup

## License

Private — All rights reserved.
