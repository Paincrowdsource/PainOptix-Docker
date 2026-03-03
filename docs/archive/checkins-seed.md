# Check-Ins: Migration + Seeds (safe/inert)

## Safety first
- This step is **DB-only**; no emails will send.
- Keep feature flags OFF in prod (`CHECKINS_ENABLED=0`).
- Prefer running against **staging** or local Supabase.

## Prereqs
- Node 20, ts-node installed.
- Env set locally:
  - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
  - SUPABASE_SERVICE_ROLE_KEY

## Run
1) Apply SQL migration to your target DB (staging/local):
   - Via Supabase SQL editor: paste the contents of `2025-09-14_checkins.sql`.
   - Or via psql if you have a direct connection.

2) Seed:
```bash
npx ts-node scripts/seed-checkins.ts
```

## Verify

Run minimal checks:

```sql
select key from message_templates order by key;
select count(*) from encouragements;
select diagnosis_code, day, branch from diagnosis_inserts order by day, branch;
```

You should see:
- 12 template keys: `day{3,7,14}.{initial,better,same,worse}`
- 10 encouragement rows
- `generic` inserts for each day/branch