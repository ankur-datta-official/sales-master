# Prisma Tooling

Prisma is installed in Sales Master as a server-only admin and database control layer. It is not the runtime data-access layer for user-facing pages yet.

## Source Of Truth

- Supabase migrations in `supabase/migrations` remain the source of truth for schema changes.
- Do not run `prisma migrate dev` for this project unless the migration ownership decision changes later.
- After applying or adding Supabase migrations, refresh Prisma's schema with:

```bash
npm run prisma:pull
npm run prisma:generate
```

## Environment

Set `DATABASE_URL` to the Supabase direct PostgreSQL connection string. Do not use `NEXT_PUBLIC_SUPABASE_URL`, and do not expose `DATABASE_URL` to client code.

Example:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

If your Supabase dashboard says the direct host is not IPv4 compatible, use the Supabase Session Pooler connection string instead. Keep the same `DATABASE_URL` variable name.

## Commands

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:pull
npm run prisma:studio
npm run prisma:format
```

Use Prisma Studio for admin inspection and controlled database management:

```bash
npm run prisma:studio
```

## Runtime Boundary

`src/lib/prisma.ts` is marked with `server-only` and initializes lazily. Existing app routes continue to use Supabase clients and RLS-aware server actions.
