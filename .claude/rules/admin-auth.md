---
paths:
  - "lib/auth/**"
  - "app/admin/**"
---

# Admin Auth Rules

## Architecture: Dual-Layer
1. **Fast path**: `admin-session` cookie (httpOnly, secure, 7-day expiry)
2. **Fallback**: Supabase session + `profiles.user_role = 'admin'`

## Critical Constraints
- NEVER set cookies from Server Components — only from Server Actions or Route Handlers
- `requireAdminAuth()` is READ-ONLY (never modifies cookies)
- `setAdminSession()` ONLY called in login Server Action (`app/admin/login/actions.ts`)
- All admin pages fetch data SERVER-SIDE and pass to client components
- Client components are presentational only (no data fetching, no useEffect/fetch)

## Key Files
- `lib/auth/server-admin.ts` — `requireAdminAuth()` and `setAdminSession()`
- `app/admin/login/actions.ts` — Login action (sets both auth layers)
- `app/admin/dashboard/page.tsx` — Server Component pattern (check auth, fetch data, pass to client)
- `app/admin/dashboard/DashboardClient.tsx` — Client Component (renders data only)

## Pattern for Admin Pages
```typescript
// Server Component (page.tsx)
export default async function AdminPage() {
  const isAuthenticated = await requireAdminAuth()
  if (!isAuthenticated) redirect('/admin/login')
  const data = await fetchData()  // Server-side
  return <PageClient data={data} />
}
```

## See Also
- Full architecture details: `docs/architecture/admin-auth.md`
