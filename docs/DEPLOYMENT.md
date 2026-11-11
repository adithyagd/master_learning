# Production Deployment & Environment Configuration Guide
**E2E Procurement Recruiter Academy + Recruitment Operations Platform**  
*Organization: E2E Procurement Private Limited (CIN: U78300KA2025PTC204064)*

---

## 1. System Architecture & Prerequisites

The platform is a Next.js application using Prisma ORM and Supabase-hosted PostgreSQL. The application uses its own JWT authentication; Supabase Auth is not required.

### Technical Stack
- **Framework**: Next.js 15 (App Router, Server Actions, Edge Middleware)
- **Runtime**: Node.js 20 LTS or Node.js 22 LTS
- **Language**: TypeScript 5.7 (Strict Mode)
- **Database**: Supabase PostgreSQL via Prisma ORM
- **Authentication**: Stateless, cryptographically signed HTTP-only JWTs (`jose`) with bcrypt password hashing
- **Styling & UI**: Tailwind CSS, Lucide Icons, Accessible Radix/Custom ARIA components

### Server Requirements
- **Minimum**: 1 vCPU, 1 GB RAM, 10 GB SSD
- **Recommended**: 2 vCPU, 2–4 GB RAM, 25 GB NVMe SSD
- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / Windows Server 2022

---

## 2. Environment Variables Configuration

Create a project in the [Supabase Dashboard](https://supabase.com/dashboard), choose a region close to your Vercel functions, and set a strong database password. Once it is ready, open **Connect** and copy the Transaction Pooler and Session Pooler connection strings. Keep the database password private and URL-encode special characters in it before placing it in a connection URL. **Never commit `.env` or production database credentials.**

```env
# Supabase Transaction Pooler (port 6543) — application/runtime
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# Supabase Session Pooler (port 5432) — Prisma migrations
DATABASE_URL_UNPOOLED="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Cryptographic Secret for JWT Session Signing (Must be >= 32 characters of high entropy)
# Generate with: openssl rand -base64 32
JWT_SECRET="generate-a-strong-high-entropy-64-character-secret-key-here"

# Default System Administrator Credentials (Used on initial bootstrap)
ADMIN_DEFAULT_EMAIL="admin@e2epvtltd.com"
ADMIN_DEFAULT_PASSWORD="ReplaceWithComplexPassword123!@#"

# Node Environment
NODE_ENV="production"
PORT=3000
```

Use the exact usernames, hosts, and database name shown by Supabase; the URLs above are examples. URL-encode special characters in the database password. Set both database variables in the local `.env` and in Vercel for **Production**, **Preview**, and **Development** as applicable. `prisma/schema.prisma` uses `DATABASE_URL` for the application and `DATABASE_URL_UNPOOLED` for migrations.

See the [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma) for connection-string details.

### Secret Rotation Protocol
- If `JWT_SECRET` is rotated, all active sessions will be invalidated immediately, requiring users to log in again.
- Passwords are stored exclusively as salted bcrypt hashes (`cost: 10`). Plaintext credentials are never retained or logged.

---

## 3. Installation & Build Pipeline

Run the following steps for a new, empty Supabase project. This creates the tables from the committed Prisma migration and seeds the initial administrator and curriculum. It does not import data from `prisma/dev.db`.

```bash
# Install dependencies and generate Prisma Client
npm ci
npx prisma generate

# Create the schema in the fresh Supabase database
npx prisma migrate deploy

# Configure ADMIN_DEFAULT_EMAIL and a unique ADMIN_DEFAULT_PASSWORD first.
# Run once: this creates/updates that admin and seeds the curriculum.
npm run db:seed
```

`npm run db:seed` updates the configured administrator password when run again; protect the credentials and run it only when intended. The seeder does not create demo users in production.

For Vercel, add `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `ADMIN_DEFAULT_EMAIL`, and `ADMIN_DEFAULT_PASSWORD` in **Project Settings → Environment Variables**. `DATABASE_URL` must be a PostgreSQL connection string, not `file:./dev.db`. Apply pending migrations from a trusted environment with the session-pooler/direct URL before the first deployment and before each release that changes the schema:

```bash
npx prisma migrate deploy
```

Do not run `prisma db push` against production. Authenticated dashboard pages are rendered dynamically and must not query the database during the Vercel build. The database schema must nevertheless be migrated before the application serves requests.

Then deploy normally; Vercel runs `npm run build`. The production build does not seed or migrate the database implicitly.

---

## 4. Production Process Management

### Option A: PM2 Process Manager (Recommended for Single-Host Deployments)

Install PM2 globally:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: "e2e-recruiter-platform",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/e2e-recruiter-platform",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

Manage the process:
```bash
# Start and persist on system boot
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option B: Systemd Service Unit

Create `/etc/systemd/system/e2e-recruiter.service`:
```ini
[Unit]
Description=E2E Procurement Recruiter Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/e2e-recruiter-platform
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=e2e-recruiter
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable e2e-recruiter
sudo systemctl start e2e-recruiter
```

---

## 5. NGINX Reverse Proxy & SSL Configuration

Deploy NGINX in front of the Next.js application to handle TLS termination, HTTP/2, client timeouts, and security headers.

`/etc/nginx/sites-available/e2e-recruiter.conf`:
```nginx
upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;

server {
    listen 80;
    server_name recruiter.e2epvtltd.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name recruiter.e2epvtltd.com;

    # SSL Certificates (managed via Certbot / Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/recruiter.e2epvtltd.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recruiter.e2epvtltd.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Enterprise Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';" always;

    # Static assets caching
    location /_next/static {
        proxy_pass http://nextjs_upstream;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Strict rate limit on authentication endpoints
    location ~* /(login|admin/login|forgot-password|reset-password) {
        limit_req zone=auth_limit burst=5 nodelay;
        proxy_pass http://nextjs_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Default proxy pass
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Pre-Flight Verification Checklist

Before releasing to end users, verify the following:
- [ ] Production `.env` file populated with unique, high-entropy `JWT_SECRET`.
- [ ] Default administrator credentials updated.
- [ ] HTTPS certificates installed and auto-renewing (`certbot renew --dry-run`).
- [ ] Supabase database URLs and application secrets configured in Vercel.
- [ ] NGINX security headers verified via `curl -I https://recruiter.e2epvtltd.com`.
- [ ] All 18 automated test suites passing (`npx vitest run`).
- [ ] Supabase backup/restore plan reviewed (see `docs/BACKUP_RECOVERY.md`).
