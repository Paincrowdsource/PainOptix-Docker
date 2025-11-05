import { HomepageV2 } from '@/src/components/home-v2/HomepageV2'
import { LandingPageV1Client } from './LandingPageV1Client'

// Force dynamic rendering - read env vars at request time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LandingPage() {
  // Prefer server runtime var (HP_V2), fallback to build-time var (NEXT_PUBLIC_HP_V2)
  const hpV2Enabled =
    (process.env.HP_V2?.toLowerCase?.() === 'true') ||
    (process.env.NEXT_PUBLIC_HP_V2 === 'true')

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {hpV2Enabled ? (
        <div data-e2e="hp-v2">
          <HomepageV2 />
        </div>
      ) : (
        <LandingPageV1Client />
      )}
    </div>
  )
}
