# Database Migration, Backup & Disaster Recovery Runbook
**E2E Procurement Recruiter Academy + Recruitment Operations Platform**  
*Organization: E2E Procurement Private Limited (CIN: U78300KA2025PTC204064)*

---

## 1. Database Architecture & Concurrency Model

The platform operates on an embedded SQLite database (`prisma/dev.db`) managed via Prisma ORM.

### Key Characteristics & Performance Optimizations:
- **Write-Ahead Logging (WAL)**: SQLite operates with WAL journal mode (`PRAGMA journal_mode=WAL;`). WAL allows concurrent readers without blocking writers, and writers do not block readers.
- **Busy Timeout**: Configured with `PRAGMA busy_timeout=5000;` to ensure transaction queues automatically retry when concurrent writes occur under high load, preventing `SQLITE_BUSY` errors.
- **Foreign Keys**: Enabled by default (`PRAGMA foreign_keys=ON;`) to maintain relational integrity across cascading deletions (`User` $\rightarrow$ `CandidateProfile` $\rightarrow$ `AssessmentAttempts`).

---

## 2. Automated Backup Strategy

Because SQLite databases are single-file systems, **never copy `dev.db` directly while the application is actively writing**, as this risks capturing an uncommitted transaction state or torn pages.

### Online Safe Hot Backups (Zero Downtime)
SQLite includes a native, ACID-compliant online backup API accessible via the `sqlite3` CLI utility:

```bash
sqlite3 prisma/dev.db ".backup 'backups/db-backup-$(date +%Y%m%d_%H%M%S).db'"
```
The `.backup` command locks pages sequentially without interrupting concurrent web traffic and guarantees a bit-for-bit consistent snapshot.

---

## 3. Automated Cron Backup Script

Create the backup directory:
```bash
mkdir -p /var/www/e2e-recruiter-platform/backups
mkdir -p /var/www/e2e-recruiter-platform/scripts
```

Create `/var/www/e2e-recruiter-platform/scripts/backup.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/e2e-recruiter-platform"
DB_PATH="${APP_DIR}/prisma/dev.db"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/e2e_db_${TIMESTAMP}.db"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# 1. Create hot snapshot
sqlite3 "${DB_PATH}" ".backup '${BACKUP_FILE}'"

# 2. Verify snapshot integrity before compressing
INTEGRITY=$(sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;")
if [ "${INTEGRITY}" != "ok" ]; then
    echo "ERROR: Backup integrity check failed: ${INTEGRITY}" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# 3. Compress snapshot
gzip -9 "${BACKUP_FILE}"

# 4. Optional: Push to secure offsite object storage (AWS S3 / Azure / Cloudflare R2)
# aws s3 cp "${COMPRESSED_FILE}" s3://e2e-backups-secure/database/

# 5. Retention policy: Remove local backups older than 30 days
find "${BACKUP_DIR}" -name "e2e_db_*.db.gz" -type f -mtime +30 -delete

echo "[$(date)] Backup completed successfully: ${COMPRESSED_FILE}"
```

Make executable:
```bash
chmod +x /var/www/e2e-recruiter-platform/scripts/backup.sh
```

### Cron Schedule (`crontab -e`)
```cron
# Run hot backup every 4 hours, and integrity verify daily at midnight
0 */4 * * * /var/www/e2e-recruiter-platform/scripts/backup.sh >> /var/log/e2e-db-backup.log 2>&1
```

---

## 4. Disaster Recovery & Restoration Runbook

In the event of hardware failure, catastrophic data corruption, or unintentional record truncation, follow these restoration procedures:

### Emergency Restoration Procedure:

1. **Stop Application Traffic**:
   ```bash
   sudo systemctl stop e2e-recruiter
   # or
   pm2 stop e2e-recruiter-platform
   ```

2. **Quarantine the Damaged Database**:
   ```bash
   mv /var/www/e2e-recruiter-platform/prisma/dev.db /var/www/e2e-recruiter-platform/prisma/dev.db.damaged.$(date +%s)
   rm -f /var/www/e2e-recruiter-platform/prisma/dev.db-wal
   rm -f /var/www/e2e-recruiter-platform/prisma/dev.db-shm
   ```

3. **Locate and Decompress Target Backup**:
   ```bash
   cd /var/www/e2e-recruiter-platform/backups
   # Select the most recent verified backup file
   gunzip -c e2e_db_YYYYMMDD_HHMMSS.db.gz > /var/www/e2e-recruiter-platform/prisma/dev.db
   ```

4. **Verify Database Integrity**:
   ```bash
   sqlite3 /var/www/e2e-recruiter-platform/prisma/dev.db "PRAGMA integrity_check;"
   # Output MUST be: ok
   ```

5. **Set Correct File Permissions**:
   ```bash
   chown www-data:www-data /var/www/e2e-recruiter-platform/prisma/dev.db
   chmod 600 /var/www/e2e-recruiter-platform/prisma/dev.db
   ```

6. **Restart Application Services**:
   ```bash
   sudo systemctl start e2e-recruiter
   # or
   pm2 start e2e-recruiter-platform
   ```

7. **Execute Verification Smoke Tests**:
   - Access `/admin/login` and verify administrative authentication.
   - Navigate to `/admin/dashboard` and verify real counts.
   - Execute test verification: `npx vitest run tests/phase17-e2e-audit.test.ts`.

---

## 5. Migration to Client-Server PostgreSQL (Scaling Beyond 10,000 Recruiters)

When the organization grows beyond single-server capacity or requires multi-region active-active clustering, migrate to PostgreSQL:

1. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Set Connection String**:
   ```env
   DATABASE_URL="postgresql://e2e_admin:SecretPass@db.internal:5432/e2e_platform?schema=public&sslmode=require"
   ```
3. **Execute Schema Migration**:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
4. **Data Transfer**:
   Use `pgloader` to copy data from SQLite to PostgreSQL with automated type casting:
   ```bash
   pgloader sqlite:///var/www/e2e-recruiter-platform/prisma/dev.db postgresql://e2e_admin:SecretPass@db.internal:5432/e2e_platform
   ```
5. **Re-seed and Verify Integrity**:
   ```bash
   npm run test
   ```
