# Admin Authentication Architecture

**Last Updated**: November 3, 2025
**Critical Reading**: Required before modifying admin auth system

---

## Overview

The admin authentication system uses a **dual-layer approach**:
1. **Fast cookie-based sessions** (`admin-session` cookie)
2. **Fallback Supabase admin verification** (checks `profiles.user_role`)

This architecture ensures fast auth checks while maintaining security through Supabase's user management.

---

## Core Files

```
lib/auth/server-admin.ts          # Server-side auth functions (SSR, Server Actions)
app/admin/login/actions.ts        # Login Server Action (sets both auth layers)
app/admin/dashboard/page.tsx      # Server Component (checks auth, fetches data)
app/admin/dashboard/DashboardClient.tsx  # Client Component (renders data)
app/admin/layout.tsx              # Admin layout (passes user to client)
```

---

## Authentication Functions

### `lib/auth/server-admin.ts`

#### `requireAdminAuth(): Promise<boolean>`

**Purpose**: Check if user is authenticated (read-only)

**Used in**: Server Components (page.tsx files)

**Flow**:
```typescript
1. Check admin-session cookie (fast path)
   ↓ Found? Return true
2. Check Supabase session + user_role = 'admin'
   ↓ Found? Return true
3. Return false (not authenticated)
```

**Important**: This function **NEVER modifies cookies** (Next.js restriction).

**Example**:
```typescript
// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  const isAuthenticated = await requireAdminAuth()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Fetch data server-side
  const data = await fetchDashboardData()

  return <DashboardClient data={data} />
}
```

#### `setAdminSession(): Promise<void>`

**Purpose**: Set the `admin-session` cookie after successful login

**Used in**: Server Actions ONLY (actions.ts files)

**Cookie details**:
- Name: `admin-session`
- Value: `'authenticated'`
- Max-Age: 7 days
- HttpOnly: true (not accessible via JavaScript)
- Secure: true (production only)
- SameSite: 'lax'

**Example**:
```typescript
// app/admin/login/actions.ts
export async function loginAdminAction(email: string, password: string) {
  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // 2. Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', data.user.id)
    .single()

  if (profile?.user_role !== 'admin') {
    return { success: false, error: 'Not authorized' }
  }

  // 3. Set admin session cookie
  await setAdminSession()

  // 4. Redirect
  redirect('/admin/dashboard')
}
```

#### `getAdminSession(): Promise<boolean>`

**Purpose**: Check if admin-session cookie exists

**Returns**: `true` if cookie found and valid

#### `clearAdminSession(): Promise<void>`

**Purpose**: Delete the admin-session cookie (logout)

**Used in**: Logout Server Actions

#### `verifySupabaseAdmin(): Promise<boolean>`

**Purpose**: Check if current Supabase user has admin role

**Used internally by**: `requireAdminAuth()`

---

## Critical Next.js Constraints

### Cookie Modification Rules

**✅ CAN set cookies in**:
- Server Actions (`'use server'` functions in `actions.ts`)
- Route Handlers (`app/api/**/route.ts`)

**❌ CANNOT set cookies in**:
- Server Components (`page.tsx`, `layout.tsx`)
- Client Components (`'use client'`)
- Middleware (use `response.cookies.set()` instead)

### Why This Matters

**Before (BROKEN)**:
```typescript
// ❌ BAD: Trying to set cookie from Server Component
export default async function AdminDashboard() {
  const isAuthenticated = await requireAdminAuth()
  // ↑ This called setAdminSession() internally
  // ERROR: "Cookies can only be modified in a Server Action or Route Handler"
}
```

**After (CORRECT)**:
```typescript
// ✅ GOOD: Cookie set in login action, only checked in page
// app/admin/login/actions.ts
export async function loginAdminAction(email, password) {
  // Authenticate...
  await setAdminSession()  // ✅ OK: Server Action
  redirect('/admin/dashboard')
}

// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  const isAuthenticated = await requireAdminAuth()  // ✅ OK: Read-only
  if (!isAuthenticated) redirect('/admin/login')
  // ...
}
```

---

## Server-Side Data Fetching Pattern

**Critical**: Admin pages should fetch data **server-side** and pass to client components.

### Why?

1. **Single source of truth**: Auth and data fetched together
2. **No API auth races**: No mismatch between SSR auth and API route auth
3. **Faster initial render**: Data ready when page loads
4. **No loading states**: Server handles all data fetching

### Architecture

```
User Request
    ↓
Server Component (page.tsx)
    ├─ requireAdminAuth() → Check auth
    ├─ fetchData() → Query Supabase
    └─ <ClientComponent data={data} /> → Render
         ↓
Client Component (DashboardClient.tsx)
    └─ Display data (presentational only)
```

### Example: Dashboard Page

**Server Component** (`app/admin/dashboard/page.tsx`):
```typescript
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

// Disable caching
export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  noStore()  // Ensure fresh data

  // 1. Check auth (redirect if not authenticated)
  const isAuthenticated = await requireAdminAuth()
  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // 2. Fetch all data server-side
  const data = await fetchDashboardData()

  // 3. Pass to client component
  return <DashboardClient data={data} />
}

async function fetchDashboardData() {
  const supabase = getServiceSupabase()

  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })

  return { assessments }
}
```

**Client Component** (`app/admin/dashboard/DashboardClient.tsx`):
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  data: {
    assessments: Assessment[]
  }
}

export default function DashboardClient({ data }: Props) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()  // Re-fetches server-side data
  }

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      {data.assessments.map(a => (
        <div key={a.id}>{a.email}</div>
      ))}
    </div>
  )
}
```

**Key Points**:
- ✅ Client component is **presentational only** (no data fetching)
- ✅ No `useEffect` or `fetch()` calls in client
- ✅ No loading/error states (handled by SSR)
- ✅ Refresh via `router.refresh()` (re-runs server component)

---

## Login Flow (Step-by-Step)

### User Action: Submits Login Form

**File**: `app/admin/login/page.tsx` (Client Component)

```typescript
'use client'

const handleLogin = async (e: FormEvent) => {
  e.preventDefault()
  const result = await loginAdminAction(email, password)
  // Redirect happens in action, or show error here
}
```

### Step 1: Authenticate with Supabase

**File**: `app/admin/login/actions.ts` (Server Action)

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

- Creates Supabase session (cookies: `sb-access-token`, `sb-refresh-token`)
- Stored as httpOnly cookies automatically

### Step 2: Verify Admin Role

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_role')
  .eq('id', data.user.id)
  .single()

if (profile?.user_role !== 'admin') {
  await supabase.auth.signOut()
  return { success: false, error: 'Not authorized' }
}
```

### Step 3: Set Admin Cookie

```typescript
await setAdminSession()
```

- Sets `admin-session` cookie
- Now user has **both** Supabase session + admin cookie

### Step 4: Redirect to Dashboard

```typescript
revalidatePath('/admin')
redirect('/admin/dashboard')
```

---

## Dashboard Load Flow (Step-by-Step)

### User Navigates to /admin/dashboard

**File**: `app/admin/dashboard/page.tsx` (Server Component)

### Step 1: Check Authentication

```typescript
const isAuthenticated = await requireAdminAuth()
```

**Fast path** (most requests):
1. Check `admin-session` cookie → Found!
2. Return `true` immediately (no database query)

**Slow path** (first visit after login):
1. Check `admin-session` cookie → Not found
2. Check Supabase session → Found!
3. Check `profiles.user_role` → `'admin'`
4. Return `true`

### Step 2: Redirect if Not Authenticated

```typescript
if (!isAuthenticated) {
  redirect('/admin/login')
}
```

### Step 3: Fetch Data Server-Side

```typescript
const data = await fetchDashboardData()
// Queries: assessments, communications, revenue, etc.
```

### Step 4: Render Client Component

```typescript
return <DashboardClient data={data} />
```

- Client receives data as props
- No API calls needed
- Instant render

---

## Common Issues & Solutions

### Issue 1: "Cookies can only be modified in a Server Action"

**Symptom**: Error when loading admin pages

**Cause**: Trying to call `setAdminSession()` from Server Component

**Solution**:
- ✅ Only call `setAdminSession()` in login action
- ✅ Use `requireAdminAuth()` (read-only) in Server Components

**Files to check**:
- `lib/auth/server-admin.ts`: Ensure `requireAdminAuth()` doesn't call `setAdminSession()`
- `app/admin/login/actions.ts`: Ensure `setAdminSession()` is called here

### Issue 2: Login card appears inside authenticated dashboard

**Symptom**: Header shows user email + logout, but content area shows login form

**Cause 1**: Login action not setting admin cookie

**Solution**: Verify `app/admin/login/actions.ts` calls `await setAdminSession()`

**Cause 2**: Client component conditionally rendering login UI

**Solution**: Remove any conditional login UI from admin client components

### Issue 3: Authentication loops (login → dashboard → login → ...)

**Symptom**: Redirects back and forth between login and dashboard

**Cause**: Cookie not persisting or being read incorrectly

**Solution**:
1. Clear all cookies for domain
2. Check `admin-session` cookie settings (httpOnly, secure, sameSite)
3. Verify `getAdminSession()` reads from correct cookie name

### Issue 4: API routes return 401 but pages work

**Symptom**: Dashboard loads but API calls fail with 401

**Cause**: API routes using different auth check than pages

**Solution**:
- API routes should check Supabase session OR admin password header
- Not all API routes check the `admin-session` cookie
- This is intentional (API routes are called from client, need explicit auth)

---

## Testing Checklist

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Test login flow
open http://localhost:3000/admin/login
# - Enter credentials
# - Verify redirects to /admin/dashboard
# - Check cookies: admin-session should exist

# 3. Test dashboard loads with data
# - Verify no loading spinner
# - Verify no error messages
# - Verify data displays immediately

# 4. Test navigation
# - Click sidebar links
# - Verify no login cards appear
# - Verify page transitions work

# 5. Test logout
# - Click Logout button
# - Verify redirects to /admin/login
# - Verify admin-session cookie deleted
```

### Production Testing

```bash
# 1. Check unauthenticated redirect
curl -sI https://painoptix.com/admin/dashboard
# Expected: 307 redirect to /admin/login

# 2. Check deployment logs
doctl apps logs c61c1a95-d2be-482b-aaee-b016be6185e0

# 3. Manual browser test (incognito)
# - Visit https://painoptix.com/admin/login
# - Log in
# - Verify dashboard loads correctly
# - Check Network tab: no /api/admin/dashboard calls on initial load
```

---

## Admin Users Management

### Current Admin Users

**Production Admins**:
- Dr. Bradley Carpentier: `drbcarpentier@gmail.com`

### Adding New Admin Users

**Via Supabase Dashboard**:
1. Go to Supabase project → Authentication → Users
2. Create new user (or find existing)
3. Go to Table Editor → profiles table
4. Find user by email
5. Set `user_role` = `'admin'`
6. Save

**Via SQL**:
```sql
-- Find user ID
SELECT id, email FROM auth.users WHERE email = 'newadmin@example.com';

-- Update profile
UPDATE profiles
SET user_role = 'admin'
WHERE id = '<user-id-from-above>';
```

### Removing Admin Access

```sql
UPDATE profiles
SET user_role = 'user'
WHERE id = '<user-id>';
```

---

## Security Considerations

### Cookie Security

- **httpOnly**: Prevents JavaScript access (XSS protection)
- **secure**: HTTPS only in production
- **sameSite: 'lax'**: CSRF protection
- **7-day expiration**: Balances security and convenience

### Session Invalidation

**Logout**:
```typescript
await supabase.auth.signOut()  // Clears Supabase session
await clearAdminSession()       // Clears admin cookie
```

**Force logout all sessions**: Change password in Supabase (invalidates all tokens)

### Audit Trail

All admin logins logged:
```typescript
console.log(JSON.stringify({
  evt: 'admin_login_attempt',
  ok: true,
  userId: data.user.id,
  timestamp: new Date().toISOString()
}))
```

View logs: `doctl apps logs <app-id> | grep admin_login_attempt`

---

## Migration Notes (November 2025)

### Previous Architecture Issues

**Old system** (pre-November 2025):
- Client-side API data fetching in dashboard
- `requireAdminAuth()` tried to set cookies from Server Components
- Authentication mismatch between SSR and API routes
- Login cards appearing inside authenticated pages

**Problems**:
1. Next.js error: "Cookies can only be modified in a Server Action"
2. Race conditions between SSR auth and API auth
3. Poor UX: loading states, error states, nested login forms

### New Architecture (November 2025)

**Changes**:
1. `requireAdminAuth()` is read-only (never sets cookies)
2. `setAdminSession()` only called in login Server Action
3. All admin pages fetch data server-side (no client API calls)
4. Dashboard is presentational-only (no data fetching logic)

**Benefits**:
- No Next.js cookie errors
- Single source of truth for auth + data
- Faster page loads (data ready on SSR)
- Better UX (no loading/error states)

---

## Related Documentation

- **[ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)**: Full admin dashboard features
- **[DATABASE.md](./DATABASE.md)**: profiles table schema
- **[API_REFERENCE.md](./API_REFERENCE.md)**: Admin API endpoints
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**: Common issues

---

**Last Reviewed**: November 3, 2025
**Next Review**: When adding new admin features or auth methods
