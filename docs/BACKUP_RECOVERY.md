# Supabase PostgreSQL Backup & Recovery

The production database is PostgreSQL hosted by Supabase. Do not copy or restore the local SQLite files in `prisma/` as a production backup.

## Backups

- Review the backup and point-in-time recovery options available for your Supabase plan in **Project → Database → Backups**.
- Before a schema migration or major release, take a Supabase backup/snapshot where available.
- For an independent logical backup, use `pg_dump` with the Supabase session-pooler or direct connection URL (port 5432). Keep the URL and resulting dump private:

```bash
pg_dump --format=custom --no-owner --file=e2e-backup.dump "$DATABASE_URL_UNPOOLED"
```

Store backups in encrypted, access-controlled storage separate from the application repository. Never commit database dumps or connection strings.

## Restore

Test a restore into a separate Supabase project first. Restoring into an existing database can overwrite or conflict with data; confirm the target and take a backup before proceeding.

```bash
pg_restore --no-owner --dbname="$DATABASE_URL_UNPOOLED" e2e-backup.dump
```

Configure `DATABASE_URL_UNPOOLED` in the shell with the target database's session-pooler or direct connection URL. Do not paste credentials into shared logs or commit them to source control.
