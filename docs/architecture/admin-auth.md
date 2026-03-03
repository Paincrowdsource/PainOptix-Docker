# Admin Authentication Architecture

**Last Updated**: March 2026 (condensed from original November 2025 document)

## Overview

Dual-layer authentication:
1. **Fast path**: `admin-session` cookie (httpOnly, secure, 7-day expiry)
2. **Fallback**: Supabase session + `profiles.user_role = 'admin'`

## Core Files

```
lib/auth/server-admin.ts          # requireAdminAuth(), setAdminSession(), clearAdminSession()
app/admin/login/actions.ts        # Login Server Action (sets both auth layers)
app/admin/dashboard/page.tsx      # Server Component pattern (auth + fetch + render)
app/admin/dashboard/DashboardClient.tsx  # Client Component (presentational only)
```

## Key Functions

| Function | Purpose | Where to call |
|----------|---------|---------------|
| `requireAdminAuth()` | Read-only auth check | Server Components (page.tsx) |
| `setAdminSession()` | Set admin cookie | Server Actions ONLY (actions.ts) |
| `clearAdminSession()` | Delete admin cookie | Logout Server Actions |
| `verifySupabaseAdmin()` | Check Supabase role | Used internally by requireAdminAuth() |

## Next.js Cookie Rules

**CAN set cookies in**: Server Actions (`'use server'`), Route Handlers (`app/api/**/route.ts`)

**CANNOT set cookies in**: Server Components, Client Components, Middleware (use `response.cookies.set()`)

## Login Flow

1. User submits form → `loginAdminAction()` (Server Action)
2. Authenticate with Supabase (`signInWithPassword`)
3. Verify `profiles.user_role === 'admin'`
4. Call `setAdminSession()` (cookie set here, in Server Action)
5. `redirect('/admin/dashboard')`

## Dashboard Load Flow

1. Server Component: `requireAdminAuth()` → fast cookie check, fallback to Supabase
2. If not auth: `redirect('/admin/login')`
3. Fetch data server-side (Supabase queries)
4. Pass data as props to Client Component
5. Client renders (presentational only — no `useEffect`, no `fetch()`)

## Admin Pages Pattern

```typescript
// Server Component (page.tsx) — auth + data
export default async function AdminPage() {
  noStore()
  const isAuthenticated = await requireAdminAuth()
  if (!isAuthenticated) redirect('/admin/login')
  const data = await fetchData()
  return <PageClient data={data} />
}

// Client Component — presentational only
export default function PageClient({ data }: Props) {
  const router = useRouter()
  const handleRefresh = () => router.refresh()  // Re-runs server component
  return <div>{/* render data */}</div>
}
```

## Admin Users

**Current admin**: Dr. Bradley Carpentier (`drbcarpentier@gmail.com`)

**Adding admins**: Set `user_role = 'admin'` in `profiles` table via Supabase dashboard or SQL:
```sql
UPDATE profiles SET user_role = 'admin' WHERE id = '<user-id>';
```

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Cookies can only be modified in a Server Action" | Setting cookie from Server Component | Only call `setAdminSession()` in actions.ts |
| Login card inside dashboard | Cookie not set in login action | Verify `setAdminSession()` called |
| Auth loops (login ↔ dashboard) | Cookie not persisting | Clear cookies, check httpOnly/secure settings |
| API returns 401 but page works | API uses different auth than pages | API routes check Supabase session or admin password header |

## Security

- httpOnly: prevents XSS access to cookie
- secure: HTTPS only in production
- sameSite: 'lax' for CSRF protection
- 7-day expiry
- All logins logged: `grep admin_login_attempt` in DO logs
