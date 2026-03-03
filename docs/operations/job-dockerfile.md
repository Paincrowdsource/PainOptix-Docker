# How to Use Dockerfile.dispatch for Check-ins Job

## Problem
The current `checkins-dispatcher` job fails because it uses `git:` source and rebuilds the entire Next.js app, but lacks the necessary Supabase env vars for the build.

## Solution
Use `Dockerfile.dispatch` instead - a minimal Docker image that only runs the dispatch script without building Next.js.

## Steps to Update DigitalOcean App Spec

### Option A: Via doctl CLI (Preferred)

1. Authenticate with correct token:
```bash
export DIGITALOCEAN_ACCESS_TOKEN=<your-digitalocean-token>
~/bin/doctl.exe auth init --access-token $DIGITALOCEAN_ACCESS_TOKEN
```

> **Note**: Get your DO token from the secure location where team tokens are stored.

2. Get current app spec:
```bash
~/bin/doctl.exe apps spec get c61c1a95-d2be-482b-aaee-b016be6185e0 --format json > app-spec.json
```

3. Edit `app-spec.json` - find the `jobs` section and replace it with:

**IMPORTANT**: Keep the existing encrypted secret values from your current app spec. Don't copy the placeholder values shown below.
```json
{
  "name": "checkins-dispatcher",
  "github": {
    "repo": "Paincrowdsource/PainOptix-Docker",
    "branch": "main",
    "deploy_on_push": true
  },
  "dockerfile_path": "/Dockerfile.dispatch",
  "source_dir": "/",
  "run_command": "",
  "envs": [
    {
      "key": "APP_BASE_URL",
      "value": "https://painoptix.com",
      "scope": "RUN_TIME"
    },
    {
      "key": "CHECKINS_DISPATCH_TOKEN",
      "value": "EV[1:...:...]",
      "scope": "RUN_TIME",
      "type": "SECRET"
    },
    {
      "key": "DRY_RUN",
      "value": "1",
      "scope": "RUN_TIME"
    }
  ],
  "instance_size_slug": "basic-xxs",
  "instance_count": 1,
  "kind": "POST_DEPLOY"
}
```

Note: Removed `git:` section and added `github:` + `dockerfile_path` instead.

4. Update the app:
```bash
~/bin/doctl.exe apps update c61c1a95-d2be-482b-aaee-b016be6185e0 --spec app-spec.json
```

### Option B: Via DigitalOcean Console (if CLI fails)

1. Go to: https://cloud.digitalocean.com/apps/c61c1a95-d2be-482b-aaee-b016be6185e0/settings
2. Click "Edit" on the `checkins-dispatcher` job component
3. Under "Source", change from Git to Dockerfile
4. Set Dockerfile Path: `/Dockerfile.dispatch`
5. Keep existing environment variables
6. Save changes

### Option C: Remove Job Entirely (Recommended Long-term)

Since GitHub Actions already handles check-in dispatch every 15 minutes, the DigitalOcean job is redundant.

To remove:
```bash
# Edit app-spec.json to remove entire "jobs" array
~/bin/doctl.exe apps update c61c1a95-d2be-482b-aaee-b016be6185e0 --spec app-spec.json
```

## Benefits

- ✅ No Next.js build required
- ✅ Faster deployment (10x speedup)
- ✅ No Supabase env vars needed at build time
- ✅ Smaller Docker image (~200MB vs ~2GB)
- ✅ Job only does what it needs to do

## Verification

After updating, verify the job builds successfully:
```bash
export DIGITALOCEAN_ACCESS_TOKEN=<your-digitalocean-token>
~/bin/doctl.exe apps list-deployments c61c1a95-d2be-482b-aaee-b016be6185e0 | head -5
```

Look for `ACTIVE` status instead of `ERROR`.
