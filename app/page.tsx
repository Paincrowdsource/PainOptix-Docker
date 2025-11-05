import { cookies } from 'next/headers'
import { HomepageV2 } from '@/src/components/home-v2/HomepageV2'
import { LandingPageV1Client } from './LandingPageV1Client'

// Force dynamic rendering - read cookie at request time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LandingPage() {
  // V1 is default; V2 only shown when hpv2=1 cookie is set
  const c = cookies()
  const useV2 = c.get('hpv2')?.value === '1'

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {useV2 ? (
        <div data-e2e="hp-v2">
          <HomepageV2 />
        </div>
      ) : (
        <LandingPageV1Client />
      )}
    </div>
  )
}
